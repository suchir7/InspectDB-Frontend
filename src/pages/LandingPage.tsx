import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/landing.css';
import {
  ArrowRight, BarChart3, Clock, Database, GitBranch, Layers, Lock, SearchCode, Server, ShieldCheck, Sparkles, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { HealthStatus } from '../types';

const BACKEND_REPO = 'https://github.com/suchir7/InspectDB-Backend';
const FRONTEND_REPO = 'https://github.com/suchir7/InspectDB-Frontend';

const GOLD_ICON = { background: 'rgba(201, 162, 58, 0.15)', borderColor: 'rgba(201, 162, 58, 0.3)', color: '#d8b860' };
const BLUE_ICON = { background: 'rgba(127, 166, 240, 0.15)', borderColor: 'rgba(127, 166, 240, 0.3)', color: '#7fa6f0' };

const BRIEF = [
  {
    kind: 'Use case',
    title: 'Store variable-schema inspection reports',
    body: 'Each report is one DocumentDB document: core fields plus findings[], nested issues[] and free-form dynamic attributes per inspection domain. A new inspection type adds fields without a migration.',
    link: { to: '/create-inspection', label: 'Create a report' },
    icon: <Layers className="w-5 h-5" />, style: BLUE_ICON
  },
  {
    kind: 'Use case',
    title: 'Query nested document structures',
    body: 'Dot-notation and $elemMatch queries across findings and issues, built visually, typed as raw MongoDB filters, or written for you by the AI assistant. Every query is scoped to the signed-in user.',
    link: { to: '/nested-query', label: 'Open the Query Explorer' },
    icon: <SearchCode className="w-5 h-5" />, style: BLUE_ICON
  },
  {
    kind: 'Bottleneck',
    title: 'MongoDB compatibility gaps break the driver',
    body: 'The driver is configured for DocumentDB: TLS with the Amazon CA bundle, retryable writes off, one index build at a time. Queries are checked for operators DocumentDB does not support ($where, $function, $elemMatch inside $all) and rewritten when possible.',
    link: { to: '/ai-assistant', label: 'Try the compatibility checks' },
    icon: <ShieldCheck className="w-5 h-5" />, style: GOLD_ICON
  },
  {
    kind: 'Bottleneck',
    title: 'Cluster cost is high for a small workload',
    body: 'EventBridge Scheduler runs the cluster on weekdays from 09:00 to 21:00 IST: 261 of 730 hours a month, 64% fewer instance hours. Cost Monitoring reads the real bill from Cost Explorer.',
    link: { to: '/cost-monitoring', label: 'See live costs' },
    icon: <Clock className="w-5 h-5" />, style: GOLD_ICON
  }
];

const FEATURES = [
  { icon: <Layers className="w-5 h-5" />, style: undefined, title: 'Variable-schema documents', desc: 'Reports with any mix of findings, nested issues, custom fields and domain telemetry, stored as native JSON documents in one collection.' },
  { icon: <SearchCode className="w-5 h-5" />, style: BLUE_ICON, title: 'Nested query builder', desc: 'Twelve query presets, a visual builder that groups array conditions into $elemMatch, raw filters, and a schema explorer that discovers every path in your data.' },
  { icon: <Sparkles className="w-5 h-5" />, style: GOLD_ICON, title: 'AI query assistant', desc: 'Gemini turns plain English into read-only MongoDB filters. A safety validator blocks writes and code execution before anything runs.' },
  { icon: <ShieldCheck className="w-5 h-5" />, style: GOLD_ICON, title: 'DocumentDB compatibility analyzer', desc: 'Checks each query against DocumentDB 3.6 to 8.0 support, explains any gap with AWS documentation links, and offers a compatible alternative.' },
  { icon: <BarChart3 className="w-5 h-5" />, style: BLUE_ICON, title: 'Live cost monitoring', desc: 'Daily spend from Cost Explorer, usage from CloudWatch, and recommendations computed from your real cluster configuration and AWS list prices.' },
  { icon: <Lock className="w-5 h-5" />, style: undefined, title: 'Private multi-user workspaces', desc: 'Accounts in Neon PostgreSQL with bcrypt passwords and signed JWT sessions. Every report and query is isolated to its owner.' }
];

const ARCHITECTURE = [
  { icon: <Zap className="w-5 h-5" />, title: 'React frontend', detail: 'Vite + TypeScript, hosted on Vercel' },
  { icon: <Server className="w-5 h-5" />, title: 'FastAPI backend', detail: 'Docker on EC2 with Caddy HTTPS' },
  { icon: <Database className="w-5 h-5" />, title: 'Amazon DocumentDB 5.0', detail: 'Private VPC, TLS, scheduled start/stop' }
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => setHealthError(true));
  }, []);

  const db = health?.database;
  const consoleLink = isAuthenticated ? '/dashboard' : '/register';

  return (
    <div className="landing-container">
      <div className="landing-bg-glow landing-glow-top-left" />
      <div className="landing-bg-glow landing-glow-top-right" />
      <div className="landing-bg-glow landing-glow-center" />
      <div className="landing-bg-glow landing-glow-bottom" />
      <div className="landing-grid-pattern" />

      <header className="landing-navbar">
        <div className="landing-navbar-inner">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">
              <Database className="w-5 h-5" />
            </div>
            <span>Inspect<span style={{ color: 'var(--gold-400)' }}>DB</span></span>
          </Link>
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="landing-btn-primary">
                <Server className="w-4 h-4" />
                <span>Open Console</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn-ghost">Sign In</Link>
                <Link to="/register" className="landing-btn-primary">
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="landing-content">
        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-badge">
            <span className="landing-pulse-dot" />
            <span>Amazon DocumentDB · Document-oriented inspection reports</span>
          </div>
          <h1 className="landing-hero-title">
            Inspection reports, stored and queried in <span className="landing-gradient-text">Amazon DocumentDB</span>.
          </h1>
          <p className="landing-hero-desc">
            Store variable-schema inspection reports, query deeply nested documents, check every query against
            DocumentDB's MongoDB compatibility gaps, and keep cluster cost low with an automatic start/stop schedule.
          </p>
          <div className="landing-hero-actions">
            <Link to={consoleLink} className="landing-btn-accent">
              <Zap className="w-4 h-4" />
              <span>{isAuthenticated ? 'Open the Console' : 'Get Started'}</span>
            </Link>
            <a href="#brief" className="landing-btn-ghost">
              <span>How it meets the brief</span>
            </a>
          </div>

          {/* Live status, read from the public health endpoint */}
          <div className="landing-glass-card" style={{ maxWidth: 760, margin: '0 auto', textAlign: 'left', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-300)' }}>Live system status</span>
              <span style={{ fontSize: '0.75rem', color: '#8e97ac' }}>Read from the API just now</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'API server', value: healthError ? 'Unreachable' : health ? 'Online' : 'Checking…', ok: !healthError && !!health },
                { label: 'Document store', value: db ? db.type : healthError ? '—' : 'Checking…', ok: !!db },
                {
                  label: 'Database status',
                  value: db ? (db.mode === 'documentdb' ? (db.connected ? 'Connected' : 'Paused (outside schedule)') : db.status) : '—',
                  ok: !!db && (db.mode !== 'documentdb' || !!db.connected)
                },
                { label: 'Collection', value: db?.database_name ? `${db.database_name}.${db.collection}` : '—', ok: !!db?.database_name }
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '0.74rem', color: '#8e97ac' }}>{item.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem', color: '#f5f7fa', fontWeight: 600, fontSize: '0.92rem' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.ok ? '#22a06b' : '#8e97ac', flexShrink: 0 }} />
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The brief */}
        <section id="brief" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Project brief</span>
            <h2 className="landing-section-title">Two use cases, two bottlenecks, all handled</h2>
            <p className="landing-section-subtitle">
              Amazon DocumentDB for a document-oriented application, and the problems teams hit when they build one.
            </p>
          </div>
          <div className="landing-bento-grid landing-bento-grid-2">
            {BRIEF.map(item => (
              <div key={item.title} className="landing-bento-item" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                  <div className="landing-bento-icon" style={{ ...item.style, marginBottom: 0 }}>{item.icon}</div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: item.kind === 'Use case' ? '#7fa6f0' : 'var(--gold-300)' }}>
                    {item.kind}
                  </span>
                </div>
                <h3 className="landing-bento-title">{item.title}</h3>
                <p className="landing-bento-desc" style={{ flex: 1 }}>{item.body}</p>
                <Link to={item.link.to} style={{ marginTop: '1rem', color: 'var(--gold-400)', fontWeight: 600, fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  {item.link.label} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">What it does</span>
            <h2 className="landing-section-title">Built for document-oriented data</h2>
            <p className="landing-section-subtitle">Everything in the app, working against a live DocumentDB cluster.</p>
          </div>
          <div className="landing-bento-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="landing-bento-item">
                <div className="landing-bento-icon" style={f.style}>{f.icon}</div>
                <h3 className="landing-bento-title">{f.title}</h3>
                <p className="landing-bento-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section id="architecture" style={{ scrollMarginTop: '5rem', marginBottom: '6rem' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag">Architecture</span>
            <h2 className="landing-section-title">How the pieces fit</h2>
            <p className="landing-section-subtitle">
              DocumentDB only accepts connections from inside its VPC, so the API runs on EC2 next to it.
              Accounts live in Neon PostgreSQL; the AI features call Google Gemini.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {ARCHITECTURE.map((node, i) => (
              <React.Fragment key={node.title}>
                <div className="landing-glass-card" style={{ flex: '1 1 220px', maxWidth: 300, padding: '1.25rem', textAlign: 'center' }}>
                  <div className="landing-bento-icon" style={{ ...GOLD_ICON, margin: '0 auto 0.75rem' }}>{node.icon}</div>
                  <div style={{ color: '#f5f7fa', fontWeight: 650 }}>{node.title}</div>
                  <div style={{ color: '#8e97ac', fontSize: '0.84rem', marginTop: '0.25rem' }}>{node.detail}</div>
                </div>
                {i < ARCHITECTURE.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gold-400)' }} aria-hidden="true">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section style={{ marginBottom: '6rem' }}>
          <div className="landing-glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <h2 className="landing-section-title" style={{ marginBottom: '0.75rem' }}>Open the console</h2>
            <p className="landing-section-subtitle" style={{ margin: '0 auto 1.75rem' }}>
              Create an account to store reports, run nested queries and see live DocumentDB costs. The source code is public.
            </p>
            <div className="landing-hero-actions" style={{ marginBottom: 0 }}>
              <Link to={consoleLink} className="landing-btn-accent">
                <Zap className="w-4 h-4" /><span>{isAuthenticated ? 'Open the Console' : 'Create an Account'}</span>
              </Link>
              <a href={BACKEND_REPO} target="_blank" rel="noreferrer" className="landing-btn-ghost">
                <GitBranch className="w-4 h-4" /><span>Backend on GitHub</span>
              </a>
              <a href={FRONTEND_REPO} target="_blank" rel="noreferrer" className="landing-btn-ghost">
                <GitBranch className="w-4 h-4" /><span>Frontend on GitHub</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-content">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-logo" style={{ marginBottom: '1rem' }}>
                <div className="landing-logo-icon"><Database className="w-4 h-4" /></div>
                <span>Inspect<span style={{ color: 'var(--gold-400)' }}>DB</span></span>
              </div>
              <p style={{ color: '#8e97ac', fontSize: '0.86rem', maxWidth: 320 }}>
                Amazon DocumentDB for a document-oriented application: variable-schema inspection reports and nested queries.
              </p>
            </div>
            <div>
              <div className="landing-footer-col-title">App</div>
              <ul className="landing-footer-links">
                <li><Link to="/reports" className="landing-footer-link">Inspection Reports</Link></li>
                <li><Link to="/nested-query" className="landing-footer-link">Nested Query Explorer</Link></li>
                <li><Link to="/ai-assistant" className="landing-footer-link">AI Query Assistant</Link></li>
                <li><Link to="/cost-monitoring" className="landing-footer-link">Cost Monitoring</Link></li>
              </ul>
            </div>
            <div>
              <div className="landing-footer-col-title">Project</div>
              <ul className="landing-footer-links">
                <li><a href="#brief" className="landing-footer-link">Project brief</a></li>
                <li><a href="#architecture" className="landing-footer-link">Architecture</a></li>
                <li><a href={BACKEND_REPO} target="_blank" rel="noreferrer" className="landing-footer-link">Backend repository</a></li>
                <li><a href={FRONTEND_REPO} target="_blank" rel="noreferrer" className="landing-footer-link">Frontend repository</a></li>
              </ul>
            </div>
            <div>
              <div className="landing-footer-col-title">Account</div>
              <ul className="landing-footer-links">
                <li><Link to="/login" className="landing-footer-link">Sign In</Link></li>
                <li><Link to="/register" className="landing-footer-link">Create Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>InspectDB · Amazon DocumentDB 5.0 · FastAPI · React</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
