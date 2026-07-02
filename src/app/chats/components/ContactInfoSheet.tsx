'use client';

interface ContactInfoSheetProps {
  open: boolean;
  avatar: string;
  name: string;
  phone: string;
  customerSince?: string;
  totalOrders?: number;
  totalSpent?: number;
  onClose: () => void;
  onBlock: () => void;
  onMediaClick: (emoji: string) => void;
}

export default function ContactInfoSheet({
  open, avatar, name, phone,
  customerSince, totalOrders = 0, totalSpent = 0,
  onClose, onBlock, onMediaClick,
}: ContactInfoSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <div className="contact-header">
            <div className="contact-avatar-lg online">{avatar}</div>
            <h3>{name}</h3>
            <p>{phone}</p>
          </div>
          <div className="contact-actions">
            <div className="contact-action"><i className="fas fa-phone"></i><span>Call</span></div>
            <div className="contact-action"><i className="fas fa-video"></i><span>Video</span></div>
            <div className="contact-action"><i className="fas fa-copy"></i><span>Copy</span></div>
            <div className="contact-action"><i className="fas fa-user"></i><span>Profile</span></div>
          </div>
          <div className="info-row">
            <i className="fas fa-phone"></i>
            <div className="info-row-text"><h4>{phone}</h4><p>Mobile</p></div>
          </div>
          <div className="info-row">
            <i className="fab fa-whatsapp" style={{ color: '#25d366' }}></i>
            <div className="info-row-text"><h4>WhatsApp Business</h4><p>Connected via Evolution API</p></div>
          </div>
          <div className="info-row">
            <i className="fas fa-calendar"></i>
            <div className="info-row-text"><h4>Customer since</h4><p>{customerSince || 'Unknown'}</p></div>
          </div>
          <div className="info-row">
            <i className="fas fa-shopping-bag"></i>
            <div className="info-row-text"><h4>Total Orders</h4><p>{totalOrders} orders • ${totalSpent.toFixed(2)} spent</p></div>
          </div>
          <button className="btn btn-danger" style={{ marginTop: '20px', height: '48px', fontSize: '15px' }} onClick={onBlock}>
            <i className="fas fa-ban"></i> Block Contact
          </button>
        </div>
      </div>
    </>
  );
}