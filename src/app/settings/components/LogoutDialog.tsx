'use client';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function LogoutDialog({ open, onClose, onLogout }: LogoutDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon warning"><i className="fas fa-right-from-bracket"></i></div>
        <h3>Log Out?</h3>
        <p>Are you sure you want to sign out of your WAMORGAN account?</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onLogout}>
            <i className="fas fa-right-from-bracket"></i> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
