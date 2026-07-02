'use client';

interface TermsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsSheet({ open, onClose }: TermsSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Terms of Service</h3>
          <p className="sheet-subtitle">Please read carefully</p>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
            <p style={{ marginBottom: 12 }}><strong>1. Acceptance:</strong> By using WAMORGAN, you agree to these terms and our privacy policy.</p>
            <p style={{ marginBottom: 12 }}><strong>2. Orders:</strong> All orders are subject to availability and confirmation of payment.</p>
            <p style={{ marginBottom: 12 }}><strong>3. Shipping:</strong> Delivery times are estimates and may vary based on location.</p>
            <p style={{ marginBottom: 12 }}><strong>4. Returns:</strong> Items can be returned within 14 days of delivery if unused.</p>
            <p><strong>5. WhatsApp:</strong> By using WhatsApp shopping, you agree to WhatsApp&apos;s Business Terms.</p>
          </div>
          <button className="btn btn-primary" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </>
  );
}
