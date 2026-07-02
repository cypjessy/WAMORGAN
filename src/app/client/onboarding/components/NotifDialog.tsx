'use client';

interface NotifDialogProps {
  open: boolean;
  onClose: () => void;
  onEnable: () => void;
}

export default function NotifDialog({ open, onClose, onEnable }: NotifDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon info"><i className="fas fa-bell"></i></div>
        <h3>Enable Notifications</h3>
        <p>Get instant alerts for order updates, shipping status, and exclusive deals.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Not Now</button>
          <button className="btn btn-primary" onClick={onEnable}>
            <i className="fas fa-bell"></i> Enable
          </button>
        </div>
      </div>
    </div>
  );
}
