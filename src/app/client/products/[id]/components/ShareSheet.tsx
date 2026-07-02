'use client';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  onShare: (method: string) => void;
}

export default function ShareSheet({ open, onClose, onShare }: ShareSheetProps) {
  const shareMethods = [
    { icon: 'fab fa-whatsapp', label: 'WhatsApp', style: { background: 'rgba(37,211,102,0.15)', color: '#25d366' } },
    { icon: 'fas fa-link', label: 'Copy Link', style: { background: 'var(--info-soft)', color: 'var(--info)' } },
    { icon: 'fas fa-message', label: 'Message', style: { background: 'var(--success-soft)', color: 'var(--success)' } },
    { icon: 'fas fa-ellipsis', label: 'More', style: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' } },
  ];

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Share Product</h3>
          <p className="sheet-subtitle">Share this deal with friends</p>
          <div className="share-grid">
            {shareMethods.map((m) => (
              <div key={m.label} className="share-item" onClick={() => { onShare(m.label); onClose(); }}>
                <div className="share-icon" style={m.style}><i className={m.icon}></i></div>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}
