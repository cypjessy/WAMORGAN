'use client';

interface CartDialogProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  productName?: string;
}

export default function CartDialog({ open, onClose, onCheckout, productName }: CartDialogProps) {
  return (
    <div className="dialog-box" style={{
      position: 'fixed', top: '50%', left: '50%', transform: open ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)',
      zIndex: 9998, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', maxWidth: 340, width: 'calc(100% - 48px)',
    }}>
      <div className="dialog-icon success"><i className="fas fa-check-circle"></i></div>
      <h3>Added to Cart!</h3>
      <p>{productName || 'Product'} has been added to your shopping cart.</p>
      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={onClose}>Continue Shopping</button>
        <button className="btn btn-primary" onClick={onCheckout}><i className="fas fa-cart-shopping"></i> View Cart</button>
      </div>
    </div>
  );
}
