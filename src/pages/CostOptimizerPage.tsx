import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, CircleDashed, Info, Lightbulb, Loader2, MinusCircle, RefreshCw, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { CostAnalysisResult, LiveCostOverview, LiveRecommendationStatus } from '../types';
import { LiveDataNotice } from '../components/cost/LiveDataNotice';
import { ScenarioBars } from '../components/cost/ScenarioBars';
import {
  HOURS_PER_MONTH, WEEKS_PER_MONTH, formatSmallUsd, formatUsd, modelMonthlyCost, pricedInstanceClasses, workloadFromLive
} from '../services/costModel';

const STATUS_META: Record<LiveRecommendationStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  applied: { label: 'Applied', badge: 'badge-success', icon: <CheckCircle2 size={12} /> },
  recommended: { label: 'Recommended', badge: 'badge-gold', icon: <Lightbulb size={12} /> },
  optional: { label: 'Optional', badge: 'badge-info', icon: <CircleDashed size={12} /> },
  not_needed: { label: 'Not needed', badge: 'badge-neutral', icon: <MinusCircle size={12} /> },
  warning: { label: 'Needs attention', badge: 'badge-danger', icon: <AlertTriangle size={12} /> }
};

const SOURCE_CHIP: React.CSSProperties = {
  fontSize: '0.66rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: 999,
  background: 'var(--color-bg-surface-secondary)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', whiteSpace: 'nowrap'
};

const HOUR_PRESETS = [
  { id: 'current', label: 'Current schedule' },
  { id: 'always_on', label: 'Always on (730 h)', hours: HOURS_PER_MONTH },
  { id: 'weekdays_12h', label: 'Weekdays 09:00–21:00', hours: Math.round(12 * 5 * WEEKS_PER_MONTH * 10) / 10 },
  { id: 'weekdays_8h', label: 'Weekdays, 8 h a day', hours: Math.round(8 * 5 * WEEKS_PER_MONTH * 10) / 10 },
  { id: 'demo_only', label: 'Demo days only (3 × 4 h a week)', hours: Math.round(12 * WEEKS_PER_MONTH * 10) / 10 },
  { id: 'custom', label: 'Custom hours' }
];

const Row: React.FC<{ label: string; value: React.ReactNode; source: string }> = ({ label, value, source }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{label}</div>
    <div style={{ fontSize: '0.86rem', fontWeight: 550 }}>{value}</div>
    <span style={SOURCE_CHIP}>{source}</span>
  </div>
);

export const CostOptimizerPage: React.FC = () => {
  const [overview, setOverview] = useState<LiveCostOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // What-if planner
  const [planClass, setPlanClass] = useState<string>('');
  const [planCount, setPlanCount] = useState<number>(1);
  const [planPreset, setPlanPreset] = useState<string>('current');
  const [customHours, setCustomHours] = useState<string>('120');
  const [planStorage, setPlanStorage] = useState<string>('standard');

  // Gemini advisor
  const [advice, setAdvice] = useState<CostAnalysisResult | null>(null);
  const [advising, setAdvising] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await api.getLiveCostOverview(refresh);
      setOverview(data);
      setLoadError(null);
      if (data.profile) {
        setPlanClass(prev => prev || data.profile!.instance_class || 'db.t3.medium');
        setPlanCount(data.profile.instance_count || 1);
        setPlanStorage(data.profile.storage_type);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const profile = overview?.profile ?? null;
  const rates = overview?.rates ?? null;
  const model = overview?.model ?? null;
  const cluster = overview?.sections.cluster?.data ?? null;
  const schedule = overview?.sections.schedule?.data ?? null;
  const metrics = overview?.sections.metrics?.data ?? null;
  const costs = overview?.sections.costs?.data ?? null;
  const recommendations = overview?.recommendations ?? [];

  const applied = recommendations.filter(r => r.status === 'applied').reduce((sum, r) => sum + r.monthly_savings, 0);
  const possible = recommendations.filter(r => r.status === 'recommended' || r.status === 'optional').reduce((sum, r) => sum + r.monthly_savings, 0);

  const planHours = useMemo(() => {
    if (!profile) return 0;
    const preset = HOUR_PRESETS.find(p => p.id === planPreset);
    if (planPreset === 'current') return profile.monthly_hours;
    if (planPreset === 'custom') return Math.min(Math.max(Number(customHours) || 0, 0), HOURS_PER_MONTH);
    return preset?.hours ?? profile.monthly_hours;
  }, [profile, planPreset, customHours]);

  const plan = useMemo(() => profile && rates
    ? modelMonthlyCost(profile, rates, { instanceClass: planClass, instanceCount: planCount, monthlyHours: planHours, storageType: planStorage })
    : null, [profile, rates, planClass, planCount, planHours, planStorage]);

  // Compare at cent precision so an unchanged plan reads "No change" rather than −$0.00
  const planDelta = plan && model ? Math.round(plan.total * 100) / 100 - model.monthly_total : 0;
  const planUnchanged = Math.abs(planDelta) < 0.005;

  const instanceOptions = useMemo(() => rates ? pricedInstanceClasses(rates, planStorage).slice(0, 10) : [], [rates, planStorage]);

  const getAdvice = async () => {
    if (!profile) return;
    setAdvising(true);
    setAdviceError(null);
    try {
      setAdvice(await api.analyzeCostAndDeployment({ workload: workloadFromLive(profile, metrics), force_refresh: true }));
    } catch (err) {
      setAdviceError(err instanceof Error ? err.message : 'Advisor request failed');
    } finally {
      setAdvising(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Cost optimizer</div>
          <h2 style={{ marginTop: '0.2rem' }}>Cost Optimizer</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: 760 }}>
            Your live DocumentDB configuration, a monthly cost model built on AWS list prices and your real usage,
            and recommendations backed by that data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/cost-monitoring" className="btn btn-secondary btn-sm">Open Cost Monitoring</Link>
          <button className="btn btn-primary btn-sm" onClick={() => load(true)} disabled={refreshing || loading}>
            <RefreshCw size={14} className={refreshing ? 'spin' : undefined} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-text-muted)' }}>
          <Loader2 size={18} className="spin" /> Loading live AWS data…
        </div>
      )}

      <LiveDataNotice overview={overview} loadError={loadError} />

      {profile && model && cluster && (
        <>
          {/* Savings summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Modelled monthly cost', value: formatUsd(model.monthly_total), sub: `${model.monthly_hours.toFixed(0)} running hours at list prices` },
              { label: 'Savings already in place', value: formatUsd(applied), sub: 'vs running 24/7 with this configuration' },
              { label: 'Further possible savings', value: formatUsd(possible), sub: 'from recommended and optional changes' },
              { label: 'Billed this month', value: costs ? formatSmallUsd(costs.documentdb_month_to_date) : '—', sub: costs ? `DocumentDB usage before credits, through ${costs.latest_cost_date ?? '—'}` : 'Cost Explorer data unavailable' }
            ].map(t => (
              <div key={t.label} className="card" style={{ padding: '1.1rem 1.2rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t.label}</div>
                <div className="stat-tile-value" style={{ marginTop: '0.35rem' }}>{t.value}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{t.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
            {/* Deployment */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Your deployment</h3><span className={`badge ${cluster.status === 'available' ? 'badge-success' : 'badge-neutral'}`}>{cluster.status}</span></div>
              <Row label="Cluster" value={`${cluster.cluster_id} · DocumentDB ${cluster.engine_version} · ${cluster.region}`} source="DocumentDB API" />
              <Row label="Instances" value={`${profile.instance_count} × ${profile.instance_class}`} source="DocumentDB API" />
              <Row label="Storage" value={`${profile.storage_type === 'iopt1' ? 'I/O-Optimized' : 'Standard'} · ${profile.storage_gb !== null ? `${(profile.storage_gb * 1024).toFixed(1)} MB used` : 'size unknown'}`} source="CloudWatch" />
              <Row label="Running hours" value={schedule?.active ? `${schedule.description} · ${profile.monthly_hours} h/month` : `Always on · ${profile.monthly_hours} h/month`} source={schedule?.active ? 'EventBridge' : 'DocumentDB API'} />
              <Row label="Backups" value={`${cluster.backup_retention_days} day retention · ${cluster.storage_encrypted ? 'encrypted' : 'not encrypted'}`} source="DocumentDB API" />
              <Row label="Usage" value={metrics && metrics.running_hours > 0
                ? `${profile.operations_per_running_hour.toLocaleString(undefined, { maximumFractionDigits: 1 })} ops and ${Math.round(profile.billed_ios_per_running_hour).toLocaleString()} billed I/Os per running hour · CPU ${profile.cpu_avg_percent?.toFixed(1)}% avg`
                : 'No running hours recorded in the last 7 days'} source="CloudWatch" />
              {metrics && metrics.running_hours < 24 && (
                <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.6rem' }}>
                  <Info size={12} style={{ verticalAlign: '-2px' }} /> Usage figures are based on {metrics.running_hours} running hours so far and will settle as more data accumulates.
                </p>
              )}
            </div>

            {/* Cost model */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Monthly cost model</h3><span style={SOURCE_CHIP}>{rates?.source}</span></div>
              <div className="table-responsive">
                <table className="table">
                  <thead><tr><th>Component</th><th>How it is calculated</th><th style={{ textAlign: 'right' }}>Per month</th></tr></thead>
                  <tbody>
                    {model.components.map(c => (
                      <tr key={c.key}>
                        <td style={{ fontWeight: 550 }}>{c.label}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{c.formula}</td>
                        <td style={{ textAlign: 'right' }}>{formatSmallUsd(c.monthly)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ fontWeight: 700 }}>Total</td><td />
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatUsd(model.monthly_total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.6rem' }}>
                Model of the DocumentDB cluster only, at on-demand list prices before credits. The API server, disk and IPv4 address are billed separately (see Cost Monitoring).
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Recommendations</h3>
                <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Each one is checked against the live configuration and usage above.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {recommendations.map(r => {
                const meta = STATUS_META[r.status];
                return (
                  <div key={r.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span className={`badge ${meta.badge}`}>{meta.icon}{meta.label}</span>
                      {r.monthly_savings > 0 && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 650, color: r.status === 'applied' ? 'var(--color-success-text)' : 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                          {r.status === 'applied' ? 'Saving ' : 'Saves '}{formatUsd(r.monthly_savings)}/mo
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 650, fontSize: '0.92rem' }}>{r.title}</div>
                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {r.evidence.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                    <div style={{ fontSize: '0.8rem' }}><strong>Action:</strong> {r.action}</div>
                    {r.tradeoff && <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>Trade-off: {r.tradeoff}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenarios */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Scenario comparison</h3>
                <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Monthly DocumentDB cost for common configurations, using your real storage and I/O rate.</p>
              </div>
            </div>
            <ScenarioBars scenarios={overview!.scenarios} />
          </div>

          {/* What-if planner */}
          {rates && plan && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">What-if planner</h3>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Starts from your live configuration. Changes here are calculations only; nothing in AWS is modified.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="plan-class">Instance class</label>
                  <select id="plan-class" className="form-control" value={planClass} onChange={e => setPlanClass(e.target.value)}>
                    {instanceOptions.map(c => (
                      <option key={c} value={c}>{c} · ${rates.instance_hourly[planStorage]?.[c]}/h</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="plan-count">Instances</label>
                  <select id="plan-count" className="form-control" value={planCount} onChange={e => setPlanCount(Number(e.target.value))}>
                    {[1, 2, 3].map(n => <option key={n} value={n}>{n}{n === 1 ? ' (no replicas)' : ` (${n - 1} replica${n > 2 ? 's' : ''})`}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="plan-hours">Running hours</label>
                  <select id="plan-hours" className="form-control" value={planPreset} onChange={e => setPlanPreset(e.target.value)}>
                    {HOUR_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.label}{p.id === 'current' ? ` (${profile.monthly_hours} h)` : p.hours ? ` · ${p.hours} h` : ''}
                      </option>
                    ))}
                  </select>
                  {planPreset === 'custom' && (
                    <input className="form-control" type="number" min="0" max="730" value={customHours}
                           onChange={e => setCustomHours(e.target.value)} aria-label="Custom running hours per month" style={{ marginTop: '0.4rem' }} />
                  )}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="plan-storage">Storage type</label>
                  <select id="plan-storage" className="form-control" value={planStorage} onChange={e => setPlanStorage(e.target.value)}>
                    <option value="standard">Standard (pay per I/O)</option>
                    <option value="iopt1">I/O-Optimized (I/O included)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'baseline', padding: '1rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'var(--gold-50)', border: '1px solid var(--gold-200)' }}>
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>Planned monthly cost</div>
                  <div className="stat-tile-value">{plan.hourlyRate === null ? 'No list price' : formatUsd(plan.total)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>Compared with today</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 650, color: planUnchanged ? 'var(--color-text-primary)' : planDelta < 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                    {planUnchanged ? 'No change' : `${planDelta < 0 ? '−' : '+'}${formatUsd(Math.abs(planDelta))}/mo`}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Instances {formatUsd(plan.instance)} · Storage {formatSmallUsd(plan.storage)} · I/O {formatSmallUsd(plan.io)} · {planHours.toFixed(0)} h/month
                </div>
              </div>
            </div>
          )}

          {/* Gemini advisor */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">AI advisor</h3>
                <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Gemini reviews this deployment's real configuration and usage and suggests improvements.</p>
              </div>
              <button className="btn btn-gold btn-sm" onClick={getAdvice} disabled={advising}>
                {advising ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                {advice ? 'Ask again' : 'Get Gemini advice'}
              </button>
            </div>
            {adviceError && <div className="alert alert-danger" style={{ margin: 0 }}><AlertTriangle size={16} /> {adviceError}</div>}
            {!advice && !adviceError && <p style={{ fontSize: '0.86rem' }}>No advice requested yet.</p>}
            {advice && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <span className={`badge ${advice.is_ai_powered ? 'badge-gold' : 'badge-neutral'}`} style={{ alignSelf: 'flex-start' }}>
                  {advice.is_ai_powered ? `Gemini (${advice.gemini_model})` : 'Rule-based advice (Gemini unavailable)'}
                </span>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{advice.gemini_summary}</p>
                {advice.recommendations.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {advice.recommendations.map(r => (
                      <div key={r.id} style={{ borderLeft: '3px solid var(--gold-400)', paddingLeft: '0.8rem' }}>
                        <div style={{ fontWeight: 650, fontSize: '0.88rem' }}>{r.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{r.explanation}</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}><strong>Action:</strong> {r.proposed_action}</div>
                      </div>
                    ))}
                  </div>
                )}
                {advice.risks && advice.risks.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>Risks</div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.84rem' }}>{advice.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
