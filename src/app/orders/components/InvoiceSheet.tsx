'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { sendMediaMessage } from '@/lib/evolution';
import { businessProfileService } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

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
  status?: string;
}

interface InvoiceSheetProps {
  open: boolean;
  order: InvoiceOrder | null;
  onClose: () => void;
  onDownload: () => void;
  businessName?: string;
}

type SendStep = 'idle' | 'capturing' | 'uploading' | 'sending' | 'sent' | 'error';

export default function InvoiceSheet({ open, order, onClose, onDownload, businessName }: InvoiceSheetProps) {
  const { user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [instanceName, setInstanceName] = useState('');
  const [sendStep, setSendStep] = useState<SendStep>('idle');
  const [sendType, setSendType] = useState<'image' | 'document'>('image');
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSendStep('idle');
    setSendError('');
    setSendSuccess(false);
    // Fetch instance name
    businessProfileService.getProfile().then(bp => {
      if (bp?.whatsappInstanceName) setInstanceName(bp.whatsappInstanceName);
    }).catch(() => {});
  }, [open]);

  if (!order) return null;

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
  const paymentLabel = order.paymentInfo?.method || 'Credit Card';
  const payText = order.status === 'cancelled'
    ? 'Order Cancelled'
    : order.status === 'refunded'
    ? 'Order Refunded'
    : order.payment === 'paid'
    ? 'Payment Received'
    : order.payment === 'refunded'
    ? 'Payment Refunded'
    : 'Payment Pending';

  const handleSendToWhatsApp = useCallback(async () => {
    if (!order.phone) {
      setSendError('Customer has no phone number');
      setSendStep('error');
      return;
    }
    if (!instanceName) {
      setSendError('WhatsApp not connected. Connect in Settings first.');
      setSendStep('error');
      return;
    }

    setSendStep('capturing');
    setSendError('');

    try {
      // Wait a tick for the DOM to be ready
      await new Promise(r => setTimeout(r, 100));

      // Capture the invoice as a PNG image
      const node = invoiceRef.current;
      if (!node) {
        setSendError('Could not capture invoice. Try again.');
        setSendStep('error');
        return;
      }

      setSendStep('uploading');
      const dataUrl = await toPng(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `invoice-${order.id}.png`, { type: 'image/png' });

      // Upload via the API
      if (!user) {
        setSendError('You must be logged in');
        setSendStep('error');
        return;
      }

      const token = await user.getIdToken(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'invoices');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        setSendError(uploadData.error || 'Upload failed');
        setSendStep('error');
        return;
      }

      const mediaUrl = uploadData.url;

      // Send via Evolution API
      setSendStep('sending');
      const caption = `🧾 *Invoice #${order.id}*\n${businessName || 'WAMORGAN'}\n\nHi *${order.customer}*,\n\nYour invoice is attached below.\nTotal: KSh ${order.total.toFixed(2)}\nStatus: ${payText}\n\nThank you for your business! 🙏`;

      await sendMediaMessage(instanceName, order.phone, sendType, mediaUrl, caption);

      setSendStep('sent');
      setSendSuccess(true);
    } catch (err: any) {
      console.error('[InvoiceSheet] Send failed:', err);
      setSendError(err.message || 'Failed to send invoice');
      setSendStep('error');
    }
  }, [order, instanceName, sendType, businessName, payText, user]);

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          {/* Invoice content — captured as image */}
          <div ref={invoiceRef} style={{ background: '#ffffff', color: '#000000', borderRadius: 12, overflow: 'hidden' }}>
            <div className="invoice-header" style={{ borderBottom: '2px solid #e5e7eb' }}>
              <div className="invoice-logo"><i className="fas fa-bolt"></i></div>
              <h3 style={{ color: '#111', margin: 0 }}>{businessName || 'WAMORGAN'}</h3>
              <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Invoice #INV-{order.id}</p>
            </div>

            <div style={{ padding: '0 20px' }}>
              <div className="invoice-section" style={{ marginBottom: 16 }}>
                <h4 style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>Bill To</h4>
                <p style={{ color: '#374151', margin: 0, lineHeight: 1.6 }}>
                  <strong>{order.customer}</strong><br />{order.phone}
                  {order.email && <><br /><span style={{ color: '#6b7280' }}>{order.email}</span></>}
                  {order.address && <><br /><span style={{ color: '#6b7280', fontSize: 13 }}>{order.address}</span></>}
                </p>
              </div>

              <div className="invoice-section" style={{ marginBottom: 16 }}>
                <h4 style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>Invoice Details</h4>
                <p style={{ color: '#374151', margin: 0 }}>
                  Invoice #: INV-{order.id}<br />
                  Date: {order.date}<br />
                  Payment: {paymentLabel}
                </p>
              </div>

              <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>Item</th>
                    <th style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                    <th style={{ textAlign: 'right', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={item.productId || idx}>
                      <td style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                        {item.imageUrl ? (
                          <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 4, backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', verticalAlign: 'middle', marginRight: 6 }} />
                        ) : (
                          <span style={{ marginRight: 4 }}>{item.emoji}</span>
                        )}
                        {item.name}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #f3f4f6', color: '#374151', fontWeight: 700 }}>KSh {(item.price * item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals" style={{ borderTop: '2px solid #e5e7eb', paddingTop: 12, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#374151' }}>
                  <span>Subtotal ({totalQty} item{totalQty > 1 ? 's' : ''})</span>
                  <span>KSh {subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #e5e7eb', marginTop: 8, fontSize: 18, fontWeight: 800 }}>
                  <span>Total</span>
                  <span style={{ color: '#059669' }}>KSh {order.total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{
                textAlign: 'center', marginTop: 16, padding: 14,
                borderRadius: 8,
                background: order.status === 'cancelled' || order.status === 'refunded'
                  ? '#fef2f2'
                  : order.payment === 'paid'
                  ? '#ecfdf5'
                  : '#fffbeb',
              }}>
                <i className={`fas ${
                  order.status === 'cancelled' || order.status === 'refunded'
                    ? 'fa-ban'
                    : order.payment === 'paid'
                    ? 'fa-check-circle'
                    : 'fa-clock'
                }`}
                  style={{
                    color: order.status === 'cancelled' || order.status === 'refunded'
                      ? '#ef4444'
                      : order.payment === 'paid'
                      ? '#10b981'
                      : '#f59e0b',
                    fontSize: 22, marginBottom: 6, display: 'block',
                  }}></i>
                <p style={{
                  color: order.status === 'cancelled' || order.status === 'refunded'
                    ? '#dc2626'
                    : order.payment === 'paid'
                    ? '#059669'
                    : '#d97706',
                  fontWeight: 700, fontSize: 13, margin: 0,
                }}>{payText}</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>
                  {order.status === 'cancelled'
                    ? 'This order has been cancelled'
                    : order.status === 'refunded'
                    ? 'This order has been refunded'
                    : order.payment === 'paid'
                    ? `Paid via ${paymentLabel} on ${order.date}`
                    : 'Awaiting payment confirmation'}
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Send Section */}
          <div style={{
            marginTop: 20, padding: 16,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(37,211,102,0.06) 0%, rgba(37,211,102,0.02) 100%)',
            border: '1px solid rgba(37,211,102,0.15)',
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fab fa-whatsapp" style={{ color: '#25d366' }}></i>
              Send Invoice to Customer
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Send this invoice to {order.customer} via WhatsApp
            </p>

            {/* Document type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                onClick={() => setSendType('image')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                  background: sendType === 'image' ? 'rgba(37,211,102,0.12)' : 'var(--bg-elevated)',
                  border: `1.5px solid ${sendType === 'image' ? 'rgba(37,211,102,0.3)' : 'var(--border-subtle)'}`,
                  color: sendType === 'image' ? '#25d366' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fas fa-image" style={{ fontSize: 18 }}></i>
                Send as Image
                <span style={{ fontSize: 10, fontWeight: 500, color: sendType === 'image' ? 'rgba(37,211,102,0.7)' : 'var(--text-muted)' }}>
                  Customer sees a photo
                </span>
              </button>
              <button
                onClick={() => setSendType('document')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                  background: sendType === 'document' ? 'rgba(37,211,102,0.12)' : 'var(--bg-elevated)',
                  border: `1.5px solid ${sendType === 'document' ? 'rgba(37,211,102,0.3)' : 'var(--border-subtle)'}`,
                  color: sendType === 'document' ? '#25d366' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fas fa-file-pdf" style={{ fontSize: 18 }}></i>
                Send as Document
                <span style={{ fontSize: 10, fontWeight: 500, color: sendType === 'document' ? 'rgba(37,211,102,0.7)' : 'var(--text-muted)' }}>
                  Customer can download
                </span>
              </button>
            </div>

            {/* Send button / Status */}
            {sendStep === 'idle' && (
              <button
                onClick={handleSendToWhatsApp}
                disabled={!order.phone || !instanceName}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #25d366 0%, #1da851 100%)',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                  opacity: (!order.phone || !instanceName) ? 0.5 : 1,
                }}
              >
                <i className="fab fa-whatsapp"></i>
                {!order.phone ? 'No phone number' : !instanceName ? 'WhatsApp not connected' : 'Send to WhatsApp'}
              </button>
            )}

            {sendStep === 'capturing' && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <i className="fas fa-camera fa-spin" style={{ marginRight: 6 }}></i>
                Capturing invoice...
              </div>
            )}

            {sendStep === 'uploading' && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <i className="fas fa-cloud-upload-alt fa-spin" style={{ marginRight: 6 }}></i>
                Uploading image...
              </div>
            )}

            {sendStep === 'sending' && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <i className="fab fa-whatsapp fa-spin" style={{ marginRight: 6, color: '#25d366' }}></i>
                Sending to {order.customer}...
              </div>
            )}

            {sendStep === 'sent' && (
              <div style={{
                padding: '12px', textAlign: 'center', fontSize: 13,
                color: '#10b981', fontWeight: 700,
                background: 'rgba(16,185,129,0.08)',
                borderRadius: 'var(--radius-md)',
              }}>
                <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>
                Invoice sent successfully via WhatsApp! 🎉
              </div>
            )}

            {sendStep === 'error' && (
              <div style={{
                padding: '12px', textAlign: 'center', fontSize: 12,
                color: '#ef4444',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 10,
              }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }}></i>
                {sendError}
              </div>
            )}

            {(sendStep === 'error' || sendStep === 'sent') && (
              <button
                onClick={() => setSendStep('idle')}
                style={{
                  width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer', marginTop: 8,
                }}
              >
                {sendStep === 'sent' ? 'Send Again' : 'Try Again'}
              </button>
            )}
          </div>

          <div className="detail-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              <i className="fas fa-times"></i> Close
            </button>
            <button className="btn btn-primary" onClick={onDownload} style={{ flex: 1 }}>
              <i className="fas fa-download"></i> Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
