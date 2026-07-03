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
    <div className="dialog-box" style={{
      position: 'fixed', top: '50%', left: '50%', transform: open ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)',
      zIndex: 9998, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', maxWidth: 340, width: 'calc(100% - 48px)',
    }}>
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
  );
}
