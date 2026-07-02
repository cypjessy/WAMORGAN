'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from './CustomerItem';
import { segmentConfig } from './CustomerItem';
import { orderService, customerService, businessProfileService } from '@/lib/db';
import { sendMessage } from '@/lib/evolution';

interface OrderBrief {
  id: string;
  items: Array<{ name: string; emoji?: string; imageUrl?: string }>;
  total: number;
  status: string;
  date: string;
}

interface CustomerProfileSheetProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CustomerProfileSheet({
  open,
  customer,
  onClose,
  onEdit,
  onDelete,
}: CustomerProfileSheetProps) {
  const [instanceName, setInstanceName] = useState('wamorgan-instance-01');
  const [orders, setOrders] = useState<OrderBrief[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    businessProfileService.getProfile().then(bp => {
      if (bp?.whatsappInstanceName) setInstanceName(bp.whatsappInstanceName);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open || !customer) return;
    setNotes(customer.notes || '');
    setLoadingOrders(true);
    orderService.getOrders().then(all => {
      const customerOrders = all
        .filter(o => o.customerPhone === customer.phone || o.customerName === customer.name)
        .slice(0, 10)
        .map(o => ({
          id: o.orderNumber || o.id,
          items: (o.items || []).map(i => ({ name: i.name, emoji: i.imageUrl ? '' : '📦', imageUrl: i.imageUrl || '' })),
          total: o.total,
          status: o.status,
          date: o.createdAt?.toDate?.()?.toLocaleDateString() || '',
        }));
      setOrders(customerOrders);
    }).catch(() => {}).finally(() => setLoadingOrders(false));
  }, [open, customer]);

  const handleSaveNotes = useCallback(async () => {
    if (!customer) return;
    setSavingNotes(true);
    try {
      await customerService.updateCustomer(customer.id, { notes });
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
    setSavingNotes(false);
  }, [customer, notes]);

  if (!customer) return null;

  const cfg = segmentConfig[customer.segment];

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          {/* Profile Hero */}
          <div className="profile-hero">
            <div className={`profile-avatar-lg ${cfg.color}`}>
              <span>{customer.initials || customer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>
              {customer.segment === 'vip' && (
                <div className="vip-crown-lg"><i className="fas fa-crown"></i></div>
              )}
            </div>
            <h3>{customer.name}</h3>
            {customer.email && <p>{customer.email}</p>}
            <span className={`customer-tag ${cfg.tag}`}>{cfg.label}</span>
          </div>

          {/* Actions */}
          <div className="profile-actions-row">
            <button className="profile-action-btn" onClick={() => customer.phone && sendMessage(instanceName, customer.phone, '')}>
              <i className="fab fa-whatsapp" style={{ color: '#25d366' }}></i> WhatsApp
            </button>
            <button className="profile-action-btn" onClick={() => customer.email && window.open(`mailto:${customer.email}`)}>
              <i className="fas fa-envelope"></i> Email
            </button>
            <button className="profile-action-btn" onClick={() => customer.phone && window.open(`tel:${customer.phone}`)}>
              <i className="fas fa-phone"></i> Call
            </button>
          </div>

          {/* Stats */}
          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="profile-stat-value" style={{ color: 'var(--accent-primary)' }}>
                ${customer.spent.toLocaleString()}
              </div>
              <div className="profile-stat-label">Total Spent</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value" style={{ color: 'var(--success)' }}>
                {customer.orders}
              </div>
              <div className="profile-stat-label">Orders</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value" style={{ color: 'var(--info)' }}>
                ${customer.avg}
              </div>
              <div className="profile-stat-label">Avg Order</div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="profile-section-title">Contact Information</div>
          <div className="profile-contact-section">
            {customer.phone && (
              <div className="contact-info-row">
                <div className="contact-icon"><i className="fas fa-phone"></i></div>
                <div className="contact-text">
                  <h4>Phone</h4>
                  <p>{customer.phone}</p>
                </div>
                <button className="contact-copy" onClick={() => customer.phone && navigator.clipboard.writeText(customer.phone!)}>Copy</button>
              </div>
            )}
            {customer.email && (
              <div className="contact-info-row">
                <div className="contact-icon"><i className="fas fa-envelope"></i></div>
                <div className="contact-text">
                  <h4>Email</h4>
                  <p>{customer.email}</p>
                </div>
                <button className="contact-copy" onClick={() => customer.email && navigator.clipboard.writeText(customer.email!)}>Copy</button>
              </div>
            )}
            {customer.address && (
              <div className="contact-info-row">
                <div className="contact-icon"><i className="fas fa-location-dot"></i></div>
                <div className="contact-text">
                  <h4>Address</h4>
                  <p>{customer.address}</p>
                </div>
              </div>
            )}
            {customer.whatsapp && (
              <div className="contact-info-row">
                <div className="contact-icon"><i className="fab fa-whatsapp"></i></div>
                <div className="contact-text">
                  <h4>WhatsApp</h4>
                  <p>{customer.whatsapp}</p>
                </div>
                <button className="contact-copy" onClick={() => customer.whatsapp && navigator.clipboard.writeText(customer.whatsapp!)}>Copy</button>
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="profile-section-title">Order History</div>
          <div className="profile-order-history-section">
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                No orders found for this customer
              </div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="order-history-item">
                  <div className="order-history-img" style={o.items[0]?.imageUrl ? { backgroundImage: `url(${o.items[0].imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 } : {}}>{o.items[0]?.imageUrl ? '' : '📦'}</div>
                  <div className="order-history-info">
                    <h4>{o.items[0]?.name || 'Order'} {o.items.length > 1 && `+${o.items.length - 1} more`}</h4>
                    <p>{o.date} &bull; #{o.id}</p>
                  </div>
                  <div>
                    <div className="order-history-price">KSh {o.total.toFixed(2)}</div>
                    <div className={`order-history-status status-${o.status}`}>{o.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <div className="profile-section-title">Notes</div>
          <textarea
            className="notes-area"
            placeholder="Add notes about this customer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Actions */}
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSaveNotes} disabled={savingNotes}>
            <i className="fas fa-check"></i> {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
          <button className="btn btn-ghost" style={{ marginTop: '10px' }} onClick={() => { onEdit(customer.id); onClose(); }}>
            <i className="fas fa-pen"></i> Edit Customer
          </button>
          <button className="btn btn-ghost" style={{ marginTop: '10px' }} onClick={() => { onDelete(customer.id); onClose(); }}>
            <i className="fas fa-trash" style={{ color: 'var(--error)' }}></i>
            <span style={{ color: 'var(--error)' }}>Delete Customer</span>
          </button>
        </div>
      </div>
    </>
  );
}
