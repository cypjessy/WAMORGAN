'use client';

interface TemplateSheetProps {
  open: boolean;
  onClose: () => void;
  onSendTemplate: (text: string) => void;
  onSendCatalog?: () => void;
}

const templates = [
  { icon: 'fa-handshake', label: 'Welcome Greeting', text: 'Welcome! Thank you for reaching out. How can I assist you today?' },
  { icon: 'fa-book-open', label: 'Send Catalog', text: 'Here is our latest product catalog. Let me know if anything catches your eye!', isCatalog: true as const },
  { icon: 'fa-check-circle', label: 'Order Confirmed', text: 'Your order has been confirmed! We will send tracking details shortly.' },
  { icon: 'fa-truck', label: 'Shipping Update', text: 'Your order is out for delivery. Expected arrival: tomorrow by 6 PM.' },
  { icon: 'fa-tag', label: 'Promotional Offer', text: 'We have a special 20% discount just for you! Use code: VIP20 at checkout.' },
  { icon: 'fa-heart', label: 'Thank You', text: 'Thank you for your purchase! We hope you love it. Please leave a review!' },
];

export default function TemplateSheet({ open, onClose, onSendTemplate, onSendCatalog }: TemplateSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <h3 className="sheet-title">Message Templates</h3>
          <p className="sheet-subtitle">Quick replies for common scenarios</p>
          {templates.map((t, i) => (
            <div key={i} className="template-item" onClick={() => {
              if ((t as any).isCatalog && onSendCatalog) {
                onSendCatalog();
              } else {
                onSendTemplate(t.text);
              }
              onClose();
            }}>
              <div className="template-icon"><i className={`fas ${t.icon}`}></i></div>
              <div className="template-text">
                <h4>{t.label}</h4>
                <p>{t.text}</p>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={onClose}>
            <i className="fas fa-plus"></i> Create Custom Template
          </button>
        </div>
      </div>
    </>
  );
}
