import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  title?: string;
  initialExpanded?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = 'Raw JSON Document (Amazon DocumentDB BSON Structure)',
  initialExpanded = true
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid #1f2a44',
      backgroundColor: '#0a1733'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1rem',
        backgroundColor: '#1f2a44',
        borderBottom: expanded ? '1px solid #36415a' : 'none'
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f5f7fa',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)'
          }}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {title}
        </button>
        <button
          onClick={handleCopy}
          className="btn btn-ghost btn-sm"
          style={{
            color: '#8e97ac',
            fontSize: '0.75rem',
            padding: '0.2rem 0.5rem'
          }}
        >
          {copied ? <Check size={14} color="#22a06b" /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>

      {expanded && (
        <pre style={{
          margin: 0,
          padding: '1rem',
          maxHeight: '400px',
          overflowY: 'auto',
          fontSize: '0.82rem',
          color: '#6b93ea',
          lineHeight: '1.6'
        }}>
          <code>{jsonString}</code>
        </pre>
      )}
    </div>
  );
};
