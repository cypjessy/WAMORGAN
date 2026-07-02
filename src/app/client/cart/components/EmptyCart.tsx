'use client';

interface EmptyCartProps {
  onStartShopping: () => void;
}

export default function EmptyCart({ onStartShopping }: EmptyCartProps) {
  return (
    <div className="empty-cart">
      <div className="empty-cart-icon"><i className="fas fa-cart-shopping"></i></div>
      <h3>Your cart is empty</h3>
      <p>Looks like you haven't added anything to your cart yet.</p>
      <button className="btn btn-primary" style={{ maxWidth: 280 }} onClick={onStartShopping}>
        <i className="fas fa-bag-shopping"></i> Start Shopping
      </button>
    </div>
  );
}
