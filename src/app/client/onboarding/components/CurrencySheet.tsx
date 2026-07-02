'use client';

interface CurrencySheetProps {
  open: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (currency: string) => void;
}

const currencies = [
  { symbol: 'KSh ', label: 'US Dollar', code: 'USD', display: 'USD ($)', color: 'var(--success)' },
  { symbol: '€', label: 'Euro', code: 'EUR', display: 'EUR (€)', color: 'var(--info)' },
  { symbol: '£', label: 'British Pound', code: 'GBP', display: 'GBP (£)', color: 'var(--accent-primary)' },
  { symbol: '₦', label: 'Nigerian Naira', code: 'NGN', display: 'NGN (₦)', color: 'var(--warning)' },
  { symbol: 'R$', label: 'Brazilian Real', code: 'BRL', display: 'BRL (R$)', color: 'var(--success)' },
];

export default function CurrencySheet({ open, onClose, selected, onSelect }: CurrencySheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Select Currency</h3>
          <p className="sheet-subtitle">Prices will be displayed in this currency</p>
          {currencies.map((c) => (
            <div
              key={c.code}
              className={`sheet-list-item ${selected === c.display ? 'selected' : ''}`}
              onClick={() => { onSelect(c.display); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c.color, flexShrink: 0 }}>{c.symbol}</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: selected === c.display ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{c.label}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{c.code}</p>
              </div>
              <i className="fas fa-check" style={{ color: 'var(--accent-primary)', fontSize: 18, opacity: selected === c.display ? 1 : 0 }}></i>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
