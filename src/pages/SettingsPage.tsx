import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Database,
  Moon,
  Sun,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Sliders,
  Laptop
} from 'lucide-react';
import { api } from '../services/api';
import { HealthStatus } from '../types';
import { DemoBanner } from '../components/common/DemoBanner';
import { toDocumentStoreInfo } from '../services/storageStatus';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const store = toDocumentStoreInfo(health);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  const checkHealth = async () => {
    setChecking(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <DemoBanner />

      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>System Settings & Environment Diagnostics</h2>
        <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Inspect connectivity, runtime environment, and client configuration.
        </p>
      </div>

      {/* Backend API Connection Tester */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} color="var(--color-primary)" />
            <h3 className="card-title">Backend API Service Connection</h3>
          </div>
          <button
            onClick={checkHealth}
            className="btn btn-secondary btn-sm"
            disabled={checking}
          >
            <RefreshCw size={14} className={checking ? 'spin' : ''} />
            <span>{checking ? 'Checking...' : 'Test Connection'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem',
            backgroundColor: 'var(--color-bg-surface-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>CONFIGURED API ENDPOINT</div>
              <code style={{ fontSize: '0.85rem', fontWeight: 700 }}>{apiUrl}</code>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {health ? (
                <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                  <CheckCircle2 size={14} />
                  Connected ({health.version})
                </span>
              ) : (
                <span className="badge badge-danger" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                  <AlertTriangle size={14} />
                  Disconnected
                </span>
              )}
            </div>
          </div>

          {health && (
            <div style={{
              padding: '0.85rem',
              backgroundColor: '#f0f8f4',
              border: '1px solid #b9e2cf',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              color: '#13623f'
            }}>
              <strong>API Status:</strong> {health.service} — {health.database.message}
            </div>
          )}
        </div>
      </div>

      {/* Database Setup & Cost Protection Information */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="var(--color-primary)" />
            <h3 className="card-title">Amazon DocumentDB Cluster Status</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Security Safe Mode</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>DATABASE NAME</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{store.databaseName}</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>PRIMARY COLLECTION</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{store.collection}</div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>AWS CLUSTER CHARGES</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: store.clusterCostActive ? '#8a6716' : '#1e8e62' }}>
                {store.clusterCostActive ? 'Active (Live DocumentDB Cluster)' : '$0.00 (In-Memory Simulation)'}
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ margin: 0, fontSize: '0.8rem' }}>
            <Info size={16} />
            <div>
              No AWS credentials or secret connection strings are stored or displayed in the client. In Phase 2, DocumentDB URI strings will be supplied strictly via server-side environment variables with TLS encryption (<code>global-bundle.pem</code>).
            </div>
          </div>
        </div>
      </div>

      {/* Interface Theme Preferences */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="var(--color-primary)" />
            <h3 className="card-title">Theme Preferences</h3>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => toggleTheme('light')}
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: '1 1 180px', padding: '0.85rem' }}
          >
            <Sun size={18} />
            <span>Enterprise Light (Default)</span>
          </button>

          <button
            onClick={() => toggleTheme('dark')}
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: '1 1 180px', padding: '0.85rem' }}
          >
            <Moon size={18} />
            <span>Dark Navy Mode</span>
          </button>
        </div>
      </div>

      {/* Application Metadata */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Application & College Project Metadata</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.825rem' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Project:</span>
            <div style={{ fontWeight: 600 }}>InspectDB Management System</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>AWS Service Focus:</span>
            <div style={{ fontWeight: 600 }}>Amazon DocumentDB (with MongoDB compatibility)</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Frontend Stack:</span>
            <div style={{ fontWeight: 600 }}>React 19 + TypeScript + Vite</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Backend Stack:</span>
            <div style={{ fontWeight: 600 }}>FastAPI + Python 3.11+ + PyMongo</div>
          </div>
        </div>
      </div>
    </div>
  );
};
