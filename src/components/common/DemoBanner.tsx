import React from 'react';
import { Info } from 'lucide-react';
import { useDocumentStore } from '../../services/storageStatus';

interface DemoBannerProps {
  message?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ message }) => {
  const store = useDocumentStore();
  const defaultMessage = store.isDocumentDb
    ? "Inspection reports are stored as variable-schema, nested JSON documents in a live Amazon DocumentDB cluster."
    : store.mode === 'mongodb'
      ? "Local development: inspection reports are stored in a local MongoDB database."
      : "Local development: inspection reports are kept in server memory and are lost when the server restarts.";
  const badgeLabel = store.isDocumentDb
    ? (store.connected ? 'DocumentDB Live' : 'DocumentDB Paused / Offline')
    : store.mode === 'mongodb' ? 'Local MongoDB' : 'In-memory store';
  const statusColor = store.isDocumentDb && !store.connected ? 'var(--color-danger)' : store.isDocumentDb ? 'var(--color-success)' : 'var(--gold-500)';

  return (
    <div style={{
      background: 'linear-gradient(90deg, var(--gold-50) 0%, var(--color-bg-surface) 70%)',
      border: '1px solid var(--gold-200)',
      borderLeft: '3px solid var(--gold-500)',
      borderRadius: 'var(--radius-md)',
      padding: '0.6rem 0.9rem 0.6rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      marginBottom: '1.25rem',
      fontSize: '0.82rem',
      color: 'var(--color-text-secondary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
        <Info size={15} color="#8a6716" style={{ flexShrink: 0 }} />
        <span>{message ?? defaultMessage}</span>
      </div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.24rem 0.7rem',
        background: 'var(--navy-900)',
        border: '1px solid rgba(201, 162, 58, 0.35)',
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        fontSize: '0.7rem',
        letterSpacing: '0.04em',
        color: 'var(--gold-300)',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 0 3px rgba(255, 255, 255, 0.06)` }} />
        {badgeLabel}
      </div>
    </div>
  );
};
