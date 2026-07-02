'use client';

interface AboutSheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AboutSheet({ open, onClose, onShowToast }: AboutSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
            <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-lg)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(232,168,56,0.3)' }}>
              <i className="fas fa-bolt"></i>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>WAMORGAN</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Version 2.4.1 (Build 2841)</p>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
            {['Terms of Service', 'Privacy Policy', 'Open Source Licenses'].map((item, i) => (
              <div
                key={i}
                onClick={() => onShowToast(item, 'success')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
              >
                <h4 style={{ fontSize: 15, fontWeight: 600 }}>{item}</h4>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            &copy; 2026 WAMORGAN Inc.<br />All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
