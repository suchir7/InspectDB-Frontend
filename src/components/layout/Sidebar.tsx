import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  SearchCode,
  Sparkles,
  Calculator,
  TrendingUp,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Server,
  Globe
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  backendOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  backendOnline
}) => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports', label: 'Inspection Reports', icon: ClipboardList },
    { to: '/create-inspection', label: 'Create Inspection', icon: PlusCircle },
    { to: '/ai-assistant', label: 'AI Query Assistant', icon: Sparkles },
    { to: '/cost-optimizer', label: 'AI Cost Optimizer', icon: Calculator },
    { to: '/cost-monitoring', label: 'Cost Monitoring', icon: TrendingUp },
    { to: '/nested-query', label: 'Nested Query Explorer', icon: SearchCode },
    { to: '/database-overview', label: 'Database Overview', icon: Database },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/landing', label: 'Product Landing', icon: Globe },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            zIndex: 90,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      <aside
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          minWidth: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          backgroundColor: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width var(--transition-normal), min-width var(--transition-normal), transform var(--transition-normal)',
          zIndex: 100,
          position: 'relative',
          height: '100vh',
          userSelect: 'none'
        }}
        className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
      >
        {/* Top Logo & App Header */}
        <div>
          <div style={{
            height: 'var(--topbar-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0' : '0 1.25rem',
            borderBottom: '1px solid var(--color-sidebar-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
              }}>
                <ShieldCheck size={22} />
              </div>
              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1
                  }}>
                    Inspect<span style={{ color: '#60a5fa' }}>DB</span>
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 500 }}>
                    Amazon DocDB System
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={onToggleCollapse}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-sidebar-text)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Collapse Sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '1rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onCloseMobile}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: collapsed ? '0.65rem' : '0.65rem 0.85rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? '#ffffff' : 'var(--color-sidebar-text)',
                    backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    transition: 'all var(--transition-fast)',
                    textDecoration: 'none'
                  })}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={19} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Status & Collapse Toggle */}
        <div style={{
          padding: '0.85rem',
          borderTop: '1px solid var(--color-sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* Backend Connection Indicator */}
          {!collapsed ? (
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server size={14} color="#94a3b8" />
                <span style={{ color: '#cbd5e1' }}>API Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: backendOnline ? '#10b981' : '#ef4444'
                }} />
                <span style={{ color: backendOnline ? '#34d399' : '#f87171', fontWeight: 600 }}>
                  {backendOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{ display: 'flex', justifyContent: 'center' }}
              title={`API Engine: ${backendOnline ? 'Online' : 'Offline'}`}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: backendOnline ? '#10b981' : '#ef4444'
              }} />
            </div>
          )}

          {collapsed && (
            <button
              onClick={onToggleCollapse}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-sidebar-text)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}
              title="Expand Sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
