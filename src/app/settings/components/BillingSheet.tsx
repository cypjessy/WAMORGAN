'use client';

interface BillingSheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function BillingSheet({ open, onClose, onShowToast }: BillingSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Billing & Plan</div>
          <div className="sheet-subtitle">Manage your subscription and invoices</div>

          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', background: 'var(--accent-gradient-soft)', border: '1px solid var(--border-glow)', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Current Plan</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Premium Plan</h3>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)', margin: '8px 0' }}>
              KSh 29<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>/month</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Billed monthly · Cancel anytime</p>
            <div style={{ textAlign: 'left', marginBottom: 16 }}>
              {['Unlimited products & orders', 'AI assistant with custom personality', 'WhatsApp integration', 'Team members (up to 5)', 'Priority support', 'Advanced analytics'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <i className="fas fa-check" style={{ color: 'var(--success)', fontSize: 12 }}></i> {f}
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={() => onShowToast('Plan upgraded!', 'success')} style={{ height: 48, fontSize: 14 }}>
              Upgrade to Business — KSh 49/mo
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method</h4>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent-primary)' }}><i className="fas fa-credit-card"></i></div>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Visa ending in 4242</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Expires 12/28</p></div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'var(--success-soft)', color: 'var(--success)' }}>Default</span>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoices</h4>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {[
                { label: 'May 1, 2026', value: 'KSh 29.00' },
                { label: 'Apr 1, 2026', value: 'KSh 29.00' },
                { label: 'Mar 1, 2026', value: 'KSh 29.00' },
              ].map((inv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
                  <div><h4 style={{ fontSize: 14, fontWeight: 600 }}>{inv.label}</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>WAMORGAN Premium</p></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{inv.value}</span>
                    <i className="fas fa-download" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
