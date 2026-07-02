'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  type: 'order' | 'payment' | 'customer' | 'message' | 'alert' | 'system';
  title: string;
  description: string;
  details: string;
  time: string;
  timestamp: Date;
  unread: boolean;
}

interface RecentActivityProps {
  maxItems?: number;
  refreshTrigger?: number;
  orders?: Order[];
}

// ─── Activity Type Config ────────────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; bgClass: string }> = {
  order:    { icon: 'fa-bag-shopping',    color: 'var(--accent-primary)', bgClass: 'rgba(232,168,56,0.15)' },
  payment:  { icon: 'fa-credit-card',     color: 'var(--success)',       bgClass: 'rgba(16,185,129,0.15)' },
  customer: { icon: 'fa-user-plus',       color: 'var(--info)',          bgClass: 'rgba(59,130,246,0.15)' },
  message:  { icon: 'fa-comment',         color: 'var(--whatsapp)',      bgClass: 'rgba(37,211,102,0.15)' },
  alert:    { icon: 'fa-triangle-exclamation', color: 'var(--warning)',  bgClass: 'rgba(245,158,11,0.15)' },
  system:   { icon: 'fa-gear',            color: 'var(--text-muted)',    bgClass: 'rgba(100,116,139,0.15)' },
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

function ShimmerRow() {
  return (
    <div className="activity-row" style={{ padding: '16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="activity-row-inner" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)', flexShrink: 0,
          animation: 'shimmer 1.5s ease-in-out infinite',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            width: '60%', height: 14, borderRadius: 6,
            background: 'var(--bg-elevated)', marginBottom: 8,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }} />
          <div style={{
            width: '80%', height: 11, borderRadius: 6,
            background: 'var(--bg-elevated)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state show" style={{ padding: '32px 16px' }}>
      <div className="empty-icon" style={{ width: 56, height: 56, fontSize: 24, marginBottom: 14 }}>
        <i className="fas fa-clock-rotate-left"></i>
      </div>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>No recent activity</h3>
      <p style={{ fontSize: 13, marginBottom: 0 }}>Activities will appear here as they happen</p>
    </div>
  );
}

interface ActivityRowProps {
  item: ActivityItem;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

function ActivityRow({ item, isExpanded, onToggle }: ActivityRowProps) {
  const config = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.system;

  return (
    <div
      className={`activity-row ${isExpanded ? 'expanded' : ''}`}
      onClick={() => onToggle(item.id)}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: item.unread ? 'rgba(232,168,56,0.03)' : 'transparent',
        position: 'relative',
      }}
    >
      {/* Unread indicator dot */}
      {item.unread && (
        <div style={{
          position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
          width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)',
        }} />
      )}

      <div className="activity-row-inner" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: config.bgClass, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16, color: config.color,
          flexShrink: 0, marginTop: 2,
        }}>
          <i className={`fas ${config.icon}`}></i>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <h4 style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {item.title}
            </h4>
            <span style={{
              fontSize: 11, color: 'var(--text-muted)', fontWeight: 500,
              flexShrink: 0, marginLeft: 8,
            }}>
              {item.time}
            </span>
          </div>
          <p style={{
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.description}
          </p>

          {/* Expanded Details */}
          {isExpanded && (
            <div
              className="activity-details"
              style={{
                marginTop: 10, padding: 12, borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}
            >
              {item.details}
            </div>
          )}
        </div>

        {/* Expand chevron */}
        <div style={{
          flexShrink: 0, color: 'var(--text-muted)', fontSize: 12,
          transition: 'transform 0.2s ease', marginTop: 14,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <i className="fas fa-chevron-down"></i>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function deriveActivities(orders: Order[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const order of orders) {
    const ts = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());
    const diff = Date.now() - ts.getTime();
    const mins = Math.floor(diff / 60000);
    let timeStr = '';
    if (mins < 1) timeStr = 'just now';
    else if (mins < 60) timeStr = `${mins}m ago`;
    else if (mins < 1440) timeStr = `${Math.floor(mins / 60)}h ago`;
    else timeStr = `${Math.floor(mins / 1440)}d ago`;

    const itemNames = order.items?.map(i => i.name).join(', ') || 'Order';
    items.push({
      id: order.id,
      type: order.status === 'delivered' ? 'payment' : 'order',
      title: order.status === 'delivered' ? 'Order Completed' : order.status === 'cancelled' ? 'Order Cancelled' : 'New Order Received',
      description: `${itemNames} — KSh ${order.total.toFixed(2)} from ${order.customerName}`,
      details: `Customer: ${order.customerName}\nPhone: ${order.customerPhone}\nStatus: ${order.status}\nItems: ${order.items?.length || 0}\nTotal: KSh ${order.total.toFixed(2)}`,
      time: timeStr,
      timestamp: ts,
      unread: order.status === 'pending' || order.status === 'processing',
    });
  }
  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export default function RecentActivity({ maxItems = 5, refreshTrigger = 0, orders }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Derive from orders
  useEffect(() => {
    setLoading(true);
    // simulate a small delay for smooth transition
    const timer = setTimeout(() => {
      const derived = orders ? deriveActivities(orders).slice(0, maxItems) : [];
      setActivities(derived);
      setUnreadCount(derived.filter(a => a.unread).length);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [maxItems, refreshTrigger, orders]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div
      className="activity-card"
      style={{
        margin: '0 20px 24px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        transition: 'all 0.5s ease-out',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="section-title" style={{ fontSize: 15 }}>Recent Activity</span>
          {unreadCount > 0 && (
            <span style={{
              padding: '2px 10px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-gradient-soft)', color: 'var(--accent-primary)',
              fontSize: 11, fontWeight: 700,
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <span className="section-action" style={{ fontSize: 12 }}>
          View All <i className="fas fa-arrow-right" style={{ fontSize: 10 }}></i>
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <>
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
        </>
      ) : activities.length === 0 ? (
        <EmptyState />
      ) : (
        activities.map((item) => (
          <ActivityRow
            key={item.id}
            item={item}
            isExpanded={expandedIds.has(item.id)}
            onToggle={handleToggle}
          />
        ))
      )}
    </div>
  );
}
