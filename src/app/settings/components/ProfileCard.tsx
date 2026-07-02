'use client';

export default function ProfileCard({ onEditPhoto }: { onEditPhoto: () => void }) {
  return (
    <div style={{ margin: '0 20px 24px', padding: 24, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'var(--accent-gradient)', opacity: 0.15 }} />
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white', fontWeight: 700, boxShadow: '0 0 30px rgba(232,168,56,0.3)', position: 'relative', zIndex: 1 }}>A</div>
        <div onClick={onEditPhoto} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid var(--bg-elevated)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer', zIndex: 2 }}>
          <i className="fas fa-camera"></i>
        </div>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Alex Morgan</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>alex@sellflow.ai</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient-soft)', border: '1px solid var(--border-glow)', fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>
        <i className="fas fa-crown"></i> Premium Plan
      </div>
    </div>
  );
}
