'use client';

interface BlockDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function BlockDialog({ open, onClose, onConfirm }: BlockDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon danger"><i className="fas fa-ban"></i></div>
        <h3>Block Contact?</h3>
        <p>Blocked contacts will no longer be able to message you or see your business profile.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <i className="fas fa-ban"></i> Block
          </button>
        </div>
      </div>
    </div>
  );
}
