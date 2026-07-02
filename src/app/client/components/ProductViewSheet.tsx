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
  onViewDetails: (productId: string) => void;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductViewSheet({
  open, onClose, product, quantity,
  onChangeQty, onAddToCart, onWishlistToggle,
  isWishlisted, onViewDetails,
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
  const fmtPrice = (val: number) => 'KSh ' + val.toFixed(2);

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content" style={{ paddingBottom: 40 }}>

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

          {/* ── Quantity Selector ── */}
          <SectionDivider title="Quantity" />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
            marginBottom: 20, padding: '12px 0',
          }}>
            <button
              onClick={() => onChangeQty(-1)}
              disabled={quantity <= 1}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: quantity <= 1 ? 0.4 : 1,
                fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}
            >
              <i className="fas fa-minus"></i>
            </button>
            <span style={{ fontSize: 28, fontWeight: 800, minWidth: 48, textAlign: 'center' }}>
              {quantity}
            </span>
            <button
              onClick={() => onChangeQty(1)}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent-gradient)', border: 'none',
                color: 'white', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(232,168,56,0.3)',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
              }}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* ── Total Price Line ── */}
          <div style={{
            textAlign: 'center', marginBottom: 20,
            fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            Total: <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>
              {fmtPrice(displayPrice * quantity)}
            </span>
          </div>

          {/* ── Action Buttons ── */}
          <button
            className="btn btn-primary"
            onClick={onAddToCart}
            style={{ opacity: isInStock ? 1 : 0.5 }}
            disabled={!isInStock}
          >
            <i className="fas fa-cart-plus"></i>
            {isInStock ? `Add to Cart` : 'Out of Stock'}
          </button>

          <button
            className="btn btn-secondary"
            style={{ marginTop: 10 }}
            onClick={() => onWishlistToggle(product.id)}
          >
            <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`}
              style={{ color: isWishlisted ? 'var(--error)' : undefined }}
            ></i>
            {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>

          <button
            className="btn btn-ghost"
            style={{ marginTop: 10 }}
            onClick={() => { onViewDetails(product.id); onClose(); }}
          >
            <i className="fas fa-arrow-right"></i> View Full Details
          </button>

        </div>
      </div>
    </>
  );
}
