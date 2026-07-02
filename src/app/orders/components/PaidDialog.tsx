'use client';

interface PaidDialogProps {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PaidDialog({ open, orderId, onClose, onConfirm }: PaidDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon warning"><i className="fas fa-credit-card"></i></div>
        <h3>Mark as Paid?</h3>
        <p>Confirm that payment for order #{orderId} has been received.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Not Yet</button>
          <button className="btn btn-success" onClick={onConfirm}>
            <i className="fas fa-check"></i> Confirm Paid
          </button>
        </div>
      </div>
    </div>
  );
}
