'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface ProductViewData {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  emoji?: string;
  imageUrl?: string;
  images?: string[];
  stock?: number;
  badge?: string;
  status?: string;
  sku?: string;
  category?: string;
  categoryName?: string;
  rating?: number;
  orders?: number;
  sold?: number;
  variants?: Array<{ id: string; specs: Record<string, string>; sku: string; price: number; stock: number }>;
  specifications?: Record<string, string | number>;
  specs?: Record<string, string[]>;
  warranty?: string;
  brand?: string;
  condition?: string;
  createdAt?: any;
}

interface ProductViewSheetProps {
  open: boolean;
  onClose: () => void;
  product: ProductViewData | null;
  quantity: number;
  onChangeQty: (delta: number) => void;
  onAddToCart: () => void;
  onWishlistToggle: (productId: string) => void;
  isWishlisted: boolean;
}

const fmt = (val: number) => 'KSh ' + val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: `${color}20`, color,
      fontSize: 12, fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

function InfoCard({ children, icon, title }: { children: React.ReactNode; icon?: string; title?: string }) {
  return (
    <div style={{
      marginBottom: 12, padding: 14,
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
    }}>
      {(icon || title) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {icon && <i className={`fas ${icon}`} style={{ fontSize: 14, color: 'var(--accent-primary)' }}></i>}
          {title && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: 12, borderRadius: 'var(--radius-md)',
      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color,
      }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

export default function ProductViewSheet({
  open, onClose, product, quantity,
  onChangeQty, onAddToCart, onWishlistToggle,
  isWishlisted,
}: ProductViewSheetProps) {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    setCurrentImg(0);
  }, [product?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);

  const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
  const displayPrice = hasSalePrice ? product.salePrice! : product.price;
  const originalPrice = product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : (hasSalePrice ? product.price : undefined);
  const discountPercent = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const isInStock = product.stock == null || product.stock > 0;
  const isLowStock = product.stock != null && product.stock > 0 && product.stock <= 5;

  const handleAddToCartClick = () => {
    onAddToCart();
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />

      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{ padding: 0 }}>

        <div className="sheet-handle" />

        <div className="sheet-content" style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 0' }}>

          {/* Hero Image */}
          <div
            style={{
              width: '100%', height: 280, borderRadius: 'var(--radius-lg)',
              background: images[currentImg]
                ? `url(${images[currentImg]}) center/cover no-repeat`
                : 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16, position: 'relative', flexShrink: 0,
            }}
          >
            {!images[currentImg] && (
              <span style={{ fontSize: 64 }}>{product.emoji || '📦'}</span>
            )}
            {discountPercent > 0 && (
              <span style={{
                position: 'absolute', top: 12, left: 12,
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                background: discountPercent > 50 ? 'var(--error)' : 'var(--accent-primary)',
                color: '#fff', fontSize: 13, fontWeight: 800,
              }}>
                -{discountPercent}%
              </span>
            )}
            {product.badge === 'new' && (
              <span style={{
                position: 'absolute', top: 12, left: 12,
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--success)', color: '#fff', fontSize: 13, fontWeight: 800,
              }}>
                NEW
              </span>
            )}
            {images.length > 1 && (
              <div style={{
                position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 6,
              }}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      border: 'none', cursor: 'pointer',
                      background: i === currentImg ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 style={{
            fontSize: 20, fontWeight: 800, letterSpacing: -0.3,
            color: 'var(--text-primary)', margin: '0 0 10px',
          }}>
            {product.name}
          </h1>

          {/* Price Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className="detail-price" style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>
              KSh {displayPrice.toLocaleString()}
            </span>
            {originalPrice && (
              <>
                <span className="detail-original" style={{ fontSize: 16, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  KSh {originalPrice.toLocaleString()}
                </span>
                <span className="detail-discount" style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(239,68,68,0.12)', color: 'var(--error)',
                  fontSize: 12, fontWeight: 800,
                }}>
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Status Badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {isInStock && !isLowStock && <Badge label="In Stock" color="var(--success)" />}
            {isLowStock && <Badge label={`Low Stock — ${product.stock} left`} color="var(--warning)" />}
            {!isInStock && <Badge label="Out of Stock" color="var(--error)" />}
            {product.rating && <Badge label={`★ ${product.rating.toFixed(1)}`} color="var(--warning)" />}
            {(product.sold || product.orders || 0) > 0 && (
              <Badge label={`${(product.sold || product.orders || 0).toLocaleString()} sold`} color="var(--accent-primary)" />
            )}
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <StatCard icon="fa-cubes" value={String(product.stock ?? '—')} label="In Stock" color="var(--warning)" />
            <StatCard icon="fa-chart-line" value={String(product.sold || product.orders || 0)} label="Sold" color="var(--accent-primary)" />
            <StatCard icon="fa-star" value={product.rating ? product.rating.toFixed(1) : '—'} label="Rating" color="var(--success)" />
          </div>

          {/* Description */}
          {product.description && (
            <InfoCard icon="fa-info-circle" title="Description">
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                {product.description}
              </p>
            </InfoCard>
          )}

          {/* Specs from product.specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <InfoCard icon="fa-sliders" title="Specifications">
              {Object.entries(product.specs).map(([specKey, values]) => (
                <div key={specKey} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                    minWidth: 80, flexShrink: 0, textTransform: 'capitalize',
                  }}>{specKey}</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(Array.isArray(values) ? values : [values]).map((v, i) => (
                      <span key={i} style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-gradient-soft)',
                        fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)',
                      }}>{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </InfoCard>
          )}

          {/* Product Info */}
          <InfoCard icon="fa-box" title="Product Info">
            {product.category && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid var(--border-subtle)',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Category</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.category}{product.categoryName ? ` / ${product.categoryName}` : ''}</span>
              </div>
            )}
            {product.brand && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid var(--border-subtle)',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Brand</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.brand}</span>
              </div>
            )}
            {product.condition && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid var(--border-subtle)',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Condition</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.condition}</span>
              </div>
            )}
            {product.warranty && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid var(--border-subtle)',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Warranty</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.warranty}</span>
              </div>
            )}
            {product.sku && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>SKU</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.sku}</span>
              </div>
            )}
          </InfoCard>

          {/* Share & Wishlist */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1, height: 44, fontSize: 13 }}>
              <i className="fas fa-share-nodes"></i> Share
            </button>
            <button
              className={`btn btn-secondary ${isWishlisted ? 'active' : ''}`}
              style={{
                flex: 1, height: 44, fontSize: 13,
                background: isWishlisted ? 'rgba(239,68,68,0.1)' : undefined,
                borderColor: isWishlisted ? 'rgba(239,68,68,0.2)' : undefined,
                color: isWishlisted ? 'var(--error)' : undefined,
              }}
              onClick={() => onWishlistToggle(product.id)}
            >
              <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`}></i>
              {isWishlisted ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          <div style={{ height: 4 }}></div>
        </div>

        {/* Sticky Action Bar */}
        <div style={{
          padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <button
              onClick={() => onChangeQty(-1)}
              disabled={quantity <= 1}
              style={{
                width: 48, height: 48, border: 'none', background: 'var(--bg-card)',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: quantity <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                opacity: quantity <= 1 ? 0.4 : 1, transition: 'all 0.15s',
              }}
            >
              <i className="fas fa-minus"></i>
            </button>
            <span style={{
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: 'var(--text-primary)',
              background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-subtle)',
              borderRight: '1px solid var(--border-subtle)',
            }}>
              {quantity}
            </span>
            <button
              onClick={() => onChangeQty(1)}
              style={{
                width: 48, height: 48, border: 'none', background: 'var(--bg-card)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: 'var(--text-primary)', transition: 'all 0.15s',
              }}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
          <button
            className="btn btn-primary"
            style={{
              flex: 1, height: 48, borderRadius: 'var(--radius-lg)',
              fontSize: 14, fontWeight: 700,
              background: !isInStock ? 'var(--text-muted)' : undefined,
              opacity: !isInStock ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            disabled={!isInStock}
            onClick={handleAddToCartClick}
          >
            <i className="fas fa-cart-plus" style={{ fontSize: 16, marginTop: -1 }}></i>
            {isInStock ? (
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span>Add to Cart</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>|</span>
                <span style={{ fontSize: 13 }}>{fmt(displayPrice * quantity)}</span>
              </span>
            ) : (
              <span>Out of Stock</span>
            )}
          </button>
        </div>
      </div>

    </>
  );
}
