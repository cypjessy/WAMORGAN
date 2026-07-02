'use client';

interface PermissionsStepProps {
  notifEnabled: boolean;
  locationEnabled: boolean;
  onToggleNotif: () => void;
  onToggleLocation: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
  onBack: () => void;
}

export default function PermissionsStep({
  notifEnabled, locationEnabled, onToggleNotif, onToggleLocation, onTerms, onPrivacy, onBack,
}: PermissionsStepProps) {
  return (
    <div>
      <div className="page-header" style={{ paddingTop: 60 }}>
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Stay Updated</h2>
      </div>

      <div className="steps-bar" style={{ marginBottom: 32, padding: '0 24px' }}>
        <div className="step-line active"></div>
        <div className="step-dot active"></div>
        <div className="step-line active"></div>
        <div className="step-dot active"></div>
        <div className="step-line active"></div>
        <div className="step-dot active"></div>
      </div>

      <div style={{ marginBottom: 24, padding: '0 20px' }}>
        <div className="setup-card" style={{ marginBottom: 12 }} onClick={onToggleNotif}>
          <div className="setup-card-icon"><i className="fas fa-bell" style={{ color: 'var(--accent-primary)' }}></i></div>
          <div className="setup-card-info">
            <h4>Push Notifications</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>Get alerts for orders, deals & shipping</p>
          </div>
          <div
            className="client-toggle"
            style={{
              width: 48, height: 28, borderRadius: 14,
              background: notifEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)',
              position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: 'white',
              position: 'absolute', top: 3, left: notifEnabled ? 23 : 3,
              transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        <div className="setup-card" onClick={onToggleLocation}>
          <div className="setup-card-icon"><i className="fas fa-location-dot" style={{ color: 'var(--error)' }}></i></div>
          <div className="setup-card-info">
            <h4>Location Access</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>For accurate delivery & local deals</p>
          </div>
          <div
            className="client-toggle"
            style={{
              width: 48, height: 28, borderRadius: 14,
              background: locationEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)',
              position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: 'white',
              position: 'absolute', top: 3, left: locationEnabled ? 23 : 3,
              transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5, padding: '0 20px' }}>
        By continuing, you agree to our{' '}
        <a style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={onTerms}>Terms of Service</a>{' '}
        and{' '}
        <a style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={onPrivacy}>Privacy Policy</a>
      </p>
    </div>
  );
}
