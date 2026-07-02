'use client';

interface OrderStatusCardProps {
  imageUrl: string;
  productName: string;
  orderNumber: string;
  status: 'shipped' | 'delivered' | 'processing';
  orderDate: string;
  estDelivery: string;
  courier: string;
  trackingNumber: string;
}

export default function OrderStatusCard({
  imageUrl, productName, orderNumber, status,
  orderDate, estDelivery, courier, trackingNumber
}: OrderStatusCardProps) {
  return (
    <div className="order-status-card">
      <div className="order-status-header">
        <div className="order-status-img" style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          {!imageUrl && <span style={{ fontSize: 28 }}>📦</span>}
        </div>
        <div className="order-status-info">
          <h3>{productName}</h3>
          <p>Order #{orderNumber}</p>
        </div>
        <div className={`status-badge ${status}`}>
          <span className="dot"></span> {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>
      <div className="order-details-grid">
        <div className="detail-box"><div className="label">Order Date</div><div className="value">{orderDate}</div></div>
        <div className="detail-box"><div className="label">Est. Delivery</div><div className="value" style={{ color: 'var(--success)' }}>{estDelivery}</div></div>
        <div className="detail-box"><div className="label">Courier</div><div className="value">{courier}</div></div>
        <div className="detail-box"><div className="label">Tracking #</div><div className="value" style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}>{trackingNumber}</div></div>
      </div>
    </div>
  );
}
