'use client';

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onMenuItemClick: (item: string) => void;
  onSettingsClick?: () => void;
  userName?: string;
  userEmail?: string;
  userInitial?: string;
}

const menuItems = [
  { id: 'settings', icon: 'fa-store', title: 'Store Settings', desc: 'Business info, currency, tax & more' },
  { id: 'whatsapp', icon: 'fab fa-whatsapp', title: 'WhatsApp', desc: 'Evolution API, connection & automation', iconColor: '#25d366' },
  { id: 'help', icon: 'fa-circle-question', title: 'Help & Support', desc: 'Documentation & tickets' },
];

export default function ProfileSheet({ open, onClose, onLogout, onMenuItemClick, userName, userEmail, userInitial, onSettingsClick }: ProfileSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} id="profileOverlay" onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`} id="profileSheet">
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <div className="profile-header-sheet" onClick={() => { onClose(); onSettingsClick?.(); }} style={{ cursor: 'pointer' }}>
            <div className="profile-avatar-lg">{userInitial || 'A'}</div>
            <h3>{userName || 'Admin'}</h3>
            <p>{userEmail || 'admin@store.com'}</p>
          </div>
          <div className="menu-list">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-item" onClick={() => {
                onMenuItemClick(item.id);
                onClose();
              }}>
                <div className="menu-item-icon" style={item.iconColor ? { color: item.iconColor } : {}}>
                  <i className={item.icon}></i>
                </div>
                <div className="menu-item-text">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
                <i className="fas fa-chevron-right"></i>
              </div>
            ))}
            <div className="menu-item" onClick={() => { onClose(); setTimeout(onLogout, 300); }}>
              <div className="menu-item-icon" style={{ color: 'var(--error)' }}><i className="fas fa-right-from-bracket"></i></div>
              <div className="menu-item-text"><h4 style={{ color: 'var(--error)' }}>Log Out</h4><p>Sign out of your account</p></div>
              <i className="fas fa-chevron-right" style={{ color: 'var(--error)' }}></i>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
