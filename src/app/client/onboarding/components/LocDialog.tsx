'use client';

interface LocDialogProps {
  open: boolean;
  onClose: () => void;
  onAllow: () => void;
}

export default function LocDialog({ open, onClose, onAllow }: LocDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon warning"><i className="fas fa-location-dot"></i></div>
        <h3>Enable Location</h3>
        <p>Allow location access for accurate delivery estimates and local store recommendations.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Not Now</button>
          <button className="btn btn-primary" onClick={onAllow}>
            <i className="fas fa-location-dot"></i> Allow
          </button>
        </div>
      </div>
    </div>
  );
}
