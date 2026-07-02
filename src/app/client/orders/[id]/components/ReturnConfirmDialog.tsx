'use client';

interface ReturnConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  items: string[];
}

export default function ReturnConfirmDialog({ open, onClose, items }: ReturnConfirmDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon success"><i className="fas fa-rotate-left"></i></div>
        <h3>Return Requested</h3>
        <p>Your return request for {items[0] || 'item'}{items.length > 1 ? ` and ${items.length - 1} other item(s)` : ''} has been submitted. You will receive a return label via email within 24 hours.</p>
        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={onClose}>Got It</button>
        </div>
      </div>
    </div>
  );
}
