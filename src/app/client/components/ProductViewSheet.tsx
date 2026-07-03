'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val: number) => 'KSh ' + val.toLocaleString();

const defaultImages = ['📦', '📦', '📦'];

const colorMap: Record<string, string> = {
  black: '#1a1a1a', white: '#f0f0f0', silver: '#c0c0c0', gray: '#808080',
  red: '#ef4444', blue: '#4a90d9', green: '#10b981', yellow: '#f59e0b',
  purple: '#8b5cf6', pink: '#ec4899', brown: '#8b4513', gold: '#f59e0b',
  navy: '#1e3a5f', teal: '#14b8a6', orange: '#f97316',
};

function getColorHex(name: string): string {
  return colorMap[name.toLowerCase()] || '#6366f1';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Gallery({ images, emoji, discount, badge }: { images?: string[]; emoji?: string; discount?: number; badge?: string }) {
  const slides = images && images.length > 0 ? images : (emoji ? [emoji] : defaultImages);
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);

  const goTo = useCallback((i: number) => {
    const idx = Math.max(0, Math.min(i, slides.length - 1));
    setCurrent(idx);
  }, [slides.length]);

  useEffect(() => {
    setCurrent(0);
  }, [images, emoji]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => goTo((current + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, [current, slides.length, goTo]);

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.changedTouches[0].screenX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].screenX;
    if (diff > 50 && current < slides.length - 1) goTo(current + 1);
    if (diff < -50 && current > 0) goTo(current - 1);
  };

  const isImage = (src: string) => src.startsWith('http') || src.startsWith('data:') || src.startsWith('/');

  return (
    <div className="pv-gallery-container">
      <div className="pv-gallery-main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {(discount != null && discount > 0) ? (
          <span className="pv-gallery-badge" style={discount > 50 ? {background:'var(--error)'} : {background:'var(--accent-primary)'}}>-{discount}% OFF</span>
        ) : badge?.toLowerCase() === 'new' ? (
          <span className="pv-gallery-badge" style={{background:'var(--success)'}}>NEW</span>
        ) : null}
        <div className="pv-gallery-slides" style={{ transform: `translateX(-${current * 100}%)` }}>
          {slides.map((src, i) => (
            <div key={i} className="pv-gallery-slide">
              {isImage(src) ? (
                <img src={src} alt={`Slide ${i + 1}`} />
              ) : (
                <span style={{ fontSize: 100 }}>{src}</span>
              )}
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <div className="pv-gallery-dots">
            {slides.map((_, i) => (
              <button key={i} className={`pv-gallery-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
        )}
      </div>
      {slides.length > 1 && (
        <div className="pv-gallery-thumbs">
          {slides.map((src, i) => (
            <div key={i} className={`pv-gallery-thumb ${i === current ? 'active' : ''}`} onClick={() => goTo(i)}>
              {isImage(src) ? (
                <img src={src} alt={`Thumb ${i + 1}`} />
              ) : (
                <span style={{ fontSize: 24 }}>{src}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stars({ rating, size }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const s = size || 11;
  return (
    <span className="stars" style={{ color: 'var(--warning)', fontSize: s }}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < full ? 'fas fa-star' : (i === full && half ? 'fas fa-star-half-stroke' : 'far fa-star')} />
      ))}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProductViewSheet({
  open, onClose, product, quantity,
  onChangeQty, onAddToCart, onWishlistToggle,
  isWishlisted,
}: ProductViewSheetProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  // Sub-sheets
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!product) return null;

  // Compute slides for gallery + related products
  const slides = product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : (product.emoji ? [product.emoji] : defaultImages));

  const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
  const displayPrice = hasSalePrice ? product.salePrice! : product.price;
  const originalPrice = product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : (hasSalePrice ? product.price : undefined);
  const discountPercent = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const isInStock = product.stock == null || product.stock > 0;
  const isLowStock = product.stock != null && product.stock > 0 && product.stock <= 5;

  // Extract variant specs
  const colorSpecs = product.variants
    ? [...new Set(product.variants.map(v => v.specs?.color).filter(Boolean) as string[])]
    : [];
  const sizeSpecs = product.variants
    ? [...new Set(product.variants.map(v => v.specs?.size || v.specs?.style).filter(Boolean) as string[])]
    : [];

  const handleWishClick = () => {
    onWishlistToggle(product.id);
  };

  const handleAddToCartClick = () => {
    onAddToCart();
    setCartDialogOpen(true);
    setTimeout(() => setCartDialogOpen(false), 2000);
  };

  const handleReviewSubmit = () => {
    setReviewSheetOpen(false);
    setReviewRating(0);
    setReviewText('');
  };

  const handleShare = (method: string) => {
    setShareOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />

      {/* Bottom Sheet */}
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{ padding: 0 }}>

        {/* Handle */}
        <div className="sheet-handle" />

        {/* Scrollable Content */}
        <div className="sheet-content" style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 0' }}>

          {/* Gallery */}
          <Gallery
            images={product.images || (product.imageUrl ? [product.imageUrl] : undefined)}
            emoji={product.emoji}
            discount={discountPercent || undefined}
            badge={product.badge}
          />

          {/* Brand */}
          {product.brand && (
            <div className="pv-brand">
              <i className="fas fa-verified"></i> {product.brand}
            </div>
          )}

          {/* Name */}
          <h1 className="pv-name">{product.name}</h1>

          {/* Meta: Rating + Sold */}
          <div className="pv-meta">
            {product.rating && (
              <div className="pv-rating">
                <i className="fas fa-star"></i> {product.rating.toFixed(1)}
                <span>({product.orders || product.sold || 0} reviews)</span>
              </div>
            )}
            {(product.sold || product.orders) ? (
              <div className="pv-sold">
                <strong>{((product.sold || product.orders) || 0).toLocaleString()}</strong> sold
              </div>
            ) : null}
          </div>

          {/* Price */}
          <div className="pv-price-row">
            <div className="pv-price">
              {fmt(displayPrice)}
              {originalPrice && <span className="pv-old">{fmt(originalPrice)}</span>}
            </div>
            {discountPercent > 0 && (
              <span className="pv-discount-badge">-{discountPercent}%</span>
            )}
          </div>

          {/* Stock */}
          <div className={`pv-stock ${isInStock ? (isLowStock ? 'low' : 'in') : 'out'}`}>
            <i className="fas fa-circle"></i>
            {isInStock ? (isLowStock ? 'Low Stock — Only ' + product.stock + ' left' : 'In Stock') : 'Out of Stock'}
          </div>

          {/* ── Share & Wishlist Action Row ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, height: 44, fontSize: 13 }}
              onClick={() => setShareOpen(true)}
            >
              <i className="fas fa-share-nodes"></i> Share
            </button>
            <button
              className={`btn btn-secondary ${isWishlisted ? 'active' : ''}`}
              style={{
                flex: 1, height: 44, fontSize: 13,
                background: isWishlisted ? 'var(--error-soft)' : undefined,
                borderColor: isWishlisted ? 'rgba(239,68,68,0.2)' : undefined,
                color: isWishlisted ? 'var(--error)' : undefined,
              }}
              onClick={handleWishClick}
            >
              <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`}></i>
              {isWishlisted ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          {/* Color Selector */}
          {colorSpecs.length > 0 && (
            <div className="pv-variant-section">
              <div className="pv-variant-label">
                Color <span>{selectedColor || colorSpecs[0]}</span>
              </div>
              <div className="pv-colors">
                {colorSpecs.map(c => {
                  const active = (selectedColor || colorSpecs[0]) === c;
                  return (
                    <div
                      key={c}
                      className={`pv-color-opt ${active ? 'active' : ''}`}
                      style={{ background: getColorHex(c) }}
                      onClick={() => setSelectedColor(c)}
                    >
                      <i className="fas fa-check check"></i>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size/Style Selector */}
          {sizeSpecs.length > 0 && (
            <div className="pv-variant-section">
              <div className="pv-variant-label">
                Size / Style <span>{selectedSize || sizeSpecs[0]}</span>
              </div>
              <div className="pv-sizes">
                {sizeSpecs.map(s => (
                  <button
                    key={s}
                    className={`pv-size-opt ${(selectedSize || sizeSpecs[0]) === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="pv-desc-section">
              <div className="pv-desc-header">
                <h3>Description</h3>
                {product.description.length > 80 && (
                  <button className="pv-desc-toggle" onClick={() => setDescExpanded(!descExpanded)}>
                    {descExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
              <div className={`pv-desc-fade ${descExpanded ? 'expanded' : ''}`}>
                <div className={`pv-desc-text ${descExpanded ? 'expanded' : ''}`}>
                  {product.description}
                </div>
              </div>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="pv-specs-section">
              <h3>Specifications</h3>
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="pv-spec-row">
                  <span className="label">{key}</span>
                  <span className="value">{String(val)}</span>
                </div>
              ))}
              {product.warranty && (
                <div className="pv-spec-row">
                  <span className="label">Warranty</span>
                  <span className="value">{product.warranty}</span>
                </div>
              )}
              {product.condition && (
                <div className="pv-spec-row">
                  <span className="label">Condition</span>
                  <span className="value">{product.condition}</span>
                </div>
              )}
              {product.sku && (
                <div className="pv-spec-row">
                  <span className="label">SKU</span>
                  <span className="value">{product.sku}</span>
                </div>
              )}
            </div>
          )}

          {/* Related Products */}
          {slides.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>You May Also Like</h3>
              <div style={{
                display: 'flex', gap: 12, overflowX: 'auto',
                scrollbarWidth: 'none', paddingBottom: 4,
              }}>
                {slides.slice(0, 5).map((src: string, i: number) => (
                  <div
                    key={i}
                    style={{
                      minWidth: 130, borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                      overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                    }}
                    onClick={() => {}}
                  >
                    <div style={{
                      width: '100%', height: 130,
                      background: 'var(--bg-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 40,
                    }}>
                      {src.startsWith('http') ? (
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{src}</span>
                      )}
                    </div>
                    <div style={{ padding: 10 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h4>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>{fmt(displayPrice)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="pv-reviews-section">
            <div className="pv-reviews-header">
              <h3>Reviews {product.orders || product.sold ? <span>({(product.orders || product.sold)})</span> : null}</h3>
              {product.rating && (
                <div className="pv-rating-big">
                  <span className="num">{product.rating.toFixed(1)}</span>
                  <Stars rating={product.rating} size={11} />
                </div>
              )}
            </div>

            {/* Rating Breakdown */}
            {product.rating && (
              <div className="pv-rating-breakdown">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = Math.floor((product.orders || product.sold || 100) * Math.max(0.02, Math.random() * 0.3 + (star / 10)));
                  return (
                    <div key={star} className="pv-rating-bar">
                      <span className="star-label">{star}★</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(count / (product.orders || product.sold || 100)) * 100}%` }} />
                      </div>
                      <span className="count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Write Review Button */}
            <button
              className="btn btn-secondary"
              style={{ marginBottom: 16, height: 44, fontSize: 14 }}
              onClick={() => setReviewSheetOpen(true)}
            >
              <i className="fas fa-pen"></i> Write a Review
            </button>

            {/* Size Guide Button (if sizes are shown) */}
            {sizeSpecs.length > 0 && (
              <button
                className="btn btn-ghost"
                style={{ marginBottom: 16, height: 44, fontSize: 14, width: '100%' }}
                onClick={() => setSizeGuideOpen(true)}
              >
                <i className="fas fa-ruler-combined"></i> Size Guide
              </button>
            )}

            {/* Sample Review Cards */}
            <div className="pv-review-card">
              <div className="pv-review-header">
                <div className="pv-review-avatar">J</div>
                <div className="pv-review-meta">
                  <h4>Verified Buyer</h4>
                  <Stars rating={5} />
                  <div className="date">Verified Purchase</div>
                </div>
              </div>
              <div className="pv-review-text">
                Great product! Fast shipping and exactly as described. Highly recommended.
              </div>
            </div>

            <div className="pv-review-card">
              <div className="pv-review-header">
                <div className="pv-review-avatar" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>S</div>
                <div className="pv-review-meta">
                  <h4>Happy Customer</h4>
                  <Stars rating={4} />
                  <div className="date">Verified Purchase</div>
                </div>
              </div>
              <div className="pv-review-text">
                Quality is excellent for the price. Would buy again.
              </div>
            </div>
          </div>

          {/* Bottom spacer for action bar */}
          <div style={{ height: 20 }}></div>
        </div>

        {/* ── Total Row (above action bar) ── */}
        <div className="pv-total-row">
          <div>
            <div className="pv-total-label">Total</div>
            <div className="pv-total-value">{fmt(displayPrice * quantity)}</div>
          </div>
        </div>

        {/* ── Sticky Action Bar ── */}
        <div className="pv-action-bar">
          <div className="pv-qty">
            <button onClick={() => onChangeQty(-1)}><i className="fas fa-minus"></i></button>
            <span>{quantity}</span>
            <button className="plus" onClick={() => onChangeQty(1)}><i className="fas fa-plus"></i></button>
          </div>
          <button
            className="btn btn-primary pv-btn-cart"
            disabled={!isInStock}
            onClick={handleAddToCartClick}
          >
            <i className="fas fa-cart-plus"></i>
            {isInStock ? `Add to Cart — ${fmt(displayPrice * quantity)}` : 'Out of Stock'}
          </button>
          <button
            className="pv-btn-wish"
            style={{
              background: '#25d366',
              border: 'none',
              color: 'white',
              boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
            }}
            onClick={() => setWaDialogOpen(true)}
            title="Ask on WhatsApp"
          >
            <i className="fab fa-whatsapp"></i>
          </button>
        </div>
      </div>

      {/* ── Size Guide Sheet ── */}
      <div className={`modal-overlay ${sizeGuideOpen ? 'active' : ''}`} onClick={() => setSizeGuideOpen(false)} />
      <div className={`bottom-sheet ${sizeGuideOpen ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Size Guide</h3>
          <p className="sheet-subtitle">Find your perfect fit</p>
          <table style={{
            width: '100%', borderCollapse: 'collapse', marginBottom: 16,
          }}>
            <thead>
              <tr>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>Size</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>Length</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>Width</th>
              </tr>
            </thead>
            <tbody>
              {sizeSpecs.map(s => (
                <tr key={s}>
                  <td style={{ padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)' }}>{s}</td>
                  <td style={{ padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)' }}>—</td>
                  <td style={{ padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)' }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-primary" onClick={() => setSizeGuideOpen(false)}>Got It</button>
        </div>
      </div>

      {/* ── WhatsApp Dialog ── */}
      <div className={`dialog-overlay ${waDialogOpen ? 'active' : ''}`} onClick={() => setWaDialogOpen(false)}>
        <div className="dialog-box">
          <div className="dialog-icon success" style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366' }}>
            <i className="fab fa-whatsapp"></i>
          </div>
          <h3>Ask on WhatsApp</h3>
          <p>Chat with our AI assistant about this product. Get instant answers about availability, shipping, and more.</p>
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={() => setWaDialogOpen(false)}>Later</button>
            <button
              className="btn btn-primary"
              style={{ background: '#25d366', boxShadow: '0 4px 24px rgba(37,211,102,0.3)' }}
              onClick={() => { setWaDialogOpen(false); }}
            >
              <i className="fab fa-whatsapp"></i> Chat Now
            </button>
          </div>
        </div>
      </div>

      {/* ── Share Sheet ── */}
      <div className={`modal-overlay ${shareOpen ? 'active' : ''}`} onClick={() => setShareOpen(false)} />
      <div className={`bottom-sheet ${shareOpen ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Share Product</h3>
          <p className="sheet-subtitle">Share this deal with friends</p>
          <div className="pv-share-grid">
            <div className="pv-share-item" onClick={() => handleShare('wa')}>
              <div className="pv-share-icon wa"><i className="fab fa-whatsapp"></i></div>
              <span>WhatsApp</span>
            </div>
            <div className="pv-share-item" onClick={() => handleShare('copy')}>
              <div className="pv-share-icon copy"><i className="fas fa-link"></i></div>
              <span>Copy Link</span>
            </div>
            <div className="pv-share-item" onClick={() => handleShare('sms')}>
              <div className="pv-share-icon sms"><i className="fas fa-message"></i></div>
              <span>Message</span>
            </div>
            <div className="pv-share-item" onClick={() => handleShare('more')}>
              <div className="pv-share-icon more"><i className="fas fa-ellipsis"></i></div>
              <span>More</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShareOpen(false)}>Cancel</button>
        </div>
      </div>

      {/* ── Review Sheet ── */}
      <div className={`modal-overlay ${reviewSheetOpen ? 'active' : ''}`} onClick={() => setReviewSheetOpen(false)} />
      <div className={`bottom-sheet ${reviewSheetOpen ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Write a Review</h3>
          <p className="sheet-subtitle">Share your experience with this product</p>
          <div className="pv-star-input">
            {[1, 2, 3, 4, 5].map(r => (
              <i key={r} className={`fas fa-star ${reviewRating >= r ? 'active' : ''}`} onClick={() => setReviewRating(r)}></i>
            ))}
          </div>
          <textarea
            className="pv-review-textarea"
            placeholder="Tell us what you liked or didn't like..."
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleReviewSubmit}
            disabled={!reviewRating || !reviewText.trim()}
          >
            <i className="fas fa-paper-plane"></i> Submit Review
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setReviewSheetOpen(false)}>Cancel</button>
        </div>
      </div>

      {/* ── Added to Cart Dialog ── */}
      <div className={`dialog-overlay ${cartDialogOpen ? 'active' : ''}`} onClick={() => setCartDialogOpen(false)}>
        <div className="dialog-box">
          <div className="dialog-icon success"><i className="fas fa-check"></i></div>
          <h3>Added to Cart!</h3>
          <p>{product.name} has been added to your cart.</p>
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={() => setCartDialogOpen(false)}>Continue</button>
            <button className="btn btn-primary" onClick={() => { setCartDialogOpen(false); onClose(); }}>
              <i className="fas fa-cart-shopping"></i> View Cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
