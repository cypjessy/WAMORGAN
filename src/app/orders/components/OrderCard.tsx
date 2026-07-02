'use client';

interface OrderItem {
  productId?: string;
  name: string;
  imageUrl?: string;
  emoji: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment: string;
  customer: string;
  phone: string;
  email?: string;
  address?: string;
  delivery?: { method: string; address?: string; pickupLocation?: string; expectedDate?: string };
  paymentInfo?: { method: string; reference?: string };
  discount?: number;
  notes?: string;
  sendWhatsApp?: boolean;
  date: string;
  time: string;
  source: string;
}

export default function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const paymentClass = order.payment === 'paid' ? 'payment-paid' : order.payment === 'refunded' ? 'payment-paid' : 'payment-unpaid';
  const paymentIcon = order.payment === 'paid' ? 'fa-check-circle' : order.payment === 'refunded' ? 'fa-rotate-left' : 'fa-clock';
  const paymentText = order.payment === 'paid' ? 'Paid' : order.payment === 'refunded' ? 'Refunded' : 'Unpaid';

  const firstItem = order.items[0];
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className={`order-card status-${order.status}`} onClick={onClick}>
      <div className="order-card-header">
        <div className="order-id-section">
          <div className="order-avatar" style={firstItem?.imageUrl ? { backgroundImage: `url(${firstItem.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 } : {}}>{firstItem?.emoji || '📦'}</div>
          <div className="order-id-info">
            <h4>#{order.id}</h4>
            <p>{order.customer} • {order.source}</p>
          </div>
        </div>
        <div>
          <div className="order-price">KSh {order.total.toFixed(2)}</div>
          <div className="order-time">{order.time}</div>
        </div>
      </div>
      <div className="order-items-preview">
        <div className="order-item-emoji" style={firstItem?.imageUrl ? { backgroundImage: `url(${firstItem.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 } : {}}>{firstItem?.emoji || '📦'}</div>
        <div className="order-item-text">{firstItem?.name || 'Items'}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}</div>
        <div className="order-item-count">{itemCount} item{itemCount > 1 ? 's' : ''}</div>
      </div>
      <div className="order-card-footer">
        <div className={`order-status-badge badge-${order.status}`}>
          <span className="badge-dot"></span>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </div>
        <div className={`order-payment ${paymentClass}`}>
          <i className={`fas ${paymentIcon}`}></i>
          {paymentText}
        </div>
      </div>
    </div>
  );
}
