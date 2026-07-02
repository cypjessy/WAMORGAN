'use client';

interface CountrySheetProps {
  open: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (flag: string, name: string) => void;
}

const countries = [
  { flag: '🇺🇸', name: 'United States', currency: 'USD ($)' },
  { flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP (£)' },
  { flag: '🇳🇬', name: 'Nigeria', currency: 'NGN (₦)' },
  { flag: '🇧🇷', name: 'Brazil', currency: 'BRL (R$)' },
  { flag: '🇮🇳', name: 'India', currency: 'INR (₹)' },
  { flag: '🇩🇪', name: 'Germany', currency: 'EUR (€)' },
  { flag: '🇨🇦', name: 'Canada', currency: 'CAD ($)' },
  { flag: '🇦🇺', name: 'Australia', currency: 'AUD ($)' },
];

export default function CountrySheet({ open, onClose, selected, onSelect }: CountrySheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Select Country</h3>
          <p className="sheet-subtitle">Choose your region for accurate pricing</p>
          <div className="sheet-search" style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search country..."
              style={{
                width: '100%', height: 48, background: 'var(--bg-elevated)',
                border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-full)',
                padding: '0 44px 0 16px', fontSize: 14, fontWeight: 500,
                color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
              }}
              onChange={(e) => {
                const term = e.target.value.toLowerCase();
                const items = document.querySelectorAll('.country-list-item');
                items.forEach((item) => {
                  const el = item as HTMLElement;
                  el.style.display = el.textContent?.toLowerCase().includes(term) ? 'flex' : 'none';
                });
              }}
            />
            <i className="fas fa-magnifying-glass" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          </div>
          {countries.map((c) => (
            <div
              key={c.name}
              className={`sheet-list-item country-list-item ${selected === c.name ? 'selected' : ''}`}
              onClick={() => { onSelect(c.flag, c.name); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.flag}</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: selected === c.name ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{c.name}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{c.currency}</p>
              </div>
              <i className="fas fa-check" style={{ color: 'var(--accent-primary)', fontSize: 18, opacity: selected === c.name ? 1 : 0 }}></i>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
