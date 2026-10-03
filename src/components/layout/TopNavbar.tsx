import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  Search,
  Bell,
  User,
  ChevronRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  Plus,
  Sparkles,
  SearchCode,
  Calculator,
  TrendingUp,
  Settings as SettingsIcon,
  Server,
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';

interface TopNavbarProps {
  backendOnline: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ backendOnline }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setShowMoreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports', label: 'Reports', icon: ClipboardList },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Gemini' },
    { to: '/nested-query', label: 'Query Explorer', icon: SearchCode },
    { to: '/cost-optimizer', label: 'Cost Optimizer', icon: Calculator },
  ];

  const secondaryNavLinks = [
    { to: '/cost-monitoring', label: 'Cost Monitoring', icon: TrendingUp },
    { to: '/database-overview', label: 'Architecture', icon: Database },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/reports?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    setShowProfile(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header
        style={{
          height: 'var(--topbar-height)',
          backgroundColor: 'var(--color-topbar-bg)',
          borderBottom: '1px solid var(--color-topbar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Left Section: Brand Logo & Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', minWidth: 0 }}>
          {/* Brand Logo */}
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1
                }}
              >
                Inspect<span style={{ color: '#60a5fa' }}>DB</span>
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.02em' }}>
                Amazon DocDB Platform
              </span>
            </div>
          </Link>

          {/* Desktop Top Navigation Links */}
          <nav
            className="top-desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: isActive ? '#60a5fa' : '#94a3b8',
                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid transparent',
                    transition: 'all var(--transition-fast)',
                    position: 'relative'
                  }}
                  className="top-nav-item"
                >
                  <Icon size={16} color={isActive ? '#60a5fa' : '#94a3b8'} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
                        color: '#c084fc',
                        border: '1px solid rgba(192, 132, 252, 0.3)',
                        fontWeight: 700,
                        letterSpacing: '0.02em'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* "More" Dropdown Menu for secondary tools */}
            <div style={{ position: 'relative' }} ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: secondaryNavLinks.some(link => location.pathname === link.to) ? '#60a5fa' : '#94a3b8',
                  backgroundColor: secondaryNavLinks.some(link => location.pathname === link.to) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: secondaryNavLinks.some(link => location.pathname === link.to) ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
                className="top-nav-item"
              >
                <Layers size={16} />
                <span>More</span>
                <ChevronDown size={14} style={{ transform: showMoreDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {showMoreDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: 220,
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    padding: '0.5rem',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  {secondaryNavLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setShowMoreDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          color: isActive ? '#60a5fa' : '#e2e8f0',
                          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent'
                        }}
                        className="dropdown-nav-item"
                      >
                        <Icon size={16} color={isActive ? '#60a5fa' : '#94a3b8'} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section: Actions, Search, Live DB Badge, Notifications & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Quick "New Inspection" Button */}
          <Link
            to="/create-inspection"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
            }}
            className="topbar-create-btn"
          >
            <Plus size={16} />
            <span>New Report</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '220px' }} className="topbar-search">
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.2rem',
                paddingRight: '0.75rem',
                height: '36px',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                outline: 'none',
                transition: 'border-color 0.15s, background-color 0.15s'
              }}
              className="topbar-search-input"
            />
          </form>

          {/* Database & Backend Status Badge */}
          <Link
            to="/database-overview"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: backendOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: backendOnline ? '#34d399' : '#f87171',
              textDecoration: 'none'
            }}
            title="Amazon DocumentDB & Neon Auth Status"
            className="topbar-db-badge"
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: backendOnline ? '#10b981' : '#ef4444',
                boxShadow: backendOnline ? '0 0 8px #10b981' : 'none'
              }}
            />
            <span>{backendOnline ? 'DocDB + Neon' : 'Offline'}</span>
          </Link>

          {/* Notifications Dropdown */}
          <div style={{ position: 'relative' }} ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Notifications"
              className="topbar-icon-btn"
            >
              <Bell size={17} />
              <span
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 7,
                  width: 7,
                  height: 7,
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px #3b82f6'
                }}
              />
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 320,
                  backgroundColor: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.6)',
                  padding: '0.75rem',
                  zIndex: 100
                }}
              >
                <div
                  style={{
                    padding: '0.4rem 0.4rem 0.6rem',
                    borderBottom: '1px solid #1f2937',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>System Notifications</span>
                  <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 600 }}>Active Session</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      fontSize: '0.78rem',
                      display: 'flex',
                      gap: '0.6rem'
                    }}
                  >
                    <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>Neon PostgreSQL Authenticated</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>User isolation active on user ID {currentUser?.id?.slice(0, 8)}...</div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      fontSize: '0.78rem',
                      display: 'flex',
                      gap: '0.6rem'
                    }}
                  >
                    <ShieldCheck size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>DocumentDB Compatibility Ready</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Real-time syntax validation active for Amazon DocumentDB 5.0.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.25rem 0.65rem 0.25rem 0.35rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer'
              }}
              className="topbar-profile-btn"
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)'
                }}
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User size={15} />}
              </div>
              <span
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: '#f8fafc'
                }}
                className="user-name"
              >
                {currentUser?.name || 'Inspector'}
              </span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>

            {showProfile && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 250,
                  backgroundColor: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.6)',
                  padding: '0.5rem',
                  zIndex: 100
                }}
              >
                <div
                  style={{
                    padding: '0.65rem',
                    borderBottom: '1px solid #1f2937',
                    marginBottom: '0.35rem'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc' }}>
                    {currentUser?.name || 'Inspector Account'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {currentUser?.email || 'inspector@inspectdb.internal'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        fontWeight: 600,
                        border: '1px solid rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      {currentUser?.role || 'USER'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: '#6ee7b7',
                        fontWeight: 600,
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      Neon Auth
                    </span>
                  </div>
                </div>

                <Link
                  to="/ai-assistant"
                  onClick={() => setShowProfile(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-md)',
                    color: '#e2e8f0',
                    textDecoration: 'none'
                  }}
                  className="dropdown-nav-item"
                >
                  <Sparkles size={15} color="#60a5fa" />
                  <span>AI Query Assistant</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-md)',
                    color: '#e2e8f0',
                    textDecoration: 'none'
                  }}
                  className="dropdown-nav-item"
                >
                  <SettingsIcon size={15} color="#94a3b8" />
                  <span>Project Settings</span>
                </Link>

                <div style={{ borderTop: '1px solid #1f2937', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.65rem',
                      fontSize: '0.825rem',
                      borderRadius: 'var(--radius-md)',
                      color: '#f87171',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textAlign: 'left'
                    }}
                    className="dropdown-logout-item"
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="mobile-menu-btn"
            style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle navigation menu"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: 'var(--topbar-height)',
            backgroundColor: 'rgba(11, 17, 32, 0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 89,
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
          className="mobile-drawer"
        >
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search reports, inspectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.4rem',
                paddingRight: '1rem',
                height: '42px',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                outline: 'none'
              }}
            />
          </form>

          {/* Quick Create Link */}
          <Link
            to="/create-inspection"
            onClick={() => setShowMobileMenu(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Plus size={18} />
            <span>Create New Inspection</span>
          </Link>

          {/* Nav items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>
              Main Navigation
            </span>
            {[...navLinks, ...secondaryNavLinks].map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMobileMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: isActive ? '#60a5fa' : '#e2e8f0',
                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid transparent'
                  }}
                >
                  <Icon size={18} color={isActive ? '#60a5fa' : '#94a3b8'} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Logout */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Log Out ({currentUser?.email})</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Component Styles */}
      <style>{`
        .top-nav-item:hover {
          color: #f1f5f9 !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        .dropdown-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        .dropdown-logout-item:hover {
          background-color: rgba(239, 68, 68, 0.15) !important;
        }
        .topbar-create-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5) !important;
        }
        .topbar-search-input:focus {
          border-color: #3b82f6 !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .topbar-icon-btn:hover, .topbar-profile-btn:hover {
          background-color: rgba(255, 255, 255, 0.12) !important;
        }

        @media (max-width: 1100px) {
          .top-desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .topbar-search {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .topbar-create-btn span {
            display: none;
          }
          .topbar-create-btn {
            padding: 0.45rem !important;
          }
          .user-name {
            display: none !important;
          }
          .topbar-db-badge {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
