'use client';

import { CartItemData } from './CartItemsSection';

interface OrderSummaryCompactProps {
  items: CartItemData[];
}

export default function OrderSummaryCompact({ items }: OrderSummaryCompactProps) {
  return (
    <div className="order-summary-compact">
      <h4>Order Summary</h4>
      {items.map((item) => (
        <div key={item.id} className="summary-item">
          <div className="summary-item-img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!item.imageUrl && <span style={{ fontSize: 24 }}>📦</span>}
          </div>
          <div className="summary-item-info">
            <h5>{item.name}</h5>
            <p>Qty: {item.qty}</p>
          </div>
          <div className="summary-item-price">KSh {(item.price * item.qty).toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
