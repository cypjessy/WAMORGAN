'use client';

interface ReorderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderName?: string;
}

export default function ReorderDialog({ open, onClose, onConfirm, orderName }: ReorderDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon warning"><i className="fas fa-rotate-right"></i></div>
        <h3>Reorder Items?</h3>
        <p>{orderName ? `This will add all items from ${orderName} to your cart.` : 'This will add all items from this order to your cart.'} Continue?</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            <i className="fas fa-rotate-right"></i> Reorder
          </button>
        </div>
      </div>
    </div>
  );
}
