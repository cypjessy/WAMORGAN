'use client';

interface CancelConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelConfirmDialog({ open, onClose, onConfirm }: CancelConfirmDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon warning"><i className="fas fa-triangle-exclamation"></i></div>
        <h3>Cancel Order?</h3>
        <p>Are you sure you want to cancel order #ORD-2841? This action cannot be undone.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Keep Order</button>
          <button className="btn btn-primary" style={{ background: 'var(--error)', boxShadow: '0 4px 24px rgba(239,68,68,0.3)' }} onClick={onConfirm}>
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
