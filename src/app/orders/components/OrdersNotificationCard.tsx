'use client';

import { useMemo } from 'react';

interface NotificationItem {
  id: string;
  type: 'cancellation' | 'new_order';
  orderNumber: string;
  customerName: string;
  time: string;
  amount?: number;
}

interface OrdersNotificationCardProps {
  pendingCancellations: number;
  newOrders: number;
  recentNotifications: NotificationItem[];
  onCancellationsClick: () => void;
  onOrderClick: (orderId: string) => void;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function OrdersNotificationCard({
  pendingCancellations,
  newOrders,
  recentNotifications,
  onCancellationsClick,
  onOrderClick,
}: OrdersNotificationCardProps) {
  const hasAlerts = pendingCancellations > 0 || newOrders > 0;
  const totalAlerts = pendingCancellations + newOrders;

  if (!hasAlerts) return null;

  const displayItems = useMemo(() => {
    // Show max 3 items
    return recentNotifications.slice(0, 3);
  }, [recentNotifications]);

  return (
    <div style={{ padding: '0 20px', marginBottom: 16 }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
          overflow: 'hidden',
          padding: '16px 16px 14px',
        }}
      >
        {/* Premium glow effect */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: 'var(--accent-primary)',
              }}
            >
              <i className="fas fa-bell"></i>
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Updates</span>
              <span
                style={{
                  marginLeft: 8,
                  padding: '1px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--accent-primary), #d4762a)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {totalAlerts} new
              </span>
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            <i className="fas fa-circle" style={{ fontSize: 6, color: 'var(--accent-primary)', marginRight: 4, verticalAlign: 'middle' }}></i>
            Live
          </span>
        </div>

        {/* Alert tiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Pending cancellations */}
          {pendingCancellations > 0 && (
            <button
              onClick={onCancellationsClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.15)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--warning-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: 'var(--warning)',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <i className="fas fa-ban"></i>
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--warning)',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 2px 6px rgba(245,158,11,0.4)',
                  }}
                >
                  {pendingCancellations}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Cancellation{pendingCancellations > 1 ? 's' : ''} Requested</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {pendingCancellations} pending — tap to review
                </div>
              </div>
              <i className="fas fa-chevron-right" style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          )}

          {/* New unprocessed orders */}
          {newOrders > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--info-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: 'var(--info)',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <i className="fas fa-cart-plus"></i>
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--info)',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 2px 6px rgba(59,130,246,0.4)',
                  }}
                >
                  {newOrders}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>New Orders — Not Processed</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {newOrders} order{newOrders > 1 ? 's' : ''} awaiting processing
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(59,130,246,0.15)',
                  color: 'var(--info)',
                  flexShrink: 0,
                  animation: 'pulse-badge 2s infinite',
                }}
              >
                <i className="fas fa-hourglass-half" style={{ marginRight: 3, fontSize: 9 }}></i>
                Action
              </span>
            </div>
          )}

          {/* Recent notification items */}
          {displayItems.length > 0 && (
            <div
              style={{
                marginTop: 4,
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {displayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'new_order') onOrderClick(item.orderNumber);
                    if (item.type === 'cancellation') onCancellationsClick();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: item.type === 'cancellation' ? 'var(--warning)' : 'var(--info)',
                      flexShrink: 0,
                      animation: item.type === 'cancellation' ? 'blink 2s infinite' : 'none',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.type === 'cancellation' ? '🚫 ' : '🆕 '}
                      {item.customerName}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                      {item.type === 'cancellation' ? 'wants to cancel' : 'placed an order'}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {timeAgo(item.time)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
