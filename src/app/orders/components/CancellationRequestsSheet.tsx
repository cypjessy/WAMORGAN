'use client';

import { useState, useMemo } from 'react';

interface CancellationRequestItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: any;
  respondedAt?: any;
  responseNote?: string;
}

interface CancellationRequestsSheetProps {
  open: boolean;
  requests: CancellationRequestItem[];
  onClose: () => void;
  onApprove: (requestId: string, orderId: string) => void;
  onReject: (requestId: string, orderId: string) => void;
  isLoading?: boolean;
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(date: any): string {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getRelativeTime(date: any): string {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = Math.abs(now.getTime() - d.getTime());
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

const statusConfig = {
  pending: {
    icon: 'fa-clock',
    label: 'Pending',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    badgeBg: 'rgba(245,158,11,0.12)',
    badgeColor: '#f59e0b',
    dotColor: '#f59e0b',
  },
  approved: {
    icon: 'fa-check-circle',
    label: 'Approved',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    badgeBg: 'rgba(16,185,129,0.12)',
    badgeColor: '#10b981',
    dotColor: '#10b981',
  },
  rejected: {
    icon: 'fa-times-circle',
    label: 'Declined',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    badgeBg: 'rgba(239,68,68,0.12)',
    badgeColor: '#ef4444',
    dotColor: '#ef4444',
  },
};

const BACKGROUND_GRADIENTS = [
  'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.02) 100%)',
  'linear-gradient(135deg, rgba(236,72,153,0.04) 0%, rgba(219,39,119,0.02) 100%)',
  'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(5,150,105,0.02) 100%)',
  'linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(217,119,6,0.02) 100%)',
  'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(37,99,235,0.02) 100%)',
];

export default function CancellationRequestsSheet({
  open,
  requests,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: CancellationRequestsSheetProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);
  // Sort: pending first, then by newest
  const sortedRequests = useMemo(() => {
    const sorted = [...requests].sort((a, b) => {
      // Pending first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      // Then by date (newest first)
      const aTime = a.requestedAt?.toDate?.()?.getTime() || 0;
      const bTime = b.requestedAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    return sorted;
  }, [requests]);

  const pendingCount = useMemo(() =>
    requests.filter(r => r.status === 'pending').length,
    [requests]
  );

  if (!open) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{ maxHeight: '92vh' }}>
        {/* Handle */}
        <div className="sheet-handle"></div>

        <div className="sheet-content" style={{ paddingBottom: 40, paddingTop: 0 }}>
          {/* ── Header Section ── */}
          <div style={{
            textAlign: 'center',
            padding: '8px 20px 20px',
            background: 'linear-gradient(180deg, rgba(245,158,11,0.06) 0%, transparent 100%)',
            margin: '0 -20px 16px',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.08) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: 24, color: '#f59e0b',
              boxShadow: '0 8px 24px rgba(245,158,11,0.15)',
            }}>
              <i className="fas fa-ban"></i>
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>
              Cancellation Requests
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {pendingCount > 0
                ? `${pendingCount} request${pendingCount > 1 ? 's' : ''} awaiting your review`
                : 'All cancellation requests have been reviewed'}
            </p>
          </div>

          {/* ── Summary Stats ── */}
          {!isLoading && sortedRequests.length > 0 && (
            <div style={{
              display: 'flex', gap: 8, padding: '0 20px', marginBottom: 16,
            }}>
              {[
                { label: 'Pending', count: requests.filter(r => r.status === 'pending').length, color: '#f59e0b' },
                { label: 'Approved', count: requests.filter(r => r.status === 'approved').length, color: '#10b981' },
                { label: 'Declined', count: requests.filter(r => r.status === 'rejected').length, color: '#ef4444' },
              ].map(stat => (
                <div key={stat.label} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.count}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Loading requests...</p>
            </div>
          )}

          {/* ── Empty State ── */}
          {!isLoading && sortedRequests.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 36, color: '#10b981',
              }}>
                <i className="fas fa-check-circle"></i>
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>All Clear</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
                No cancellation requests yet. When customers request cancellations via WhatsApp, they'll appear here.
              </p>
            </div>
          )}

          {/* ── Request Cards ── */}
          {!isLoading && sortedRequests.length > 0 && (
            <div style={{ padding: '0 16px' }}>
              {sortedRequests.map((req, index) => {
                const cfg = statusConfig[req.status];
                const bgGradient = BACKGROUND_GRADIENTS[index % BACKGROUND_GRADIENTS.length];
                const isPending = req.status === 'pending';

                return (
                  <div
                    key={req.id}
                    style={{
                      marginBottom: 14,
                      borderRadius: 'var(--radius-lg)',
                      background: bgGradient,
                      border: `1px solid ${
                        isPending ? 'rgba(245,158,11,0.2)' : 'var(--border-subtle)'
                      }`,
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      ...(isPending ? {
                        boxShadow: '0 4px 20px rgba(245,158,11,0.08)',
                      } : {}),
                    }}
                  >
                    {/* Status accent bar */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0,
                      width: 3,
                      background: cfg.gradient,
                      borderTopLeftRadius: 'var(--radius-lg)',
                      borderBottomLeftRadius: 'var(--radius-lg)',
                    }} />

                    <div style={{ padding: '16px 16px 16px 20px' }}>
                      {/* Row: Order info + Status badge */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}>
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                          }}>
                            <span style={{
                              fontSize: 13, fontWeight: 800,
                              color: 'var(--accent-primary)',
                              letterSpacing: '-0.3px',
                            }}>
                              #{req.orderNumber}
                            </span>
                            <span style={{
                              width: 4, height: 4, borderRadius: '50%',
                              background: 'var(--border-subtle)',
                            }} />
                            <span style={{
                              fontSize: 11, color: 'var(--text-muted)', fontWeight: 500,
                            }}>
                              {getRelativeTime(req.requestedAt)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, flexShrink: 0,
                            }}>
                              <i className="fas fa-user" style={{ color: 'var(--text-muted)' }}></i>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {req.customerName}
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 'var(--radius-full)',
                          background: cfg.badgeBg,
                          fontSize: 11, fontWeight: 700, color: cfg.badgeColor,
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: cfg.dotColor,
                            ...(isPending ? { animation: 'blink 2s infinite' } : {}),
                          }} />
                          {cfg.label}
                        </div>
                      </div>

                      {/* Reason */}
                      <div style={{
                        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: 12,
                      }}>
                        <div style={{
                          fontSize: 10, color: 'var(--text-muted)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
                        }}>
                          <i className="fas fa-quote-left" style={{ marginRight: 4, fontSize: 9 }}></i>
                          Reason
                        </div>
                        <p style={{
                          fontSize: 13, lineHeight: 1.6,
                          color: 'var(--text-secondary)',
                        }}>
                          {req.reason || 'No reason provided'}
                        </p>
                      </div>

                      {/* Customer contact */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        marginBottom: isPending ? 12 : 0,
                      }}>
                        <i className="fas fa-phone-alt" style={{ fontSize: 11, color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {req.customerPhone}
                        </span>
                      </div>

                      {/* Pending: Approve / Reject buttons */}
                      {isPending && (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={async () => {
                              setActioningId(req.id);
                              try { await onApprove(req.id, req.orderNumber); }
                              finally { setActioningId(null); }
                            }}
                            disabled={actioningId === req.id}
                            style={{
                              flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              border: 'none', color: 'white',
                              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                              transition: 'all 0.2s ease',
                              opacity: actioningId === req.id ? 0.6 : 1,
                            }}
                          >
                            <i className={`fas ${actioningId === req.id ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                            {actioningId === req.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={async () => {
                              setActioningId(req.id);
                              try { await onReject(req.id, req.orderNumber); }
                              finally { setActioningId(null); }
                            }}
                            disabled={actioningId === req.id}
                            style={{
                              flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              border: 'none', color: 'white',
                              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              boxShadow: '0 4px 16px rgba(239,68,68,0.25)',
                              transition: 'all 0.2s ease',
                              opacity: actioningId === req.id ? 0.6 : 1,
                            }}
                          >
                            <i className={`fas ${actioningId === req.id ? 'fa-spinner fa-spin' : 'fa-times'}`}></i>
                            {actioningId === req.id ? 'Processing...' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {/* Responded info */}
                      {!isPending && req.respondedAt && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-elevated)',
                          fontSize: 11, color: 'var(--text-muted)', fontWeight: 500,
                        }}>
                          <i className={`fas ${
                            req.status === 'approved' ? 'fa-check-circle' : 'fa-times-circle'
                          }`} style={{
                            color: req.status === 'approved' ? '#10b981' : '#ef4444',
                          }} />
                          {req.status === 'approved' ? 'Approved' : 'Declined'} &middot; {formatDate(req.respondedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bottom spacing */}
              <div style={{ height: 8 }} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
