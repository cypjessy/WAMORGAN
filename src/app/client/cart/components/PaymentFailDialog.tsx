'use client';

interface PaymentFailDialogProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function PaymentFailDialog({ open, onClose, onRetry }: PaymentFailDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon warning"><i className="fas fa-triangle-exclamation"></i></div>
        <h3>Payment Failed</h3>
        <p>We couldn't process your payment. Please check your card details or try a different payment method.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onRetry}><i className="fas fa-rotate"></i> Retry</button>
        </div>
      </div>
    </div>
  );
}
