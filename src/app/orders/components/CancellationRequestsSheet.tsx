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

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

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

export default function CancellationRequestsSheet({
  open,
  requests,
  onClose,
  onApprove,
  onReject,
  isLoading = false,
}: CancellationRequestsSheetProps) {
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  const counts = useMemo(() => {
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      all: requests.length,
    };
  }, [requests]);

  const handleApprove = async (req: CancellationRequestItem) => {
    setActioningId(req.id);
    try {
      await onApprove(req.id, req.orderNumber);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (req: CancellationRequestItem) => {
    setActioningId(req.id);
    try {
      await onReject(req.id, req.orderNumber);
    } finally {
      setActioningId(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle"></div>
        <div className="sheet-content" style={{ paddingBottom: 40 }}>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--warning-soft)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px', fontSize: 20, color: 'var(--warning)',
            }}>
              <i className="fas fa-ban"></i>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Cancellation Requests</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Review and manage customer cancellation requests
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: '0 20px', overflowX: 'auto' }}>
            {(['pending', 'approved', 'rejected', 'all'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  background: filter === tab ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
                  border: filter === tab ? 'none' : '1.5px solid var(--border-subtle)',
                  color: filter === tab ? 'white' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <i className={`fas ${tab === 'pending' ? 'fa-clock' : tab === 'approved' ? 'fa-check' : tab === 'rejected' ? 'fa-times' : 'fa-list'}`}></i>
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {counts[tab] > 0 && (
                  <span style={{
                    padding: '1px 7px', borderRadius: 'var(--radius-full)',
                    background: filter === tab ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                    fontSize: 10, fontWeight: 700,
                  }}>{counts[tab]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading requests...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredRequests.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📭</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No {filter !== 'all' ? filter : ''} requests</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {filter === 'pending'
                  ? 'No pending cancellation requests. Great!'
                  : filter === 'approved'
                  ? 'No approved requests yet.'
                  : filter === 'rejected'
                  ? 'No rejected requests.'
                  : 'No cancellation requests have been submitted.'}
              </p>
            </div>
          )}

          {/* Request List */}
          {!isLoading && filteredRequests.length > 0 && (
            <div style={{ padding: '0 20px' }}>
              {filteredRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isActioning = actioningId === req.id;

                return (
                  <div key={req.id} style={{
                    padding: 16, marginBottom: 12, borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-elevated)',
                    border: `1.5px solid ${
                      req.status === 'pending' ? 'var(--warning)' :
                      req.status === 'approved' ? 'var(--success)' :
                      'var(--error)'
                    }`,
                    opacity: isPending ? 1 : 0.7,
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h5 style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-primary)' }}>
                          {req.orderNumber}
                        </h5>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatDate(req.requestedAt)} at {formatTime(req.requestedAt)}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 10px', borderRadius: 'var(--radius-full)',
                        background: req.status === 'pending' ? 'var(--warning-soft)' :
                                    req.status === 'approved' ? 'var(--success-soft)' :
                                    'var(--error-soft)',
                        color: req.status === 'pending' ? 'var(--warning)' :
                               req.status === 'approved' ? 'var(--success)' :
                               'var(--error)',
                        fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                      }}>
                        <i className={`fas ${
                          req.status === 'pending' ? 'fa-clock' :
                          req.status === 'approved' ? 'fa-check' : 'fa-times'
                        }`} style={{ marginRight: 4 }}></i>
                        {req.status === 'pending' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Customer</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{req.customerName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{req.customerPhone}</div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Reason</div>
                      <div style={{
                        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)', fontSize: 13, lineHeight: 1.5,
                        color: 'var(--text-secondary)',
                      }}>
                        {req.reason || 'No reason provided'}
                      </div>
                    </div>

                    {/* Actions for pending */}
                    {isPending && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={isActioning}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--success), #059669)',
                            border: 'none', color: 'white', fontSize: 13, fontWeight: 700,
                            fontFamily: 'inherit', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            opacity: isActioning ? 0.6 : 1,
                          }}
                        >
                          <i className={`fas ${isActioning ? 'fa-spinner fa-spin' : 'fa-check'}`}></i>
                          {isActioning ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          disabled={isActioning}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--error), #dc2626)',
                            border: 'none', color: 'white', fontSize: 13, fontWeight: 700,
                            fontFamily: 'inherit', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            opacity: isActioning ? 0.6 : 1,
                          }}
                        >
                          <i className="fas fa-times"></i>
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Responded info for non-pending */}
                    {!isPending && req.respondedAt && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                        <i className={`fas ${req.status === 'approved' ? 'fa-check-circle' : 'fa-times-circle'}`}
                          style={{ color: req.status === 'approved' ? 'var(--success)' : 'var(--error)', marginRight: 4 }}></i>
                        {req.status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(req.respondedAt)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ height: 20 }}></div>
        </div>
      </div>
    </>
  );
}
