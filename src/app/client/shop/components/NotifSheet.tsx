'use client';

import { useState, useEffect } from 'react';
import { orderService } from '@/lib/db';

interface NotifSheetProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

const statusIcon: Record<string, string> = {
  pending: 'fa-clock',
  confirmed: 'fa-check-circle',
  processing: 'fa-box',
  shipped: 'fa-truck',
  delivered: 'fa-circle-check',
  cancelled: 'fa-xmark-circle',
  refunded: 'fa-rotate-left',
};

const statusCls: Record<string, string> = {
  pending: 'sale',
  confirmed: 'sale',
  processing: 'ship',
  shipped: 'ship',
  delivered: 'promo',
  cancelled: '',
  refunded: 'promo',
};

function timeAgo(date: any): string {
  if (!date) return '';
  const now = Date.now();
  const ms = now - (date.toMillis ? date.toMillis() : new Date(date).getTime());
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function NotifSheet({ open, onClose, userId }: NotifSheetProps) {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    if (!userId) { setLoading(false); setRecentOrders([]); return; }
    orderService.getOrders(undefined, { customerId: userId }).then(orders => {
      setRecentOrders(orders.slice(0, 10));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open, userId]);

  const unread = recentOrders.filter(o => o.status === 'pending').length;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Notifications</h3>
          <p className="sheet-subtitle">{unread} unread notifications</p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>No notifications yet</div>
          ) : (
            recentOrders.map((o, i) => (
              <div key={o.id || i} className="notif-item">
                <div className={`notif-icon ${statusCls[o.status] || 'sale'}`}>
                  <i className={`fas ${statusIcon[o.status] || 'fa-bell'}`}></i>
                </div>
                <div className="notif-text">
                  <h4>Order {o.status}</h4>
                  <p>{o.customerName} — {o.orderNumber || o.id?.slice(0, 8)} — ${o.total?.toFixed(2)}</p>
                </div>
                <span className="notif-time">{timeAgo(o.createdAt)}</span>
              </div>
            ))
          )}
          <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={onClose}>Mark All Read</button>
        </div>
      </div>
    </>
  );
}
