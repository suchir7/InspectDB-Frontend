import React from 'react';
import { LiveScenario } from '../../types';
import { formatUsd } from '../../services/costModel';

/** Emphasis bar chart: the current configuration in the accent color, alternatives in gray. */
export const ScenarioBars: React.FC<{ scenarios: LiveScenario[] }> = ({ scenarios }) => {
  const max = Math.max(...scenarios.map(s => s.monthly_total), 0.01);
  return (
    <div className="cost-viz" style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {scenarios.map(s => {
        const isCurrent = s.id === 'current';
        const pct = Math.max((s.monthly_total / max) * 100, 0.8);
        const diff = s.difference_vs_current;
        return (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(170px, 260px) 1fr', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-primary)', fontWeight: isCurrent ? 650 : 500 }}>
              {s.label}
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                {s.instance_class} · {s.monthly_hours.toFixed(0)} h/month · {s.storage_type === 'iopt1' ? 'I/O-Optimized' : 'Standard'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  title={`${s.label}: ${formatUsd(s.monthly_total)} per month`}
                  style={{
                    width: `${pct}%`,
                    height: 16,
                    background: isCurrent ? 'var(--series-server)' : 'var(--viz-muted-bar)',
                    borderRadius: '0 4px 4px 0'
                  }}
                />
              </div>
              <div style={{ whiteSpace: 'nowrap', fontSize: '0.84rem', fontWeight: 650, fontVariantNumeric: 'tabular-nums', minWidth: 92, textAlign: 'right' }}>
                {formatUsd(s.monthly_total)}/mo
              </div>
              <div style={{
                whiteSpace: 'nowrap', fontSize: '0.74rem', minWidth: 78, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                color: isCurrent ? 'var(--color-text-muted)' : diff < 0 ? 'var(--color-success-text)' : diff > 0 ? 'var(--color-danger-text)' : 'var(--color-text-muted)'
              }}>
                {isCurrent ? 'current' : diff === 0 ? 'same' : `${diff < 0 ? '−' : '+'}${formatUsd(Math.abs(diff))}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
