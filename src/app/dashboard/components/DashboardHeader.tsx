'use client';

interface DashboardHeaderProps {
  greeting: string;
  notificationCount: number;
  userName?: string;
  businessName?: string;
  onNotificationClick: () => void;
  onProfileClick: () => void;
}

export default function DashboardHeader({
  greeting, notificationCount, userName, businessName, onNotificationClick, onProfileClick,
}: DashboardHeaderProps) {
  const displayName = userName || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-header">
      <div className="user-greeting">
        <h2>{greeting}, {displayName.split(' ')[0]}!</h2>
        <p>{businessName ? `Manage ${businessName}` : 'Manage your store with ease'}</p>
      </div>
      <div className="header-actions">
        <button className="icon-btn" onClick={onNotificationClick}>
          <i className="fas fa-bell"></i>
          {notificationCount > 0 && <span className="badge"></span>}
        </button>
        <button className="avatar-btn" onClick={onProfileClick}>{initial}</button>
      </div>
    </div>
  );
}
