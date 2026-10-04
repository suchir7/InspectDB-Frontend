import React from 'react';
import { AlertTriangle, PlugZap } from 'lucide-react';
import { LiveCostOverview } from '../../types';

const SECTION_LABELS: Record<string, string> = {
  cluster: 'Cluster configuration (DocumentDB API)',
  schedule: 'Start/stop schedule (EventBridge Scheduler)',
  metrics: 'Usage metrics (CloudWatch)',
  pricing: 'List prices (AWS Price List API)',
  costs: 'Billed spend (Cost Explorer)'
};

/** Explains which live AWS data sources are missing and why; never substitutes estimates. */
export const LiveDataNotice: React.FC<{ overview: LiveCostOverview | null; loadError?: string | null }> = ({ overview, loadError }) => {
  if (loadError) {
    return (
      <div className="alert alert-danger" style={{ margin: 0 }}>
        <AlertTriangle size={17} style={{ flexShrink: 0 }} />
        <div><strong>Could not load live AWS data.</strong> {loadError}</div>
      </div>
    );
  }
  if (!overview) return null;

  if (!overview.enabled || !overview.available) {
    return (
      <div className="card" style={{ borderLeft: '3px solid var(--gold-500)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--gold-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PlugZap size={20} color="#8a6716" />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: '0.25rem' }}>Live AWS data not connected</div>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>{overview.reason}</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
            This page only shows real figures from your AWS account: cluster configuration, schedule, CloudWatch usage, list prices and Cost Explorer spend.
            Nothing is estimated or simulated while the connection is missing.
          </p>
        </div>
      </div>
    );
  }

  const failing = Object.entries(overview.sections).filter(([, section]) => section && section.error);
  if (!failing.length) return null;
  return (
    <div className="alert alert-warning" style={{ margin: 0 }}>
      <AlertTriangle size={17} style={{ flexShrink: 0 }} />
      <div>
        <strong>Some live data could not be refreshed.</strong>
        <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0 }}>
          {failing.map(([name, section]) => (
            <li key={name}>
              {SECTION_LABELS[name] ?? name}: {section!.error}
              {section!.data ? ' Showing the last successful reading.' : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
