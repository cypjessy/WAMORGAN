'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productService } from '@/lib/db';
import ClientBottomNav from '../components/ClientBottomNav';
import ProductViewSheet from '../components/ProductViewSheet';

const PAGE_SIZE = 20;

export default function NewArrivalsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Quick view state
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // Cart (localStorage)
  const [cartItems, setCartItems] = useState<any[]>([]);
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

  // Wishlist (localStorage)
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

  useEffect(() => {
    productService.getProducts().then(all => {
      setProducts(all);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const newArrivals = useMemo(() => {
    return products
      .filter((p: any) => p.status !== 'draft')
      .sort((a: any, b: any) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tb.getTime() - ta.getTime();
      });
  }, [products]);

  const visibleProducts = newArrivals.slice(0, visibleCount);
  const hasMore = visibleCount < newArrivals.length && visibleCount < 100;

  const handleProductClick = (item: any) => {
    const rawProduct = products.find((p: any) => p.id === item.id || p.name === item.name);
    setQuickViewProduct(rawProduct || item);
    setQuickViewQty(1);
    setQuickViewOpen(true);
  };

  const handleAddToCart = () => {
    if (quickViewProduct) {
      setCartItems(prev => [...prev, { productId: quickViewProduct.id, image: quickViewProduct.images?.[0] || quickViewProduct.imageUrl || '', name: quickViewProduct.name, price: quickViewProduct.price }]);
    }
    setQuickViewOpen(false);
  };

  const handleWishlistToggle = useCallback((productId: string) => {
    const p = products.find((r: any) => r.id === productId);
    if (p) {
      const newWishlist = new Set(wishlist);
      if (newWishlist.has(p.name)) {
        newWishlist.delete(p.name);
      } else {
        newWishlist.add(p.name);
      }
      setWishlist(newWishlist);
    }
  }, [products, wishlist]);

  const handleViewDetails = (productId: string) => {
    setQuickViewOpen(false);
    setTimeout(() => router.push(`/client/products/${productId}`), 300);
  };

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      <div className="main-scroll shop-scroll">
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>New Arrivals</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Latest products added to the store</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <span style={{ fontSize: 13 }}>Loading products...</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '0 20px' }}>
              {visibleProducts.map((item: any, idx: number) => {
                const image = item.images?.[0] || item.imageUrl || '';
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => handleProductClick(item)}
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      overflow: 'hidden', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: '100%', height: 180,
                      background: image ? `url(${image}) center/cover no-repeat` : 'var(--bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {!image && <span style={{ fontSize: 56 }}>{item.emoji || '📦'}</span>}
                    </div>
                    <div style={{ padding: 12 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-primary)' }}>
                        ${item.price?.toFixed(0) || '0'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div style={{ padding: '20px 20px 100px', textAlign: 'center' }}>
                <button
                  onClick={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, 100))}
                  className="btn btn-secondary"
                  style={{ width: '100%', height: 48 }}
                >
                  <i className="fas fa-chevron-down"></i> Load More ({Math.min(newArrivals.length, 100) - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

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

      <ClientBottomNav activeIndex={0} cartCount={cartItems.length} />
    </div>
  );
}