'use client';

interface TermsSheetModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsSheetModal({ open, onClose }: TermsSheetModalProps) {
  return (
    <>
      <div
        className={`modal-overlay ${open ? 'active' : ''}`}
        id="termsOverlay"
        onClick={onClose}
      ></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`} id="termsSheet">
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Terms of Service</h3>
          <p className="sheet-subtitle">Please read carefully</p>

          <div style={{
            fontSize: '13px', color: 'var(--text-secondary)',
            lineHeight: '1.8', maxHeight: '300px', overflowY: 'auto',
          }}>
            <p style={{ marginBottom: '12px' }}>By using WAMORGAN, you agree to our terms of service and privacy policy.</p>
            <p style={{ marginBottom: '12px' }}><strong>1. Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
            <p style={{ marginBottom: '12px' }}><strong>2. WhatsApp Automation:</strong> You must comply with WhatsApp Business API terms when using our automation features.</p>
            <p style={{ marginBottom: '12px' }}><strong>3. Data Privacy:</strong> We protect your business and customer data with enterprise-grade encryption.</p>
            <p><strong>4. Subscription:</strong> Some features require an active subscription plan.</p>
          </div>

          <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '16px' }}>
            I Understand
          </button>
        </div>
      </div>
    </>
  );
}
