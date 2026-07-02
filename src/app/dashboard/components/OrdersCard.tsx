'use client';

import type { Order } from '@/lib/db';

interface OrdersCardProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
}

function statusClass(status: string): string {
  const map: Record<string, string> = { pending: 'status-pending', confirmed: 'status-pending', processing: 'status-processing', shipped: 'status-processing', delivered: 'status-completed', cancelled: 'status-cancelled', refunded: 'status-cancelled' };
  return map[status] || 'status-pending';
}

function timeAgo(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export default function OrdersCard({ orders, onOrderClick }: OrdersCardProps) {
  const recent = orders.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="orders-card">
        <div className="section-header orders-card-header">
          <span className="section-title">Recent Orders</span>
        </div>
        <div className="empty-state show" style={{ padding: '24px 16px' }}>
          <div className="empty-icon" style={{ width: 48, height: 48, fontSize: 20 }}><i className="fas fa-shopping-bag"></i></div>
          <h3 style={{ fontSize: 14, marginBottom: 2 }}>No orders yet</h3>
          <p style={{ fontSize: 12, marginBottom: 0 }}>Orders will appear here once customers start buying</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-card">
      <div className="section-header orders-card-header">
        <span className="section-title">Recent Orders</span>
        <span className="section-action" onClick={() => window.location.href = '/orders'}>
          See All <i className="fas fa-arrow-right" style={{ fontSize: '11px' }}></i>
        </span>
      </div>
      {recent.map((order) => {
        const itemName = order.items?.[0]?.name || 'Order';
        return (
          <div key={order.id} className="order-item" onClick={() => onOrderClick(order.id)}>
            <div className="order-img" style={order.items?.[0]?.imageUrl ? { backgroundImage: `url(${order.items[0].imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>{order.items?.[0]?.imageUrl ? '' : '📦'}</div>
            <div className="order-info">
              <h4>{itemName}</h4>
              <p>{order.orderNumber || 'Order'} &bull; {timeAgo(order.createdAt)}</p>
            </div>
            <div>
              <div className="order-price">KSh {order.total.toFixed(2)}</div>
              <div className={`order-status ${statusClass(order.status)}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
