'use client';

interface SettingsToggleRowProps {
  icon: string;
  iconClass: string;
  label: string;
  description: string;
  defaultActive?: boolean;
}

export default function SettingsToggleRow({ icon, iconClass, label, description, defaultActive = false }: SettingsToggleRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
        <div className={`menu-item-icon ${iconClass}`} style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          <i className={icon}></i>
        </div>
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 600 }}>{label}</h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{description}</p>
        </div>
      </div>
      <div
        className={`toggle-switch ${defaultActive ? 'active' : ''}`}
        onClick={(e) => (e.currentTarget as HTMLElement).classList.toggle('active')}
        style={{ width: 50, height: 28, borderRadius: 'var(--radius-full)', background: defaultActive ? 'var(--accent-primary)' : 'var(--bg-card)', border: `2px solid ${defaultActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.25s ease', flexShrink: 0 }}
      >
        <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'white', top: 2, left: defaultActive ? 24 : 2, transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}
