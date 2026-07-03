'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import '../client.css';
import { useAuth } from '@/context/AuthContext';
import { hapticsImpact, nativeShare } from '@/lib/capacitor';
import { orderService, wishlistService, productService, cartService, cancellationRequestService } from '@/lib/db';
import type { Order, Product } from '@/lib/db';

import TabBar from './components/TabBar';
import OrderCard, { OrderData } from './components/OrderCard';
import WishlistCard, { WishlistData } from './components/WishlistCard';
import OrderDetailSheet, { OrderDetailData, TimelineStep } from './components/OrderDetailSheet';
import FilterSheet from './components/FilterSheet';
import SortSheet from './components/SortSheet';
import CancelDialog from './components/CancelDialog';
import ReorderDialog from './components/ReorderDialog';
import ClearWishlistDialog from './components/ClearWishlistDialog';
import ClientBottomNav from '../components/ClientBottomNav';
import Snackbar from './components/Snackbar';

// ── Helpers ──

function formatCurrency(amount: number): string {
  return 'KSh ' + amount.toFixed(2);
}

function fmtDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDetailDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' • ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const PROGRESS_MAP: Record<string, number> = {
  pending: 1, confirmed: 2, processing: 2, shipped: 3, delivered: 4, cancelled: 0, refunded: 0,
};

function toOrderData(o: Order): OrderData {
  const first = o.items?.[0];
  const qty = o.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  return {
    id: o.id,
    imageUrl: first?.imageUrl || '',
    name: first?.name || `Order ${o.orderNumber || ''}`,
    orderId: o.orderNumber ? `#${o.orderNumber}` : `#${o.id.slice(-6)}`,
    status: o.status,
    price: formatCurrency(o.total),
    items: `${qty} ${qty === 1 ? 'item' : 'items'}`,
    date: fmtDate(o.createdAt),
    progressSteps: PROGRESS_MAP[o.status] ?? 0,
    showProgress: !['cancelled', 'refunded'].includes(o.status),
  };
}

function buildTimeline(o: Order): TimelineStep[] {
  const placed = fmtDetailDate(o.createdAt);
  const updated = fmtDetailDate(o.updatedAt);
  switch (o.status) {
    case 'pending':
      return [
        { dot: <i className="fas fa-file-invoice" />, title: 'Order Placed', description: placed, status: 'done' },
        { dot: <i className="fas fa-credit-card" />, title: 'Payment Confirmed', description: 'Pending', status: 'pending' },
        { dot: <i className="fas fa-box" />, title: 'Shipped', description: 'Pending', status: 'pending' },
        { dot: <i className="fas fa-home" />, title: 'Delivered', description: 'Pending', status: 'pending' },
      ];
    case 'confirmed':
    case 'processing':
      return [
        { dot: <i className="fas fa-check" />, title: 'Order Placed', description: placed, status: 'done' },
        { dot: <i className="fas fa-check" />, title: 'Payment Confirmed', description: updated, status: 'done' },
        { dot: <i className="fas fa-box" />, title: 'Shipped', description: 'Pending', status: 'pending' },
        { dot: <i className="fas fa-home" />, title: 'Delivered', description: 'Pending', status: 'pending' },
      ];
    case 'shipped':
      return [
        { dot: <i className="fas fa-check" />, title: 'Order Placed', description: placed, status: 'done' },
        { dot: <i className="fas fa-check" />, title: 'Payment Confirmed', description: updated, status: 'done' },
        { dot: <i className="fas fa-truck" />, title: 'Shipped', description: updated, status: 'current' },
        { dot: <i className="fas fa-box" />, title: 'Delivered', description: 'Pending', status: 'pending' },
      ];
    case 'delivered':
      return [
        { dot: <i className="fas fa-check" />, title: 'Order Placed', description: placed, status: 'done' },
        { dot: <i className="fas fa-check" />, title: 'Payment Confirmed', description: placed, status: 'done' },
        { dot: <i className="fas fa-check" />, title: 'Shipped', description: updated, status: 'done' },
        { dot: <i className="fas fa-home" />, title: 'Delivered', description: updated, status: 'current' },
      ];
    case 'cancelled':
      return [
        { dot: <i className="fas fa-check" />, title: 'Order Placed', description: placed, status: 'done' },
        { dot: <i className="fas fa-check" />, title: 'Payment Confirmed', description: placed, status: 'done' },
        { dot: <i className="fas fa-xmark" />, title: 'Cancelled', description: updated, status: 'current' },
      ];
    case 'refunded':
      return [
        { dot: <i className="fas fa-check" />, title: 'Order Placed', description: placed, status: 'done' },
        { dot: <i className="fas fa-check" />, title: 'Payment Confirmed', description: placed, status: 'done' },
        { dot: <i className="fas fa-check" />, title: 'Shipped', description: placed, status: 'done' },
        { dot: <i className="fas fa-rotate-left" />, title: 'Refunded', description: updated, status: 'current' },
      ];
    default:
      return [];
  }
}

function toDetailData(o: Order): OrderDetailData {
  const first = o.items?.[0];
  const qty = o.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  return {
    imageUrl: first?.imageUrl || '',
    name: first?.name || `Order ${o.orderNumber || ''}`,
    orderId: o.orderNumber ? `#${o.orderNumber}` : `#${o.id.slice(-6)}`,
    status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
    statusClass: 'status-' + o.status,
    date: fmtDate(o.createdAt),
    total: formatCurrency(o.total),
    items: `${qty} ${qty === 1 ? 'item' : 'items'}`,
    payment: o.paymentMethod || 'N/A',
    shipping: o.deliveryMethod || 'Standard',
    tracking: 'N/A',
    timeline: buildTimeline(o),
  };
}

const STATUS_FILTER_MAP: Record<string, string[]> = {
  all: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
  processing: ['pending', 'confirmed', 'processing'],
  shipped: ['shipped'],
  delivered: ['delivered'],
  cancelled: ['cancelled', 'refunded'],
};

function wishlistFromProduct(p: Product, productId: string): WishlistData {
  const price = p.salePrice || p.price;
  const oldPriceVal = p.originalPrice && p.originalPrice > price ? p.originalPrice : undefined;
  const stockNum = p.stock ?? 0;
  let stock: WishlistData['stock'] = 'in-stock';
  let stockLabel = 'In Stock';
  if (stockNum === 0 || p.status === 'out') {
    stock = 'out-of-stock';
    stockLabel = 'Out of Stock';
  } else if (stockNum <= (p.lowStockAlert || 5)) {
    stock = 'low-stock';
    stockLabel = `Only ${stockNum} left`;
  }
  return {
    productId,
    imageUrl: p.images?.[0] || p.imageUrl || '',
    name: p.name,
    price: formatCurrency(price),
    oldPrice: oldPriceVal ? formatCurrency(oldPriceVal) : undefined,
    stock,
    stockLabel,
    priceDrop: !!oldPriceVal,
  };
}

export default function OrdersListPage() {
  const router = useRouter();
  const { user } = useAuth();
  // Page system: 'orders' | 'wishlist'
  const [activePage, setActivePage] = useState<'orders' | 'wishlist'>('orders');

  // Firestore orders
  const [fireOrders, setFireOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Orders state
  const [orderFilter, setOrderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Wishlist state
  const [wishlistFilter, setWishlistFilter] = useState('all');
  const [wishlistItems, setWishlistItems] = useState<WishlistData[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  // Sheets
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Dialogs
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [clearWishDialogOpen, setClearWishDialogOpen] = useState(false);

  // ── Filter state ──
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState('All Time');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  // Snackbar
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  // Fetch orders from Firestore
  useEffect(() => {
    if (!user) { setOrdersLoading(false); return; }
    const load = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const data = await orderService.getOrders(undefined, { customerId: user.uid });
        setFireOrders(data);
      } catch (e) {
        console.error('Failed to load orders', e);
        setOrdersError('Failed to load orders');
      }
      setOrdersLoading(false);
    };
    load();
  }, [user]);

  // Fetch wishlist from Firestore
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setWishlistLoading(true);
      try {
        const [wishlistDb, allProducts] = await Promise.all([
          wishlistService.getWishlist(user.uid),
          productService.getProducts(),
        ]);
        const productMap = new Map<string, Product>();
        allProducts.forEach(p => productMap.set(p.id, p));
        const merged: WishlistData[] = [];
        for (const w of wishlistDb) {
          const prod = productMap.get(w.productId);
          if (prod) {
            merged.push(wishlistFromProduct(prod, w.productId));
          }
        }
        if (!cancelled) setWishlistItems(merged);
      } catch (e) {
        console.error('Failed to load wishlist', e);
      }
      if (!cancelled) setWishlistLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  // Convert to display format
  const displayOrders = useMemo(() => fireOrders.map(toOrderData), [fireOrders]);

  // Dynamic order tabs
  const orderTabs = useMemo(() => {
    const count = (pred: (s: string) => boolean) => displayOrders.filter(o => pred(o.status)).length;
    return [
      { key: 'all', label: `All (${displayOrders.length})` },
      { key: 'processing', label: `Processing (${count(s => ['pending','confirmed','processing'].includes(s))})` },
      { key: 'shipped', label: `Shipped (${count(s => s === 'shipped')})` },
      { key: 'delivered', label: `Delivered (${count(s => s === 'delivered')})` },
      { key: 'cancelled', label: `Cancelled (${count(s => ['cancelled','refunded'].includes(s))})` },
    ];
  }, [displayOrders]);

  // Filtered + sorted orders
  const filteredOrders = useMemo(() => {
    const allowed = STATUS_FILTER_MAP[orderFilter] || STATUS_FILTER_MAP.all;
    let list = displayOrders.filter(o => allowed.includes(o.status));

    // Apply additional filters from FilterSheet
    if (filterStatuses.length > 0) {
      const statusLower = filterStatuses.map(s => s.toLowerCase());
      list = list.filter(o => statusLower.includes(o.status));
    }
    const minP = parseFloat(filterMinPrice);
    const maxP = parseFloat(filterMaxPrice);
    if (!isNaN(minP)) {
      list = list.filter(o => parseFloat(o.price.replace(/[KSh,\s]/g, '')) >= minP);
    }
    if (!isNaN(maxP)) {
      list = list.filter(o => parseFloat(o.price.replace(/[KSh,\s]/g, '')) <= maxP);
    }
    if (filterDateRange !== 'All Time') {
      const now = Date.now();
      const msMap: Record<string, number> = {
        'Last 7 Days': 7 * 86400000,
        'Last 30 Days': 30 * 86400000,
        'Last 3 Months': 90 * 86400000,
      };
      const ms = msMap[filterDateRange];
      if (ms) {
        list = list.filter(o => {
          const raw = fireOrders.find(fo => fo.id === o.id);
          if (!raw?.createdAt) return true;
          const d = raw.createdAt.toDate ? raw.createdAt.toDate() : new Date(raw.createdAt);
          return now - d.getTime() <= ms;
        });
      }
    }

    switch (sortBy) {
      case 'recent':
        list.sort((a, b) => {
          const ra = fireOrders.find(fo => fo.id === a.id);
          const rb = fireOrders.find(fo => fo.id === b.id);
          const ta = ra?.createdAt?.toDate?.()?.getTime() || new Date(ra?.createdAt || 0).getTime();
          const tb = rb?.createdAt?.toDate?.()?.getTime() || new Date(rb?.createdAt || 0).getTime();
          return tb - ta;
        });
        break;
      case 'price-high': list.sort((a, b) => parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, ''))); break;
      case 'price-low': list.sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, ''))); break;
      case 'total-high': list.sort((a, b) => {
        const ra = fireOrders.find(fo => fo.id === a.id);
        const rb = fireOrders.find(fo => fo.id === b.id);
        return (rb?.total || 0) - (ra?.total || 0);
      });
        break;
      default: break;
    }
    return list;
  }, [displayOrders, orderFilter, sortBy, filterStatuses, filterDateRange, filterMinPrice, filterMaxPrice, fireOrders]);

  // Dynamic wishlist tabs
  const wishlistTabs = useMemo(() => {
    const all = wishlistItems.length;
    const inStock = wishlistItems.filter(w => w.stock === 'in-stock').length;
    const priceDrop = wishlistItems.filter(w => w.priceDrop).length;
    return [
      { key: 'all', label: `All (${all})` },
      { key: 'in-stock', label: `In Stock (${inStock})` },
      { key: 'price-drop', label: `Price Drop (${priceDrop})` },
    ];
  }, [wishlistItems]);

  // Filtered wishlist
  const filteredWishlist = useMemo(() => {
    if (wishlistFilter === 'all') return wishlistItems;
    if (wishlistFilter === 'in-stock') return wishlistItems.filter(w => w.stock === 'in-stock');
    if (wishlistFilter === 'price-drop') return wishlistItems.filter(w => w.priceDrop);
    return wishlistItems;
  }, [wishlistFilter, wishlistItems]);

  // ── Handlers ──

  const handleBack = () => router.back();

  const switchPage = (page: 'orders' | 'wishlist') => {
    setActivePage(page);
  };

  const handleOrderClick = async (order: OrderData) => {
    await hapticsImpact('light');
    const raw = fireOrders.find(o => o.id === order.id);
    if (raw) {
      setSelectedOrder(raw);
      setDetailSheetOpen(true);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!selectedOrder) return;
    await hapticsImpact('light');
    const link = selectedOrder.id;
    window.open(`/api/invoice/${link}`, '_blank');
    showToast('Invoice opened', 'success');
    await nativeShare({ title: 'Invoice', text: `Order ${selectedOrder.orderNumber || selectedOrder.id}` });
  };

  const handleReorder = () => {
    setReorderDialogOpen(true);
  };

  const confirmReorder = async () => {
    setReorderDialogOpen(false);
    if (!user || !selectedOrder?.items) return;
    try {
      for (const item of selectedOrder.items) {
        await cartService.addToCart(user.uid, {
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.imageUrl || '',
        });
      }
      showToast(`${selectedOrder.items.length} item(s) added to cart`, 'success');
    } catch {
      showToast('Failed to reorder items', 'error');
    }
  };

  const handleCancelOrder = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    setCancelDialogOpen(false);
    if (!selectedOrder?.id) { showToast('Order not found', 'error'); return; }
    try {
      await orderService.updateOrder(selectedOrder.id, { status: 'cancelled' });
      // Create a cancellation request record
      await cancellationRequestService.create({
        orderId: selectedOrder.id,
        orderNumber: selectedOrder.orderNumber || selectedOrder.id,
        customerPhone: selectedOrder.customerPhone || '',
        customerName: selectedOrder.customerName || 'Customer',
        reason: 'Cancelled by customer',
        status: 'approved',
        requestedAt: new Date().toISOString(),
      });
      setFireOrders(prev => prev.map(o =>
        o.id === selectedOrder.id ? { ...o, status: 'cancelled' as const } : o
      ));
      showToast('Order cancelled successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error');
    }
  };

  const handleWishlistRemove = async (item: WishlistData) => {
    if (!user || !item.productId) return;
    try {
      await wishlistService.removeFromWishlist(user.uid, item.productId);
      setWishlistItems(prev => prev.filter(w => w.productId !== item.productId));
      showToast('Removed from wishlist', 'success');
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  const handleWishlistAddToCart = async (item: WishlistData) => {
    if (!user || !item.productId) return;
    try {
      await wishlistService.removeFromWishlist(user.uid, item.productId);
      setWishlistItems(prev => prev.filter(w => w.productId !== item.productId));
      showToast(`${item.name} moved to cart`, 'success');
    } catch {
      showToast('Failed to move item to cart', 'error');
    }
  };

  const confirmClearWishlist = async () => {
    setClearWishDialogOpen(false);
    if (!user) return;
    try {
      await wishlistService.clearWishlist(user.uid);
      setWishlistItems([]);
      showToast('Wishlist cleared', 'success');
    } catch {
      showToast('Failed to clear wishlist', 'error');
    }
  };

  const handleTrackOrder = () => {
    setDetailSheetOpen(false);
    setTimeout(() => {
      if (selectedOrder) {
        router.push(`/client/orders/${selectedOrder.id}`);
      }
    }, 300);
  };

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Scroll - wraps both pages */}
      <div className="main-scroll orders-scroll" id="mainScroll">

        {/* ===== PAGE: MY ORDERS ===== */}
        <div className={`page ${activePage === 'orders' ? 'active' : 'exit-left'}`}>
          <div className="page-header">
            <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i></button>
            <h2>My Orders</h2>
            <div className="header-actions">
              <button
                className="icon-btn"
                onClick={() => switchPage('wishlist')}
                style={{ position: 'relative' }}
              >
                <i className="fas fa-heart"></i>
                {wishlistItems.length > 0 && (
                  <span className="badge-count">{wishlistItems.length > 9 ? '9+' : wishlistItems.length}</span>
                )}
              </button>
              <button className="icon-btn" onClick={() => setFilterOpen(true)}><i className="fas fa-filter"></i></button>
              <button className="icon-btn" onClick={() => setSortOpen(true)}><i className="fas fa-arrow-down-wide-short"></i></button>
            </div>
          </div>

          <TabBar tabs={orderTabs} activeTab={orderFilter} onTabChange={setOrderFilter} />

          {ordersLoading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading orders...</p>
            </div>
          ) : ordersError ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-exclamation-triangle" style={{ color: 'var(--error)' }}></i></div>
              <h3>Something went wrong</h3>
              <p>{ordersError}</p>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '0 32px', marginTop: 16 }} onClick={() => window.location.reload()}>
                <i className="fas fa-rotate"></i> Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-box-open"></i></div>
              <h3>No orders found</h3>
              <p>You don't have any{orderFilter !== 'all' ? ' ' + orderFilter : ''} orders yet.</p>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '0 32px' }} onClick={() => showToast('Browsing products...', 'success')}>
                <i className="fas fa-bag-shopping"></i> Start Shopping
              </button>
            </div>
          ) : (
            <div id="ordersList">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} onClick={handleOrderClick} />
              ))}
            </div>
          )}

          {/* Switch to wishlist */}
          <div
            onClick={() => switchPage('wishlist')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px', margin: '16px 20px 8px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', border: '1.5px dashed var(--border-subtle)',
              cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600
            }}
          >
            <i className="fas fa-heart" style={{ color: 'var(--error)' }}></i>
            <span>View Wishlist ({wishlistItems.length} items)</span>
            <i className="fas fa-chevron-right" style={{ fontSize: 12 }}></i>
          </div>
        </div>

        {/* ===== PAGE: WISHLIST ===== */}
        <div className={`page ${activePage === 'wishlist' ? 'active' : 'exit-left'}`}>
          <div className="page-header">
            <button className="back-btn" onClick={() => switchPage('orders')}><i className="fas fa-arrow-left"></i></button>
            <h2>My Wishlist</h2>
            <div className="header-actions">
              {wishlistItems.length > 0 && (
                <button className="icon-btn" onClick={() => setClearWishDialogOpen(true)}><i className="fas fa-trash-can"></i></button>
              )}
            </div>
          </div>

          <TabBar tabs={wishlistTabs} activeTab={wishlistFilter} onTabChange={setWishlistFilter} />

          {wishlistLoading ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading wishlist...</p>
            </div>
          ) : filteredWishlist.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-heart-crack"></i></div>
              <h3>Your wishlist is empty</h3>
              <p>Browse products and tap the heart icon to save items you love.</p>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '0 32px', marginTop: 16 }} onClick={() => showToast('Browsing products...', 'success')}>
                <i className="fas fa-bag-shopping"></i> Start Shopping
              </button>
            </div>
          ) : (
            <div id="wishlistList">
              {filteredWishlist.map((item) => (
                <WishlistCard
                  key={item.productId || item.name}
                  item={item}
                  onAddToCart={handleWishlistAddToCart}
                  onRemove={handleWishlistRemove}
                />
              ))}
            </div>
          )}

          {/* Switch to orders */}
          <div
            onClick={() => switchPage('orders')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px', margin: '16px 20px 8px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', border: '1.5px dashed var(--border-subtle)',
              cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600
            }}
          >
            <i className="fas fa-box" style={{ color: 'var(--accent-primary)' }}></i>
            <span>View Orders ({displayOrders.length} total)</span>
            <i className="fas fa-chevron-right" style={{ fontSize: 12 }}></i>
          </div>
        </div>

        <div style={{ height: 72 }}></div>
      </div>

      {/* Bottom Nav */}
      <ClientBottomNav activeIndex={4} />

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        open={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        data={selectedOrder ? toDetailData(selectedOrder) : null}
        onTrackOrder={handleTrackOrder}
        onDownloadInvoice={handleDownloadInvoice}
        onReorder={handleReorder}
        onCancel={handleCancelOrder}
      />

      {/* Filter Sheet */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(filters) => {
          setFilterStatuses(filters.status);
          setFilterDateRange(filters.dateRange);
          setFilterMinPrice(filters.minPrice);
          setFilterMaxPrice(filters.maxPrice);
          setFilterOpen(false);
          showToast('Filters applied', 'success');
        }}
        onReset={() => {
          setFilterStatuses([]);
          setFilterDateRange('All Time');
          setFilterMinPrice('');
          setFilterMaxPrice('');
          setFilterOpen(false);
          showToast('Filters reset', 'success');
        }}
      />

      {/* Sort Sheet */}
      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        onSelect={(value) => {
          setSortBy(value);
          setSortOpen(false);
          showToast('Sort updated', 'success');
        }}
        selected={sortBy}
      />

      {/* Dialogs */}
      <CancelDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={confirmCancelOrder}
        orderName={selectedOrder?.items?.[0]?.name}
      />
      <ReorderDialog
        open={reorderDialogOpen}
        onClose={() => setReorderDialogOpen(false)}
        onConfirm={confirmReorder}
        orderName={selectedOrder?.items?.[0]?.name}
      />
      <ClearWishlistDialog
        open={clearWishDialogOpen}
        onClose={() => setClearWishDialogOpen(false)}
        onConfirm={confirmClearWishlist}
      />

      {/* Snackbar */}
      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
