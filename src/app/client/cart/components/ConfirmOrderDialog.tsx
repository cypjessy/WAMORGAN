'use client';

interface ConfirmOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
}

export default function ConfirmOrderDialog({ open, onClose, onConfirm, total }: ConfirmOrderDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon info"><i className="fas fa-lock"></i></div>
        <h3>Confirm Order</h3>
        <p>You are about to place an order for <strong>KSh {total.toFixed(2)}</strong>. Please confirm to proceed.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}><i className="fas fa-check"></i> Confirm</button>
        </div>
      </div>
    </div>
  );
}
