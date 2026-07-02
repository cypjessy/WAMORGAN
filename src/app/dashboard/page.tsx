'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import {
  businessProfileService, orderService, productService, customerService
} from '@/lib/db';
import type { Order } from '@/lib/db';

import DashboardHeader from './components/DashboardHeader';
import EvolutionConnectionCard from './components/EvolutionConnectionCard';
import KpiGrid from './components/KpiGrid';
import QuickActionsGrid from './components/QuickActionsGrid';
import RecentActivity from './components/RecentActivity';
import NotificationsSheet from './components/NotificationsSheet';
import ProfileSheet from './components/ProfileSheet';
import Snackbar from './components/Snackbar';
import RefreshIndicator from './components/RefreshIndicator';
import LogoutDialog from './components/LogoutDialog';
import FabMenu from './components/FabMenu';
import WhatsAppConnectDialog from './components/WhatsAppConnectDialog';
import OrderDetailSheet from './components/OrderDetailSheet';
import BottomNav from '@/app/components/BottomNav';
import MoreSheet from '@/app/components/MoreSheet';
import './dashboard.css';

// ─── Helpers ───────────────────────────────────────────────

function timeAgo(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} hr ago`;
  return `${Math.floor(mins / 1440)} day ago`;
}

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17) return 'Good Evening';
  return 'Good Morning';
}

// ─── Notification type ─────────────────────────────────────

interface NotifItem {
  iconClass: string;
  faIcon: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

// ─── Page ──────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Data
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState({ all: 0, active: 0, paused: 0, draft: 0 });
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [totalStock, setTotalStock] = useState(0);

  // WhatsApp refresh trigger
  const [evoRefreshTrigger, setEvoRefreshTrigger] = useState(0);

  // Derived
  const totalRevenue = useMemo(() =>
    allOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, o) => sum + (o.total || 0), 0), [allOrders]
  );

  const pendingOrders = useMemo(() =>
    allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed'), [allOrders]
  );

  const processingOrders = useMemo(() =>
    allOrders.filter(o => o.status === 'processing' || o.status === 'shipped'), [allOrders]
  );

  const todayPendingCount = useMemo(() =>
    pendingOrders.filter(o => {
      const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      return (Date.now() - ts.getTime()) < 86400000;
    }).length, [pendingOrders]
  );

  // Notifications
  const notifications = useMemo(() => {
    const items: NotifItem[] = [];
    const now = Date.now();

    pendingOrders.slice(0, 3).forEach(o => {
      const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      if (now - ts.getTime() < 86400000) {
        items.push({ iconClass: 'new-inquiry', faIcon: 'fa-envelope', title: 'New Inquiry Received',
          desc: `${o.customerName} is interested in ${o.items?.[0]?.name || 'your product'}`,
          time: timeAgo(o.createdAt), unread: true });
      }
    });

    allOrders.filter(o => o.status === 'delivered').slice(0, 2).forEach(o => {
      items.push({ iconClass: 'viewing-req', faIcon: 'fa-calendar-check', title: 'Order Completed',
        desc: `${o.customerName} confirmed delivery`,
        time: timeAgo(o.updatedAt || o.createdAt), unread: false });
    });

    allProducts.filter((p: any) => p.status === 'active' && (p.stock ?? 0) <= 5).slice(0, 2).forEach((p: any) => {
      items.push({ iconClass: 'system', faIcon: 'fa-shield-alt', title: 'Low Stock Alert',
        desc: `${p.name} is running low (${p.stock} left)`,
        time: 'now', unread: true });
    });

    return items.slice(0, 8);
  }, [allOrders, allProducts, pendingOrders]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Recent orders (sorted by newest first)
  const recentOrders = useMemo(() =>
    [...allOrders]
      .sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5),
    [allOrders]
  );

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [orders, oc, pc, customers, bp, products] = await Promise.all([
        orderService.getOrders(), orderService.getOrderCounts(),
        productService.getProductCounts(), customerService.getCustomers(),
        businessProfileService.getProfile(), productService.getProducts(),
      ]);
      setAllOrders(orders); setOrderCounts(oc); setProductCounts(pc);
      setAllCustomers(customers); setCustomerCount(customers.length);
      setBusinessName(bp?.businessName || '');
      setAllProducts(products);
      setTotalStock(products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0));
    } catch (err) { console.error('Failed to load dashboard data:', err); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setSnackbar({ visible: true, message, type });
    clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  useEffect(() => { return () => clearTimeout(snackbarTimeout.current); }, []);

  // Nav
  const [navIndex, setNavIndex] = useState(0);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Modal states
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [fabModalOpen, setFabModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Pull to refresh
  const [pullVisible, setPullVisible] = useState(false);
  const [pullSpinning, setPullSpinning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isRefreshing = useRef(false);


  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scroll = scrollRef.current;
    if (scroll && scroll.scrollTop <= 0) touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing.current) return;
    const scroll = scrollRef.current;
    if (!scroll || scroll.scrollTop > 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    setPullVisible(diff > 80);
    if (diff > 120) { setPullSpinning(true); } else { setPullSpinning(false); }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullSpinning) {
      showSnackbar('Refreshing dashboard...', 'info');
      setTimeout(() => {
        setPullVisible(false);
        setPullSpinning(false);
        loadData();
        setEvoRefreshTrigger(prev => prev + 1);
        showSnackbar('Dashboard refreshed!', 'success');
      }, 1500);
    } else { setPullVisible(false); }
    isRefreshing.current = false;
  }, [showSnackbar, loadData, pullSpinning]);

  // FAB helper — toggles open/close
  const handleFabClick = useCallback(() => {
    setFabModalOpen(prev => !prev);
  }, []);

  // Handlers
  const displayName = user?.displayName || businessName || user?.email?.split('@')[0] || 'Admin';
  const userEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();
  const greeting = getGreeting();

  const handleLogout = useCallback(async () => {
    setLogoutModalOpen(false);
    setProfileModalOpen(false);
    showSnackbar('Logging out...', 'info');
    await logout();
    setTimeout(() => { window.location.href = '/'; }, 1000);
  }, [showSnackbar, logout]);



  // ─── Render ──────────────────────────────────────────────
  return (
    <AuthGuard>
      <div className="app-container dashboard-theme" style={{ minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* REFRESH INDICATOR */}
        <RefreshIndicator visible={pullVisible} spinning={pullSpinning} />

        {/* HEADER */}
        <div className="safe-top" style={{ background: 'var(--bg-primary)' }}>
          <DashboardHeader
            greeting={greeting}
            notificationCount={unreadCount}
            userName={displayName}
            businessName={businessName}
            onNotificationClick={() => setNotifModalOpen(true)}
            onProfileClick={() => setProfileModalOpen(true)}
          />
          <div className="search-bar" style={{ margin: '12px 20px 8px' }}>
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search products, orders..." id="searchInput" />
            <button className="filter-btn" onClick={() => showSnackbar('Filters coming soon', 'info')}>
              <i className="fas fa-sliders-h"></i>
            </button>
          </div>
        </div>

        {/* MAIN SCROLL */}
        <div
          className="main-scroll"
          ref={scrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}
        >
          {/* EVOLUTION WHATSAPP CARD */}
          <EvolutionConnectionCard
            onOpenConnect={() => setWhatsAppDialogOpen(true)}
            showToast={showSnackbar}
            refreshTrigger={evoRefreshTrigger}
          />

          {/* KPI GRID */}
          <KpiGrid
            orderCount={orderCounts.all || 0}
            revenue={totalRevenue}
            customerCount={customerCount}
            productCount={productCounts.all || 0}
            onCardClick={(type) => {
              const routes: Record<string, string> = {
                revenue: '/orders', orders: '/orders',
                products: '/products', chats: '/customers',
              };
              router.push(routes[type] || '/');
            }}
          />

          {/* QUICK ACTIONS */}
          <QuickActionsGrid
            onAction={(action) => {
              const routes: Record<string, string> = {
                'add-product': '/products',
                'new-order': '/orders',
                'customers': '/customers',
                'store-settings': '/settings',
              };
              router.push(routes[action] || '/');
            }}
          />

          {/* RECENT ACTIVITY */}
          <RecentActivity orders={allOrders} maxItems={5} />

          {/* RECENT ORDERS */}
          <div className="section-header">
            <h3 className="section-title">Recent Orders</h3>
            <button className="section-link" onClick={() => router.push('/orders')}>See All</button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="activity-list">
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-clipboard-list"></i></div>
                <h3>No orders yet</h3>
                <p>New customer orders will appear here</p>
              </div>
            </div>
          ) : (
            <div className="orders-card">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="order-item"
                  onClick={() => {
                    setSelectedOrder(o);
                    setOrderSheetOpen(true);
                  }}
                >
                  <div className="order-img">
                    {o.items?.[0]?.imageUrl ? (
                      <img
                        src={o.items[0].imageUrl}
                        alt={o.items[0].name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                    ) : (
                      <i className="fas fa-box"></i>
                    )}
                  </div>
                  <div className="order-info">
                    <h4>{o.customerName || 'Customer'}</h4>
                    <p>{o.items?.[0]?.name || 'Order'} {o.items && o.items.length > 1 ? `+${o.items.length - 1} more` : ''}</p>
                  </div>
                  <div className="order-price">
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {formatCurrency(o.total)}
                    </div>
                    <span className={`order-status status-${o.status}`}>
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 100 }}></div>
        </div>

        {/* FAB MENU */}
        <FabMenu open={fabModalOpen} onAction={(action) => {
          setFabModalOpen(false);
          const routes: Record<string, string> = {
            'add-product': '/products',
            'new-order': '/orders',
            'customers': '/customers',
            'store-settings': '/settings',
          };
          router.push(routes[action] || '/');
        }} />

        {/* NOTIFICATIONS SHEET */}
        <NotificationsSheet
          open={notifModalOpen}
          onClose={() => setNotifModalOpen(false)}
          notifications={notifications.map(n => ({
            icon: n.iconClass, fa: n.faIcon, title: n.title, desc: n.desc, time: n.time,
          }))}
          unreadCount={unreadCount}
        />

        {/* PROFILE SHEET */}
        <ProfileSheet
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onLogout={handleLogout}
          onMenuItemClick={(item) => {
            const routes: Record<string, string> = {
              settings: '/settings', whatsapp: '/settings?tab=whatsapp',
              help: '/settings',
            };
            router.push(routes[item] || '/settings');
          }}
          onSettingsClick={() => router.push('/settings')}
          userName={displayName}
          userEmail={userEmail}
          userInitial={initial}
        />

        {/* LOGOUT DIALOG */}
        <LogoutDialog
          open={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
          onLogout={handleLogout}
        />

        {/* WHATSAPP CONNECT DIALOG */}
        <WhatsAppConnectDialog
          open={whatsAppDialogOpen}
          onClose={() => setWhatsAppDialogOpen(false)}
          onConnected={() => {
            setWhatsAppDialogOpen(false);
            setEvoRefreshTrigger(prev => prev + 1);
            showSnackbar('WhatsApp connected successfully!', 'success');
          }}
          showToast={showSnackbar}
        />

        {/* ORDER DETAIL SHEET */}
        <OrderDetailSheet
          open={orderSheetOpen}
          order={selectedOrder}
          onClose={() => setOrderSheetOpen(false)}
          onSendInvoice={() => { setOrderSheetOpen(false); showSnackbar('Invoice sent to customer', 'success'); }}
        />

        {/* BOTTOM NAVIGATION */}
        <BottomNav
          activeIndex={navIndex}
          fabOpen={fabModalOpen}
          onNavClick={(i) => {
            setNavIndex(i);
            const routes: Record<number, string> = { 0: '/dashboard', 1: '/products', 2: '/chats' };
            if (routes[i]) router.push(routes[i]);
          }}
          onFabClick={handleFabClick}
          onMoreClick={() => setMoreSheetOpen(true)}
        />
        <MoreSheet open={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} />

        {/* SNACKBAR */}
        <Snackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type} />
      </div>
    </AuthGuard>
  );
}
