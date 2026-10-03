import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  CheckCircle2,
  Server
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide a valid full name (at least 2 characters).');
      return;
    }

    if (!trimmedEmail) {
      setError('Please provide your email address.');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError('Password does not satisfy security requirements (at least 8 characters, 1 letter, and 1 number).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-glow-top" />
      <div className="auth-glow-bottom" />

      {/* Header */}
      <div className="auth-header">
        <div className="auth-logo-icon">
          <Database size={28} />
        </div>
        <h2 className="auth-title">
          Create <span>InspectDB</span> Account
        </h2>
        <p className="auth-subtitle">
          Persistent User Account Storage in Neon PostgreSQL
        </p>

        {/* Badges */}
        <div className="auth-badge-row">
          <span className="auth-badge-neon">
            <Server size={12} />
            Neon PostgreSQL
          </span>
          <span className="auth-badge-sec">
            <ShieldCheck size={12} />
            Bcrypt Hashed
          </span>
        </div>
      </div>

      {/* Card Form */}
      <div className="auth-card-container">
        <h3 className="auth-form-title">Inspector Registration</h3>
        <p className="auth-form-desc">
          Create your account to start managing inspection reports and running AI advisors.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-box">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: '#fb7185' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#ffe4e6' }}>Registration Error</div>
              <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="auth-field">
            <div className="auth-field-header">
              <label className="auth-field-label">Full Name</label>
            </div>
            <div className="auth-input-wrapper">
              <User size={16} className="auth-input-icon" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Connor"
                className="auth-input"
              />
            </div>
          </div>

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
            </div>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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

            {/* Password Requirement Chips */}
            <div className="auth-req-row">
              <span className={`auth-req-chip ${hasMinLength ? 'active' : ''}`}>
                <CheckCircle2 size={11} color={hasMinLength ? '#10b981' : '#64748b'} />
                8+ chars
              </span>
              <span className={`auth-req-chip ${hasLetter ? 'active' : ''}`}>
                <CheckCircle2 size={11} color={hasLetter ? '#10b981' : '#64748b'} />
                1+ letter
              </span>
              <span className={`auth-req-chip ${hasNumber ? 'active' : ''}`}>
                <CheckCircle2 size={11} color={hasNumber ? '#10b981' : '#64748b'} />
                1+ number
              </span>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="auth-field">
            <div className="auth-field-header">
              <label className="auth-field-label">Confirm Password</label>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="auth-input"
                style={{
                  borderColor: confirmPassword && !passwordsMatch ? '#f43f5e' : confirmPassword && passwordsMatch ? '#10b981' : undefined
                }}
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '0.25rem' }}>
                Passwords do not match.
              </div>
            )}
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
                <span>Creating Neon Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-card-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">
            Sign In
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};
