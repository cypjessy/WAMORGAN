'use client';

interface LocationStepProps {
  country: string;
  currency: string;
  language: string;
  address: string;
  onAddressChange: (val: string) => void;
  onSelectCountry: () => void;
  onSelectCurrency: () => void;
  onSelectLanguage: () => void;
  onBack: () => void;
}

export default function LocationStep({
  country, currency, language, address, onAddressChange,
  onSelectCountry, onSelectCurrency, onSelectLanguage, onBack,
}: LocationStepProps) {
  return (
    <div>
      <div className="page-header" style={{ paddingTop: 60 }}>
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Set Your Location</h2>
      </div>

      <div className="steps-bar" style={{ marginBottom: 32, padding: '0 24px' }}>
        <div className="step-line active"></div>
        <div className="step-dot active"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
      </div>

      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, padding: '0 20px', lineHeight: 1.6 }}>
        This helps us show accurate prices, shipping costs, and delivery options for your region.
      </p>

      <div style={{ padding: '0 20px' }}>
        <div className="setup-card" onClick={onSelectCountry}>
          <div className="setup-card-icon">{country === 'United States' ? '🇺🇸' : '🌍'}</div>
          <div className="setup-card-info">
            <h4>Country</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{country}</p>
          </div>
          <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
        </div>

        <div className="setup-card" onClick={onSelectCurrency}>
          <div className="setup-card-icon"><i className="fas fa-coins" style={{ color: 'var(--success)' }}></i></div>
          <div className="setup-card-info">
            <h4>Currency</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{currency}</p>
          </div>
          <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
        </div>

        <div className="setup-card" onClick={onSelectLanguage}>
          <div className="setup-card-icon"><i className="fas fa-globe" style={{ color: 'var(--info)' }}></i></div>
          <div className="setup-card-info">
            <h4>Language</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{language}</p>
          </div>
          <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 8, padding: '0 20px' }}>
        <label className="form-label">Delivery Address</label>
        <div className="input-wrapper">
          <input
            type="text"
            className="form-input"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Enter your delivery address"
          />
          <i className="fas fa-location-dot input-icon" style={{ color: 'var(--error)' }}></i>
        </div>
      </div>
    </div>
  );
}
