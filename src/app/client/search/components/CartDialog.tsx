'use client';

interface CartDialogProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  productName: string;
}

export default function CartDialog({ open, onClose, onCheckout, productName }: CartDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon success"><i className="fas fa-check"></i></div>
        <h3>Added to Cart</h3>
        <p>{productName} has been added to your cart. Continue shopping or checkout now.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Continue</button>
          <button className="btn btn-primary" onClick={onCheckout}>Checkout</button>
        </div>
      </div>
    </div>
  );
}
