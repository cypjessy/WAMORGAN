'use client';

interface LanguageSheetProps {
  open: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (lang: string) => void;
}

const languages = [
  { code: 'EN', label: 'English', native: '' },
  { code: 'ES', label: 'Spanish', native: 'Español' },
  { code: 'FR', label: 'French', native: 'Français' },
  { code: 'PT', label: 'Portuguese', native: 'Português' },
  { code: 'DE', label: 'German', native: 'Deutsch' },
];

export default function LanguageSheet({ open, onClose, selected, onSelect }: LanguageSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Select Language</h3>
          <p className="sheet-subtitle">Choose your preferred language</p>
          {languages.map((l) => (
            <div
              key={l.code}
              className={`sheet-list-item ${selected === l.label ? 'selected' : ''}`}
              onClick={() => { onSelect(l.label); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{l.code}</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: selected === l.label ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{l.label}</h4>
                {l.native && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{l.native}</p>}
              </div>
              <i className="fas fa-check" style={{ color: 'var(--accent-primary)', fontSize: 18, opacity: selected === l.label ? 1 : 0 }}></i>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
