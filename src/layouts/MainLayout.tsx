import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { TopNavbar } from '../components/layout/TopNavbar';
import { api } from '../services/api';
import { ChevronRight, Home, Sparkles, Database, ShieldCheck } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState(true);
  const location = useLocation();

  // Check health periodically
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.getHealth();
        setBackendOnline(true);
      } catch (err) {
        setBackendOnline(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  // Derive breadcrumbs and title
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return [{ label: 'Dashboard', path: '/dashboard' }];
    if (path === '/reports') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Inspection Reports', path: '/reports' }];
    if (path.startsWith('/reports/')) return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reports', path: '/reports' }, { label: 'Report Details', path: path }];
    if (path === '/create-inspection') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reports', path: '/reports' }, { label: 'New Inspection', path: '/create-inspection' }];
    if (path.startsWith('/edit-inspection/')) return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reports', path: '/reports' }, { label: 'Edit Report', path: path }];
    if (path === '/ai-assistant') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'AI Query Assistant', path: '/ai-assistant' }];
    if (path === '/nested-query') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Nested Query Explorer', path: '/nested-query' }];
    if (path === '/cost-optimizer') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'AI Cost Optimizer', path: '/cost-optimizer' }];
    if (path === '/cost-monitoring') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Cost Monitoring', path: '/cost-monitoring' }];
    if (path === '/database-overview') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Architecture Overview', path: '/database-overview' }];
    if (path === '/settings') return [{ label: 'Dashboard', path: '/dashboard' }, { label: 'System Settings', path: '/settings' }];
    return [{ label: 'Home', path: '/dashboard' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-app)' }}>
      {/* High-End Top Navigation Bar */}
      <TopNavbar backendOnline={backendOnline} />

      {/* Secondary Context & Breadcrumb Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#64748b' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#64748b',
              textDecoration: 'none',
              transition: 'color 0.15s'
            }}
            className="breadcrumb-home-link"
          >
            <Home size={14} />
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              <ChevronRight size={12} color="#94a3b8" />
              {idx === breadcrumbs.length - 1 ? (
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.15s' }}
                  className="breadcrumb-link"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Quick Context Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="subheader-quick-stats">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.75rem' }}>
            <Sparkles size={13} color="#6366f1" />
            <span>Gemini AI Engine: <strong>Active</strong></span>
          </div>
          <div style={{ width: 1, height: 14, backgroundColor: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.75rem' }}>
            <Database size={13} color="#2563eb" />
            <span>Target: <strong>Amazon DocumentDB 5.0</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main
        style={{
          flex: 1,
          padding: '2rem 1.5rem',
          maxWidth: '1520px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <Outlet />
      </main>

      {/* Subtle Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1520px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748b'
          }}
          className="app-footer-inner"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="#2563eb" />
            <span><strong>InspectDB</strong> &mdash; Enterprise Inspection Management & Compatibility Platform</span>
          </div>
          <div>
            <span>Connected to Amazon DocumentDB compatible wire protocol &amp; Neon Cloud Auth</span>
          </div>
        </div>
      </footer>

      <style>{`
        .breadcrumb-link:hover, .breadcrumb-home-link:hover {
          color: #2563eb !important;
        }
        @media (max-width: 768px) {
          .subheader-quick-stats {
            display: none !important;
          }
          .app-footer-inner {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};
