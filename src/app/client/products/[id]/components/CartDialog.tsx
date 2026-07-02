'use client';

interface CartDialogProps {
  open: boolean;
  onClose: () => void;
  onViewCart: () => void;
  productName: string;
  variant?: string;
}

export default function CartDialog({ open, onClose, onViewCart, productName, variant }: CartDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon success"><i className="fas fa-check"></i></div>
        <h3>Added to Cart!</h3>
        <p>{productName}{variant ? ` (${variant})` : ''} has been added to your cart.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Continue Shopping</button>
          <button className="btn btn-primary" onClick={onViewCart}>
            <i className="fas fa-cart-shopping"></i> View Cart
          </button>
        </div>
      </div>
    </div>
  );
}
