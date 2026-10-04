import { LiveMetrics, LiveProfile, LiveRates, WorkloadInput } from '../types';

export const HOURS_PER_MONTH = 730;
export const WEEKS_PER_MONTH = 365.25 / 12 / 7;

export interface ModelOverrides {
  instanceClass?: string;
  instanceCount?: number;
  monthlyHours?: number;
  storageType?: string;
}

export interface ModelResult {
  instance: number;
  storage: number;
  io: number;
  total: number;
  hourlyRate: number | null;
}

/** Same formula as the backend cost model: list prices x the cluster's real usage. */
export function modelMonthlyCost(profile: LiveProfile, rates: LiveRates, overrides: ModelOverrides = {}): ModelResult {
  const instanceClass = overrides.instanceClass ?? profile.instance_class ?? 'db.t3.medium';
  const instanceCount = overrides.instanceCount ?? profile.instance_count;
  const hours = overrides.monthlyHours ?? profile.monthly_hours;
  const storageType = overrides.storageType ?? profile.storage_type;

  const hourlyRate = rates.instance_hourly[storageType]?.[instanceClass] ?? null;
  const storageRate = rates.storage_gb_month[storageType] ?? 0;
  const ioRate = rates.io_per_million ?? 0;

  const instance = (hourlyRate ?? 0) * hours * instanceCount;
  const storage = (profile.storage_gb ?? 0) * storageRate;
  const io = storageType === 'iopt1' ? 0 : (profile.billed_ios_per_running_hour * hours / 1_000_000) * ioRate;
  return { instance, storage, io, total: instance + storage + io, hourlyRate };
}

/** Instance classes that have a list price for the given storage type, cheapest first. */
export function pricedInstanceClasses(rates: LiveRates, storageType: string): string[] {
  const table = rates.instance_hourly[storageType] ?? {};
  return Object.keys(table).sort((a, b) => table[a] - table[b]);
}

/** Builds the planning-calculator workload from the live profile and CloudWatch usage. */
export function workloadFromLive(profile: LiveProfile, metrics: LiveMetrics | null): WorkloadInput {
  const runningHours = metrics?.running_hours ?? 0;
  const reads = metrics?.read_operations ?? 0;
  const writes = metrics?.write_operations ?? 0;
  const readShare = reads + writes > 0 ? Math.round((reads / (reads + writes)) * 1000) / 10 : 85;
  const opsPerDay = runningHours > 0
    ? Math.round(profile.operations_per_running_hour * profile.monthly_hours / 30.4)
    : 0;
  return {
    requests_per_day: opsPerDay,
    read_percentage: readShare,
    write_percentage: Math.round((100 - readShare) * 10) / 10,
    avg_document_size_kb: 8,
    data_storage_gb: profile.storage_gb ?? 0,
    backup_retention_days: Math.max(1, profile.backup_retention_days ?? 1),
    monthly_uptime_hours: Math.round(profile.monthly_hours),
    environment_tier: 'development',
    traffic_pattern: 'intermittent',
    availability_tier: profile.instance_count > 1 ? 'multi_az' : 'single_az',
    region: profile.region,
    selected_deployment: profile.monthly_hours < 700 ? 'scheduled_dev' : 'provisioned_single_az'
  };
}

export const formatUsd = (value: number, digits = 2): string =>
  `${value < 0 ? '−' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/** Small amounts (fractions of a cent early in the month) get enough precision to be meaningful. */
export const formatSmallUsd = (value: number): string =>
  formatUsd(value, Math.abs(value) > 0 && Math.abs(value) < 1 ? 4 : 2);
