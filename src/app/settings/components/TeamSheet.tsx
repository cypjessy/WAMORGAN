'use client';

interface TeamSheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function TeamSheet({ open, onClose, onShowToast }: TeamSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Team Members</div>
          <div className="sheet-subtitle">Manage access & permissions</div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {[
                { name: 'Alex Morgan', role: 'Owner', initial: 'A', active: true, color: 'var(--accent-gradient)' },
                { name: 'Sarah Chen', role: 'Admin', initial: 'S', active: true, color: 'var(--success-soft)' },
                { name: 'Mike Johnson', role: 'Staff', initial: 'M', active: false, color: 'var(--warning-soft)' },
              ].map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>{member.initial}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700 }}>{member.name}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{member.role}</p>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: member.active ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => onShowToast('Invite sent!', 'success')} style={{ flex: 1 }}>
              <i className="fas fa-user-plus"></i> Invite Member
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
