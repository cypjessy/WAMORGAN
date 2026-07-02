'use client';

interface PrivacySheetProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacySheet({ open, onClose }: PrivacySheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Privacy Policy</h3>
          <p className="sheet-subtitle">How we handle your data</p>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
            <p style={{ marginBottom: 12 }}><strong>1. Data Collection:</strong> We collect information you provide during registration and shopping.</p>
            <p style={{ marginBottom: 12 }}><strong>2. Usage:</strong> Your data is used to process orders, personalize recommendations, and improve our service.</p>
            <p style={{ marginBottom: 12 }}><strong>3. Security:</strong> We use encryption and secure servers to protect your information.</p>
            <p><strong>4. Third Parties:</strong> We share data only with shipping partners and payment processors as needed.</p>
          </div>
          <button className="btn btn-primary" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </>
  );
}
