'use client';

interface OrderItem {
  productId?: string;
  name: string;
  imageUrl?: string;
  emoji: string;
  price: number;
  qty: number;
}

interface InvoiceOrder {
  id: string;
  items: OrderItem[];
  total: number;
  customer: string;
  phone: string;
  email?: string;
  address?: string;
  payment: string;
  paymentInfo?: { method: string; reference?: string };
  date: string;
}

interface InvoiceSheetProps {
  open: boolean;
  order: InvoiceOrder | null;
  onClose: () => void;
  onDownload: () => void;
  businessName?: string;
}

export default function InvoiceSheet({ open, order, onClose, onDownload, businessName }: InvoiceSheetProps) {
  if (!order) return null;

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
  const paymentLabel = order.paymentInfo?.method || 'Credit Card';
  const payText = order.payment === 'paid' ? 'Payment Received' : order.payment === 'refunded' ? 'Payment Refunded' : 'Payment Pending';

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <div className="invoice-header">
            <div className="invoice-logo"><i className="fas fa-bolt"></i></div>
            <h3>{businessName || 'WAMORGAN'}</h3>
            <p>Invoice #INV-{order.id}</p>
          </div>

          <div className="invoice-section">
            <h4>Bill To</h4>
            <p><strong>{order.customer}</strong><br />{order.phone}</p>
            {order.email && <p style={{ color: 'var(--text-muted)', marginTop: 2 }}>{order.email}</p>}
            {order.address && <p style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: 13 }}>{order.address}</p>}
          </div>

          <div className="invoice-section">
            <h4>Invoice Details</h4>
            <p>Invoice #: INV-{order.id}<br />Date: {order.date}<br />Payment: {paymentLabel}</p>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.productId || idx}>
                  <td>{item.imageUrl ? <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', verticalAlign: 'middle', marginRight: 6 }} /> : <span style={{ marginRight: 4 }}>{item.emoji}</span>}{item.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.qty}</td>
                  <td>KSh {(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="invoice-total-row">
              <span>Subtotal ({totalQty} item{totalQty > 1 ? 's' : ''})</span>
              <span>KSh {subtotal.toFixed(2)}</span>
            </div>
            <div className="invoice-total-row grand">
              <span>Total</span>
              <span>KSh {order.total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{
            textAlign: 'center', marginTop: 20, padding: 16,
            borderRadius: 'var(--radius-md)',
            background: order.payment === 'paid' ? 'var(--success-soft)' : 'var(--warning-soft)',
          }}>
            <i className={`fas ${order.payment === 'paid' ? 'fa-check-circle' : 'fa-clock'}`}
              style={{ color: order.payment === 'paid' ? 'var(--success)' : 'var(--warning)', fontSize: 24, marginBottom: 8 }}></i>
            <p style={{ color: order.payment === 'paid' ? 'var(--success)' : 'var(--warning)', fontWeight: 700, fontSize: 14 }}>{payText}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
              {order.payment === 'paid' ? `Paid via ${paymentLabel} on ${order.date}` : 'Awaiting payment confirmation'}
            </p>
          </div>

          <div className="detail-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              <i className="fas fa-share-nodes"></i> Share
            </button>
            <button className="btn btn-primary" onClick={onDownload}>
              <i className="fas fa-download"></i> Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
