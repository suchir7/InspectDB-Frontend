import React, { useMemo, useState } from 'react';
import { LiveCostDay } from '../../types';
import { formatSmallUsd } from '../../services/costModel';

const SERIES = [
  { key: 'docdb', label: 'DocumentDB', color: 'var(--series-docdb)' },
  { key: 'server', label: 'API server (EC2, disk, IPv4)', color: 'var(--series-server)' },
  { key: 'other', label: 'Other AWS services', color: 'var(--series-other)' }
] as const;

type SeriesKey = typeof SERIES[number]['key'];

const seriesFor = (component: string): SeriesKey => {
  if (component.startsWith('docdb_')) return 'docdb';
  if (component === 'ec2_instance' || component === 'ec2_storage' || component === 'public_ipv4') return 'server';
  return 'other';
};

const niceStep = (max: number): number => {
  const raw = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  return (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
};

const WIDTH = 1000;
const HEIGHT = 260;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 56 };
const GAP = 2;

export const DailyCostChart: React.FC<{ days: LiveCostDay[] }> = ({ days }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const rows = useMemo(() => days.map(day => {
    const totals: Record<SeriesKey, number> = { docdb: 0, server: 0, other: 0 };
    Object.entries(day.components).forEach(([component, amount]) => {
      totals[seriesFor(component)] += Math.max(amount, 0);
    });
    return { date: day.date, totals, total: totals.docdb + totals.server + totals.other };
  }), [days]);

  const maxTotal = Math.max(...rows.map(r => r.total), 0);
  const hasData = maxTotal > 0;
  const step = hasData ? niceStep(maxTotal) : 1;
  const yMax = hasData ? Math.ceil(maxTotal / step) * step : 1;
  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = plotW / Math.max(rows.length, 1);
  const barW = Math.min(24, slot * 0.62);
  const y = (v: number) => MARGIN.top + plotH - (v / yMax) * plotH;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);
  const tickDigits = step < 0.01 ? 4 : step < 1 ? 2 : 0;
  const shortDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <div className="cost-viz">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div className="viz-legend" aria-label="Legend">
          {SERIES.map(s => (
            <span key={s.key} className="viz-legend-item">
              <span className="viz-swatch" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(v => !v)}>
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {!showTable && !hasData && (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>
          No billed usage recorded in the last 30 days yet.
        </div>
      )}

      {!showTable && hasData && (
        <div style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img"
               aria-label="Daily AWS usage cost for the last 30 days, stacked by DocumentDB, API server and other services">
            {ticks.map(t => (
              <g key={t}>
                <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(t)} y2={y(t)}
                      stroke={t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth={1} />
                <text x={MARGIN.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11"
                      fill="var(--color-text-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  ${t.toFixed(tickDigits)}
                </text>
              </g>
            ))}
            {rows.map((row, i) => {
              const cx = MARGIN.left + slot * i + slot / 2;
              let base = 0;
              const segments = SERIES.filter(s => row.totals[s.key] > 0);
              return (
                <g key={row.date} opacity={hover === null || hover === i ? 1 : 0.55}>
                  {segments.map((s, si) => {
                    const value = row.totals[s.key];
                    const top = y(base + value);
                    const bottom = y(base);
                    base += value;
                    const isTop = si === segments.length - 1;
                    const h = Math.max(bottom - top - (si > 0 ? GAP : 0), 0.75);
                    const x = cx - barW / 2;
                    const yTop = bottom - (si > 0 ? GAP : 0) - h;
                    if (!isTop || h < 5) {
                      return <rect key={s.key} x={x} y={yTop} width={barW} height={h} fill={s.color} />;
                    }
                    const r = 4;
                    return (
                      <path key={s.key} fill={s.color}
                            d={`M${x},${yTop + h} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${yTop + h} Z`} />
                    );
                  })}
                  {(i % 5 === 0 || i === rows.length - 1) && (
                    <text x={cx} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">
                      {shortDate(row.date)}
                    </text>
                  )}
                  {/* Hit target: the whole day column, larger than the painted bar */}
                  <rect x={MARGIN.left + slot * i} y={MARGIN.top} width={slot} height={plotH} fill="transparent"
                        tabIndex={0} aria-label={`${shortDate(row.date)}: ${formatSmallUsd(row.total)}`}
                        onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
                </g>
              );
            })}
          </svg>

          {hover !== null && (
            <div className="viz-tooltip" style={{
              left: `${((MARGIN.left + slot * hover + slot / 2) / WIDTH) * 100}%`,
              top: 8,
              transform: hover > rows.length * 0.6 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{formatSmallUsd(rows[hover].total)}</div>
              <div style={{ color: '#A9B4CC', marginBottom: '0.4rem' }}>{shortDate(rows[hover].date)} · usage before credits</div>
              {SERIES.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                  <span style={{ width: 12, height: 2, background: s.color, display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatSmallUsd(rows[hover].totals[s.key])}</span>
                  <span style={{ color: '#A9B4CC' }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showTable && (
        <div className="table-responsive" style={{ maxHeight: 320, overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Date</th>{SERIES.map(s => <th key={s.key} style={{ textAlign: 'right' }}>{s.label}</th>)}<th style={{ textAlign: 'right' }}>Total</th></tr>
            </thead>
            <tbody>
              {[...rows].reverse().map(row => (
                <tr key={row.date}>
                  <td>{shortDate(row.date)}</td>
                  {SERIES.map(s => <td key={s.key} style={{ textAlign: 'right' }}>{formatSmallUsd(row.totals[s.key])}</td>)}
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatSmallUsd(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
