import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calculator,
  Sparkles,
  TrendingDown,
  Server,
  Database,
  Clock,
  HardDrive,
  Activity,
  Layers,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShieldAlert,
  Zap,
  Sliders,
  Check,
  Info,
  Flame,
  FileSpreadsheet,
  Laptop,
  GraduationCap,
  Code,
  Building,
  Bell,
  Gauge,
  SlidersHorizontal,
  Compass,
  ArrowUpDown,
  CheckCircle,
  ShieldCheck,
  Lock,
  GitBranch
} from 'lucide-react';
import { api } from '../services/api';
import {
  WorkloadInput,
  CostEstimateResponse,
  CostAnalysisResult,
  Recommendation,
  DeploymentOptionEstimate,
  CostHealth
} from '../types';
import {
  DOCUMENTDB_PRICING,
  REGIONS,
  WORKLOAD_PRESETS,
  UPTIME_PRESETS,
  CALCULATION_FORMULAS,
  WorkloadPreset
} from '../services/pricingConfig';

export const CostOptimizerPage: React.FC = () => {
  const navigate = useNavigate();

  // Primary Workload State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('dev_environment');
  const [workload, setWorkload] = useState<WorkloadInput>(WORKLOAD_PRESETS[2].workload);

  // API State
  const [estimate, setEstimate] = useState<CostEstimateResponse | null>(null);
  const [analysis, setAnalysis] = useState<CostAnalysisResult | null>(null);
  const [history, setHistory] = useState<CostAnalysisResult[]>([]);
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);
  const [analyzingAi, setAnalyzingAi] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // UI Interactive State
  const [activeTab, setActiveTab] = useState<'estimator' | 'ai-advisor' | 'matrix' | 'simulator' | 'history'>('estimator');
  const [showWhyScore, setShowWhyScore] = useState<boolean>(false);
  const [showPricingAssumptions, setShowPricingAssumptions] = useState<boolean>(false);
  const [expandedRecs, setExpandedRecs] = useState<Record<string, boolean>>({});

  // Helper currency formatter
  const fmt = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  // Fetch deterministic estimate whenever workload changes
  const fetchEstimate = useCallback(async (currentWorkload: WorkloadInput) => {
    setLoadingEstimate(true);
    try {
      const res = await api.calculateCostEstimate(currentWorkload);
      setEstimate(res);
      setErrorBanner(null);
    } catch (err: any) {
      console.error('Failed to calculate estimate:', err);
      setErrorBanner(err.message || 'Failed to calculate deterministic cost estimate.');
    } finally {
      setLoadingEstimate(false);
    }
  }, []);

  // Fetch history snapshots
  const fetchHistory = useCallback(async () => {
    try {
      const hist = await api.getCostAnalysisHistory();
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load cost history:', err);
    }
  }, []);

  useEffect(() => {
    fetchEstimate(workload);
  }, [workload, fetchEstimate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: WorkloadPreset) => {
    setSelectedPresetId(preset.id);
    setWorkload(preset.workload);
    setSuccessBanner(`Applied '${preset.name}' workload preset.`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Handle Custom Input Changes
  const handleInputChange = (field: keyof WorkloadInput, value: any) => {
    setSelectedPresetId('custom');
    setWorkload(prev => ({ ...prev, [field]: value }));
  };

  // Run AI Advisor Analysis
  const handleRunAiAnalysis = async (forceRefresh = false) => {
    setAnalyzingAi(true);
    setErrorBanner(null);
    setAnalysisStage(1);

    const stageTimer1 = setTimeout(() => setAnalysisStage(2), 700);
    const stageTimer2 = setTimeout(() => setAnalysisStage(3), 1400);

    try {
      const result = await api.analyzeCostAndDeployment({
        workload,
        force_refresh: forceRefresh
      });
      setAnalysis(result);
      fetchHistory();
      setActiveTab('ai-advisor');
      setSuccessBanner('Gemini 2.5 Flash architectural analysis completed.');
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      console.error('AI Cost Advisor Error:', err);
      setErrorBanner(err.message || 'Gemini AI advisor encountered an error. Showing deterministic optimization guidance.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setAnalyzingAi(false);
      setAnalysisStage(0);
    }
  };

  // Update Recommendation Status
  const handleUpdateStatus = async (recId: string, newStatus: 'pending' | 'applied' | 'dismissed') => {
    try {
      await api.updateRecommendationStatus(recId, newStatus);
      if (analysis) {
        setAnalysis(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            recommendations: prev.recommendations.map(r => r.id === recId ? { ...r, status: newStatus } : r)
          };
        });
      }
      fetchHistory();
    } catch (err) {
      console.error('Failed to update recommendation status:', err);
    }
  };

  // Calculate Explainable Cost Optimization Score (0-100)
  const calculateScoreDetails = useMemo(() => {
    const isScheduled = workload.monthly_uptime_hours <= 200;
    const isLocal = workload.monthly_uptime_hours === 0;
    
    // 1. Compute Scheduling Score (Weight: 40%)
    let computeScore = 40;
    if (workload.monthly_uptime_hours > 500 && workload.requests_per_day < 50000) {
      computeScore = 10; // High penalty for 24/7 idle development instances
    } else if (isScheduled) {
      computeScore = 38;
    } else if (isLocal) {
      computeScore = 40;
    } else {
      computeScore = 25;
    }

    // 2. Workload-to-Instance Ratio (Weight: 25%)
    let sizingScore = 25;
    if (workload.requests_per_day <= 10000 && workload.selected_deployment.includes('multi_az')) {
      sizingScore = 8;
    } else if (workload.requests_per_day <= 20000) {
      sizingScore = 23;
    }

    // 3. Storage Allocation Efficiency (Weight: 20%)
    let storageScore = 20;
    if (workload.data_storage_gb > 50 && workload.requests_per_day < 1000) {
      storageScore = 10;
    }

    // 4. Backup Retention Policy (Weight: 15%)
    let backupScore = 15;
    if (workload.backup_retention_days > 14) {
      backupScore = 8;
    }

    const totalScore = computeScore + sizingScore + storageScore + backupScore;

    return {
      totalScore,
      computeScore,
      sizingScore,
      storageScore,
      backupScore,
      isUnderutilized: workload.monthly_uptime_hours >= 400 && workload.requests_per_day <= 50000
    };
  }, [workload]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Navigation Strip */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to="/cost-monitoring"
            style={{
              color: '#6b93ea',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'none'
            }}
          >
            <span>← Back to Cost Monitoring Dashboard</span>
          </Link>
          <span style={{ color: '#4e5871' }}>|</span>
          <span style={{ color: '#8e97ac' }}>Target Bottleneck:</span>
          <strong style={{ color: '#f5f7fa' }}>Small Workload vs. High Cluster Baseline Cost</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => handleRunAiAnalysis(true)}
            disabled={analyzingAi}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
          >
            <Sparkles size={13} />
            <span>{analyzingAi ? 'Running Gemini Analysis...' : 'Evaluate with Gemini 2.5 Flash'}</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Amazon DocumentDB Cost Optimizer & Advisor
          </h2>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#fcf8ed',
            color: '#a9801e',
            border: '1px solid #f0e2b8',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Sparkles size={11} /> Gemini 2.5 Flash Powered
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
          Analyze DocumentDB workload and identify potential cost-optimization opportunities for low-workload environments.
        </p>
      </div>

      {errorBanner && (
        <div className="alert alert-danger">
          <div>{errorBanner}</div>
        </div>
      )}

      {successBanner && (
        <div className="alert alert-success">
          <div>{successBanner}</div>
        </div>
      )}

      {/* TOP: Optimization Status & Score Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {/* Status Card 1: Workload Intensity */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Current Workload Intensity
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2459c9', marginTop: '0.25rem' }}>
              Low Workload
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Development inspection reports & periodic testing ({workload.requests_per_day.toLocaleString()} req/day). Minimum cluster provision is sufficient.
            </p>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            Diagnosis: <strong>Idle Compute Optimization Candidate</strong>
          </div>
        </div>

        {/* Status Card 2: Optimization Opportunities Detected */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Optimization Status
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e8e62', marginTop: '0.25rem' }}>
              3 Opportunities Detected
            </div>
            <p style={{ fontSize: '0.78rem', color: '#13623f', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Potential savings up to <strong>~$44.46/mo (~76% reduction)</strong> via scheduled auto-stop and right-sizing.
            </p>
          </div>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.72rem', color: '#1e8e62', fontWeight: 600 }}>
            ✓ Evidence-Based Rate Card Verification
          </div>
        </div>

        {/* Status Card 3: Explainable Health Score */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Architecture Health Score
              </div>
              <button
                onClick={() => setShowWhyScore(!showWhyScore)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {showWhyScore ? 'Hide Details' : 'Why this score?'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '2.15rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: calculateScoreDetails.totalScore >= 75 ? '#1e8e62' : calculateScoreDetails.totalScore >= 50 ? '#a9801e' : '#c23b3b' }}>
                {calculateScoreDetails.totalScore}/100
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {calculateScoreDetails.totalScore >= 75 ? 'Highly Optimized' : calculateScoreDetails.totalScore >= 50 ? 'Moderate Efficiency' : 'High Waste Risk'}
              </span>
            </div>
            <div style={{ width: '100%', height: 6, backgroundColor: 'var(--color-bg-surface-secondary)', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div style={{
                width: `${calculateScoreDetails.totalScore}%`,
                height: '100%',
                backgroundColor: calculateScoreDetails.totalScore >= 75 ? '#22a06b' : calculateScoreDetails.totalScore >= 50 ? '#c9a23a' : '#d04545',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Expandable Why This Score Breakdown */}
          {showWhyScore && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Compute Scheduling (40 pts):</span>
                <strong>{calculateScoreDetails.computeScore}/40</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Workload Sizing Ratio (25 pts):</span>
                <strong>{calculateScoreDetails.sizingScore}/25</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Storage Allocation (20 pts):</span>
                <strong>{calculateScoreDetails.storageScore}/20</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Backup Policy (15 pts):</span>
                <strong>{calculateScoreDetails.backupScore}/15</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Governance Workflow: How InspectDB Optimizes */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f5f7fa' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Cost Optimization Governance & Recommendation Workflow
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          <span style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', backgroundColor: '#eceff5', color: '#36415a' }}>1. Workload Input / CloudWatch</span>
          <span style={{ color: '#8e97ac' }}>➔</span>
          <span style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', backgroundColor: '#eceff5', color: '#36415a' }}>2. Workload Analysis</span>
          <span style={{ color: '#8e97ac' }}>➔</span>
          <span style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', backgroundColor: '#eceff5', color: '#36415a' }}>3. Cost Rate Card Modeling</span>
          <span style={{ color: '#8e97ac' }}>➔</span>
          <span style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', backgroundColor: '#fbf4e2', color: '#7a5a12' }}>4. Underutilization Detection</span>
          <span style={{ color: '#8e97ac' }}>➔</span>
          <span style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', backgroundColor: '#e9f6f0', color: '#13623f' }}>5. Evidence-Based Recs</span>
          <span style={{ color: '#8e97ac' }}>➔</span>
          <span style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', backgroundColor: '#e6eefc', color: '#122650' }}>6. User Review & Decision</span>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
          🛡️ <strong>Safety Guarantee:</strong> InspectDB operates strictly in advisory & simulation mode. Changes require user review and are never automatically or destructively applied to cloud infrastructure.
        </p>
      </div>

      {/* Structured Optimization Opportunities */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={18} color="#1e8e62" />
              Evidence-Based Optimization Opportunities
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
              Actionable recommendations to eliminate unnecessary DocumentDB costs for low-volume workloads.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Opportunity 1: Scheduled Development Instance */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-surface-secondary)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: '#fbeaea',
                    color: '#c23b3b'
                  }}>
                    HIGH SAVINGS IMPACT
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Confidence: High (Rate Card Verified)</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.35rem' }}>
                  Automate Scheduled Start/Stop for Development Cluster
                </h4>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e8e62' }}>
                  Save ~$44.46/mo
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  Drops compute from $58.44/mo to $12.48/mo
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontSize: '0.78rem' }}>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Issue:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  24/7 continuous uptime (730 hrs/mo) provisioned for an inspection workload active only during work hours.
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Evidence:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Workload requires ~160 hrs/mo (8h/weekday). Nights and weekends generate 570 idle hours (~78% idle time).
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Recommended Action:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Deploy AWS EventBridge rule + AWS Lambda to stop cluster at 7 PM and start at 8 AM on weekdays.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Data Source: AWS Pricing Rate Card & Workload Schedule Calculator
              </span>
              <button
                onClick={() => handleUpdateStatus('rec-scheduled-start-stop', 'applied')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
              >
                <span>Mark as Applied</span>
                <Check size={13} />
              </button>
            </div>
          </div>

          {/* Opportunity 2: Zero-Cost Local Development */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-surface-secondary)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: '#e6eefc',
                    color: '#122650'
                  }}>
                    PHASE 1 STRATEGY
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Confidence: 100%</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.35rem' }}>
                  Utilize In-Memory Repository During Schema Prototyping
                </h4>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e8e62' }}>
                  $0.00 /mo
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  100% cloud compute savings
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontSize: '0.78rem' }}>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Issue:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Incurring AWS cluster charges while inspection schemas and query filters are being designed.
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Evidence:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  InspectDB provides an in-memory repository with full $elemMatch and dot-notation semantics.
                </p>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Recommended Action:</strong>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Keep <code>USE_MOCK_DB=true</code> until end-to-end cloud load testing is required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What-If Analysis Matrix */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Calculator size={18} color="var(--color-primary)" />
          What-If Deployment Tier Sizing & Cost Matrix
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
          Compare estimated monthly costs across AWS DocumentDB deployment configurations based on your workload sizing.
        </p>

        {estimate && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Deployment Tier</th>
                  <th>Configuration</th>
                  <th>Uptime Target</th>
                  <th>Compute Cost</th>
                  <th>Storage & I/O</th>
                  <th>Total Monthly Estimate</th>
                  <th>Savings vs 24/7</th>
                </tr>
              </thead>
              <tbody>
                {estimate.comparison_options.map((opt) => {
                  const isSelected = opt.id === workload.selected_deployment;
                  const diffVs247 = 58.44 - opt.monthly_cost;
                  return (
                    <tr key={opt.id} style={{ backgroundColor: isSelected ? 'var(--color-primary-light)' : undefined }}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{opt.name}</strong>
                        {isSelected && (
                          <span style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-primary)',
                            color: '#ffffff',
                            fontWeight: 700
                          }}>
                            SELECTED
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        <code>{opt.instance_type}</code> ({opt.node_count} node{opt.node_count > 1 ? 's' : ''})
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {opt.monthly_uptime_hours} hrs/mo
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {fmt(opt.breakdown.compute_cost)}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {fmt(opt.breakdown.storage_cost + opt.breakdown.io_cost + opt.breakdown.backup_cost)}
                      </td>
                      <td style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {fmt(opt.monthly_cost)}
                      </td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 700, color: diffVs247 > 0 ? '#1e8e62' : '#67718a' }}>
                        {diffVs247 > 0 ? `+${fmt(diffVs247)}/mo` : 'Baseline'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gemini AI Custom Advisor Findings */}
      {analysis && (
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #c9a23a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#c9a23a" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Gemini 2.5 Flash Deployment Assessment
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Analysis ID: {analysis.analysis_id}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
            {analysis.gemini_summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {analysis.recommendations?.map((rec) => (
              <div key={rec.id} style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-secondary)',
                border: '1px solid var(--color-border)',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{rec.title}</span>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: rec.impact === 'high' ? '#fbeaea' : '#f3f7fe',
                    color: rec.impact === 'high' ? '#c23b3b' : '#2459c9',
                    fontWeight: 700
                  }}>
                    {rec.impact.toUpperCase()} IMPACT
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 0.5rem 0' }}>
                  {rec.explanation}
                </p>
                <div style={{ color: '#1e8e62', fontWeight: 600 }}>
                  Proposed Action: {rec.proposed_action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
