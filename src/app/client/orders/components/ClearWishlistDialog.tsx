'use client';

interface ClearWishlistDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ClearWishlistDialog({ open, onClose, onConfirm }: ClearWishlistDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon danger"><i className="fas fa-trash-can"></i></div>
        <h3>Clear Wishlist?</h3>
        <p>This will remove all items from your wishlist. This cannot be undone.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ background: 'var(--error)', boxShadow: '0 4px 24px rgba(239,68,68,0.3)' }}
            onClick={onConfirm}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
