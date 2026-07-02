'use client';

import type { Order, OrderItem } from '@/lib/db';

interface OrderDetailSheetProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onSendInvoice: () => void;
}

function statusClass(status: string): string {
  const map: Record<string, string> = { pending: 'status-pending', confirmed: 'status-pending', processing: 'status-processing', shipped: 'status-processing', delivered: 'status-completed', cancelled: 'status-cancelled', refunded: 'status-cancelled' };
  return map[status] || 'status-pending';
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OrderDetailSheet({ open, order, onClose, onSendInvoice }: OrderDetailSheetProps) {
  if (!order) return null;

  const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <div className="order-detail-header">
            <div className="order-detail-img" style={order.items?.[0]?.imageUrl ? { fontSize: 32, backgroundImage: `url(${order.items[0].imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { fontSize: 32 }}>{order.items?.[0]?.imageUrl ? '' : '📦'}</div>
            <div className="order-detail-info">
              <h3>{order.orderNumber || 'Order'}</h3>
              <p>{order.customerName}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span className={`order-status ${statusClass(order.status)}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            {order.paymentStatus && (
              <span className={`order-status ${order.paymentStatus === 'paid' ? 'status-completed' : 'status-pending'}`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            )}
          </div>
          <div className="detail-row">
            <span className="label">Customer</span>
            <span className="value">{order.customerName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone</span>
            <span className="value">{order.customerPhone}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date</span>
            <span className="value">{formatDate(order.createdAt)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Items</span>
            <span className="value">{totalQty} item{totalQty !== 1 ? 's' : ''}</span>
          </div>
          <div className="detail-row">
            <span className="label">Total</span>
            <span className="value" style={{ color: 'var(--accent-primary)', fontSize: '18px' }}>KSh {order.total.toFixed(2)}</span>
          </div>

          {order.items && order.items.length > 0 && (
            <>
              <div style={{ fontSize: '14px', fontWeight: 700, margin: '20px 0 12px' }}>Items</div>
              {order.items.map((item, i) => (
                <div key={i} className="detail-row" style={{ marginBottom: 6 }}>
                  <span className="value" style={{ fontSize: 13 }}>{item.name} x{item.quantity}</span>
                  <span className="value">KSh {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </>
          )}

          <div style={{ fontSize: '14px', fontWeight: 700, margin: '20px 0 12px' }}>Order Timeline</div>
          <div className="detail-timeline">
            <div className="timeline-item">
              <div className="timeline-dot done"><i className="fas fa-check"></i></div>
              <div className="timeline-text">
                <h4>Order Placed</h4>
                <p>{formatDate(order.createdAt)}</p>
              </div>
            </div>
            {order.status !== 'pending' && order.status !== 'cancelled' && (
              <div className="timeline-item">
                <div className="timeline-dot done"><i className="fas fa-check"></i></div>
                <div className="timeline-text">
                  <h4>Processing</h4>
                  <p>{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            )}
            <div className="timeline-item">
              <div className={`timeline-dot ${order.status === 'delivered' ? 'done' : 'pending'}`}>
                {order.status === 'delivered' ? <i className="fas fa-check"></i> : order.status === 'shipped' || order.status === 'processing' ? <i className="fas fa-truck"></i> : null}
              </div>
              <div className="timeline-text">
                <h4>{order.status === 'delivered' ? 'Delivered' : 'Delivery'}</h4>
                <p>{order.status === 'delivered' ? formatDate(order.updatedAt) : order.status === 'shipped' ? 'In transit' : 'Pending'}</p>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={onSendInvoice}>
            <i className="fas fa-file-invoice"></i> Send Invoice
          </button>
          <button className="btn btn-secondary" style={{ marginTop: '10px' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
