'use client';

// ─── Types matching CreateOrderDialog ──────────────────────────────────────

interface OrderItem {
  productId?: string;
  name: string;
  imageUrl?: string;
  emoji: string;
  price: number;
  qty: number;
}

interface DeliveryInfo {
  method: string;
  address?: string;
  pickupLocation?: string;
  expectedDate?: string;
}

interface PaymentInfo {
  method: string;
  reference?: string;
}

interface OrderDetail {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment: string;
  paymentInfo?: PaymentInfo;
  customer: string;
  phone: string;
  email?: string;
  address?: string;
  delivery?: DeliveryInfo;
  discount?: number;
  notes?: string;
  sendWhatsApp?: boolean;
  date: string;
  time: string;
  source: string;
}

interface OrderDetailSheetProps {
  open: boolean;
  order: OrderDetail | null;
  onClose: () => void;
  onUpdateStatus: () => void;
  onInvoice: () => void;
  onCancel: () => void;
}

// ─── Statics ────────────────────────────────────────────────────────────────

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Credit Card',
  bank: 'Bank Transfer',
  paypal: 'PayPal',
  mpesa: 'M-Pesa',
  'WhatsApp Pay': 'WhatsApp Pay',
};

const paymentMethodIcons: Record<string, string> = {
  cash: 'fa-money-bill-wave',
  card: 'fa-credit-card',
  bank: 'fa-building-columns',
  paypal: 'fab fa-paypal',
  mpesa: 'fa-mobile-screen',
  'WhatsApp Pay': 'fab fa-whatsapp',
};

const bannerConfig: Record<string, { icon: string; title: string; sub: string; color: string }> = {
  pending: { icon: 'fa-clock', title: 'Order Pending', sub: 'Awaiting payment confirmation', color: 'var(--warning)' },
  processing: { icon: 'fa-box', title: 'Order Processing', sub: 'Preparing for shipment', color: 'var(--info)' },
  completed: { icon: 'fa-check', title: 'Order Completed', sub: 'Delivered successfully', color: 'var(--success)' },
  cancelled: { icon: 'fa-ban', title: 'Order Cancelled', sub: 'Order has been cancelled', color: 'var(--error)' },
  refunded: { icon: 'fa-rotate-left', title: 'Order Refunded', sub: 'Payment has been refunded', color: 'var(--info)' },
};

const timelineSteps = [
  { icon: 'fa-check', title: 'Order Placed' },
  { icon: 'fa-credit-card', title: 'Payment' },
  { icon: 'fa-box', title: 'Processing' },
  { icon: 'fa-truck', title: 'Shipped' },
  { icon: 'fa-check', title: 'Delivered' },
];

const payStatusColors: Record<string, string> = {
  paid: 'var(--success)',
  unpaid: 'var(--warning)',
  refunded: 'var(--info)',
};

const payStatusText: Record<string, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  refunded: 'Refunded',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="detail-row">
      <span className="label">{label}</span>
      <span className="value" style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: 0.5,
      margin: '20px 0 12px', paddingTop: 4,
    }}>
      {title}
    </div>
  );
}

// ─── Badge Component ────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: `${color}20`, color,
      fontSize: 12, fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OrderDetailSheet({ open, order, onClose, onUpdateStatus, onInvoice, onCancel }: OrderDetailSheetProps) {
  if (!order) return null;

  const config = bannerConfig[order.status] || bannerConfig.pending;
  const payColor = payStatusColors[order.payment] || 'var(--warning)';
  const payText = payStatusText[order.payment] || 'Unpaid';

  // Timeline status index
  const statusOrder: Record<string, number> = { pending: 1, processing: 2, completed: 4, cancelled: 1, refunded: 1 };
  const statusIdx = (order.status === 'cancelled' || order.status === 'refunded') ? 1 : (statusOrder[order.status] || 1);

  // Pricing
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountPercent = order.discount || 0;
  const discountAmount = Math.min(discountPercent, 100) / 100 * subtotal;
  const total = Math.max(0, subtotal - discountAmount);

  const paymentLabel = order.paymentInfo?.method
    ? (paymentMethodLabels[order.paymentInfo.method] || order.paymentInfo.method)
    : (order.payment === 'paid' ? 'Paid' : 'Pending');

  const paymentIcon = order.paymentInfo?.method
    ? (paymentMethodIcons[order.paymentInfo.method] || 'fa-credit-card')
    : (order.payment === 'paid' ? 'fa-check-circle' : 'fa-clock');

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content" style={{ paddingBottom: 40 }}>

          {/* ── Status Banner ── */}
          <div className={`detail-status-banner ${order.status}`}>
            <i className={`fas ${config.icon}`} style={{ color: config.color }}></i>
            <div>
              <h4>{config.title}</h4>
              <p>{config.sub}</p>
            </div>
          </div>

          {/* ── Customer Section ── */}
          <SectionDivider title="Customer" />

          <InfoRow label="Name" value={order.customer} />
          <InfoRow label="Phone" value={order.phone} />
          {order.email && <InfoRow label="Email" value={order.email} />}
          {order.address && (
            <InfoRow
              label="Address"
              value={
                <span style={{ fontSize: 13, lineHeight: 1.5, display: 'block', textAlign: 'right' }}>
                  {order.address}
                </span>
              }
            />
          )}

          {/* ── Items Section ── */}
          <SectionDivider title={`Items (${order.items.length})`} />

          <div className="detail-items-list">
            {order.items.map((item, idx) => (
              <div key={item.productId || idx} className="detail-item-row">
                <div className="detail-item-emoji" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 } : {}}>{item.emoji}</div>
                <div className="detail-item-info">
                  <h4>{item.name}</h4>
                  <p>Qty: {item.qty} × KSh {item.price.toFixed(2)}</p>

                </div>
                <div className="detail-item-price">KSh {(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* ── Delivery Section ── */}
          {order.delivery && (
            <>
              <SectionDivider title="Delivery" />
              <InfoRow
                label="Method"
                value={
                  <Badge
                    label={order.delivery.method === 'pickup' ? 'Pickup' : 'Delivery'}
                    color={order.delivery.method === 'pickup' ? 'var(--accent-primary)' : 'var(--info)'}
                  />
                }
              />
              {order.delivery.method === 'pickup' && order.delivery.pickupLocation && (
                <InfoRow label="Pickup Station" value={order.delivery.pickupLocation} />
              )}
              {order.delivery.method === 'delivery' && order.delivery.address && (
                <InfoRow
                  label="Delivery Address"
                  value={
                    <span style={{ fontSize: 13, lineHeight: 1.5, display: 'block', textAlign: 'right' }}>
                      {order.delivery.address}
                    </span>
                  }
                />
              )}
              {order.delivery.expectedDate && (
                <InfoRow label="Expected Date" value={order.delivery.expectedDate} />
              )}
            </>
          )}

          {/* ── Payment Section ── */}
          <SectionDivider title="Payment" />

          <InfoRow
            label="Method"
            value={
              <span>
                <i className={paymentIcon} style={{ marginRight: 6, fontSize: 14 }}></i>
                {paymentLabel}
              </span>
            }
          />
          <InfoRow label="Status" value={payText} color={payColor} />
          {order.paymentInfo?.reference && (
            <InfoRow label="Reference" value={order.paymentInfo.reference} />
          )}

          {/* ── Order Info Row ── */}
          <SectionDivider title="Order Info" />

          <InfoRow label="Order ID" value={<span style={{ fontFamily: 'monospace' }}>#{order.id}</span>} />
          <InfoRow label="Date" value={`${order.date} • ${order.time}`} />
          <InfoRow label="Source" value={order.source} />
          {order.notes && (
            <InfoRow
              label="Notes"
              value={
                <span style={{ fontSize: 13, lineHeight: 1.5, display: 'block', textAlign: 'right', maxWidth: 220 }}>
                  “{order.notes}”
                </span>
              }
            />
          )}
          {order.sendWhatsApp !== undefined && (
            <InfoRow
              label="WhatsApp"
              value={
                <Badge
                  label={order.sendWhatsApp ? 'Confirmation Sent' : 'Not Sent'}
                  color={order.sendWhatsApp ? '#25d366' : 'var(--text-muted)'}
                />
              }
            />
          )}

          {/* ── Pricing Breakdown ── */}
          <SectionDivider title="Summary" />

          <div className="detail-total-row">
            <span className="label">Subtotal</span>
            <span className="value">KSh {subtotal.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="detail-total-row">
              <span className="label">Discount ({discountPercent}%)</span>
              <span className="value" style={{ color: 'var(--success)' }}>-KSh {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="detail-total-row grand">
            <span className="label">Total</span>
            <span className="value" style={{ color: 'var(--accent-primary)', fontSize: 22 }}>
              KSh {total.toFixed(2)}
            </span>
          </div>

          {/* ── Timeline ── */}
          <SectionDivider title="Order Timeline" />

          <div className="detail-timeline">
            {timelineSteps.map((step, i) => {
              if ((order.status === 'cancelled' || order.status === 'refunded') && i > 1) return null;
              let dotClass = 'pending';
              let dotContent = '';
              if (i < statusIdx) { dotClass = 'done'; dotContent = '<i class="fas fa-check"></i>'; }
              else if (i === statusIdx && order.status !== 'cancelled' && order.status !== 'refunded') { dotClass = 'current'; dotContent = `<i class="fas ${step.icon}"></i>`; }
              else if ((order.status === 'cancelled' || order.status === 'refunded') && i === 1) { dotClass = 'current'; dotContent = order.status === 'cancelled' ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-rotate-left"></i>'; }

              let titleText = step.title;
              let subText = '';
              if ((order.status === 'cancelled' || order.status === 'refunded') && i === 1) {
                titleText = order.status === 'cancelled' ? 'Order Cancelled' : 'Order Refunded';
                subText = `${order.status === 'cancelled' ? 'Cancelled' : 'Refunded'} on ${order.date}`;
              } else if (i === 0) {
                subText = `${order.date} • ${order.time}`;
              } else if (i === 1) {
                subText = order.payment === 'paid' ? 'Payment received successfully' : 'Waiting for customer payment';
              } else if (step.title === 'Processing') {
                subText = 'Order will be prepared for shipment';
              } else if (step.title === 'Shipped') {
                subText = 'Package dispatched to customer';
              } else if (step.title === 'Delivered') {
                subText = 'Order completed successfully';
              }

              return (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${dotClass}`} dangerouslySetInnerHTML={{ __html: dotContent }} />
                  <div className="timeline-text">
                    <h4>{titleText}</h4>
                    <p>{subText}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Actions ── */}
          <div className="detail-actions" style={{ marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={onUpdateStatus}>
              <i className="fas fa-tag"></i> Update Status
            </button>
            <button className="btn btn-primary" onClick={onInvoice}>
              <i className="fas fa-file-invoice"></i> Invoice
            </button>
          </div>
          {(order.status === 'pending' || order.status === 'processing') && (
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onCancel}>
              <i className="fas fa-ban" style={{ color: 'var(--error)' }}></i>
              <span style={{ color: 'var(--error)' }}>Cancel Order</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
