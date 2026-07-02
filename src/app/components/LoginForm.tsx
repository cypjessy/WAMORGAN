'use client';

interface LoginFormProps {
  loginEmail: string;
  loginPassword: string;
  rememberMe: boolean;
  showPassword: boolean;
  emailError: boolean;
  passwordError: boolean;
  formShaking: boolean;
  loading: boolean;
  onEmailChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onRememberChange: (checked: boolean) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotClick: () => void;
}

export default function LoginForm({
  loginEmail,
  loginPassword,
  rememberMe,
  showPassword,
  emailError,
  passwordError,
  formShaking,
  loading,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onSubmit,
  onForgotClick,
}: LoginFormProps) {
  return (
    <>
      <div className="logo-section">
        <div className="logo-icon">
          <i className="fas fa-bolt"></i>
        </div>
        <h1>WAMORGAN</h1>
        <p>Welcome back, seller</p>
      </div>

      <form id="loginForm" className={formShaking ? 'shake' : ''} onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="loginEmail">Email Address</label>
          <div className="input-wrapper">
            <input
              type="email"
              className={`form-input ${emailError ? 'error' : ''}`}
              id="loginEmail"
              placeholder="you@company.com"
              required
              value={loginEmail}
              onChange={e => onEmailChange(e.target.value)}
            />
            <i className="fas fa-envelope input-icon"></i>
          </div>
          <div className={`error-text ${emailError ? 'show' : ''}`} id="loginEmailError">
            Please enter a valid email
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="loginPassword">Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`form-input ${passwordError ? 'error' : ''}`}
              id="loginPassword"
              placeholder="Enter your password"
              required
              value={loginPassword}
              onChange={e => onPasswordChange(e.target.value)}
            />
            <button type="button" className="toggle-password" onClick={onTogglePassword} tabIndex={-1}>
              <i className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </button>
          </div>
          <div className={`error-text ${passwordError ? 'show' : ''}`} id="loginPasswordError">
            Password must be at least 6 characters
          </div>
        </div>

        <div className="checkbox-row">
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={e => onRememberChange(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <a className="forgot-link" onClick={onForgotClick}>Forgot Password?</a>
        </div>

        <button type="submit" className="btn btn-primary" id="loginBtn" disabled={loading}>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <span>Sign In</span>
              <i className="fas fa-arrow-right"></i>
            </>
          )}
        </button>
      </form>
    </>
  );
}
