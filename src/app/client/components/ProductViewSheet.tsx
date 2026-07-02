'use client';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: 0.5,
      margin: '20px 0 12px', paddingTop: 4,
    }}>
      {title}
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductViewSheet({
  open, onClose, product, quantity,
  onChangeQty, onAddToCart, onWishlistToggle,
  isWishlisted,
}: ProductViewSheetProps) {
  if (!product) return null;

  const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
  const displayPrice = hasSalePrice ? product.salePrice! : product.price;
  const original = product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : undefined;
  const discountPercent = original ? Math.round((1 - displayPrice / original) * 100) : 0;
  const isInStock = product.stock != null && product.stock > 0;
  const isLowStock = product.stock != null && product.stock > 0 && product.stock <= (product.sold && product.sold > 0 ? 5 : 5);

  // Build category icon
  const categoryIcons: Record<string, string> = {
    electronics: '📱', fashion: '👕', food: '🍕', beauty: '💄',
    home: '🏠', sports: '⚽', books: '📚', other: '📦',
  };
  const categoryIcon = categoryIcons[product.category?.toLowerCase() || 'other'] || '📦';

  // Format price as currency string
  const fmtPrice = (val: number) => 'KSh ' + val.toLocaleString();

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{ paddingBottom: 0, paddingTop: 0 }}>
        <div className="sheet-handle" />
        <div className="sheet-content" style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Hero Image ── */}
          <div
            className="detail-hero"
            style={
              product.imageUrl
                ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 }
                : undefined
            }
          >
            {!product.imageUrl && (product.emoji || '📦')}
          </div>

          {/* ── Name & SKU ── */}
          <div className="detail-name">{product.name}</div>
          {product.sku && <div className="detail-sku">SKU: {product.sku}</div>}

          {/* ── Price Row ── */}
          <div className="detail-price-row">
            <span className="detail-price">{fmtPrice(displayPrice)}</span>
            {original && (
              <>
                <span className="detail-original">{fmtPrice(original)}</span>
                <span className="detail-discount">-{discountPercent}%</span>
              </>
            )}
          </div>

          {/* ── Status Badges ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {isInStock && isLowStock && <Badge label="Low Stock" color="var(--warning)" />}
            {isInStock && !isLowStock && <Badge label="In Stock" color="var(--success)" />}
            {!isInStock && <Badge label="Out of Stock" color="var(--error)" />}
            {product.badge === 'hot' && <Badge label="Hot" color="var(--warning)" />}
            {product.badge === 'new' && <Badge label="New" color="var(--success)" />}
            {product.status === 'active' && <Badge label="Active" color="var(--accent-primary)" />}
            {product.rating && (
              <Badge label={`★ ${product.rating.toFixed(1)}`} color="var(--warning)" />
            )}
            {product.warranty && <Badge label={`${product.warranty} warranty`} color="var(--info)" />}
          </div>

          {/* ── Category ── */}
          {product.category && (
            <>
              <SectionDivider title="Category" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-gradient-soft)',
                  border: '1px solid var(--border-glow)',
                  fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)',
                }}>
                  <span style={{ fontSize: 16 }}>{categoryIcon}</span>
                  {product.category}
                </span>
                {product.categoryName && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
                  }}>
                    {product.categoryName}
                  </span>
                )}
              </div>
            </>
          )}

          {/* ── Description ── */}
          {product.description && (
            <>
              <SectionDivider title="Description" />
              <p className="detail-description" style={{ marginBottom: 16 }}>{product.description}</p>
            </>
          )}

          {/* ── Specs ── */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <>
              <SectionDivider title="Specifications" />
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="detail-row" style={{ padding: '8px 0' }}>
                  <span className="label" style={{ textTransform: 'capitalize' }}>{key}</span>
                  <span className="value">{String(val)}</span>
                </div>
              ))}
            </>
          )}

          {/* ── Variants ── */}
          {product.variants && product.variants.length > 0 && (
            <>
              <SectionDivider title={`Variants (${product.variants.length})`} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {product.variants.map((v, i) => (
                  <span key={i} className="variant-tag">
                    {Object.values(v.specs).join(' / ')}
                    {v.price !== displayPrice && ` (${fmtPrice(v.price)})`}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* ── Stats ── */}
          <div className="detail-stats-row">
            <div className="detail-stat">
              <div className="detail-stat-value" style={{ color: isInStock ? 'var(--success)' : 'var(--error)' }}>
                {product.stock ?? 0}
              </div>
              <div className="detail-stat-label">In Stock</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value" style={{ color: 'var(--accent-primary)' }}>
                {product.sold || product.orders || 0}
              </div>
              <div className="detail-stat-label">Sold</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value" style={{ color: 'var(--info)' }}>
                {product.rating ? product.rating.toFixed(1) : '—'}
              </div>
              <div className="detail-stat-label">Rating</div>
            </div>
          </div>

        </div>

        {/* ── Bottom Action Bar (outside scroll area) ── */}
        <div style={{
          background: 'rgba(18, 18, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '12px 24px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0,
        }}>
          {/* Total Line + Qty Selector */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                Total
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)' }}>
                {fmtPrice(displayPrice * quantity)}
              </div>
            </div>
            <div className="qty-selector">
              <button onClick={() => onChangeQty(-1)} style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)', border: 'none',
                color: 'var(--text-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}>
                <i className="fas fa-minus"></i>
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                {quantity}
              </span>
              <button onClick={() => onChangeQty(1)} style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)', border: 'none',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                transition: 'all 0.15s ease',
              }}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={onAddToCart}
              style={{
                flex: 1, height: 48, fontSize: 15,
                opacity: isInStock ? 1 : 0.5,
                border: 'none', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)', color: 'white',
                cursor: isInStock ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                transition: 'all 0.25s ease',
              }}
              disabled={!isInStock}
            >
              <i className="fas fa-cart-plus"></i>
              {isInStock ? `Add to Cart` : 'Out of Stock'}
            </button>
            <button
              onClick={() => onWishlistToggle(product.id)}
              style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: isWishlisted ? 'var(--error-soft)' : 'var(--bg-elevated)',
                border: `1.5px solid ${isWishlisted ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`,
                color: isWishlisted ? 'var(--error)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
            >
              <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`}></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
