import { WorkloadInput } from '../types';

export interface PricingConfig {
  version: string;
  source: string;
  currency: string;
  computeHourly: {
    local: number;
    'db.t3.medium': number;
    'db.r5.large': number;
    'db.r6g.large': number;
    elastic_dcu: number;
  };
  storagePerGBMonth: number;
  ioPerMillionRequests: number;
  backupPerGBMonth: number;
  regionMultipliers: Record<string, number>;
}

export const DOCUMENTDB_PRICING: PricingConfig = {
  version: '2026.1',
  source: 'AWS DocumentDB Standard Pricing (US East / N. Virginia baseline, Q1 2026)',
  currency: 'USD',
  computeHourly: {
    local: 0.00,
    'db.t3.medium': 0.078,  // 2 vCPU, 4.0 GiB RAM ($0.078/hr)
    'db.r5.large': 0.277,   // 2 vCPU, 16.0 GiB RAM ($0.277/hr)
    'db.r6g.large': 0.245,  // 2 vCPU, 16.0 GiB RAM Graviton2 ($0.245/hr)
    elastic_dcu: 0.12       // DocumentDB Compute Unit ($0.12/DCU-hr)
  },
  storagePerGBMonth: 0.10,     // $0.10/GB-month replicated 6-ways across 3 AZs
  ioPerMillionRequests: 0.20,  // $0.20 per 1,000,000 I/Os
  backupPerGBMonth: 0.095,     // $0.095/GB-month beyond 100% cluster size
  regionMultipliers: {
    'us-east-1': 1.00,
    'us-west-2': 1.00,
    'eu-west-1': 1.10,
    'eu-central-1': 1.12,
    'ap-south-1': 1.05,
    'ap-southeast-1': 1.10
  }
};

export const REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', multiplier: '1.00x', multValue: 1.00 },
  { id: 'us-west-2', name: 'US West (Oregon)', multiplier: '1.00x', multValue: 1.00 },
  { id: 'eu-west-1', name: 'Europe (Ireland)', multiplier: '1.10x', multValue: 1.10 },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)', multiplier: '1.12x', multValue: 1.12 },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)', multiplier: '1.05x', multValue: 1.05 },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', multiplier: '1.10x', multValue: 1.10 }
];

export interface WorkloadPreset {
  id: string;
  name: string;
  description: string;
  iconName: string;
  badge: string;
  workload: WorkloadInput;
}

export const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    id: 'local_dev',
    name: 'Local Development',
    description: 'Zero-cost offline prototyping using local mock/Docker repository.',
    iconName: 'Laptop',
    badge: '$0.00 / mo',
    workload: {
      requests_per_day: 1000,
      read_percentage: 80,
      write_percentage: 20,
      avg_document_size_kb: 4.0,
      data_storage_gb: 2,
      backup_retention_days: 1,
      monthly_uptime_hours: 0,
      environment_tier: 'development',
      traffic_pattern: 'intermittent',
      availability_tier: 'single_az',
      region: 'us-east-1',
      selected_deployment: 'local_dev'
    }
  },
  {
    id: 'college_project',
    name: 'Small College Project',
    description: 'Scheduled demo & testing cluster during class labs and evaluations.',
    iconName: 'GraduationCap',
    badge: '~$7.80 / mo',
    workload: {
      requests_per_day: 5000,
      read_percentage: 85,
      write_percentage: 15,
      avg_document_size_kb: 8.0,
      data_storage_gb: 5,
      backup_retention_days: 3,
      monthly_uptime_hours: 80,
      environment_tier: 'demo',
      traffic_pattern: 'intermittent',
      availability_tier: 'single_az',
      region: 'us-east-1',
      selected_deployment: 'scheduled_dev'
    }
  },
  {
    id: 'dev_environment',
    name: 'Development Environment',
    description: 'Active 8h/weekday development workflow with automated weekend shutdown.',
    iconName: 'Code',
    badge: '~$14.67 / mo',
    workload: {
      requests_per_day: 25000,
      read_percentage: 80,
      write_percentage: 20,
      avg_document_size_kb: 12.0,
      data_storage_gb: 15,
      backup_retention_days: 7,
      monthly_uptime_hours: 160,
      environment_tier: 'development',
      traffic_pattern: 'steady',
      availability_tier: 'single_az',
      region: 'us-east-1',
      selected_deployment: 'scheduled_dev'
    }
  },
  {
    id: 'small_production',
    name: 'Small Production',
    description: 'Continuous 24/7 high availability inspection processing system.',
    iconName: 'Building',
    badge: '~$115.80 / mo',
    workload: {
      requests_per_day: 100000,
      read_percentage: 85,
      write_percentage: 15,
      avg_document_size_kb: 16.0,
      data_storage_gb: 50,
      backup_retention_days: 14,
      monthly_uptime_hours: 730,
      environment_tier: 'production',
      traffic_pattern: 'bursty',
      availability_tier: 'multi_az',
      region: 'us-east-1',
      selected_deployment: 'provisioned_multi_az'
    }
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'User-configured granular parameters and traffic distribution.',
    iconName: 'Sliders',
    badge: 'Custom',
    workload: {
      requests_per_day: 25000,
      read_percentage: 80,
      write_percentage: 20,
      avg_document_size_kb: 8.0,
      data_storage_gb: 15,
      backup_retention_days: 7,
      monthly_uptime_hours: 730,
      environment_tier: 'development',
      traffic_pattern: 'steady',
      availability_tier: 'single_az',
      region: 'us-east-1',
      selected_deployment: 'scheduled_dev'
    }
  }
];

export const UPTIME_PRESETS = [
  { label: '24/7 Continuous (730h)', hours: 730, desc: 'Full monthly continuous uptime' },
  { label: '8h / Weekday Dev (160h)', hours: 160, desc: 'Scheduled start/stop (40 hrs/wk)' },
  { label: '4h / Weekday Demo (80h)', hours: 80, desc: 'College demo & lab evaluation' },
  { label: 'Local Only (0h)', hours: 0, desc: '0 cloud hours (Local Mock / Docker)' }
];

export const CALCULATION_FORMULAS = [
  {
    component: 'Compute ($/mo)',
    formula: 'Monthly Uptime (Hours) × Hourly Rate ($0.078 for db.t3.medium) × Node Count × Region Multiplier',
    example: '160 hrs × $0.078 × 1 node × 1.00 = $12.48 / month'
  },
  {
    component: 'Active Cluster Storage ($/mo)',
    formula: 'Active Document Data (GB) × $0.10 / GB-month × Region Multiplier (6-way replicated across 3 AZs included)',
    example: '15 GB × $0.10 × 1.00 = $1.50 / month'
  },
  {
    component: 'I/O Operations ($/mo)',
    formula: '(Monthly Requests × Weighted I/O Factor ÷ 1,000,000) × $0.20 × Region Multiplier. Weighted factor: Read = 1.1 I/Os, Write = 2.0 I/Os.',
    example: '(25,000 req/day × 30 days × 1.28 I/Os ÷ 1,000,000) × $0.20 = $0.19 / month'
  },
  {
    component: 'Backup Storage ($/mo)',
    formula: 'Max(0, Estimated Backup GB − Cluster Storage GB) × $0.095 / GB-month. Backup up to 100% of cluster storage is 100% FREE.',
    example: '7 days retention on 15 GB generates ~20.25 GB backup. (20.25 − 15.00) × $0.095 = $0.50 / month'
  }
];
