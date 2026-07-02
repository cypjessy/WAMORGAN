'use client';

import { useRouter } from 'next/navigation';

interface FabSheetProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const actions = [
  { icon: 'fa-comment-dots', label: 'New Chat', desc: 'Start a conversation', route: '/client/messages', color: 'var(--accent-primary)' },
  { icon: 'fa-cart-plus', label: 'New Order', desc: 'Browse and order products', route: '/client/shop', color: 'var(--success)' },
  { icon: 'fa-qrcode', label: 'Scan Product', desc: 'Scan barcode to look up', route: '/client/search', color: 'var(--warning)' },
  { icon: 'fa-right-from-bracket', label: 'Logout', desc: 'Sign out of your account', route: null, color: 'var(--error)' },
];

export default function FabSheet({ open, onClose, onLogout }: FabSheetProps) {
  const router = useRouter();

  const handleAction = (action: typeof actions[0]) => {
    if (action.route) {
      onClose();
      router.push(action.route);
    } else {
      onClose();
      setTimeout(() => onLogout(), 300);
    }
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Quick Actions</h3>
          <p className="sheet-subtitle">Choose an action to get started</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(action)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: 14, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.2s ease', width: '100%',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: `${action.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: action.color, flexShrink: 0,
                }}>
                  <i className={`fas ${action.icon}`}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{action.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{action.desc}</div>
                </div>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 12 }}></i>
              </button>
            ))}
          </div>

          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ marginTop: 16, width: '100%' }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
