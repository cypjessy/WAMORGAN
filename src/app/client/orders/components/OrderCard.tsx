'use client';

export interface OrderData {
  id: string;
  imageUrl: string;
  name: string;
  orderId: string;
  status: string;
  price: string;
  items: string;
  date: string;
  progressSteps: number; // 0-4 dots active
  showProgress?: boolean;
}

interface OrderCardProps {
  order: OrderData;
  onClick: (order: OrderData) => void;
}

const statusConfig: Record<string, { class: string; label: string }> = {
  delivered: { class: 'status-delivered', label: 'Delivered' },
  shipped: { class: 'status-shipped', label: 'Shipped' },
  processing: { class: 'status-processing', label: 'Processing' },
  pending: { class: 'status-processing', label: 'Pending' },
  confirmed: { class: 'status-processing', label: 'Confirmed' },
  cancelled: { class: 'status-cancelled', label: 'Cancelled' },
  refunded: { class: 'status-cancelled', label: 'Refunded' },
};

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const status = statusConfig[order.status] || { class: 'status-processing', label: order.status };

  return (
    <div className="order-card" onClick={() => onClick(order)}>
      <div className="order-card-header">
        <div className="order-img" style={order.imageUrl ? { backgroundImage: `url(${order.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          {!order.imageUrl && <span style={{ fontSize: 28 }}>📦</span>}
        </div>
        <div className="order-info">
          <h4>{order.name}</h4>
          <p>{order.orderId}</p>
        </div>
        <span className={`order-status ${status.class}`}>{status.label}</span>
      </div>

      {order.showProgress !== false && (
        <div className="order-progress">
          <span className={`progress-dot ${0 < order.progressSteps ? 'active' : ''}`}></span>
          <span className={`progress-line ${1 < order.progressSteps ? 'active' : ''}`}></span>
          <span className={`progress-dot ${1 < order.progressSteps ? 'active' : ''}`}></span>
          <span className={`progress-line ${2 < order.progressSteps ? 'active' : ''}`}></span>
          <span className={`progress-dot ${2 < order.progressSteps ? 'active' : ''}`}></span>
          <span className={`progress-line ${3 < order.progressSteps ? 'active' : ''}`}></span>
          <span className={`progress-dot ${3 < order.progressSteps ? 'active' : ''}`}></span>
        </div>
      )}

      <div className="order-meta">
        <span className="price">{order.price}</span>
        <span className="items-count">{order.items}</span>
        <span className="date">{order.date}</span>
      </div>
    </div>
  );
}
