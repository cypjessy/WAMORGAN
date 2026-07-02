'use client';

interface NewPasswordFormProps {
  newPassword: string;
  confirmPassword: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  onNewPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onReset: () => void;
  onGoBack: () => void;
}

export default function NewPasswordForm({
  newPassword, confirmPassword, showNewPassword, showConfirmPassword,
  onNewPasswordChange, onConfirmPasswordChange,
  onToggleNewPassword, onToggleConfirmPassword, onReset, onGoBack,
}: NewPasswordFormProps) {
  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={onGoBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>New Password</h2>
      </div>

      <div className="success-checkmark" style={{ marginBottom: '24px' }}>
        <i className="fas fa-shield-halved"></i>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
        Create a strong password for your account
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="newPassword">New Password</label>
        <div className="input-wrapper">
          <input
            type={showNewPassword ? 'text' : 'password'}
            className="form-input"
            id="newPassword"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={e => onNewPasswordChange(e.target.value)}
          />
          <button type="button" className="toggle-password" onClick={onToggleNewPassword} tabIndex={-1}>
            <i className={`fas ${showNewPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
        <div className="input-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            className="form-input"
            id="confirmPassword"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={e => onConfirmPasswordChange(e.target.value)}
          />
          <button type="button" className="toggle-password" onClick={onToggleConfirmPassword} tabIndex={-1}>
            <i className={`fas ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
          </button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onReset}>
        Reset Password <i className="fas fa-lock"></i>
      </button>
    </>
  );
}
