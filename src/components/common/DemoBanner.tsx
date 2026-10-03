import React from 'react';
import { Info, Database } from 'lucide-react';
import { useDocumentStore } from '../../services/storageStatus';

interface DemoBannerProps {
  message?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ message }) => {
  const store = useDocumentStore();
  const defaultMessage = store.isDocumentDb
    ? "Amazon DocumentDB: Inspection reports are stored as variable-schema, nested JSON documents in a live DocumentDB cluster."
    : "Amazon DocumentDB Project Foundation: Displaying demonstration dataset with variable schemas and nested JSON documents. Zero AWS cluster costs incurred in Phase 1.";
  const badgeLabel = store.isDocumentDb
    ? (store.connected ? 'DocumentDB Live' : 'DocumentDB Paused / Offline')
    : 'Local Demo Mode';

  return (
    <div style={{
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: 'var(--radius-md)',
      padding: '0.65rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      marginBottom: '1.25rem',
      fontSize: '0.825rem',
      color: '#1e40af'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
        <span>{message ?? defaultMessage}</span>
      </div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        backgroundColor: '#dbeafe',
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        fontSize: '0.72rem',
        color: '#1d4ed8',
        whiteSpace: 'nowrap'
      }}>
        <Database size={12} />
        {badgeLabel}
      </div>
    </div>
  );
};
