'use client';

interface AiSheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AiSheet({ open, onClose, onShowToast }: AiSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">AI Assistant</div>
          <div className="sheet-subtitle">Personality, greeting, automation</div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personality</h4>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent-primary)' }}><i className="fas fa-face-smile"></i></div>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Tone</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Friendly & Professional</p></div>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--success)' }}><i className="fas fa-language"></i></div>
                <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Language</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>English (Default)</p></div>
                <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Greeting Message</label>
            <textarea className="form-input" defaultValue="Hi! 👋 Thanks for reaching out to WAMORGAN Store. How can I help you today?" style={{ height: 'auto', padding: '14px 16px', minHeight: 80, resize: 'none' }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Automation</h4>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {[
                { label: 'Auto-Reply to New Messages', desc: 'AI responds to first messages', active: true },
                { label: 'Order Status Inquiries', desc: 'Answer order-related questions', active: true },
                { label: 'Product Recommendations', desc: 'Suggest products to customers', active: false },
                { label: 'Business Hours Only', desc: 'Only respond during business hours', active: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div><h4 style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</p></div>
                  <div className={`toggle-switch ${item.active ? 'active' : ''}`} onClick={(e) => (e.currentTarget as HTMLElement).classList.toggle('active')} style={{ width: 44, height: 24, borderRadius: 12, background: item.active ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${item.active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <div style={{ position: 'absolute', top: 2, left: item.active ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: item.active ? 'white' : 'var(--text-muted)', transition: 'all 0.2s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => { onShowToast('AI settings saved', 'success'); onClose(); }}>
            <i className="fas fa-check"></i> Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
