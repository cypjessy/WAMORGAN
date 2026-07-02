'use client';

interface ClientHeaderProps {
  cartCount: number;
  notifCount: number;
  onNotifClick: () => void;
  onCartClick: () => void;
}

export default function ClientHeader({ cartCount, notifCount, onNotifClick, onCartClick }: ClientHeaderProps) {
  return (
    <div className="home-header">
      <div className="brand-logo">
        <div className="logo-icon"><i className="fas fa-bag-shopping"></i></div>
        <span>WAMORGAN</span>
      </div>
      <div className="header-actions">
        <button className="icon-btn" onClick={onNotifClick}>
          <i className="fas fa-bell"></i>
          {notifCount > 0 && <span className="badge-count">{notifCount}</span>}
        </button>
        <button className="icon-btn" onClick={onCartClick}>
          <i className="fas fa-cart-shopping"></i>
          <span className="badge-count">{cartCount}</span>
        </button>
      </div>
    </div>
  );
}
