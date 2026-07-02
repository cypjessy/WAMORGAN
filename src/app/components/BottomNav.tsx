'use client';

interface BottomNavProps {
  activeIndex: number;
  fabOpen: boolean;
  onNavClick: (index: number) => void;
  onFabClick: () => void;
  onMoreClick?: () => void;
}

const navItems = [
  { icon: 'fa-house', label: 'Home' },
  { icon: 'fa-boxes-stacked', label: 'Products' },
];

const rightNavItems = [
  { icon: 'fa-message', label: 'Chats' },
  { icon: 'fa-ellipsis-h', label: 'More' },
];

export default function BottomNav({ activeIndex, fabOpen, onNavClick, onFabClick, onMoreClick }: BottomNavProps) {
  return (
    <nav className="bottom-nav admin-nav">
      {navItems.map((item, i) => (
        <button key={i} className={`nav-item ${activeIndex === i ? 'active' : ''}`} onClick={() => onNavClick(i)}>
          <i className={`fas ${item.icon}`}></i>
          <span>{item.label}</span>
        </button>
      ))}

      <div className="nav-fab-wrapper">
        <button
          className={`nav-fab ${fabOpen ? 'active' : ''}`}
          onClick={onFabClick}
          aria-label="Quick actions"
        >
          <i className={`fas ${fabOpen ? 'fa-times' : 'fa-plus'}`}></i>
        </button>
      </div>

      {rightNavItems.map((item, i) => {
        const idx = i + 2;
        if (item.label === 'More') {
          return (
            <button key={idx} className={`nav-item ${activeIndex === 3 ? 'active' : ''}`} onClick={onMoreClick}>
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          );
        }
        return (
          <button key={idx} className={`nav-item ${activeIndex === idx ? 'active' : ''}`} onClick={() => onNavClick(idx)}>
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
