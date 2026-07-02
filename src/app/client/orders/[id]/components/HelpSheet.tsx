'use client';

interface HelpSheetProps {
  open: boolean;
  onClose: () => void;
  onOption: (option: string) => void;
}

export default function HelpSheet({ open, onClose, onOption }: HelpSheetProps) {
  const options = [
    { icon: 'fas fa-message', label: 'Live Chat', desc: 'Chat with our support team', style: {} },
    { icon: 'fas fa-envelope', label: 'Email Support', desc: 'support@sellflow.ai', style: {} },
    { icon: 'fas fa-phone', label: 'Call Us', desc: '+1 800 123 4567', style: {} },
    { icon: 'fab fa-whatsapp', label: 'WhatsApp', desc: 'Get instant AI support', style: { color: '#25d366' } },
  ];

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Need Help?</h3>
          <p className="sheet-subtitle">Choose how you want to get support</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {options.map((opt) => (
              <button
                key={opt.label}
                className="action-btn"
                style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: 16 }}
                onClick={() => { onOption(opt.label); onClose(); }}
              >
                <i className={opt.icon} style={{ fontSize: 20, ...opt.style }}></i>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
