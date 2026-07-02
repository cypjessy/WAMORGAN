'use client';

interface ForgotSheetModalProps {
  open: boolean;
  sheetEmail: string;
  onEmailChange: (val: string) => void;
  onSend: () => void;
  onClose: () => void;
}

export default function ForgotSheetModal({
  open, sheetEmail, onEmailChange, onSend, onClose,
}: ForgotSheetModalProps) {
  return (
    <>
      <div
        className={`modal-overlay ${open ? 'active' : ''}`}
        id="forgotOverlay"
        onClick={onClose}
      ></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`} id="forgotSheet">
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Reset Password</h3>
          <p className="sheet-subtitle">We'll send a reset link to your email</p>

          <div className="form-group">
            <label className="form-label" htmlFor="sheetEmail">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                id="sheetEmail"
                placeholder="you@company.com"
                value={sheetEmail}
                onChange={e => onEmailChange(e.target.value)}
              />
              <i className="fas fa-envelope input-icon"></i>
            </div>
          </div>

          <button className="btn btn-primary" onClick={onSend} style={{ marginTop: '8px' }}>
            Send Reset Link <i className="fas fa-paper-plane"></i>
          </button>

          <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '12px' }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
