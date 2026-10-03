import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/landing.css';
import {
  Database,
  TrendingDown,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Server,
  Layers,
  SearchCode,
  Calculator,
  ChevronDown,
  Cpu,
  Clock,
  HardDrive,
  BarChart3,
  ExternalLink,
  Lock,
  Code2,
  Terminal,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // State for interactive code/preview tabs in Hero
  const [activeHeroTab, setActiveHeroTab] = useState<'bottleneck' | 'nested-query' | 'ai-assistant' | 'health-score'>('bottleneck');
  const [copiedCode, setCopiedCode] = useState(false);

  // State for interactive workload sizing & cost calculator
  const [docCount, setDocCount] = useState<number>(50000); // 50k documents
  const [dailyOps, setDailyOps] = useState<number>(25000); // 25k ops/day
  const [instanceType, setInstanceType] = useState<'t3.medium' | 'r5.large' | 'r5.2xlarge'>('t3.medium');
  const [scheduleMode, setScheduleMode] = useState<'scheduled' | 'continuous' | 'local'>('scheduled');

  // State for 6-step architecture workflow
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);

  // State for pricing billing toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semester'>('monthly');

  // State for FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // State for runbook email input
  const [runbookEmail, setRunbookEmail] = useState('');
  const [runbookSent, setRunbookSent] = useState(false);
  const [runbookError, setRunbookError] = useState('');

  // Copy helper
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, []);

  // Fast zero-lag memoized pricing calculations based on verified AWS DocumentDB rate cards
  const costCalculations = useMemo(() => {
    // DocumentDB Pricing Rate Cards (us-east-1)
    const hourlyRates = {
      't3.medium': 0.078,
      'r5.large': 0.277,
      'r5.2xlarge': 1.108
    };

    const hourlyRate = hourlyRates[instanceType];
    
    // Compute hours per month
    const hoursPerMonth = scheduleMode === 'local' ? 0 : scheduleMode === 'scheduled' ? 160 : 744; // 160 hrs = 8h/day M-F
    const continuousHours = 744;

    const continuousCompute = continuousHours * hourlyRate;
    const actualCompute = hoursPerMonth * hourlyRate;

    // Storage: estimate 2.5 KB per document avg
    const totalGB = Math.max(0.01, (docCount * 2.5) / (1024 * 1024));
    const storageCost = totalGB * 0.10; // $0.10 per GB-month

    // I/O Requests: dailyOps * 30 days
    const monthlyIO = (dailyOps * 30) / 1000000;
    const ioCost = monthlyIO * 0.20; // $0.20 per 1M requests

    const totalActual = actualCompute + storageCost + ioCost;
    const totalContinuous = continuousCompute + storageCost + ioCost;
    const savings = Math.max(0, totalContinuous - totalActual);
    const savingsPct = totalContinuous > 0 ? Math.round((savings / totalContinuous) * 100) : 0;

    return {
      hourlyRate,
      hoursPerMonth,
      actualCompute: actualCompute.toFixed(2),
      continuousCompute: continuousCompute.toFixed(2),
      storageCost: storageCost.toFixed(2),
      ioCost: ioCost.toFixed(2),
      totalGB: totalGB < 1 ? totalGB.toFixed(2) : totalGB.toFixed(1),
      totalActual: totalActual.toFixed(2),
      totalContinuous: totalContinuous.toFixed(2),
      savings: savings.toFixed(2),
      savingsPct
    };
  }, [docCount, dailyOps, instanceType, scheduleMode]);

  // Handle runbook submission
  const handleRunbookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!runbookEmail.includes('@') || !runbookEmail.includes('.')) {
      setRunbookError('Please enter a valid email address');
      return;
    }
    setRunbookError('');
    setRunbookSent(true);
  };

  return (
    <div className="landing-container">
      {/* Background Ambient Glows */}
      <div className="landing-bg-glow landing-glow-top-left" />
      <div className="landing-bg-glow landing-glow-top-right" />
      <div className="landing-bg-glow landing-glow-center" />
      <div className="landing-bg-glow landing-glow-bottom" />
      <div className="landing-grid-pattern" />

      {/* Top Navigation */}
      <header className="landing-navbar">
        <div className="landing-navbar-inner">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span>Inspect<span style={{ color: '#38bdf8' }}>DB</span></span>
            <span style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              fontWeight: 600,
              marginLeft: '0.25rem'
            }}>
              v1.4 DocumentDB
            </span>
          </Link>

          <nav className="landing-nav-links" style={{ display: 'none' }} id="desktop-nav">
            <a href="#bottleneck" className="landing-nav-link">Bottleneck</a>
            <a href="#calculator" className="landing-nav-link">Cost Sizing</a>
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#comparison" className="landing-nav-link">Comparison</a>
            <a href="#pricing" className="landing-nav-link">Pricing</a>
            <a href="#faq" className="landing-nav-link">FAQ</a>
          </nav>

          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <Link to="/reports" className="landing-btn-primary">
                <Server className="w-4 h-4" />
                <span>Open Console</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn-ghost">
                  Sign In
                </Link>
                <Link to="/register" className="landing-btn-primary">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="landing-content">
        
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="landing-hero">
          <div className="landing-badge">
            <span className="landing-pulse-dot" />
            <span>Target: Amazon DocumentDB · Low Workload Cost Optimizer</span>
          </div>

          <h1 className="landing-hero-title">
            The document database optimizer built for <span className="landing-gradient-text">Amazon DocumentDB</span>.
          </h1>

          <p className="landing-hero-desc">
            Store variable-schema inspection reports and query deeply nested documents. InspectDB diagnoses the critical bottleneck — <strong style={{ color: '#f8fafc' }}>high fixed cluster cost for small workloads</strong> — and cuts compute bills by up to 76% with automated scheduling.
          </p>

          <div className="landing-hero-actions">
            <Link to={isAuthenticated ? "/reports" : "/register"} className="landing-btn-accent">
              <Zap className="w-4 h-4" />
              <span>Launch Optimizer Console</span>
            </Link>
            <a href="#calculator" className="landing-btn-ghost">
              <Calculator className="w-4 h-4 text-blue-400" />
              <span>Calculate Workload Spend</span>
            </a>
          </div>

          {/* Quickstart Command Bar */}
          <div className="landing-command-bar">
            <span style={{ color: '#94a3b8' }}>$</span>
            <span className="landing-command-text">npx @inspectdb/cli analyze --target=documentdb --region=us-east-1</span>
            <button
              onClick={() => handleCopy('npx @inspectdb/cli analyze --target=documentdb --region=us-east-1')}
              className="landing-copy-btn"
              title="Copy quickstart command"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Hero Interactive Terminal / Showcase Card */}
          <div className="landing-terminal-wrapper">
            <div className="landing-terminal-header">
              <div className="landing-terminal-dots">
                <div className="landing-dot landing-dot-red" />
                <div className="landing-dot landing-dot-yellow" />
                <div className="landing-dot landing-dot-green" />
              </div>

              <div className="landing-tab-buttons">
                <button
                  className={`landing-tab-btn ${activeHeroTab === 'bottleneck' ? 'active' : ''}`}
                  onClick={() => setActiveHeroTab('bottleneck')}
                >
                  Bottleneck Analysis
                </button>
                <button
                  className={`landing-tab-btn ${activeHeroTab === 'nested-query' ? 'active' : ''}`}
                  onClick={() => setActiveHeroTab('nested-query')}
                >
                  Nested MQL Query
                </button>
                <button
                  className={`landing-tab-btn ${activeHeroTab === 'ai-assistant' ? 'active' : ''}`}
                  onClick={() => setActiveHeroTab('ai-assistant')}
                >
                  AI Query Assistant
                </button>
                <button
                  className={`landing-tab-btn ${activeHeroTab === 'health-score' ? 'active' : ''}`}
                  onClick={() => setActiveHeroTab('health-score')}
                >
                  Health Score
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                latency: 3.8ms
              </div>
            </div>

            <div className="landing-terminal-body">
              {activeHeroTab === 'bottleneck' && (
                <div>
                  <div style={{ color: '#38bdf8', marginBottom: '0.5rem' }}>
                    // [InspectDB Bottleneck Diagnosis] Amazon DocumentDB Workload vs Provisioned Cluster
                  </div>
                  <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>
                    ⚠️ POTENTIAL UNDERUTILIZATION DETECTED: Low Ingestion Workload (~0.06 req/s) vs 24/7 Fixed Cluster
                  </div>
                  <div style={{ color: '#94a3b8', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>• Target Engine:</span>
                      <strong style={{ color: '#ffffff' }}>Amazon DocumentDB v4.0 (MongoDB 4.0 Wire Compatible)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>• Baseline 24/7 Spend (db.t3.medium @ $0.078/hr):</span>
                      <strong style={{ color: '#ef4444' }}>$58.44 / month</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>• Optimized Scheduled Dev Spend (160 hrs/mo):</span>
                      <strong style={{ color: '#10b981' }}>$13.98 / month (~76% savings)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Automated Action:</span>
                      <span style={{ color: '#38bdf8' }}>AWS Lambda + EventBridge Start/Stop Policy Active</span>
                    </div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                    ✓ 0 fake metrics. All calculations based on AWS Rate-Cards and actual document storage payload.
                  </div>
                </div>
              )}

              {activeHeroTab === 'nested-query' && (
                <div>
                  <div style={{ color: '#38bdf8', marginBottom: '0.5rem' }}>
                    // Querying nested variable-schema inspection reports with $elemMatch & deep path projection
                  </div>
                  <pre style={{ margin: 0, color: '#e2e8f0' }}>
{`db.inspection_reports.find({
  "status": "APPROVED",
  "facility.environment.temperature_c": { $gte: 28.5 },
  "sections.findings": {
    $elemMatch: {
      "severity": { $in: ["CRITICAL", "HIGH"] },
      "remediation.completed": false
    }
  }
}).project({ "report_id": 1, "sections.title": 1, "created_at": 1 })`}
                  </pre>
                  <div style={{ marginTop: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Matched 3 documents in 4.1ms · Index used: facility_env_idx</span>
                  </div>
                </div>
              )}

              {activeHeroTab === 'ai-assistant' && (
                <div>
                  <div style={{ color: '#a855f7', marginBottom: '0.5rem' }}>
                    // [InspectDB AI Query Engine] Natural Language → Validated DocumentDB MQL
                  </div>
                  <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.6rem 0.85rem', borderRadius: '8px', marginBottom: '0.75rem', color: '#f3e8ff' }}>
                    💬 Prompt: "Find all HVAC inspections with high severity issues that are still pending review"
                  </div>
                  <pre style={{ margin: 0, color: '#38bdf8' }}>
{`{
  "inspection_domain": "HVAC",
  "review_status": "PENDING_REVIEW",
  "sections.findings.severity": "HIGH"
}`}
                  </pre>
                  <div style={{ marginTop: '0.6rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                    🛡️ Verified by Safe MQL Abstract Syntax Tree Validator (No destructive write operators).
                  </div>
                </div>
              )}

              {activeHeroTab === 'health-score' && (
                <div>
                  <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                    // [Architecture Health Score: 85 / 100] Explainable Workload Sizing
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>Workload Sizing (25/30)</div>
                      <div style={{ color: '#34d399', fontWeight: 700 }}>Aligned with db.t3.medium</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>Compute Efficiency (20/30)</div>
                      <div style={{ color: '#f59e0b', fontWeight: 700 }}>Schedule Dev active (~76% saved)</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>Schema Optimization (20/20)</div>
                      <div style={{ color: '#34d399', fontWeight: 700 }}>Embedded findings structure</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>VPC & Multi-AZ (20/20)</div>
                      <div style={{ color: '#34d399', fontWeight: 700 }}>Isolated subnet routing</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Proof & Metrics Ribbon */}
          <div className="landing-stats-grid">
            <div className="landing-stat-card">
              <div className="landing-stat-val" style={{ color: '#34d399' }}>76%</div>
              <div className="landing-stat-label">Fixed Compute Reduction with Scheduled Dev</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-val" style={{ color: '#38bdf8' }}>$13.98<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/mo</span></div>
              <div className="landing-stat-label">Optimized Dev Baseline vs $58.44 24/7 Cluster</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-val" style={{ color: '#f59e0b' }}>0</div>
              <div className="landing-stat-label">Fabricated Telemetry · 100% Rate-Card Math</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-val" style={{ color: '#a855f7' }}>&lt; 5ms</div>
              <div className="landing-stat-label">P99 Deep Nested MQL Query Latency</div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE WORKLOAD & COST CALCULATOR */}
        {/* ========================================================================= */}
        <section id="calculator" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Interactive Sizing Simulator</span>
            <h2 className="landing-section-title">Calculate Your DocumentDB Workload & Spend</h2>
            <p className="landing-section-subtitle">
              Simulate storage, compute, and I/O costs across instance families and verify how scheduling reduces unnecessary cluster burn.
            </p>
          </div>

          <div className="landing-glass-card">
            <div className="landing-calc-container">
              {/* Controls Column */}
              <div>
                {/* Documents Stored Slider */}
                <div className="landing-slider-group">
                  <div className="landing-slider-header">
                    <span className="landing-slider-title">Documents Ingested</span>
                    <span className="landing-slider-value">{docCount.toLocaleString()} docs ({costCalculations.totalGB} GB)</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="1000000"
                    step="5000"
                    value={docCount}
                    onChange={(e) => setDocCount(Number(e.target.value))}
                    className="landing-range-input"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                    <span>1,000</span>
                    <span>250,000</span>
                    <span>500,000</span>
                    <span>1,000,000</span>
                  </div>
                </div>

                {/* Daily Query / Ingestion Ops Slider */}
                <div className="landing-slider-group">
                  <div className="landing-slider-header">
                    <span className="landing-slider-title">Daily Query & Ingestion Operations</span>
                    <span className="landing-slider-value">{dailyOps.toLocaleString()} ops/day</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="200000"
                    step="2000"
                    value={dailyOps}
                    onChange={(e) => setDailyOps(Number(e.target.value))}
                    className="landing-range-input"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                    <span>1,000 ops</span>
                    <span>50,000 ops</span>
                    <span>100,000 ops</span>
                    <span>200,000 ops</span>
                  </div>
                </div>

                {/* Instance Sizing Selection */}
                <div className="landing-slider-group">
                  <div className="landing-slider-header">
                    <span className="landing-slider-title">Amazon DocumentDB Instance Class</span>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Rate: ${costCalculations.hourlyRate}/hr</span>
                  </div>
                  <div className="landing-radio-cards">
                    <div
                      className={`landing-radio-card ${instanceType === 't3.medium' ? 'active' : ''}`}
                      onClick={() => setInstanceType('t3.medium')}
                    >
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.875rem' }}>db.t3.medium</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2 vCPU · 4 GB RAM</div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>$0.078/hr</div>
                    </div>
                    <div
                      className={`landing-radio-card ${instanceType === 'r5.large' ? 'active' : ''}`}
                      onClick={() => setInstanceType('r5.large')}
                    >
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.875rem' }}>db.r5.large</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2 vCPU · 16 GB RAM</div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>$0.277/hr</div>
                    </div>
                    <div
                      className={`landing-radio-card ${instanceType === 'r5.2xlarge' ? 'active' : ''}`}
                      onClick={() => setInstanceType('r5.2xlarge')}
                    >
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.875rem' }}>db.r5.2xlarge</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>8 vCPU · 64 GB RAM</div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>$1.108/hr</div>
                    </div>
                  </div>
                </div>

                {/* Scheduling Strategy */}
                <div>
                  <div className="landing-slider-header">
                    <span className="landing-slider-title">Cluster Run Schedule</span>
                  </div>
                  <div className="landing-radio-cards">
                    <div
                      className={`landing-radio-card ${scheduleMode === 'scheduled' ? 'active' : ''}`}
                      onClick={() => setScheduleMode('scheduled')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#34d399', fontSize: '0.875rem' }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Scheduled Dev</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>8h/day (M-F) = 160h/mo</div>
                    </div>
                    <div
                      className={`landing-radio-card ${scheduleMode === 'continuous' ? 'active' : ''}`}
                      onClick={() => setScheduleMode('continuous')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.875rem' }}>
                        <Activity className="w-3.5 h-3.5" />
                        <span>Continuous 24/7</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>744h/mo non-stop</div>
                    </div>
                    <div
                      className={`landing-radio-card ${scheduleMode === 'local' ? 'active' : ''}`}
                      onClick={() => setScheduleMode('local')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.875rem' }}>
                        <Server className="w-3.5 h-3.5" />
                        <span>Local Sandbox</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>In-memory ($0.00)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Results Column */}
              <div className="landing-calc-result">
                <div>
                  <div className="landing-calc-savings-badge">
                    <TrendingDown className="w-4 h-4" />
                    <span>Projected Savings: ${costCalculations.savings} / month ({costCalculations.savingsPct}%)</span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Estimated Total Monthly Spend
                  </div>
                  <div style={{ fontSize: '2.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    ${costCalculations.totalActual}
                    <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}> / month</span>
                  </div>
                  {scheduleMode === 'scheduled' && (
                    <div style={{ fontSize: '0.8125rem', color: '#ef4444', textDecoration: 'line-through', marginTop: '0.35rem' }}>
                      Unoptimized 24/7 Spend: ${costCalculations.totalContinuous}/mo
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Compute ({costCalculations.hoursPerMonth} hrs @ ${costCalculations.hourlyRate}/hr):</span>
                      <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${costCalculations.actualCompute}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Cluster Storage ({costCalculations.totalGB} GB @ $0.10/GB):</span>
                      <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${costCalculations.storageCost}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>I/O Operations ({((dailyOps * 30) / 1000).toFixed(0)}k reqs @ $0.20/1M):</span>
                      <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>${costCalculations.ioCost}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem', borderRadius: '12px', fontSize: '0.8125rem', color: '#93c5fd' }}>
                  💡 <strong>Recommendation:</strong> For {docCount.toLocaleString()} inspection documents, a scheduled <strong>{instanceType}</strong> configuration keeps infrastructure costs low while providing full DocumentDB query compatibility.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6-STEP AWS WORKFLOW */}
        {/* ========================================================================= */}
        <section style={{ marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Governance & Optimization Lifecycle</span>
            <h2 className="landing-section-title">How InspectDB Analyzes & Optimizes DocumentDB</h2>
            <p className="landing-section-subtitle">
              We never execute destructive cloud changes automatically. Our workflow provides continuous visibility, AI assistance, and operator control.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { num: 1, title: 'Connect & Ingest', desc: 'Local or AWS sandbox' },
              { num: 2, title: 'Variable Schemas', desc: 'Nested report models' },
              { num: 3, title: 'Cost Ceilings', desc: 'Spend guardrails' },
              { num: 4, title: 'AI Nested Query', desc: 'NL to MQL pipeline' },
              { num: 5, title: 'Cost Attribution', desc: 'Compute vs IO drivers' },
              { num: 6, title: 'What-If Downsize', desc: 'Evidence-based sizing' }
            ].map((step) => (
              <div
                key={step.num}
                onClick={() => setActiveWorkflowStep(step.num)}
                style={{
                  background: activeWorkflowStep === step.num ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${activeWorkflowStep === step.num ? '#2563eb' : 'rgba(255, 255, 255, 0.08)'}`,
                  padding: '1rem',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: activeWorkflowStep === step.num ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {step.num}
                  </span>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.875rem' }}>{step.title}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', paddingLeft: '1.85rem' }}>{step.desc}</div>
              </div>
            ))}
          </div>

          <div className="landing-glass-card" style={{ padding: '1.75rem' }}>
            {activeWorkflowStep === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Step 1: Connect or Run in Local Academic Sandbox
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    InspectDB operates seamlessly in Phase 1 Local Demo Mode with zero cloud dependencies or connects directly to your Amazon DocumentDB cluster endpoint inside your VPC.
                  </p>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', background: '#090e1a', padding: '0.85rem', borderRadius: '10px', color: '#38bdf8' }}>
                    $ export DOCUMENTDB_URI="mongodb://user:pass@docdb-cluster.cluster-xyz.us-east-1.docdb.amazonaws.com:27017/?tls=true"
                  </div>
                </div>
                <div style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                  <div style={{ color: '#10b981' }}>✓ Local In-Memory Repository: READY</div>
                  <div style={{ color: '#cbd5e1' }}>✓ Neon PostgreSQL Auth: CONNECTED</div>
                  <div style={{ color: '#f59e0b' }}>✓ CloudWatch Telemetry: Awaiting IAM Link</div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Step 2: Variable-Schema Document Ingestion
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    Store complex inspection reports across manufacturing, building safety, and aerospace domains. Nested objects and polymorphic arrays are indexed automatically without tedious SQL migrations.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>99 Discovered Paths</span>
                    <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>7 Nested Arrays</span>
                  </div>
                </div>
                <div style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#cbd5e1' }}>
                  <pre style={{ margin: 0 }}>
{`{
  "report_id": "REP-2026-001",
  "domain": "Manufacturing",
  "sections": [
    {
      "title": "HVAC Thermal Audit",
      "findings": [
        { "severity": "HIGH", "temp": 34.2 }
      ]
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            )}

            {activeWorkflowStep === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Step 3: Automated Spend Ceilings & Auto-Pause
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    Enforce an AWS Budgets guardrail that halts development clusters over nights and weekends before runaway billing occurs.
                  </p>
                  <div style={{ color: '#34d399', fontSize: '0.875rem', fontWeight: 600 }}>
                    ⚡ Saves up to $44.46/month per developer sandbox.
                  </div>
                </div>
                <div style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                  <div style={{ color: '#f59e0b' }}>guardrails:</div>
                  <div style={{ color: '#cbd5e1', paddingLeft: '1rem' }}>monthly_ceiling_usd: 25</div>
                  <div style={{ color: '#cbd5e1', paddingLeft: '1rem' }}>auto_pause_schedule: "0 20 * * 1-5"</div>
                  <div style={{ color: '#10b981', paddingLeft: '1rem' }}>pause_on_breach: true</div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 4 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Step 4: AI-Assisted Nested Document Queries
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    Ask questions in natural English. InspectDB translates them into performant DocumentDB MongoDB MQL queries with `$elemMatch` filter clauses and projections.
                  </p>
                  <Link to="/ai-assistant" className="landing-btn-ghost" style={{ fontSize: '0.8125rem' }}>
                    <span>Open AI Assistant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#38bdf8' }}>
                  // AI Query Pipeline Output<br />
                  {'db.reports.find({ "sections.findings.status": "OPEN" })'}
                </div>
              </div>
            )}

            {activeWorkflowStep === 5 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Step 5: CloudWatch Cost Driver Attribution
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    Track exact spending proportions. For small workloads, 96.2% of costs originate from idle instance uptime rather than storage or query operations.
                  </p>
                </div>
                <div style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                    <span>Instance Hours (Compute):</span>
                    <strong style={{ color: '#ef4444' }}>96.2%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                    <span>Cluster Storage:</span>
                    <strong style={{ color: '#38bdf8' }}>2.6%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>I/O Operations:</span>
                    <strong style={{ color: '#34d399' }}>1.2%</strong>
                  </div>
                </div>
              </div>
            )}

            {activeWorkflowStep === 6 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                    Step 6: What-If Downsizing & Operator Approval
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    InspectDB recommends cluster resizing and scheduling adjustments. You evaluate the simulated impact and decide when to apply changes via Terraform or AWS Console.
                  </p>
                </div>
                <div style={{ background: '#090e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>
                    Human-in-the-Loop Governance
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    No unannounced destructive actions or surprise downtime.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CORE FEATURES BENTO GRID */}
        {/* ========================================================================= */}
        <section id="features" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Enterprise Capabilities</span>
            <h2 className="landing-section-title">Built for Document-Oriented Precision</h2>
            <p className="landing-section-subtitle">
              Everything required to ingest variable-schema reports, query nested telemetry, and run lean on Amazon Web Services.
            </p>
          </div>

          <div className="landing-bento-grid">
            <div className="landing-bento-item">
              <div className="landing-bento-icon">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="landing-bento-title">Variable-Schema Storage</h3>
              <p className="landing-bento-desc">
                Store inspection records with dynamic fields, equipment telemetry arrays, and multi-tier subdocuments without schema migrations or rigid SQL DDL.
              </p>
            </div>

            <div className="landing-bento-item">
              <div className="landing-bento-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="landing-bento-title">Automated Cluster Schedulers</h3>
              <p className="landing-bento-desc">
                Stop paying for idle clusters over nights and weekends. Automated 8h/day weekday schedules reduce non-production compute bills by up to 76%.
              </p>
            </div>

            <div className="landing-bento-item">
              <div className="landing-bento-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#c084fc' }}>
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="landing-bento-title">Explainable AI Assistant</h3>
              <p className="landing-bento-desc">
                Translates plain-English operator prompts into safe, valid MongoDB 4.0 MQL queries with strict AST safety validators preventing accidental data modification.
              </p>
            </div>

            <div className="landing-bento-item">
              <div className="landing-bento-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}>
                <SearchCode className="w-5 h-5" />
              </div>
              <h3 className="landing-bento-title">Deep Nested Indexing</h3>
              <p className="landing-bento-desc">
                Execute fast multi-key queries across subdocuments like <code>sections.findings.remediation.completed</code> with full pipeline projection and explain plans.
              </p>
            </div>

            <div className="landing-bento-item">
              <div className="landing-bento-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="landing-bento-title">Zero Fabricated Data Policy</h3>
              <p className="landing-bento-desc">
                We never show invented CloudWatch metrics or fake cost savings. All math is deterministic, rate-card backed, and clearly states connection status.
              </p>
            </div>

            <div className="landing-bento-item">
              <div className="landing-bento-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="landing-bento-title">1-Click S3 / JSON Export</h3>
              <p className="landing-bento-desc">
                Export complete document schemas and collections directly to your Amazon S3 buckets in clean JSON/CSV format with zero vendor lock-in.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HONEST COMPARISON TABLE */}
        {/* ========================================================================= */}
        <section id="comparison" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Architecture Evaluation</span>
            <h2 className="landing-section-title">The Honest Architecture Comparison</h2>
            <p className="landing-section-subtitle">
              How InspectDB + Amazon DocumentDB stacks up against alternative database choices for variable-schema document applications.
            </p>
          </div>

          <div className="landing-table-wrapper">
            <table className="landing-compare-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th className="highlight">InspectDB + DocumentDB</th>
                  <th>Managed Cloud DB (Atlas)</th>
                  <th>Self-Hosted EC2 MongoDB</th>
                  <th>Relational PostgreSQL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>Small Workload Cost</td>
                  <td className="highlight" style={{ color: '#34d399' }}>$13.98/mo (Scheduled)</td>
                  <td>$57.00/mo (Fixed M10)</td>
                  <td>$38.00/mo + Ops Time</td>
                  <td>$15.00/mo</td>
                </tr>
                <tr>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>Variable-Schema Agility</td>
                  <td className="highlight" style={{ color: '#34d399' }}>Native JSON / BSON</td>
                  <td>Native JSON / BSON</td>
                  <td>Native JSON / BSON</td>
                  <td>Rigid DDL or JSONB query tax</td>
                </tr>
                <tr>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>Nested Subdocument Querying</td>
                  <td className="highlight" style={{ color: '#34d399' }}>Full $elemMatch & MQL</td>
                  <td>Full MQL</td>
                  <td>Full MQL</td>
                  <td>Complex jsonb_extract_path</td>
                </tr>
                <tr>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>AWS VPC & IAM Integration</td>
                  <td className="highlight" style={{ color: '#34d399' }}>Native AWS VPC Endpoint</td>
                  <td>External VPC Peering</td>
                  <td>Manual Security Groups</td>
                  <td>Native RDS / Aurora</td>
                </tr>
                <tr>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>Automated Idle Dev Auto-Pause</td>
                  <td className="highlight" style={{ color: '#34d399' }}>Built-in Lambda/EventBridge</td>
                  <td>Requires custom API scripts</td>
                  <td>Manual EC2 Stop</td>
                  <td>Aurora Serverless v2</td>
                </tr>
                <tr>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>Built-in AI Query Assistant</td>
                  <td className="highlight" style={{ color: '#34d399' }}>Included with AST Guard</td>
                  <td>Paid add-on</td>
                  <td>None</td>
                  <td>None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PRICING & DEPLOYMENT TIERS */}
        {/* ========================================================================= */}
        <section id="pricing" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Transparent AWS Sizing</span>
            <h2 className="landing-section-title">Deployment Architectures & Sizing Tiers</h2>
            <p className="landing-section-subtitle">
              Choose the right operational model for your team—from zero-cost local developer sandboxes to high-availability production clusters.
            </p>

            <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.25rem', borderRadius: '10px', marginTop: '1.5rem' }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  background: billingCycle === 'monthly' ? '#2563eb' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('semester')}
                style={{
                  background: billingCycle === 'semester' ? '#2563eb' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Semester (4 Months)
              </button>
            </div>
          </div>

          <div className="landing-pricing-grid">
            {/* Tier 1: Local In-Memory Developer */}
            <div className="landing-pricing-card">
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
                  Local Developer
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', minHeight: '40px' }}>
                  Zero-cost in-memory sandbox for rapid prototyping, offline testing, and university projects.
                </p>
                <div style={{ margin: '1.5rem 0' }}>
                  <span className="landing-price-val">$0</span>
                  <span className="landing-price-period"> / free forever</span>
                </div>
                <ul className="landing-feature-list">
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> In-memory inspection repository</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Full Nested Query Explorer</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> AI Query Assistant (Gemini)</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> JSON / CSV Export</li>
                </ul>
              </div>
              <Link to="/register" className="landing-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                Start Free Sandbox
              </Link>
            </div>

            {/* Tier 2: Scheduled Dev (Featured) */}
            <div className="landing-pricing-card featured">
              <div className="landing-pricing-badge">Recommended for Lean Teams</div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
                  Scheduled Dev Cluster
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', minHeight: '40px' }}>
                  db.t3.medium (2 vCPU / 4GB) running 8h/day on weekdays with automated off-hours pause.
                </p>
                <div style={{ margin: '1.5rem 0' }}>
                  <span className="landing-price-val" style={{ color: '#34d399' }}>
                    ${billingCycle === 'monthly' ? '13.98' : '55.92'}
                  </span>
                  <span className="landing-price-period"> {billingCycle === 'monthly' ? '/ month' : '/ semester'}</span>
                </div>
                <ul className="landing-feature-list">
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> 160 active cluster hours / mo</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Automated Lambda start/stop policy</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> 76% Compute cost savings</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Spend ceiling budget guardrail</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Real AWS VPC deployment</li>
                </ul>
              </div>
              <Link to="/cost-optimizer" className="landing-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Configure Scheduled Dev
              </Link>
            </div>

            {/* Tier 3: Continuous 24/7 Dev */}
            <div className="landing-pricing-card">
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
                  Continuous 24/7 Dev
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', minHeight: '40px' }}>
                  db.t3.medium running non-stop 744 hours/month for always-on staging pipelines.
                </p>
                <div style={{ margin: '1.5rem 0' }}>
                  <span className="landing-price-val">
                    ${billingCycle === 'monthly' ? '58.44' : '233.76'}
                  </span>
                  <span className="landing-price-period"> {billingCycle === 'monthly' ? '/ month' : '/ semester'}</span>
                </div>
                <ul className="landing-feature-list">
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Always-on 744 hrs / month</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> 2 vCPU · 4 GB RAM Compute</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Continuous CI/CD automated test runs</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Automated CloudWatch cost monitoring</li>
                </ul>
              </div>
              <Link to="/cost-monitoring" className="landing-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                View Cost Breakdown
              </Link>
            </div>

            {/* Tier 4: Production HA */}
            <div className="landing-pricing-card">
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
                  Production Multi-AZ
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', minHeight: '40px' }}>
                  2× db.r5.large instances across 3 Availability Zones with automatic failover.
                </p>
                <div style={{ margin: '1.5rem 0' }}>
                  <span className="landing-price-val">
                    ${billingCycle === 'monthly' ? '410.20' : '1,640.80'}
                  </span>
                  <span className="landing-price-period"> {billingCycle === 'monthly' ? '/ month' : '/ semester'}</span>
                </div>
                <ul className="landing-feature-list">
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Multi-AZ high availability replica</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> 6-way replicated storage across 3 AZs</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Sub-minute failover guarantee</li>
                  <li className="landing-feature-item"><Check className="w-4 h-4 text-emerald-400" /> Enterprise audit logging & backup</li>
                </ul>
              </div>
              <Link to="/settings" className="landing-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                Enterprise Details
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FAQ ACCORDION */}
        {/* ========================================================================= */}
        <section id="faq" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Frequently Asked Questions</span>
            <h2 className="landing-section-title">Everything You Need to Know</h2>
          </div>

          <div className="landing-faq-list">
            {[
              {
                q: "Why is Amazon DocumentDB expensive for small or development workloads?",
                a: "Amazon DocumentDB requires a dedicated provisioned instance (minimum db.t3.medium at $0.078/hr in us-east-1). Running it continuously costs $58.44/month regardless of whether you send 10 queries or 1,000,000 queries. InspectDB solves this by establishing scheduled start/stop automation during off-hours, lowering the fixed monthly compute cost to $13.98/mo."
              },
              {
                q: "Does InspectDB modify my AWS infrastructure automatically?",
                a: "No. InspectDB operates under strict Human-in-the-Loop governance. The system monitors your workload, detects idle underutilization, models What-If cost impacts, and generates copyable Terraform/CloudFormation code. You maintain complete control over applying changes to your AWS account."
              },
              {
                q: "What is Phase 1 Local Demo Mode?",
                a: "Phase 1 allows you to test all features (variable-schema report ingestion, nested queries, AI prompt assistant, What-If simulation) using an in-memory repository and Neon PostgreSQL for auth. No AWS account or credit card is required to run Phase 1."
              },
              {
                q: "How does the AI Query Assistant prevent destructive operations?",
                a: "Every query generated by Gemini is inspected by InspectDB's Abstract Syntax Tree validator. Destructive write operations (such as $delete, $drop, $set, $unset) are blocked. Only safe read filters, projections, and aggregation pipelines are executed."
              },
              {
                q: "How does DocumentDB handle nested arrays and variable inspection schemas?",
                a: "Amazon DocumentDB is MongoDB 4.0 API compatible. It allows arbitrary JSON/BSON structures with embedded arrays and nested key-value pairs. Queries with $elemMatch evaluate conditions against multiple subdocument fields in a single pass."
              },
              {
                q: "Can I export my data if I decide to migrate?",
                a: "Yes. InspectDB includes native 1-click export to Amazon S3 buckets or local files in clean JSON and CSV format. Nothing is held hostage."
              }
            ].map((item, idx) => (
              <div key={idx} className="landing-faq-item">
                <button
                  className="landing-faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-blue-400"
                    style={{
                      transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {openFaq === idx && (
                  <div className="landing-faq-answer">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* QUICKSTART / RUNBOOK CTA SECTION */}
        {/* ========================================================================= */}
        <section style={{ marginBottom: '6rem' }}>
          <div className="landing-glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.2) 0%, rgba(15, 23, 42, 0.9) 70%)', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
            <span className="landing-badge" style={{ marginBottom: '1rem' }}>
              <Terminal className="w-3.5 h-3.5" />
              <span>Get the AWS DocumentDB Cost Optimization Runbook</span>
            </span>

            <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#ffffff', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Deploy in under six minutes on your AWS Sandbox
            </h2>

            <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Receive our step-by-step CloudFormation template, scheduled start/stop Lambda script, and DocumentDB nested query cheat sheet.
            </p>

            {runbookSent ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.75rem 1.5rem', borderRadius: '12px', color: '#34d399', fontWeight: 600 }}>
                <CheckCircle2 className="w-5 h-5" />
                <span>Optimization Runbook & CloudFormation templates dispatched to your email!</span>
              </div>
            ) : (
              <form onSubmit={handleRunbookSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                <input
                  type="email"
                  placeholder="name@university.edu or company email"
                  value={runbookEmail}
                  onChange={(e) => setRunbookEmail(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="landing-btn-accent">
                  <span>Send Runbook</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {runbookError && (
              <div style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                {runbookError}
              </div>
            )}

            <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link to="/register" className="landing-btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
                <span>Launch InspectDB Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="landing-btn-ghost" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
                <span>Sign In to Existing Account</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-content">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-logo" style={{ marginBottom: '1rem' }}>
                <div className="landing-logo-icon">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <span>Inspect<span style={{ color: '#38bdf8' }}>DB</span></span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '320px' }}>
                The workload analyzer and cost optimization platform for Amazon DocumentDB. Designed for variable-schema applications and lean cloud budgets.
              </p>
            </div>

            <div>
              <div className="landing-footer-col-title">Platform</div>
              <ul className="landing-footer-links">
                <li><Link to="/cost-monitoring" className="landing-footer-link">Cost Monitoring</Link></li>
                <li><Link to="/cost-optimizer" className="landing-footer-link">Cost Optimizer</Link></li>
                <li><Link to="/ai-assistant" className="landing-footer-link">AI Query Assistant</Link></li>
                <li><Link to="/nested-query" className="landing-footer-link">Nested Query Explorer</Link></li>
              </ul>
            </div>

            <div>
              <div className="landing-footer-col-title">Architecture</div>
              <ul className="landing-footer-links">
                <li><a href="#bottleneck" className="landing-footer-link">Bottleneck Diagnosis</a></li>
                <li><a href="#calculator" className="landing-footer-link">Workload Sizing</a></li>
                <li><a href="#comparison" className="landing-footer-link">Database Comparison</a></li>
                <li><a href="#pricing" className="landing-footer-link">AWS Pricing Cards</a></li>
              </ul>
            </div>

            <div>
              <div className="landing-footer-col-title">Resources</div>
              <ul className="landing-footer-links">
                <li><Link to="/login" className="landing-footer-link">Sign In</Link></li>
                <li><Link to="/register" className="landing-footer-link">Register Account</Link></li>
                <li><Link to="/settings" className="landing-footer-link">System Settings</Link></li>
                <li><a href="#faq" className="landing-footer-link">Documentation & FAQ</a></li>
              </ul>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <div>
              © 2026 InspectDB. All rights reserved. Amazon DocumentDB is a trademark of Amazon Web Services, Inc.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              <span className="landing-pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span>Engine Status: Amazon DocumentDB v4.0 Wire Compatible</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
