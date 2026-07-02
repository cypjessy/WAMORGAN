'use client';

interface NotifItem {
  icon: string;
  fa: string;
  title: string;
  desc: string;
  time: string;
}

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  notifications: NotifItem[];
  unreadCount: number;
}

export default function NotificationsSheet({ open, onClose, notifications, unreadCount }: NotificationsSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} id="notifOverlay" onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`} id="notifSheet">
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Notifications</h3>
          <p className="sheet-subtitle">{unreadCount} unread notifications</p>
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-bell" style={{ fontSize: 24, marginBottom: 8, display: 'block' }}></i>
              <span style={{ fontSize: 13, fontWeight: 500 }}>No notifications yet</span>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="notif-item">
                <div className={`notif-icon ${n.icon}`}><i className={`fas ${n.fa}`}></i></div>
                <div className="notif-text">
                  <h4>{n.title}</h4>
                  <p>{n.desc}</p>
                </div>
                <span className="notif-time">{n.time}</span>
              </div>
            ))
          )}
          <button className="btn btn-secondary" style={{ marginTop: '8px' }} onClick={onClose}>
            Mark All Read
          </button>
        </div>
      </div>
    </>
  );
}