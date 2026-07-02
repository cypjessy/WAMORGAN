'use client';

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderName?: string;
}

export default function CancelDialog({ open, onClose, onConfirm, orderName }: CancelDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon danger"><i className="fas fa-circle-xmark"></i></div>
        <h3>Cancel Order?</h3>
        <p>Are you sure you want to cancel{orderName ? ` your order for ${orderName}` : ' this order'}? This action cannot be undone.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Keep Order</button>
          <button
            className="btn btn-primary"
            style={{ background: 'var(--error)', boxShadow: '0 4px 24px rgba(239,68,68,0.3)' }}
            onClick={onConfirm}
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
