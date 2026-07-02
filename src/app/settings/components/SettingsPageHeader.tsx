'use client';

interface SettingsPageHeaderProps {
  onBack: () => void;
}

export default function SettingsPageHeader({ onBack }: SettingsPageHeaderProps) {
  return (
    <div className="page-header" style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, background: 'linear-gradient(to bottom, var(--bg-primary) 80%, transparent)', zIndex: 10, backdropFilter: 'blur(12px)' }}>
      <button className="back-btn" onClick={onBack} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
        <i className="fas fa-arrow-left"></i>
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #fff 0%, #F5C76B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Settings</h1>
    </div>
  );
}
