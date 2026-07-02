'use client';

interface CancelDialogProps {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelDialog({ open, orderId, onClose, onConfirm }: CancelDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon danger"><i className="fas fa-ban"></i></div>
        <h3>Cancel Order?</h3>
        <p>This will cancel order #{orderId} and notify the customer. This action cannot be undone.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Keep Order</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <i className="fas fa-ban"></i> Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}
