'use client';

interface CartBarProps {
  visible: boolean;
  items: { image: string }[];
  total: string;
  count: number;
  onCheckout: () => void;
}

export default function CartBar({ visible, items, total, count, onCheckout }: CartBarProps) {
  return (
    <div className={`cart-bar ${visible ? 'show' : ''}`}>
      <div className="cart-bar-items">
        {items.map((item, i) => (
          <div key={i} className="cart-bar-item" style={item.image ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!item.image && <span style={{ fontSize: 18 }}>📦</span>}
          </div>
        ))}
      </div>
      <div className="cart-bar-info">
        <h4>{count} items in cart</h4>
        <p>KSh {total} total</p>
      </div>
      <button className="cart-bar-btn" onClick={onCheckout}>Checkout</button>
    </div>
  );
}
