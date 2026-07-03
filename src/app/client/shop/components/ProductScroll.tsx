'use client';

import { useState, useEffect, useMemo } from 'react';
import { productService } from '@/lib/db';

interface ProductScrollProps {
  onProductClick: (product: { name: string; price: string; oldPrice?: string; emoji: string; badge?: string }, index?: number) => void;
  onWishClick?: (name: string) => void;
  wishlist?: Set<string>;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const x = Math.sin(seed + i) * 10000;
    const j = Math.floor(Math.abs(x - Math.floor(x)) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ProductScroll({ onProductClick, onWishClick, wishlist }: ProductScrollProps) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    productService.getProducts().then(setProducts).catch(() => {});
  }, []);

  const hourSeed = Math.floor(Date.now() / 3600000);

  const flashDeals = useMemo(() => {
    const withPrice = products.filter((p: any) => p.price > 0);
    const shuffled = seededShuffle(withPrice, hourSeed);
    return shuffled.slice(0, 15).map((p: any) => {
      const price = p.price;
      const hasOriginal = p.originalPrice != null && p.originalPrice > price;
      const oldPrice = hasOriginal ? p.originalPrice : price * (1.2 + Math.sin(hourSeed + (p.id?.charCodeAt(0) || 0)) * 0.15);
      const discount = hasOriginal ? Math.round((1 - price / oldPrice) * 100) : Math.round((1 - price / oldPrice) * 100);
      return {
        name: p.name,
        price: `KSh ${price.toFixed(0)}`,
        oldPrice: `KSh ${Number(oldPrice).toFixed(0)}`,
        emoji: p.emoji || '📦',
        badge: p.badge || `-${discount}%`,
        image: p.images?.[0] || p.imageUrl || '',
        rating: p.rating != null ? p.rating.toFixed(1) : (3.5 + Math.sin(hourSeed + (p.id?.charCodeAt(1) || 0)) * 0.8).toFixed(1),
        reviews: p.orders != null ? `${p.orders}` : `${Math.floor(100 + Math.abs(Math.sin(hourSeed + (p.id?.length || 0)) * 900))}`,
      };
    });
  }, [products, hourSeed]);

  return (
    <div className="product-scroll">
      {flashDeals.map((item, idx) => (
        <div
          key={item.name + idx}
          className="product-card-h"
          onClick={() => onProductClick(item, idx)}
        >
          <div className="prod-img" style={item.image ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
            {!item.image && <span style={{ fontSize: 64 }}>{item.emoji}</span>}
            <span className="discount-badge">{item.badge}</span>
            {onWishClick && (
              <button
                className={`wish-btn ${wishlist?.has(item.name) ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onWishClick(item.name); }}
              >
                <i className={`${wishlist?.has(item.name) ? 'fas' : 'far'} fa-heart`}></i>
              </button>
            )}
          </div>
          <div className="prod-info">
            <h4>{item.name}</h4>
            <div className="prod-price">
              {item.price}
              {item.oldPrice && <span className="old" style={{ color: 'var(--error)', textDecoration: 'line-through' }}>{item.oldPrice}</span>}
            </div>
            <div className="prod-rating">
              <i className="fas fa-star"></i> {item.rating} <span>({item.reviews})</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
