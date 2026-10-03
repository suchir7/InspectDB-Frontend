import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Server,
  Sparkles,
  Info
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Where to navigate after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: trimmedEmail, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-glow-top" />
      <div className="auth-glow-bottom" />

      {/* Header / Brand */}
      <div className="auth-header">
        <div className="auth-logo-icon">
          <Database size={28} />
        </div>
        <h2 className="auth-title">
          Inspect<span>DB</span>
        </h2>
        <p className="auth-subtitle">
          Inspection Report Management & AI Query Intelligence Platform
        </p>

        {/* Badges */}
        <div className="auth-badge-row">
          <span className="auth-badge-neon">
            <Server size={12} />
            Neon PostgreSQL Auth
          </span>
          <span className="auth-badge-sec">
            <ShieldCheck size={12} />
            JWT Secured
          </span>
        </div>
      </div>

      {/* Card Form */}
      <div className="auth-card-container">
        <h3 className="auth-form-title">Sign In</h3>
        <p className="auth-form-desc">
          Enter your inspector credentials to access the operational platform.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-box">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: '#fb7185' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#ffe4e6' }}>Authentication Failed</div>
              <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="auth-field">
            <div className="auth-field-header">
              <label className="auth-field-label">Email Address</label>
            </div>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="inspector@inspectdb.org"
                className="auth-input"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field">
            <div className="auth-field-header">
              <label className="auth-field-label">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="auth-input"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-eye-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating with Neon...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-card-footer">
          <span>New to InspectDB?</span>
          <Link to="/register" className="auth-link">
            Create an account
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Architecture Separation Note */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', zIndex: 10 }}>
        <Sparkles size={13} color="#818cf8" />
        <span>PostgreSQL stores relational auth & accounts. Inspection reports stay variable-schema.</span>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={18} color="#4f46e5" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Password Reset Notice</h3>
              </div>
            </div>
            <div className="modal-body" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              In Phase 1, password hashes are secured with bcrypt in <strong>Neon PostgreSQL</strong>. Self-service email reset will be connected to AWS SES in Phase 2. Please contact your system administrator to update credentials.
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="btn btn-primary btn-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
