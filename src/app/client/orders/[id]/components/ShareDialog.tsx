'use client';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
  trackingUrl: string;
}

export default function ShareDialog({ open, onClose, onCopy, onShare, trackingUrl }: ShareDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon info"><i className="fas fa-share-nodes"></i></div>
        <h3>Share Tracking</h3>
        <p>Share this tracking link with someone else.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input type="text" value={trackingUrl} readOnly
            style={{ flex: 1, height: 48, background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 16px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
          <button className="btn btn-sm btn-primary" onClick={onCopy} style={{ width: 'auto' }}>
            <i className="fas fa-copy"></i>
          </button>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onShare}><i className="fab fa-whatsapp"></i> Share</button>
        </div>
      </div>
    </div>
  );
}
