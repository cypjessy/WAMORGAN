'use client';

interface SecuritySheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SecuritySheet({ open, onClose }: SecuritySheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Security</div>
          <div className="sheet-subtitle">Password, 2FA, and biometric settings</div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</h4>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--info)' }}><i className="fas fa-key"></i></div>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Change Password</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Update your account password</p></div>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--success)' }}><i className="fas fa-shield-halved"></i></div>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Two-Factor Authentication</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Add an extra layer of security</p></div>
                <div style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>Off</div>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Biometric</h4>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent-primary)' }}><i className="fas fa-fingerprint"></i></div>
                  <div><h4 style={{ fontSize: 15, fontWeight: 600 }}>Face ID / Fingerprint</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Quick access with biometrics</p></div>
                </div>
                <div className="toggle-switch active" onClick={(e) => (e.currentTarget as HTMLElement).classList.toggle('active')} style={{ width: 50, height: 28, borderRadius: 'var(--radius-full)', background: 'var(--accent-primary)', border: '2px solid var(--accent-primary)', position: 'relative', cursor: 'pointer', transition: 'all 0.25s ease', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'white', top: 2, left: 24, transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Sessions</h4>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className="fas fa-display"></i></div>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 14, fontWeight: 600 }}>MacBook Pro — Safari</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Active now · San Francisco, CA</p></div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'var(--success-soft)', color: 'var(--success)' }}>Current</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className="fas fa-mobile-screen"></i></div>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 14, fontWeight: 600 }}>iPhone 16 Pro</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>2 hours ago · New York, NY</p></div>
                <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600, cursor: 'pointer' }}>Revoke</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
