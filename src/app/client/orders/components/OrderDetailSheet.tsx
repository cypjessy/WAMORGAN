'use client';

export interface TimelineStep {
  dot: React.ReactNode;
  title: string;
  description: string;
  status: 'done' | 'current' | 'pending';
}

export interface OrderDetailData {
  imageUrl: string;
  name: string;
  orderId: string;
  status: string;
  statusClass: string;
  date: string;
  total: string;
  items: string;
  payment: string;
  shipping: string;
  tracking: string;
  timeline: TimelineStep[];
}

interface OrderDetailSheetProps {
  open: boolean;
  onClose: () => void;
  data: OrderDetailData | null;
  onTrackOrder?: () => void;
  onDownloadInvoice?: () => void;
  onReorder?: () => void;
  onCancel?: () => void;
}

export default function OrderDetailSheet({ open, onClose, data, onTrackOrder, onDownloadInvoice, onReorder, onCancel }: OrderDetailSheetProps) {
  if (!data) return null;

  const canCancel = data?.statusClass === 'status-processing' || data?.statusClass === 'status-pending' || data?.statusClass === 'status-confirmed';

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <div className="order-detail-header">
            <div className="order-detail-img" style={data.imageUrl ? { backgroundImage: `url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
              {!data.imageUrl && <span style={{ fontSize: 32 }}>📦</span>}
            </div>
            <div className="order-detail-info">
              <h3>{data.name}</h3>
              <p>{data.orderId}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
            <span className={`order-status ${data.statusClass}`}>{data.status}</span>
          </div>

          <div className="detail-row">
            <span className="label">Order Date</span>
            <span className="value">{data.date}</span>
          </div>
          <div className="detail-row">
            <span className="label">Total Amount</span>
            <span className="value" style={{ color: 'var(--accent-primary)', fontSize: 18 }}>{data.total}</span>
          </div>
          <div className="detail-row">
            <span className="label">Items</span>
            <span className="value">{data.items}</span>
          </div>
          <div className="detail-row">
            <span className="label">Payment</span>
            <span className="value">{data.payment}</span>
          </div>
          <div className="detail-row">
            <span className="label">Shipping</span>
            <span className="value">{data.shipping}</span>
          </div>
          <div className="detail-row">
            <span className="label">Tracking</span>
            <span className="value" style={data.tracking !== 'N/A' && data.tracking !== 'Pending' ? { color: 'var(--info)' } : {}}>
              {data.tracking}
            </span>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 12px' }}>Order Timeline</div>
          <div className="detail-timeline">
            {data.timeline.map((step, idx) => (
              <div className="timeline-item" key={idx}>
                <div className={`timeline-dot ${step.status}`}>{step.dot}</div>
                <div className="timeline-text">
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {onDownloadInvoice && (
            <button className="btn btn-primary" onClick={onDownloadInvoice} style={{ marginTop: 8 }}>
              <i className="fas fa-download"></i> Download Invoice
            </button>
          )}

          {onReorder && (
            <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={onReorder}>
              <i className="fas fa-rotate-right"></i> Reorder
            </button>
          )}

          {onCancel && canCancel && (
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onCancel}>
              <i className="fas fa-circle-xmark"></i> Cancel Order
            </button>
          )}

          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}
