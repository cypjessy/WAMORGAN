'use client';

import '../client.css';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { productService, orderService, searchAnalyticsService } from '@/lib/db';
import ClientHeader from './components/ClientHeader';
import SearchSection from './components/SearchSection';
import QuickTags from './components/QuickTags';
import HeroCarousel from './components/HeroCarousel';
import CategoryGrid from './components/CategoryGrid';
import FlashBanner from './components/FlashBanner';
import ProductScroll from './components/ProductScroll';
import ProductGrid from './components/ProductGrid';
import BrandStrip from './components/BrandStrip';
import CartBar from './components/CartBar';
import ClientBottomNav from '../components/ClientBottomNav';
import ProductViewSheet from '../components/ProductViewSheet';
import FilterSheet from './components/FilterSheet';
import SortSheet from './components/SortSheet';
import NotifSheet from './components/NotifSheet';
import CartDialog from './components/CartDialog';
import Snackbar from './components/Snackbar';

interface CartItem {
  image: string;
  name: string;
  price: number;
}

interface ShopProduct {
  name: string;
  price: string;
  numPrice: number;
  emoji: string;
  badge?: string;
  badgeStyle?: string;
  rating: string;
  reviews: string;
  image?: string;
}

export default function ClientShopPage() {
  const router = useRouter();

  // Products from Firestore
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const products = await productService.getProducts();
        setRawProducts(products);
      } catch (err) { console.error('Failed to load products:', err); }
      finally { setShopLoading(false); }
    })();
  }, []);

  // ─── Real product data from Firestore ────────────────────────────────────
  const shopProducts = useMemo(() => rawProducts.map((p) => ({
    name: p.name,
    price: `KSh ${p.price.toFixed(0)}`,
    numPrice: p.price,
    emoji: p.emoji || '📦',
    badge: p.badge || undefined,
    badgeStyle: 'var(' + (p.badge ? '--accent-primary)' : '--success)'),
    rating: p.rating != null ? p.rating.toFixed(1) : (4 + Math.random()).toFixed(1),
    reviews: p.orders != null ? `${p.orders}` : `${Math.floor(100 + Math.random() * 900)}`,
    image: p.images?.[0] || p.imageUrl || '',
  })), [rawProducts]);

  // ─── Sort state ──────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<string>('Most Popular');
  const sortedProducts = useMemo(() => {
    const list = [...shopProducts];
    switch (sortKey) {
      case 'Price: High to Low': return list.sort((a, b) => b.numPrice - a.numPrice);
      case 'Price: Low to High': return list.sort((a, b) => a.numPrice - b.numPrice);
      case 'Highest Rated': return list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      case 'Newest First': return list.sort((a, b) => {
        const aIdx = rawProducts.findIndex(r => r.name === a.name);
        const bIdx = rawProducts.findIndex(r => r.name === b.name);
        return aIdx - bIdx;
      });
      default: return list; // Most Popular — keep Firestore order
    }
  }, [shopProducts, sortKey, rawProducts]);

  const newArrivals = sortedProducts.slice(0, 15);
  const trendingProducts = sortedProducts.length > 4 ? sortedProducts.slice(4, 8) : sortedProducts.slice(0, 4);

  // ─── Filter state ────────────────────────────────────────────────────────
  const [filterPriceMin, setFilterPriceMin] = useState<number>(0);
  const [filterPriceMax, setFilterPriceMax] = useState<number>(99999);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterRating, setFilterRating] = useState<string>('Any');

  const filteredProducts = useMemo(() => {
    return sortedProducts.filter(p => {
      if (p.numPrice < filterPriceMin || p.numPrice > filterPriceMax) return false;
      if (filterCategory !== 'All') {
        const match = rawProducts.find(r => r.name === p.name);
        if (!match || match.category !== filterCategory) return false;
      }
      if (filterRating === '4+ Stars' && parseFloat(p.rating) < 4) return false;
      if (filterRating === '3+ Stars' && parseFloat(p.rating) < 3) return false;
      return true;
    });
  }, [sortedProducts, filterPriceMin, filterPriceMax, filterCategory, filterRating, rawProducts]);

  // ─── Category brand filter ──────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterVisibleCount, setFilterVisibleCount] = useState(10);
  const PAGE_STEP = 10;

  const filteredRawProducts = useMemo(() => {
    if (!activeFilter) return [];
    const q = activeFilter.toLowerCase();
    return rawProducts.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.subcategory?.toLowerCase().includes(q)
    );
  }, [rawProducts, activeFilter]);

  const filteredDisplay = useMemo(() => {
    return filteredRawProducts.slice(0, filterVisibleCount).map(p => ({
      name: p.name,
      price: `KSh ${p.price.toFixed(0)}`,
      emoji: p.emoji || '📦',
      rating: p.rating != null ? p.rating.toFixed(1) : (4 + Math.random()).toFixed(1),
      reviews: p.orders != null ? `${p.orders}` : `${Math.floor(100 + Math.random() * 900)}`,
      image: p.images?.[0] || p.imageUrl || '',
    }));
  }, [filteredRawProducts, filterVisibleCount]);

  // ─── Cart (localStorage-persisted) ──────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wamorgan_cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch {}
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (cartLoaded) localStorage.setItem('wamorgan_cart', JSON.stringify(cartItems));
  }, [cartItems, cartLoaded]);

  const [cartBarVisible, setCartBarVisible] = useState(true);

  // ─── Wishlist (localStorage-persisted) ──────────────────────────────────
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishLoaded, setWishLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wamorgan_wishlist');
      if (saved) setWishlist(new Set(JSON.parse(saved)));
    } catch {}
    setWishLoaded(true);
  }, []);

  useEffect(() => {
    if (wishLoaded) localStorage.setItem('wamorgan_wishlist', JSON.stringify([...wishlist]));
  }, [wishlist, wishLoaded]);

  // ─── Quick view ──────────────────────────────────────────────────────────
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // ─── Sheets & dialogs ────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState('');

  // Unread notification count
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    orderService.getOrders().then(orders => {
      setNotifCount(orders.filter(o => o.status === 'pending').length);
    }).catch(() => {});
  }, []);

  // ─── Snackbar ────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  const lastScrollRef = useRef(0);

  const handleWishClick = (name: string) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(name)) {
      newWishlist.delete(name);
      showToast('Removed from wishlist', 'success');
    } else {
      newWishlist.add(name);
      showToast('Added to wishlist', 'success');
    }
    setWishlist(newWishlist);
  };

  const handleWishlistToggle = (productId: string) => {
    // Find product in rawProducts by id
    const p = rawProducts.find((r: any) => r.id === productId);
    if (p) {
      handleWishClick(p.name);
    }
  };

  const handleProductClick = (product: any, index?: number) => {
    // Find the raw Firestore product by name (index is unreliable from shuffled lists)
    const rawProduct = rawProducts.find((r: any) => r.name === product.name)
      || (index !== undefined ? rawProducts[index] : undefined);
    setQuickViewProduct(rawProduct || product);
    setQuickViewQty(1);
    setQuickViewOpen(true);
  };

  const handleViewDetails = (productId: string) => {
    setQuickViewOpen(false);
    if (!productId) return;
    setTimeout(() => router.push(`/client/products/${productId}`), 300);
  };

  const handleAddToCart = () => {
    if (quickViewProduct) {
      const image = quickViewProduct.images?.[0] || quickViewProduct.imageUrl || '';
      const price = quickViewProduct.price;
      const priceNum = typeof price === 'string' ? parseInt(price.replace(/[$,]/g, '')) : price;
      const name = quickViewProduct.name;
      setCartItems(prev => [...prev, { productId: quickViewProduct.id, image, name, price: priceNum }]);
      setLastAddedProduct(name);
    }
    setQuickViewOpen(false);
    setCartBarVisible(true);
    setTimeout(() => setCartDialogOpen(true), 300);
  };

  const handleViewCart = () => {
    setCartDialogOpen(false);
    router.push('/client/cart');
  };

  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0).toLocaleString();

  // Handle scroll for cart bar
  useEffect(() => {
    const el = document.getElementById('mainScroll');
    if (!el) return;
    const handler = () => {
      const currentScroll = el.scrollTop;
      const cartBar = document.getElementById('cartBar');
      if (!cartBar) return;
      if (currentScroll > lastScrollRef.current && currentScroll > 100) {
        cartBar.style.transform = 'translateX(-50%) translateY(100px)';
      } else {
        cartBar.style.transform = 'translateX(-50%) translateY(0)';
      }
      lastScrollRef.current = currentScroll;
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="app-container">
      {/* Background */}
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Scroll */}
      <div className="main-scroll shop-scroll" id="mainScroll">
        <ClientHeader cartCount={cartCount} notifCount={notifCount} onNotifClick={() => setNotifOpen(true)} onCartClick={() => router.push('/client/cart')} />
        <SearchSection onSearch={(query) => { searchAnalyticsService.recordSearch(query); router.push(`/client/search?q=${encodeURIComponent(query)}`); }} />
        <QuickTags onTagClick={(label) => router.push(`/client/search?q=${encodeURIComponent(label)}`)} />
        <HeroCarousel onCtaClick={(label) => router.push('/client/search?deals=summer-sale')} />
        
        <div className="section-header">
          <span className="section-title"><i className="fas fa-grid-2"></i> Categories</span>
          <span className="section-action" onClick={() => router.push('/client/search')}>See All <i className="fas fa-arrow-right" style={{ fontSize: 10 }}></i></span>
        </div>
        <CategoryGrid onCategoryClick={(label) => router.push(`/client/search?q=${encodeURIComponent(label)}`)} />
        
        <FlashBanner onClick={() => router.push('/client/flash-deals')} />
        
        <div className="section-header">
          <span className="section-title"><i className="fas fa-fire"></i> Flash Deals</span>
          <span className="section-action" onClick={() => router.push('/client/flash-deals')}>View All</span>
        </div>
        <ProductScroll onProductClick={(p) => handleProductClick(p)} />
        
        <div className="section-header">
          <span className="section-title"><i className="fas fa-sparkles"></i> New Arrivals</span>
          <span className="section-action" onClick={() => router.push('/client/new-arrivals')}>View All</span>
        </div>
        <ProductGrid products={newArrivals} onProductClick={(p, idx) => handleProductClick(p, idx)} onWishClick={handleWishClick} wishlist={wishlist} />
        
        <div className="section-header">
          <span className="section-title"><i className="fas fa-tag"></i> Popular Categories</span>
        </div>
        <BrandStrip onBrandClick={(label) => { setActiveFilter(label); setFilterVisibleCount(10); }} />
        
        {/* Filtered Products */}
        {activeFilter && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <i className="fas fa-search"></i> {activeFilter}
              </span>
              <button
                onClick={() => setActiveFilter(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 4,
                }}
              >
                <i className="fas fa-times"></i> Clear
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '0 20px' }}>
              {filteredDisplay.map((item, idx) => (
                <div
                  key={item.name + idx}
                  className="product-card"
                  onClick={() => handleProductClick(item, idx)}
                  style={{ borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div className="prod-img" style={item.image ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                    {!item.image && <span style={{ fontSize: 56 }}>{item.emoji}</span>}
                  </div>
                  <div className="prod-info" style={{ padding: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                    <div className="prod-price" style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-primary)' }}>{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
            {filterVisibleCount < filteredRawProducts.length && (
              <div style={{ padding: '16px 20px 0', textAlign: 'center' }}>
                <button
                  onClick={() => setFilterVisibleCount(prev => prev + PAGE_STEP)}
                  className="btn btn-secondary"
                  style={{ width: '100%', height: 44, fontSize: 13 }}
                >
                  <i className="fas fa-chevron-down"></i> Load More ({filteredRawProducts.length - filterVisibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="section-header">
          <span className="section-title"><i className="fas fa-heart"></i> Trending Now</span>
          <span className="section-action" onClick={() => router.push('/client/search?q=trending')}>View All</span>
        </div>
        <ProductGrid products={trendingProducts} onProductClick={(p, idx) => handleProductClick(p, idx)} onWishClick={handleWishClick} wishlist={wishlist} />
        
        <div style={{ height: 20 }}></div>
      </div>

      {/* Cart Bar */}
      <CartBar
        visible={cartBarVisible}
        items={cartItems.slice(0, 3)}
        total={cartTotal}
        count={cartCount}
        onCheckout={() => router.push('/client/cart')}
      />

      {/* Bottom Nav */}
      <ClientBottomNav activeIndex={0} cartCount={cartCount} />

      {/* Product View Sheet */}
      <ProductViewSheet
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={quickViewProduct}
        quantity={quickViewQty}
        onChangeQty={(delta) => setQuickViewQty(prev => Math.max(1, prev + delta))}
        onAddToCart={handleAddToCart}
        onWishlistToggle={handleWishlistToggle}
        isWishlisted={quickViewProduct ? wishlist.has(quickViewProduct.name) : false}
        onViewDetails={handleViewDetails}
      />

      {/* Filter & Sort Sheets */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(min, max, cat, rating) => { setFilterPriceMin(min); setFilterPriceMax(max); setFilterCategory(cat); setFilterRating(rating); setFilterOpen(false); showToast('Filters applied', 'success'); }}
        onReset={() => { setFilterPriceMin(0); setFilterPriceMax(99999); setFilterCategory('All'); setFilterRating('Any'); setFilterOpen(false); }}
        categories={[...new Set(rawProducts.map((p: any) => p.category).filter(Boolean))] as string[]}
      />
      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} onSelect={(label) => { setSortKey(label); setSortOpen(false); }} />
      
      {/* Notifications Sheet */}
      <NotifSheet open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Dialogs */}
      <CartDialog open={cartDialogOpen} onClose={() => setCartDialogOpen(false)} onCheckout={handleViewCart} productName={lastAddedProduct} />

      {/* Snackbar */}
      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
