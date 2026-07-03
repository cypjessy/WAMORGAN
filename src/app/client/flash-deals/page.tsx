'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productService, cartService } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import ClientBottomNav from '../components/ClientBottomNav';
import ProductViewSheet from '../components/ProductViewSheet';

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const x = Math.sin(seed + i) * 10000;
    const j = Math.floor(Math.abs(x - Math.floor(x)) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FlashDealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getProducts().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const hourSeed = Math.floor(Date.now() / 3600000);

  const flashDeals = useMemo(() => {
    const withPrice = products.filter((p: any) => p.price > 0);
    const shuffled = seededShuffle(withPrice, hourSeed);
    return shuffled.slice(0, 50).map((p: any) => {
      const price = p.price;
      const fakeMarkup = 1.2 + Math.sin(hourSeed + p.id?.charCodeAt(0) || 0) * 0.15;
      const fakeOriginal = (price * fakeMarkup).toFixed(0);
      const discount = Math.round((1 - price / Number(fakeOriginal)) * 100);
      return {
        name: p.name,
        price: `KSh ${price.toFixed(0)}`,
        oldPrice: `KSh ${fakeOriginal}`,
        emoji: p.emoji || '📦',
        badge: `-${discount}%`,
        image: p.images?.[0] || p.imageUrl || '',
        rating: (3.5 + Math.sin(hourSeed + p.id?.charCodeAt(1) || 0) * 0.8).toFixed(1),
        reviews: `${Math.floor(100 + Math.abs(Math.sin(hourSeed + p.id?.length || 0)) * 900)}`,
      };
    });
  }, [products, hourSeed]);

  // Quick view
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // Cart (localStorage)
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    if (!user) { setCartLoaded(true); return; }
    cartService.getCart(user.uid).then(items => {
      setCartItems(items.map((i: any) => ({ productId: i.productId, image: i.image, name: i.name, price: i.price })));
    }).catch(() => {}).finally(() => setCartLoaded(true));
  }, [user]);

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

  const handleProductClick = (item: any, idx: number) => {
    const rawProduct = products.find((p: any) => p.name === item.name);
    setQuickViewProduct(rawProduct || products[idx % products.length] || null);
    setQuickViewQty(1);
    setQuickViewOpen(true);
  };

  const handleAddToCart = () => {
    if (quickViewProduct) {
      const item = { productId: quickViewProduct.id, image: quickViewProduct.images?.[0] || quickViewProduct.imageUrl || '', name: quickViewProduct.name, price: quickViewProduct.price };
      setCartItems(prev => [...prev, item]);
      if (user) cartService.addToCart(user.uid, item);
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
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Flash Deals</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Limited time offers — refreshed every hour</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <span style={{ fontSize: 13 }}>Loading deals...</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '0 20px 100px' }}>
            {flashDeals.map((item, idx) => (
              <div
                key={item.name + idx}
                onClick={() => handleProductClick(item, idx)}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '100%', height: 180,
                  background: item.image ? `url(${item.image}) center/cover no-repeat` : 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', fontSize: item.image ? 0 : 56,
                }}>
                  {!item.image && <span style={{ fontSize: 56 }}>{item.emoji}</span>}
                  <span style={{
                    position: 'absolute', top: 8, left: 8,
                    padding: '4px 8px', borderRadius: 6,
                    background: 'var(--error)', color: 'white',
                    fontSize: 10, fontWeight: 800,
                  }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ padding: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {item.price}
                    {item.oldPrice && <span style={{ fontSize: 12, color: 'var(--error)', textDecoration: 'line-through', fontWeight: 600, marginLeft: 4 }}>{item.oldPrice}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--warning)', fontWeight: 600, marginTop: 4 }}>
                    <i className="fas fa-star"></i> {item.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
      />

      <ClientBottomNav activeIndex={0} cartCount={cartItems.length} />
    </div>
  );
}