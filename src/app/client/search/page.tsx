'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { hapticsImpact } from '@/lib/capacitor';
import { productService, searchAnalyticsService, cartService } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import SearchHeader from './components/SearchHeader';
import FilterSortRow from './components/FilterSortRow';
import ActiveFilters from './components/ActiveFilters';
import ResultCard, { ResultProduct } from './components/ResultCard';
import SkeletonGrid from './components/SkeletonGrid';
import EmptyState from './components/EmptyState';
import LoadMore from './components/LoadMore';
import FilterSheet from './components/FilterSheet';
import SortSheet from './components/SortSheet';
import ProductViewSheet from '../components/ProductViewSheet';
import CartDialog from './components/CartDialog';
import ClientBottomNav from '../components/ClientBottomNav';
import Snackbar from './components/Snackbar';
import '../client.css';

const PAGE_SIZE = 20;

const sortOptions = [
  { value: 'popular', icon: 'fas fa-fire', label: 'Most Popular' },
  { value: 'price-high', icon: 'fas fa-arrow-down-9-1', label: 'Price: High to Low' },
  { value: 'price-low', icon: 'fas fa-arrow-up-1-9', label: 'Price: Low to High' },
  { value: 'rating', icon: 'fas fa-star', label: 'Highest Rated' },
  { value: 'newest', icon: 'fas fa-clock', label: 'Newest First' },
  { value: 'discount', icon: 'fas fa-percent', label: 'Biggest Discount' },
];

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="app-container">
        <div className="main-scroll search-scroll">
          <SkeletonGrid />
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

function SearchResultsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const initialPriceMax = searchParams?.get('priceMax') ? Number(searchParams.get('priceMax')) : 99999;
  const initialSort = searchParams?.get('sort') || 'popular';

  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [filterCount, setFilterCount] = useState(0);
  const [activeFilterLabels, setActiveFilterLabels] = useState<string[]>([]);
  const [sort, setSort] = useState(initialSort);
  const [filterPriceMin, setFilterPriceMin] = useState(0);
  const [filterPriceMax, setFilterPriceMax] = useState(initialPriceMax);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategories, setFilterSubcategories] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState(0);
  const [loading, setLoading] = useState(true);

  // Set initial filter labels from URL params
  useEffect(() => {
    const labels: string[] = [];
    if (initialPriceMax < 99999) {
      labels.push(`Under KSh ${initialPriceMax}`);
    }
    setActiveFilterLabels(labels);
    setFilterCount(labels.length);
  }, []);

  // All loaded Firestore products (raw)
  const [rawProducts, setRawProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const products = await productService.getProducts();
        setRawProducts(products);
      } catch (err) { console.error('Failed to load products:', err); }
      finally { setLoading(false); }
    })();
  }, []);

  const matchedProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rawProducts;
    if (q) {
      list = list.filter((p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q)
      );
    }
    // Price filter
    list = list.filter((p: any) => p.price >= filterPriceMin && p.price <= filterPriceMax);
    // Category filter
    if (filterCategory) {
      list = list.filter((p: any) => p.category === filterCategory);
    }
    // Subcategory filter
    if (filterSubcategories.length > 0) {
      list = list.filter((p: any) => filterSubcategories.includes(p.subcategory));
    }
    // Rating filter
    if (filterRating > 0) {
      list = list.filter((p: any) => (p.rating ?? 0) >= filterRating);
    }
    // Sort
    switch (sort) {
      case 'price-high': list = [...list].sort((a: any, b: any) => b.price - a.price); break;
      case 'price-low': list = [...list].sort((a: any, b: any) => a.price - b.price); break;
      case 'rating': list = [...list].sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case 'newest': list = [...list]; break; // already createdAt desc from Firestore
      case 'discount': list = [...list].sort((a: any, b: any) => ((b.originalPrice ?? b.price) - b.price) - ((a.originalPrice ?? a.price) - a.price)); break;
      default: list = [...list]; break; // popular — keep Firestore order
    }
    return list;
  }, [rawProducts, query, filterPriceMin, filterPriceMax, filterCategory, filterSubcategories, filterRating, sort]);

  // ─── Pagination (client-side) ──────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, sort, filterCategory, filterPriceMin, filterPriceMax, filterRating]);

  const pagedProducts: ResultProduct[] = useMemo(() => {
    return matchedProducts.slice(0, visibleCount).map((p: any) => ({
      name: p.name,
      price: `KSh ${p.price.toFixed(0)}`,
      oldPrice: p.originalPrice && p.originalPrice > p.price ? `KSh ${p.originalPrice.toFixed(0)}` : undefined,
      emoji: p.emoji || '📦',
      badge: p.badge || (p.originalPrice && p.originalPrice > p.price ? `-${Math.round((1 - p.price / p.originalPrice) * 100)}%` : undefined),
      badgeType: p.badge ? (p.badge.toLowerCase().includes('new') ? 'new' as const : p.badge.toLowerCase().includes('hot') ? 'hot' as const : 'sale' as const) : 'sale' as const,
      rating: p.rating ?? 4 + Math.random(),
      reviewCount: p.orders ? `${p.orders}` : `${Math.floor(100 + Math.random() * 900)}`,
      image: p.images?.[0] || p.imageUrl || '',
    }));
  }, [matchedProducts, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  };

  // ─── Wishlist (localStorage) ──────────────────────────────────────────
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

  // ─── Cart (Firestore) ──────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setCartLoaded(true); return; }
    cartService.getCart(user.uid).then(items => {
      setCartItems(items.map((i: any) => ({ productId: i.productId, image: i.image, name: i.name, price: i.price })));
    }).catch(() => {}).finally(() => setCartLoaded(true));
  }, [user]);

  // ─── Quick view ────────────────────────────────────────────────────────
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // ─── Sheets & Dialogs ──────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState('');

  // ─── Snackbar ──────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  const handleBack = () => router.back();

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) searchAnalyticsService.recordSearch(q);
    setVisibleCount(PAGE_SIZE);
  };

  const handleFilterApply = (filters: any) => {
    setFilterOpen(false);
    setFilterPriceMin(Number(filters.minPrice) || 0);
    setFilterPriceMax(Number(filters.maxPrice) || 99999);
    setFilterCategory(filters.categories?.[0] || '');
    setFilterSubcategories(filters.subcategories || []);
    setFilterRating(filters.rating);

    const labels: string[] = [];
    if (filters.categories?.length) labels.push(...filters.categories);
    if (filters.subcategories?.length) labels.push(...filters.subcategories);
    if (Number(filters.minPrice) || Number(filters.maxPrice)) {
      labels.push(`KSh ${filters.minPrice || '0'} - KSh ${filters.maxPrice || '∞'}`);
    }
    if (filters.rating >= 4) labels.push(`${filters.rating}+ Stars`);
    setActiveFilterLabels(labels);
    setFilterCount(labels.length);
    showToast('Filters applied', 'success');
  };

  const handleFilterReset = () => {
    setFilterOpen(false);
    setFilterPriceMin(0);
    setFilterPriceMax(99999);
    setFilterCategory('');
    setFilterSubcategories([]);
    setFilterRating(0);
    setActiveFilterLabels([]);
    setFilterCount(0);
    showToast('Filters reset', 'success');
  };

  const handleRemoveFilter = (filter: string) => {
    const next = activeFilterLabels.filter(f => f !== filter);
    setActiveFilterLabels(next);
    setFilterCount(next.length);
  };

  const handleClearFilters = () => {
    setFilterPriceMin(0);
    setFilterPriceMax(99999);
    setFilterCategory('');
    setFilterSubcategories([]);
    setFilterRating(0);
    setActiveFilterLabels([]);
    setFilterCount(0);
    showToast('All filters cleared', 'success');
  };

  const handleSortSelect = (s: string) => {
    setSort(s);
    showToast(`Sorted by ${sortOptions.find(o => o.value === s)?.label}`, 'success');
  };

  const handleWishClick = (name: string) => {
    const next = new Set(wishlist);
    if (next.has(name)) {
      next.delete(name);
      showToast('Removed from wishlist', 'success');
    } else {
      next.add(name);
      showToast('Added to wishlist', 'success');
    }
    setWishlist(next);
  };

  const handleWishlistToggle = (productId: string) => {
    const p = rawProducts.find((r: any) => r.id === productId);
    if (p) handleWishClick(p.name);
  };

  const handleCardClick = async (product: ResultProduct) => {
    await hapticsImpact('light');
    const rawProduct = rawProducts.find((r: any) => r.name === product.name);
    setQuickViewProduct(rawProduct || product);
    setQuickViewQty(1);
    setQuickViewOpen(true);
  };

  const handleAddToCart = (product?: ResultProduct) => {
    const name = product?.name || quickViewProduct?.name || 'Product';
    setLastAddedProduct(name);
    if (product) {
      const p = rawProducts.find((r: any) => r.name === product.name);
      if (p && user) {
        const item = { productId: p.id, image: p.images?.[0] || p.imageUrl || '', name: p.name, price: p.price };
        setCartItems(prev => [...prev, item]);
        cartService.addToCart(user.uid, item);
      }
      setCartDialogOpen(true);
    } else {
      if (quickViewProduct && user) {
        const item = { productId: quickViewProduct.id, image: quickViewProduct.images?.[0] || quickViewProduct.imageUrl || '', name: quickViewProduct.name, price: quickViewProduct.price };
        setCartItems(prev => [...prev, item]);
        cartService.addToCart(user.uid, item);
      }
      setQuickViewOpen(false);
      setCartDialogOpen(true);
    }
  };

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Scroll */}
      <div className="main-scroll search-scroll" id="mainScroll">
        <SearchHeader initialQuery={query} onBack={handleBack} onSearch={handleSearch} onChange={setQuery} />
        <FilterSortRow filterCount={filterCount} resultCount={`${matchedProducts.length} results`} onFilterClick={() => setFilterOpen(true)} onSortClick={() => setSortOpen(true)} />
        <ActiveFilters filters={activeFilterLabels} onRemove={handleRemoveFilter} onClearAll={handleClearFilters} />

        {loading ? (
          <SkeletonGrid />
        ) : query && matchedProducts.length === 0 ? (
          <EmptyState query={query} onClearSearch={() => { handleSearch(''); }} />
        ) : (
          <>
            <div className="results-grid">
              {pagedProducts.map((product) => (
                <ResultCard
                  key={product.name}
                  product={product}
                  wishlisted={wishlist.has(product.name)}
                  onWishClick={handleWishClick}
                  onCardClick={handleCardClick}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            {visibleCount < matchedProducts.length && (
              <LoadMore loading={false} onLoadMore={handleLoadMore} />
            )}
          </>
        )}

        <div style={{ height: 72 }}></div>
      </div>

      {/* Bottom Nav */}
      <ClientBottomNav activeIndex={1} />

      {/* Sheets */}
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} onApply={handleFilterApply} onReset={handleFilterReset} />
      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} onSelect={handleSortSelect} selected={sort} />
      <ProductViewSheet
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={quickViewProduct}
        quantity={quickViewQty}
        onChangeQty={(delta) => setQuickViewQty(prev => Math.max(1, prev + delta))}
        onAddToCart={() => handleAddToCart()}
        onWishlistToggle={handleWishlistToggle}
        isWishlisted={quickViewProduct ? wishlist.has(quickViewProduct.name) : false}
      />

      {/* Dialogs */}
      <CartDialog open={cartDialogOpen} onClose={() => setCartDialogOpen(false)} onCheckout={() => { setCartDialogOpen(false); showToast('Going to checkout', 'success'); }} productName={lastAddedProduct} />

      {/* Snackbar */}
      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
