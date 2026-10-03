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
  ];

  const secondaryNavLinks = [
    { to: '/cost-optimizer', label: 'Cost Optimizer', icon: Calculator },
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
          gap: '1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Left Section: Brand Logo & Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', minWidth: 0 }}>
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
                background: 'var(--gradient-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy-900)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 6px 18px -6px rgba(201, 162, 58, 0.6)'
              }}
            >
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  color: '#ffffff',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '1.3rem',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1
                }}
              >
                Inspect<span style={{ color: 'var(--gold-400)' }}>DB</span>
              </span>
              <span style={{ color: '#8e97ac', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Amazon DocumentDB
              </span>
            </div>
          </Link>

          {/* Desktop Top Navigation Links */}
          <nav
            className="top-desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem'
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
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    color: isActive ? 'var(--color-topbar-text-active)' : 'var(--color-topbar-text)',
                    backgroundColor: isActive ? 'var(--color-topbar-active)' : 'transparent',
                    border: isActive ? '1px solid var(--color-topbar-active-border)' : '1px solid transparent',
                    transition: 'all var(--transition-fast)',
                    position: 'relative'
                  }}
                  className="top-nav-item"
                >
                  <Icon size={16} color={isActive ? '#e6cf8f' : '#a9b4cc'} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(201, 162, 58, 0.16)',
                        color: 'var(--gold-300)',
                        border: '1px solid rgba(201, 162, 58, 0.35)',
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
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: secondaryNavLinks.some(link => location.pathname === link.to) ? 'var(--color-topbar-text-active)' : 'var(--color-topbar-text)',
                  backgroundColor: secondaryNavLinks.some(link => location.pathname === link.to) ? 'var(--color-topbar-active)' : 'transparent',
                  border: secondaryNavLinks.some(link => location.pathname === link.to) ? '1px solid var(--color-topbar-active-border)' : '1px solid transparent',
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
                    backgroundColor: '#0e1e42',
                    border: '1px solid #1c2b4f',
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
                          color: isActive ? 'var(--gold-300)' : '#dfe3ec',
                          backgroundColor: isActive ? 'var(--color-topbar-active)' : 'transparent'
                        }}
                        className="dropdown-nav-item"
                      >
                        <Icon size={16} color={isActive ? '#e6cf8f' : '#8e97ac'} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0 }}>
          {/* Quick "New Inspection" Button */}
          <Link
            to="/create-inspection"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-gold)',
              color: 'var(--navy-950)',
              fontSize: '0.825rem',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 6px 16px -6px rgba(201, 162, 58, 0.55)',
              border: '1px solid var(--gold-600)',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
            }}
            className="topbar-create-btn"
          >
            <Plus size={16} />
            <span>New Report</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '220px' }} className="topbar-search">
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#67718a' }} />
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
                color: '#f5f7fa',
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
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${backendOnline ? 'rgba(201, 162, 58, 0.3)' : 'rgba(194, 59, 59, 0.35)'}`,
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: backendOnline ? 'var(--gold-300)' : '#e07a7a',
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
                backgroundColor: backendOnline ? '#22a06b' : '#d04545',
                boxShadow: backendOnline ? '0 0 8px #22a06b' : 'none'
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
                color: '#8e97ac',
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
                  backgroundColor: '#3a6fe0',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px #3a6fe0'
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
                  backgroundColor: '#0e1e42',
                  border: '1px solid #1c2b4f',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.6)',
                  padding: '0.75rem',
                  zIndex: 100
                }}
              >
                <div
                  style={{
                    padding: '0.4rem 0.4rem 0.6rem',
                    borderBottom: '1px solid #1c2b4f',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f5f7fa' }}>System Notifications</span>
                  <span style={{ fontSize: '0.7rem', color: '#e6cf8f', fontWeight: 600 }}>Active Session</span>
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
                    <CheckCircle2 size={16} color="#22a06b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#f5f7fa' }}>Neon PostgreSQL Authenticated</div>
                      <div style={{ fontSize: '0.72rem', color: '#8e97ac' }}>User isolation active on user ID {currentUser?.id?.slice(0, 8)}...</div>
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
                    <ShieldCheck size={16} color="#3a6fe0" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#f5f7fa' }}>DocumentDB Compatibility Ready</div>
                      <div style={{ fontSize: '0.72rem', color: '#8e97ac' }}>Real-time syntax validation active for Amazon DocumentDB 5.0.</div>
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
                  background: 'var(--gradient-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--navy-900)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }}
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User size={15} />}
              </div>
              <span
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: '#f5f7fa',
                  whiteSpace: 'nowrap'
                }}
                className="user-name"
              >
                {currentUser?.name || 'Inspector'}
              </span>
              <ChevronDown size={13} color="#8e97ac" />
            </button>

            {showProfile && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 250,
                  backgroundColor: '#0e1e42',
                  border: '1px solid #1c2b4f',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.6)',
                  padding: '0.5rem',
                  zIndex: 100
                }}
              >
                <div
                  style={{
                    padding: '0.65rem',
                    borderBottom: '1px solid #1c2b4f',
                    marginBottom: '0.35rem'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f5f7fa' }}>
                    {currentUser?.name || 'Inspector Account'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#8e97ac',
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
                        backgroundColor: 'rgba(201, 162, 58, 0.2)',
                        color: '#a3bdf3',
                        fontWeight: 600,
                        border: '1px solid rgba(201, 162, 58, 0.3)'
                      }}
                    >
                      {currentUser?.role || 'USER'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(34, 160, 107, 0.2)',
                        color: '#8fd7b5',
                        fontWeight: 600,
                        border: '1px solid rgba(34, 160, 107, 0.3)'
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
                    color: '#dfe3ec',
                    textDecoration: 'none'
                  }}
                  className="dropdown-nav-item"
                >
                  <Sparkles size={15} color="#e6cf8f" />
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
                    color: '#dfe3ec',
                    textDecoration: 'none'
                  }}
                  className="dropdown-nav-item"
                >
                  <SettingsIcon size={15} color="#8e97ac" />
                  <span>Project Settings</span>
                </Link>

                <div style={{ borderTop: '1px solid #1c2b4f', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
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
                      color: '#e07a7a',
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
              color: '#f5f7fa',
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
            backgroundColor: 'rgba(6, 14, 34, 0.95)',
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
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#67718a' }} />
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
                backgroundColor: '#1f2a44',
                border: '1px solid #36415a',
                color: '#f5f7fa',
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
              background: 'linear-gradient(135deg, #2459c9 0%, #1a3466 100%)',
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
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#67718a', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>
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
                    color: isActive ? '#e6cf8f' : '#dfe3ec',
                    backgroundColor: isActive ? 'rgba(201, 162, 58, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(107, 147, 234, 0.3)' : '1px solid transparent'
                  }}
                >
                  <Icon size={18} color={isActive ? '#e6cf8f' : '#8e97ac'} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Logout */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #1f2a44' }}>
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
                backgroundColor: 'rgba(194, 59, 59, 0.1)',
                color: '#e07a7a',
                border: '1px solid rgba(194, 59, 59, 0.25)',
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
          color: #ffffff !important;
          background-color: var(--color-topbar-hover) !important;
        }
        .dropdown-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        .dropdown-logout-item:hover {
          background-color: rgba(194, 59, 59, 0.15) !important;
        }
        .topbar-create-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
          color: var(--navy-950) !important;
        }
        .topbar-search-input:focus {
          border-color: var(--gold-500) !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .topbar-icon-btn:hover, .topbar-profile-btn:hover {
          background-color: rgba(255, 255, 255, 0.12) !important;
        }

        /* Keep one tidy row at every width: shed secondary items before anything wraps */
        @media (max-width: 1599px) {
          .topbar-search {
            display: none !important;
          }
        }

        @media (max-width: 1379px) {
          .topbar-db-badge {
            display: none !important;
          }
        }

        @media (max-width: 1279px) {
          .user-name {
            display: none !important;
          }
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
