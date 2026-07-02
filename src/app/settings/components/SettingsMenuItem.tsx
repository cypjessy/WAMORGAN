'use client';

interface SettingsMenuItemProps {
  icon: string;
  iconClass: string;
  label: string;
  description: string;
  value?: string;
  valueColor?: string;
  onClick: () => void;
}

export default function SettingsMenuItem({ icon, iconClass, label, description, value, valueColor, onClick }: SettingsMenuItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseDown={(e) => {
        const target = e.currentTarget;
        target.style.background = 'var(--bg-card-hover)';
        const reset = () => { target.style.background = ''; };
        setTimeout(reset, 150);
      }}
    >
      <div className={`menu-item-icon ${iconClass}`} style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        <i className={icon}></i>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: 15, fontWeight: 600 }}>{label}</h4>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{description}</p>
      </div>
      {value && (
        <span style={{ fontSize: 14, color: valueColor || 'var(--text-secondary)', fontWeight: 600, marginRight: 8 }}>{value}</span>
      )}
      <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
    </div>
  );
}
