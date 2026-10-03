import React from 'react';
import { SeverityLevel, ReportStatus } from '../../types';

interface StatusBadgeProps {
  status: ReportStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const formatted = status.replace('_', ' ');
  let badgeClass = 'badge-neutral';
  
  if (status === 'passed') badgeClass = 'badge-passed';
  else if (status === 'action_required') badgeClass = 'badge-action_required';
  else if (status === 'in_review') badgeClass = 'badge-in_review';
  else if (status === 'failed') badgeClass = 'badge-failed';
  else if (status === 'draft') badgeClass = 'badge-draft';

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        display: 'inline-block'
      }} />
      {formatted}
    </span>
  );
};

interface SeverityBadgeProps {
  severity: SeverityLevel | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const sev = (severity || 'none').toLowerCase();
  let badgeClass = 'badge-sev-none';
  
  if (sev === 'critical') badgeClass = 'badge-sev-critical';
  else if (sev === 'high') badgeClass = 'badge-sev-high';
  else if (sev === 'medium') badgeClass = 'badge-sev-medium';
  else if (sev === 'low') badgeClass = 'badge-sev-low';
  else if (sev === 'none' || sev === 'info') badgeClass = 'badge-sev-none';

  return (
    <span className={`badge ${badgeClass}`}>
      {sev.toUpperCase()}
    </span>
  );
};
