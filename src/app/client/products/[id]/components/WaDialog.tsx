'use client';

interface WaDialogProps {
  open: boolean;
  onClose: () => void;
  onChat: () => void;
}

export default function WaDialog({ open, onClose, onChat }: WaDialogProps) {
  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-box">
        <div className="dialog-icon success"><i className="fab fa-whatsapp"></i></div>
        <h3>Ask on WhatsApp</h3>
        <p>Chat with our AI assistant about this product. Get instant answers about availability, shipping, and more.</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Later</button>
          <button
            className="btn btn-primary"
            style={{ background: '#25d366', boxShadow: '0 4px 24px rgba(37,211,102,0.3)' }}
            onClick={onChat}
          >
            <i className="fab fa-whatsapp"></i> Chat Now
          </button>
        </div>
      </div>
    </div>
  );
}
