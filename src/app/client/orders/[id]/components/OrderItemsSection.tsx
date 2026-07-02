'use client';

interface OrderItem {
  imageUrl: string;
  name: string;
  variant: string;
  price: string;
}

interface OrderItemsSectionProps {
  items: OrderItem[];
}

export default function OrderItemsSection({ items }: OrderItemsSectionProps) {
  return (
    <div className="items-section">
      <div className="section-title"><i className="fas fa-box-open"></i> Order Items</div>
      {items.map((item, i) => (
        <div key={i} className="item-row">
          <div className="item-img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!item.imageUrl && <span style={{ fontSize: 24 }}>📦</span>}
          </div>
          <div className="item-info">
            <h4>{item.name}</h4>
            <p>{item.variant}</p>
          </div>
          <div className="item-price">{item.price}</div>
        </div>
      ))}
    </div>
  );
}
