'use client';

interface RegisterFormProps {
  regName: string;
  regEmail: string;
  regPhone: string;
  regPassword: string;
  regAddress: string;
  regCity: string;
  showRegPassword: boolean;
  termsAgree: boolean;
  loading: boolean;
  formShaking: boolean;
  errors: Record<string, string>;
  onRegNameChange: (val: string) => void;
  onRegEmailChange: (val: string) => void;
  onRegPhoneChange: (val: string) => void;
  onRegPasswordChange: (val: string) => void;
  onRegAddressChange: (val: string) => void;
  onRegCityChange: (val: string) => void;
  onToggleRegPassword: () => void;
  onTermsAgreeChange: (checked: boolean) => void;
  onRegister: () => void;
  onOpenTerms: () => void;
  onGoBack: () => void;
}

export default function RegisterForm({
  regName, regEmail, regPhone, regPassword, regAddress, regCity, showRegPassword,
  termsAgree, loading, formShaking, errors,
  onRegNameChange, onRegEmailChange, onRegPhoneChange, onRegPasswordChange,
  onRegAddressChange, onRegCityChange,
  onToggleRegPassword, onTermsAgreeChange,
  onRegister, onOpenTerms, onGoBack,
}: RegisterFormProps) {
  return (
    <>
      <div className={`page-header ${formShaking ? 'shake' : ''}`}>
        <button className="back-btn" onClick={onGoBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Join as a Customer</h2>
      </div>

      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, textAlign: 'center' }}>
        Create your account to start shopping
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="regName">Full Name *</label>
        <div className="input-wrapper">
          <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} id="regName" placeholder="John Doe"
            value={regName} onChange={e => onRegNameChange(e.target.value)} />
          <i className="fas fa-user input-icon"></i>
        </div>
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="regEmail">Email Address *</label>
        <div className="input-wrapper">
          <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} id="regEmail" placeholder="you@email.com"
            value={regEmail} onChange={e => onRegEmailChange(e.target.value)} />
          <i className="fas fa-envelope input-icon"></i>
        </div>
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="regPhone">Phone Number</label>
        <div className="input-wrapper">
          <input type="tel" className="form-input" id="regPhone" placeholder="+1 234 567 890"
            value={regPhone} onChange={e => onRegPhoneChange(e.target.value)} />
          <i className="fas fa-phone input-icon"></i>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="regPassword">Password *</label>
        <div className="input-wrapper">
          <input type={showRegPassword ? 'text' : 'password'} className={`form-input ${errors.password ? 'error' : ''}`} id="regPassword" placeholder="Min. 6 characters"
            value={regPassword} onChange={e => onRegPasswordChange(e.target.value)} />
          <button type="button" className="toggle-password" onClick={onToggleRegPassword} tabIndex={-1}>
            <i className={`fas ${showRegPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
          </button>
        </div>
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      {/* Optional Shipping Address */}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, marginBottom: 12 }}>
        Shipping address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="regAddress">Street Address</label>
        <div className="input-wrapper">
          <input type="text" className="form-input" id="regAddress" placeholder="123 Main St"
            value={regAddress} onChange={e => onRegAddressChange(e.target.value)} />
          <i className="fas fa-location-dot input-icon"></i>
        </div>
      </div>

      <div className="form-row" style={{ gap: 12 }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label" htmlFor="regCity">City</label>
          <input type="text" className="form-input" id="regCity" placeholder="New York"
            value={regCity} onChange={e => onRegCityChange(e.target.value)}
            style={{ paddingLeft: 16, paddingRight: 16 }} />
        </div>
      </div>

      <label className="checkbox-wrapper" style={{ marginTop: 12, marginBottom: 20 }}>
        <input type="checkbox" checked={termsAgree} onChange={e => onTermsAgreeChange(e.target.checked)} />
        <span>
          I agree to the{' '}
          <a style={{ color: 'var(--accent-primary)', textDecoration: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.preventDefault(); onOpenTerms(); }}>Terms of Service</a> and{' '}
          <a style={{ color: 'var(--accent-primary)', textDecoration: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.preventDefault(); onOpenTerms(); }}>Privacy Policy</a>
        </span>
      </label>
      {errors.terms && <p className="field-error" style={{ marginTop: -12, marginBottom: 12 }}>{errors.terms}</p>}

      <button className="btn btn-primary" onClick={onRegister} disabled={loading}>
        {loading ? <span className="spinner" /> : <span>Create Account <i className="fas fa-arrow-right"></i></span>}
      </button>
    </>
  );
}