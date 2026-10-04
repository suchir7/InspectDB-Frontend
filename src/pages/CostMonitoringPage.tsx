import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Cpu, Database, HardDrive, Info, Loader2, RefreshCw, Sparkles, Wallet
} from 'lucide-react';
import { api } from '../services/api';
import { CostMonitoringAnalysisResponse, LiveCostOverview } from '../types';
import { DailyCostChart } from '../components/cost/DailyCostChart';
import { LiveDataNotice } from '../components/cost/LiveDataNotice';
import { formatSmallUsd, formatUsd, workloadFromLive } from '../services/costModel';

const BUDGET_KEY = 'inspectdb_monthly_budget';

const readBudget = (): number | null => {
  try {
    const value = Number(localStorage.getItem(BUDGET_KEY));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
};

const formatBytes = (bytes: number | null): string => {
  if (bytes === null) return '—';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

const formatTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

interface Alert { level: 'warning' | 'info' | 'success'; title: string; detail: string }

const StatTile: React.FC<{ label: string; value: string; sub: string; icon: React.ReactNode }> = ({ label, value, sub, icon }) => (
  <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>
      <span style={{ color: 'var(--gold-700)' }}>{icon}</span>
    </div>
    <div className="stat-tile-value" style={{ marginTop: '0.35rem' }}>{value}</div>
    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{sub}</div>
  </div>
);

export const CostMonitoringPage: React.FC = () => {
  const [overview, setOverview] = useState<LiveCostOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(readBudget);
  const [budgetDraft, setBudgetDraft] = useState<string>(() => (readBudget() ?? '').toString());
  const [analysis, setAnalysis] = useState<CostMonitoringAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setOverview(await api.getLiveCostOverview(refresh));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cluster = overview?.sections.cluster?.data ?? null;
  const schedule = overview?.sections.schedule?.data ?? null;
  const metrics = overview?.sections.metrics?.data ?? null;
  const costs = overview?.sections.costs?.data ?? null;
  const profile = overview?.profile ?? null;

  const saveBudget = () => {
    const value = Number(budgetDraft);
    const next = value > 0 ? value : null;
    setBudget(next);
    try {
      next ? localStorage.setItem(BUDGET_KEY, String(next)) : localStorage.removeItem(BUDGET_KEY);
    } catch {
      // Storage unavailable (private mode); the budget still applies for this session
    }
  };

  const scheduledHoursInWindow = schedule?.active && schedule.weekly_hours !== null ? schedule.weekly_hours : null;

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    if (costs && budget) {
      const pct = costs.projected_month_usage / budget * 100;
      if (pct > 100) list.push({ level: 'warning', title: 'Projected to exceed your budget', detail: `${formatUsd(costs.projected_month_usage)} projected vs a ${formatUsd(budget)} budget (${pct.toFixed(0)}%).` });
      else if (pct >= 80) list.push({ level: 'warning', title: 'Close to your budget', detail: `${formatUsd(costs.projected_month_usage)} projected, ${pct.toFixed(0)}% of ${formatUsd(budget)}.` });
    }
    if (metrics && scheduledHoursInWindow !== null && metrics.running_hours > scheduledHoursInWindow + 1) {
      list.push({ level: 'info', title: 'Cluster ran outside its schedule', detail: `${metrics.running_hours} running hours in the last 7 days vs ${scheduledHoursInWindow} scheduled. It was probably started manually.` });
    }
    if (metrics && metrics.cpu_credits_charged > 0) {
      list.push({ level: 'warning', title: 'Burst CPU credits charged', detail: `${metrics.cpu_credits_charged.toFixed(2)} surplus vCPU-hours in the last 7 days.` });
    }
    if (costs) {
      const totals = costs.daily.map(d => d.total);
      costs.daily.forEach((day, i) => {
        const history = totals.slice(Math.max(0, i - 7), i).filter(v => v > 0).sort((a, b) => a - b);
        if (history.length >= 3) {
          const median = history[Math.floor(history.length / 2)];
          if (day.total > median * 1.5 && day.total - median > 0.1) {
            list.push({ level: 'info', title: `Cost spike on ${day.date}`, detail: `${formatSmallUsd(day.total)} vs a 7-day median of ${formatSmallUsd(median)}.` });
          }
        }
      });
      if (!costs.latest_cost_date) list.push({ level: 'info', title: 'No billed usage yet', detail: 'Cost Explorer has not reported any usage for the last 30 days. New charges can take up to 24 hours to appear.' });
    }
    if (!list.length && (costs || metrics)) list.push({ level: 'success', title: 'No anomalies detected', detail: 'Spend and usage are in line with the schedule and recent history.' });
    return list;
  }, [costs, metrics, budget, scheduledHoursInWindow]);

  const runAnalysis = async () => {
    if (!profile) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const workload = workloadFromLive(profile, metrics);
      setAnalysis(await api.analyzeCostMonitoring({
        current_workload: workload,
        baseline_workload: { ...workload, monthly_uptime_hours: 730, selected_deployment: 'provisioned_single_az' },
        threshold: budget ?? Math.max(5, Math.ceil(overview?.model?.monthly_total ?? 20))
      }));
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const budgetPct = costs && budget ? Math.min((costs.projected_month_usage / budget) * 100, 150) : null;
  const budgetState = budgetPct === null ? null : budgetPct > 100 ? 'over' : budgetPct >= 80 ? 'near' : 'within';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">AWS cost monitoring</div>
          <h2 style={{ marginTop: '0.2rem' }}>Cost Monitoring</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Actual spend and usage for your DocumentDB deployment, read live from your AWS account.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {overview?.sections.costs?.fetched_at && (
            <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
              Spend updated {formatTime(overview.sections.costs.fetched_at)}
            </span>
          )}
          <Link to="/cost-optimizer" className="btn btn-secondary btn-sm">Open Cost Optimizer</Link>
          <button className="btn btn-primary btn-sm" onClick={() => load(true)} disabled={refreshing || loading}>
            <RefreshCw size={14} className={refreshing ? 'spin' : undefined} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-text-muted)' }}>
          <Loader2 size={18} className="spin" /> Loading live AWS data…
        </div>
      )}

      <LiveDataNotice overview={overview} loadError={loadError} />

      {cluster && (
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={18} color="#2459c9" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Cluster</div>
              <div style={{ fontWeight: 650, fontSize: '0.9rem' }}>{cluster.cluster_id}</div>
            </div>
          </div>
          <span className={`badge ${cluster.status === 'available' ? 'badge-success' : cluster.status === 'stopped' ? 'badge-neutral' : 'badge-warning'}`}>
            {cluster.status === 'available' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            {cluster.status}
          </span>
          <div style={{ fontSize: '0.84rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Instance </span>
            {cluster.instances.map(i => i.instance_class).join(', ') || 'none'} · {cluster.region}
          </div>
          <div style={{ fontSize: '0.84rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Schedule </span>
            {schedule?.active ? `${schedule.description} · ${schedule.monthly_hours} h/month` : 'none (always on)'}
          </div>
        </div>
      )}

      {/* KPI row */}
      {overview?.available && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <StatTile label="Usage this month" icon={<Wallet size={17} />}
                    value={costs ? formatSmallUsd(costs.month_to_date.usage) : '—'}
                    sub={costs ? `Before credits · data through ${costs.latest_cost_date ?? '—'}` : 'Cost Explorer data unavailable'} />
          <StatTile label="Credits applied" icon={<CheckCircle2 size={17} />}
                    value={costs ? formatSmallUsd(costs.month_to_date.credits) : '—'}
                    sub={costs ? `Net billed ${formatSmallUsd(costs.month_to_date.net)}` : '—'} />
          <StatTile label="Average per day" icon={<Activity size={17} />}
                    value={costs ? formatSmallUsd(costs.average_daily_last_7_days) : '—'}
                    sub="Last 7 complete days" />
          <StatTile label="Projected month-end" icon={<Clock size={17} />}
                    value={costs ? formatUsd(costs.projected_month_usage) : '—'}
                    sub={costs ? `At the 7-day average · day ${costs.days_elapsed} of ${costs.days_in_month}` : '—'} />
        </div>
      )}

      {/* Budget */}
      {overview?.available && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '0.9rem' }}>
            <h3 className="card-title">Monthly budget</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>$</span>
              <input className="form-control" style={{ width: 110, padding: '0.4rem 0.6rem' }} type="number" min="1" step="1"
                     placeholder="e.g. 30" value={budgetDraft} onChange={e => setBudgetDraft(e.target.value)} aria-label="Monthly budget in US dollars" />
              <button className="btn btn-secondary btn-sm" onClick={saveBudget}>Save</button>
            </div>
          </div>
          {budgetPct === null ? (
            <p style={{ fontSize: '0.86rem' }}>Set a monthly budget to compare it with the projected month-end spend. It is saved in this browser only.</p>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.45rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  {budgetState === 'within' ? <CheckCircle2 size={15} color="#1e8e62" /> : <AlertTriangle size={15} color={budgetState === 'over' ? '#c23b3b' : '#b7841c'} />}
                  {budgetState === 'within' ? 'Within budget' : budgetState === 'near' ? 'Near budget' : 'Over budget'}
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUsd(costs!.projected_month_usage)} of {formatUsd(budget!)}</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: budgetState === 'within' ? 'var(--color-success-light)' : budgetState === 'near' ? 'var(--color-warning-light)' : 'var(--color-danger-light)' }}>
                <div style={{
                  width: `${Math.min(budgetPct, 100)}%`, height: '100%', borderRadius: 999,
                  background: budgetState === 'within' ? 'var(--color-success)' : budgetState === 'near' ? 'var(--color-warning)' : 'var(--color-danger)'
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily chart */}
      {costs && (
        <div className="card">
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <h3 className="card-title">Daily cost, last 30 days</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Usage before credits, from Cost Explorer. {costs.note.split('. ')[0]}.</p>
            </div>
          </div>
          <DailyCostChart days={costs.daily} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Components */}
        {costs && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Where the money goes</h3></div>
            {costs.components.length === 0 ? (
              <p style={{ fontSize: '0.86rem' }}>No billed usage in the last 30 days yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead><tr><th>Component</th><th style={{ textAlign: 'right' }}>This month</th><th style={{ textAlign: 'right' }}>Last 30 days</th></tr></thead>
                  <tbody>
                    {costs.components.map(c => (
                      <tr key={c.key}>
                        <td>{c.label}</td>
                        <td style={{ textAlign: 'right' }}>{formatSmallUsd(c.month_to_date)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatSmallUsd(c.last_30_days)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.6rem' }}>
              Amazon DocumentDB is billed as its own service; Amazon RDS lines are other databases or their snapshots.
            </p>
          </div>
        )}

        {/* Usage */}
        {metrics && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Usage, last 7 days</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>CloudWatch</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
              {[
                { icon: <Clock size={15} />, label: 'Running hours', value: `${metrics.running_hours} h`, sub: scheduledHoursInWindow !== null ? `${scheduledHoursInWindow} h scheduled` : 'no schedule' },
                { icon: <Cpu size={15} />, label: 'CPU', value: metrics.cpu_avg_percent !== null ? `${metrics.cpu_avg_percent.toFixed(1)}% avg` : '—', sub: metrics.cpu_peak_percent !== null ? `${metrics.cpu_peak_percent.toFixed(1)}% peak` : '' },
                { icon: <HardDrive size={15} />, label: 'Storage used', value: formatBytes(metrics.storage_bytes), sub: 'cluster volume' },
                { icon: <Activity size={15} />, label: 'Operations', value: metrics.operations.toLocaleString(), sub: `${(metrics.read_operations ?? 0).toLocaleString()} reads · ${(metrics.write_operations ?? 0).toLocaleString()} writes` },
                { icon: <Database size={15} />, label: 'Billed I/Os', value: metrics.billed_ios.toLocaleString(), sub: 'read + write' },
                { icon: <Activity size={15} />, label: 'Connections', value: metrics.connections_avg !== null ? metrics.connections_avg.toFixed(1) : '—', sub: 'average' }
              ].map(t => (
                <div key={t.label} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{t.icon}{t.label}</div>
                  <div style={{ fontWeight: 650, fontSize: '1rem', marginTop: '0.2rem' }}>{t.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{t.sub}</div>
                </div>
              ))}
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Date (UTC)</th><th style={{ textAlign: 'right' }}>Running h</th><th style={{ textAlign: 'right' }}>Operations</th><th style={{ textAlign: 'right' }}>Billed I/Os</th><th style={{ textAlign: 'right' }}>Avg CPU</th></tr></thead>
                <tbody>
                  {[...metrics.daily].reverse().map(d => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td style={{ textAlign: 'right' }}>{d.running_hours}</td>
                      <td style={{ textAlign: 'right' }}>{d.operations.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{d.billed_ios.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{d.cpu_avg !== null ? `${d.cpu_avg.toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Alerts</h3><span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>Computed from the data above</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {alerts.map((a, i) => (
              <div key={i} className={`alert alert-${a.level === 'warning' ? 'warning' : a.level === 'success' ? 'success' : 'info'}`} style={{ margin: 0 }}>
                {a.level === 'success' ? <CheckCircle2 size={16} /> : a.level === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                <div><strong>{a.title}.</strong> {a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemini */}
      {profile && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">AI cost analysis</h3>
              <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Sends this deployment's real configuration and usage to Gemini for a written review.</p>
            </div>
            <button className="btn btn-gold btn-sm" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
              {analysis ? 'Run again' : 'Analyse with Gemini'}
            </button>
          </div>
          {analysisError && <div className="alert alert-danger" style={{ margin: 0 }}><AlertTriangle size={16} /> {analysisError}</div>}
          {!analysis && !analysisError && <p style={{ fontSize: '0.86rem' }}>No analysis yet.</p>}
          {analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <span className={`badge ${analysis.is_ai_powered ? 'badge-gold' : 'badge-neutral'}`} style={{ alignSelf: 'flex-start' }}>
                {analysis.is_ai_powered ? 'Gemini analysis' : 'Rule-based analysis (Gemini unavailable)'}
              </span>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{analysis.summary}</p>
              {analysis.optimization_opportunities.length > 0 && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>Opportunities</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {analysis.optimization_opportunities.map((o, i) => (
                      <li key={i} style={{ fontSize: '0.86rem' }}><strong>{o.title}.</strong> {o.reason} {o.action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.recommended_actions.length > 0 && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>Recommended actions</div>
                  <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {analysis.recommended_actions.map(a => (
                      <li key={a.step} style={{ fontSize: '0.86rem' }}>{a.action} <span style={{ color: 'var(--color-text-muted)' }}>{a.rationale}</span></li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
