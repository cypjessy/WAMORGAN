'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import FabSheet from './FabSheet';
import LogoutDialog from './LogoutDialog';

interface ClientBottomNavProps {
  activeIndex: number;
  cartCount?: number;
}

const navItems = [
  { icon: 'fa-house', label: 'Home', route: '/client/shop' },
  { icon: 'fa-magnifying-glass', label: 'Search', route: '/client/search' },
  { icon: 'fa-cart-shopping', label: 'Cart', route: '/client/cart' },
  { icon: 'fa-box', label: 'Orders', route: '/client/orders' },
];

export default function ClientBottomNav({ activeIndex, cartCount }: ClientBottomNavProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  const handleNavClick = (idx: number) => {
    const item = navItems[idx];
    if (item.route) router.push(item.route);
  };

  const handleFabClick = () => {
    setFabOpen(prev => !prev);
  };

  const performLogout = async () => {
    setLogoutOpen(false);
    await logout();
    router.push('/');
  };

  useEffect(() => {
    if (!fabOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFabOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fabOpen]);

  return (
    <>
      <nav className="bottom-nav premium-nav">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={`nav-item ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => handleNavClick(idx)}
          >
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
            {item.label === 'Cart' && cartCount !== undefined && cartCount > 0 && (
              <span className="nav-badge-num">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        ))}

        {/* FAB — sits above the nav in the curved cutout */}
        <div className="nav-fab-wrapper">
          <button
            ref={fabRef}
            className={`nav-fab ${fabOpen ? 'active' : ''}`}
            onClick={handleFabClick}
            aria-label="Quick actions"
          >
            <i className={`fas ${fabOpen ? 'fa-times' : 'fa-plus'}`}></i>
          </button>
        </div>
      </nav>

      <FabSheet
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        onLogout={() => setLogoutOpen(true)}
      />

      <LogoutDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onLogout={performLogout}
      />
    </>
  );
}
