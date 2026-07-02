'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

const moreItems = [
  { icon: 'fa-clipboard-list', label: 'Orders', color: '#E8A838', desc: 'Manage customer orders', route: '/orders' },
  { icon: 'fa-gear', label: 'Settings', color: '#f59e0b', desc: 'App & account settings', route: '/settings' },
  { icon: 'fa-users', label: 'Customers', color: '#3b82f6', desc: 'Customer management', route: '/customers' },
];

export default function MoreSheet({ open, onClose }: MoreSheetProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleItemClick = (item: typeof moreItems[0]) => {
    if (item.route) {
      onClose();
      setTimeout(() => router.push(item.route), 300);
    } else {
      onClose();
    }
  };

  const handleLogout = async () => {
    setConfirmOpen(false);
    onClose();
    setTimeout(() => router.push('/'), 500);
    await logout();
  };

  return (
    <>
      {/* Overlay */}
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      {/* Sheet */}
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content" style={{ paddingBottom: '40px' }}>
          <div className="sheet-title">More</div>
          <div className="sheet-subtitle">All your tools in one place</div>

          <div className="more-grid">
            {moreItems.map((item, i) => (
              <div
                key={i}
                className="more-grid-item"
                onClick={() => handleItemClick(item)}
              >
                <div className="more-grid-icon" style={{ background: `${item.color}15`, color: item.color }}>
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <span className="more-grid-label">{item.label}</span>
                <span className="more-grid-desc">{item.desc}</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
            <div
              onClick={() => setConfirmOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                transition: 'all 0.2s ease', color: 'var(--error)',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                <i className="fas fa-right-from-bracket"></i>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Log Out</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, fontWeight: 500 }}>Sign out of your account</p>
              </div>
              <i className="fas fa-chevron-right" style={{ fontSize: 12, opacity: 0.4 }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog (outside bottom-sheet to avoid transform breaking position:fixed) */}
      {confirmOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: 24, width: '100%', maxWidth: 340,
            textAlign: 'center',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--warning-soft)', color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 28,
            }}>
              <i className="fas fa-right-from-bracket"></i>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Log Out?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to sign out of your account?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)} style={{ flex: 1, height: 48, fontSize: 15 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleLogout}
                style={{ flex: 1, height: 48, fontSize: 15, background: 'var(--error)', boxShadow: '0 4px 24px rgba(239,68,68,0.3)' }}>
                <i className="fas fa-right-from-bracket"></i> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
