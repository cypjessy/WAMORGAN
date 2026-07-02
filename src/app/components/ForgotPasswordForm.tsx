'use client';

interface ForgotPasswordFormProps {
  forgotEmail: string;
  onEmailChange: (val: string) => void;
  onSend: () => void;
  onGoBack: () => void;
}

export default function ForgotPasswordForm({
  forgotEmail, onEmailChange, onSend, onGoBack,
}: ForgotPasswordFormProps) {
  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={onGoBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Reset Password</h2>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>
        Enter your email and we'll send you a verification code
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="forgotEmail">Email Address</label>
        <div className="input-wrapper">
          <input type="email" className="form-input" id="forgotEmail" placeholder="you@company.com"
            value={forgotEmail} onChange={e => onEmailChange(e.target.value)} />
          <i className="fas fa-envelope input-icon"></i>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onSend}>
        Send Code <i className="fas fa-paper-plane"></i>
      </button>
    </>
  );
}
