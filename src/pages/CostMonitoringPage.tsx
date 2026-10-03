import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Sliders,
  FileText,
  Clock,
  Zap,
  HardDrive,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Bell,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Check,
  Cpu,
  Layers,
  SearchCode,
  ShieldCheck,
  History,
  GitCompare,
  Plus,
  Server,
  Database,
  SlidersHorizontal,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import {
  WorkloadInput,
  CostEstimateResponse,
  CostTrendResponse,
  CostDriverDetail,
  CostAnomalyReport,
  CostMonitoringSnapshot,
  CostComparisonReport,
  OptimizationSimulationResponse,
  CostMonitoringAnalysisResponse,
  CostAlertConfig
} from '../types';

const DEFAULT_WORKLOAD: WorkloadInput = {
  requests_per_day: 5000,
  read_percentage: 85.0,
  write_percentage: 15.0,
  avg_document_size_kb: 8.0,
  data_storage_gb: 15.0,
  backup_retention_days: 7,
  monthly_uptime_hours: 160,
  environment_tier: 'development',
  traffic_pattern: 'steady',
  availability_tier: 'single_az',
  region: 'us-east-1',
  selected_deployment: 'scheduled_dev'
};

const DEFAULT_ALERTS: CostAlertConfig[] = [
  {
    id: 'alert-threshold',
    title: 'Monthly Budget Threshold Exceeded',
    description: 'Trigger alert when projected monthly cost exceeds configured threshold',
    enabled: true,
    triggerCondition: 'Cost > Threshold'
  },
  {
    id: 'alert-spike',
    title: 'Cost Surge (>15% Increase)',
    description: 'Detect sudden spikes in runtime, storage, or write I/O between monitoring periods',
    enabled: true,
    triggerCondition: 'Delta > +15%'
  },
  {
    id: 'alert-idle',
    title: 'Idle 24/7 Compute in Development',
    description: 'Warn when low-workload clusters run 24/7 without scheduled auto-stop',
    enabled: true,
    triggerCondition: 'Uptime > 500h in Dev'
  }
];

export const CostMonitoringPage: React.FC = () => {
  const navigate = useNavigate();

  // Core Workload & Configuration State
  const [workload, setWorkload] = useState<WorkloadInput>(() => {
    const saved = localStorage.getItem('inspectdb_cost_workload');
    return saved ? JSON.parse(saved) : DEFAULT_WORKLOAD;
  });

  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('inspectdb_cost_threshold');
    return saved ? parseFloat(saved) : 20.0;
  });

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [trendMetric, setTrendMetric] = useState<'daily' | 'cumulative'>('daily');

  // API Data State
  const [estimate, setEstimate] = useState<CostEstimateResponse | null>(null);
  const [trend, setTrend] = useState<CostTrendResponse | null>(null);
  const [drivers, setDrivers] = useState<CostDriverDetail[]>([]);
  const [anomaly, setAnomaly] = useState<CostAnomalyReport | null>(null);
  const [analysis, setAnalysis] = useState<CostMonitoringAnalysisResponse | null>(null);
  const [snapshots, setSnapshots] = useState<CostMonitoringSnapshot[]>([]);
  const [alerts, setAlerts] = useState<CostAlertConfig[]>(DEFAULT_ALERTS);

  // Modals & UI Controls
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simulatedResult, setSimulatedResult] = useState<OptimizationSimulationResponse | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareReport, setCompareReport] = useState<CostComparisonReport | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [showPricingAssumptions, setShowPricingAssumptions] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [newSnapshotTitle, setNewSnapshotTitle] = useState('');
  const [showSaveSnapshotInput, setShowSaveSnapshotInput] = useState(false);

  // Helper currency formatter
  const fmt = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  // Fetch Deterministic Metrics
  const fetchMonitoringData = async () => {
    setLoadingMetrics(true);
    setError(null);
    try {
      const [estData, trendData, driversData, anomalyData, snapsData] = await Promise.all([
        api.calculateCostEstimate(workload),
        api.getCostTrend(workload, timeframe),
        api.getCostDrivers(workload),
        api.checkCostAnomalies({ current_workload: workload, threshold }),
        api.getMonitoringSnapshots().catch(() => [])
      ]);

      setEstimate(estData);
      setTrend(trendData);
      setDrivers(driversData);
      setAnomaly(anomalyData);
      setSnapshots(snapsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load cost monitoring metrics.');
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Run Gemini Cost Analyst
  const runAiAnalysis = async (forceRefresh = false) => {
    setLoadingAi(true);
    try {
      const res = await api.analyzeCostMonitoring({
        current_workload: workload,
        threshold,
        force_refresh: forceRefresh
      });
      setAnalysis(res);
    } catch (err: any) {
      console.error('AI Cost Monitoring Analysis Error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [workload, timeframe, threshold]);

  // Save workload change to local storage
  const handleWorkloadChange = (field: keyof WorkloadInput, val: any) => {
    const updated = { ...workload, [field]: val };
    setWorkload(updated);
    localStorage.setItem('inspectdb_cost_workload', JSON.stringify(updated));
  };

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    localStorage.setItem('inspectdb_cost_threshold', val.toString());
  };

  // Calculate underutilization metrics
  const currentCost = estimate?.selected_deployment?.monthly_cost ?? 0;
  const requestsPerSec = (workload.requests_per_day / (24 * 3600)).toFixed(3);
  const baseline247Compute = 58.44; // 1x db.t3.medium @ 730h
  const isUnderutilized = workload.monthly_uptime_hours >= 400 && workload.requests_per_day <= 50000;
  const idleHours = Math.max(0, 730 - workload.monthly_uptime_hours);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top AWS Status Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: '#0a1733',
        border: '1px solid #36415a',
        color: '#f5f7fa',
        fontSize: '0.825rem',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={15} color="#6b93ea" />
            <span style={{ color: '#8e97ac' }}>Target Engine:</span>
            <strong style={{ color: '#f5f7fa' }}>Amazon DocumentDB (v4.0)</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#8e97ac' }}>AWS Region:</span>
            <span style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              backgroundColor: '#1f2a44',
              color: '#6b93ea',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}>
              {workload.region}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#8e97ac' }}>Mode:</span>
            <span style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              backgroundColor: '#3b82f620',
              color: '#6b93ea',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid #3b82f640'
            }}>
              Workload Sizing & Bottleneck Analyzer
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={fetchMonitoringData}
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: '#1f2a44', borderColor: '#36415a', color: '#f5f7fa', padding: '0.25rem 0.6rem' }}
          >
            <RefreshCw size={13} className={loadingMetrics ? 'spin' : ''} />
            <span>Sync Metrics</span>
          </button>
          <Link
            to="/cost-optimizer"
            className="btn btn-primary btn-sm"
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
          >
            <span>View Optimization Opportunities</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Amazon DocumentDB Cost Monitoring
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#e9f6f0',
              color: '#1e8e62',
              border: '1px solid #b9e2cf',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <CheckCircle2 size={11} /> Continuous Utilization Tracking
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
            Monitor Amazon DocumentDB usage, resource utilization, and estimated cluster spending.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowSimulateModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Calculator size={14} />
            <span>Simulate Schedule</span>
          </button>
          <button
            onClick={() => runAiAnalysis(true)}
            disabled={loadingAi}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} color="#c9a23a" />
            <span>{loadingAi ? 'Analyzing Gemini...' : 'Run Gemini Analyst'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <div>{error}</div>
        </div>
      )}

      {/* CORE BOTTLENECK DIAGNOSIS: Workload vs Cluster Cost Analysis */}
      <div className="card" style={{
        padding: '1.25rem',
        backgroundColor: isUnderutilized ? '#fbf5e4' : 'var(--color-bg-surface)',
        border: isUnderutilized ? '1px solid #eddba6' : '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertOctagon size={18} color={isUnderutilized ? '#a9801e' : '#2459c9'} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Workload Intensity vs. Provisioned Cluster Cost Analysis
            </h3>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isUnderutilized ? '#fbf4e2' : '#e7f5ee',
            color: isUnderutilized ? '#7a5a12' : '#176b4a',
            border: isUnderutilized ? '1px solid #e6cf8f' : '1px solid #8fd7b5'
          }}>
            {isUnderutilized ? '⚠️ High Cost / Low Workload Disconnect Detected' : '✓ Workload Sizing Optimal'}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {/* Column 1: Actual Workload Demand */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Workload Demand (Low Intensity)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
              {workload.requests_per_day.toLocaleString()} req/day
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Equivalent to <strong>~{requestsPerSec} requests/sec</strong>. DocumentDB minimum instance compute capacity (2 vCPUs) is &gt;95% idle under this query rate.
            </div>
          </div>

          {/* Column 2: Provisioned AWS Baseline */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Provisioned Instance Baseline
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c23b3b', marginTop: '0.25rem' }}>
              ${baseline247Compute.toFixed(2)}/mo
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Standard 24/7 provisioned <code>db.t3.medium</code> instance ($0.078/hr × 730h) incurs high fixed baseline costs even with zero traffic.
            </div>
          </div>

          {/* Column 3: Scheduled Optimization Opportunity */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#e9f6f0',
            border: '1px solid #b9e2cf'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#13623f', textTransform: 'uppercase' }}>
              Scheduled Development Sizing
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e8e62', marginTop: '0.25rem' }}>
              $13.98/mo <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>(~76% Savings)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#13623f', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Automating 8h/weekday start/stop (160h/mo) matches actual developer activity, eliminating 570 idle hours per month.
            </div>
          </div>
        </div>

        {/* Action Banner */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isUnderutilized ? '#fbf4e2' : 'var(--color-bg-surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ fontSize: '0.825rem', color: isUnderutilized ? '#7a5a12' : 'var(--color-text-primary)' }}>
            💡 <strong>Root Bottleneck:</strong> Small academic workloads on AWS DocumentDB suffer from fixed instance hourly rates. Start/stop automation or local in-memory execution resolves this cost overhead.
          </div>
          <Link
            to="/cost-optimizer"
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            <span>Explore Optimization Advisor</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Main Cost Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        {/* Card 1: Estimated Monthly Cost */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Estimated Monthly Cost
                </div>
                <div style={{ fontSize: '2.15rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--color-text-primary)', marginTop: '0.2rem' }}>
                  {fmt(currentCost)}
                </div>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Tier: <strong>{estimate?.selected_deployment?.name || 'Scheduled Dev'}</strong>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Source: Deterministic Rate Card Model
          </div>
        </div>

        {/* Card 2: Cluster Utilization */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Workload Intensity
                </div>
                <div style={{ fontSize: '2.15rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: '#2459c9', marginTop: '0.2rem' }}>
                  Low
                </div>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f3f7fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2459c9'
              }}>
                <Activity size={20} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Volume: ~{requestsPerSec} ops/sec • {workload.monthly_uptime_hours}h active/mo
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Source: Workload Input Sizing
          </div>
        </div>

        {/* Card 3: Storage & Replicated Footprint */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Storage Allocation
                </div>
                <div style={{ fontSize: '2.15rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: '#a9801e', marginTop: '0.2rem' }}>
                  {workload.data_storage_gb} GB
                </div>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fcf8ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a9801e'
              }}>
                <HardDrive size={20} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Cost: ${fmt(estimate?.selected_deployment?.breakdown?.storage_cost)}/mo (6-way replicated in AWS)
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Source: Storage Allocation Formula ($0.10/GB)
          </div>
        </div>

        {/* Card 4: Potential Monthly Savings */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Identified Optimization
                </div>
                <div style={{ fontSize: '2.15rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: '#1e8e62', marginTop: '0.2rem' }}>
                  {fmt(estimate?.potential_monthly_savings)}
                </div>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#e9f6f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e8e62'
              }}>
                <Zap size={20} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#13623f', marginTop: '0.5rem', fontWeight: 600 }}>
              {estimate?.cost_health?.potential_optimization_percent || 76}% potential monthly reduction
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Source: Comparative Tier Analysis
          </div>
        </div>
      </div>

      {/* Cost Trend & Trajectory Section */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--color-primary)" />
              DocumentDB Cost Trajectory Projection ({timeframe})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Deterministic cost projection based on provisioned uptime vs scheduled start/stop optimization.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Timeframe selector */}
            <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              {(['7d', '30d', '90d'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: timeframe === tf ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                    color: timeframe === tf ? '#ffffff' : 'var(--color-text-secondary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Daily vs Cumulative Toggle */}
            <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <button
                onClick={() => setTrendMetric('daily')}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: trendMetric === 'daily' ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                  color: trendMetric === 'daily' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Daily Cost
              </button>
              <button
                onClick={() => setTrendMetric('cumulative')}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: trendMetric === 'cumulative' ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                  color: trendMetric === 'cumulative' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cumulative
              </button>
            </div>
          </div>
        </div>

        {/* Trend Visualization Bars */}
        {trend && trend.points.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 160, padding: '1rem 0 0.5rem', borderBottom: '1px solid var(--color-border)' }}>
              {trend.points.map((pt, idx) => {
                const maxVal = trendMetric === 'daily' ? (trend.current_daily_cost * 1.5 || 1.0) : (trend.projected_monthly_cost || 50.0);
                const val = trendMetric === 'daily' ? pt.daily_cost : pt.cumulative_cost;
                const heightPct = Math.min(100, Math.max(8, (val / maxVal) * 100));
                return (
                  <div
                    key={idx}
                    title={`${pt.date}: ${fmt(val)} (${trendMetric})`}
                    style={{
                      flex: 1,
                      height: `${heightPct}%`,
                      backgroundColor: 'var(--color-primary)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease',
                      opacity: 0.85,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              <span>{trend.points[0]?.date}</span>
              <span>Projected Period Spending: <strong>{fmt(trend.projected_monthly_cost)}</strong></span>
              <span>{trend.points[trend.points.length - 1]?.date}</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Trend calculation unavailable.
          </div>
        )}
      </div>

      {/* Component Drivers Breakdown */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Layers size={18} color="var(--color-primary)" />
          Cost Drivers & Component Contribution Breakdown
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {drivers.map((d, i) => (
            <div key={i} style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-surface-secondary)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {d.driver_name}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: d.impact_level === 'High' ? '#fbeaea' : '#f3f7fe',
                    color: d.impact_level === 'High' ? '#c23b3b' : '#2459c9'
                  }}>
                    {d.impact_level} Impact
                  </span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                  {fmt(d.monthly_cost_contribution)}/mo <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({d.percentage_of_total}%)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Current setting: <strong>{d.current_value}</strong>
                </div>
              </div>

              <div style={{
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                fontSize: '0.72rem',
                color: '#13623f'
              }}>
                💡 {d.optimization_opportunity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gemini AI Cost Insights Section */}
      {analysis && (
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #c9a23a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#c9a23a" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Gemini 2.5 Flash Architectural Analysis
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Model: gemini-2.5-flash
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
            {analysis.summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {analysis.optimization_opportunities?.map((opp, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-secondary)',
                border: '1px solid var(--color-border)',
                fontSize: '0.78rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                  {opp.title}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {opp.reason}
                </div>
                <div style={{ marginTop: '0.4rem', color: '#1e8e62', fontWeight: 600 }}>
                  Action: {opp.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimulateModal && (
        <div className="modal-overlay" onClick={() => setShowSimulateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calculator size={18} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>What-If Schedule Simulation</h3>
              </div>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                Compare your current continuous uptime (<strong>{workload.monthly_uptime_hours} hrs/mo</strong>) against a scheduled development window (<strong>160 hrs/mo</strong>).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fbeaea', border: '1px solid #f1c9c9' }}>
                  <div style={{ fontSize: '0.72rem', color: '#8e2525', fontWeight: 700 }}>24/7 Provisioned Single-AZ</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c23b3b', marginTop: '0.25rem' }}>$58.44/mo</div>
                  <div style={{ fontSize: '0.75rem', color: '#8e2525', marginTop: '0.25rem' }}>730 hours continuous</div>
                </div>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#e9f6f0', border: '1px solid #b9e2cf' }}>
                  <div style={{ fontSize: '0.72rem', color: '#13623f', fontWeight: 700 }}>Scheduled Dev (8h/weekday)</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e8e62', marginTop: '0.25rem' }}>$13.98/mo</div>
                  <div style={{ fontSize: '0.75rem', color: '#13623f', marginTop: '0.25rem' }}>160 hours optimized</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#13623f', padding: '0.65rem', backgroundColor: '#e9f6f0', borderRadius: 'var(--radius-sm)' }}>
                ✅ <strong>Simulated Monthly Savings: ~$44.46/mo (~76% reduction)</strong>. Note: This is an architectural simulation and does not modify AWS infrastructure.
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
              <Link
                to="/cost-optimizer"
                className="btn btn-primary btn-sm"
                onClick={() => setShowSimulateModal(false)}
              >
                Go to Cost Optimizer
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
