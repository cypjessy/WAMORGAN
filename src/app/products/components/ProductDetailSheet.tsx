'use client';

import categoryData from '../lib/categoryData';

interface Product {
  id: number;
  name: string;
  emoji: string;
  imageUrl?: string;
  price: number;
  original: number;
  stock: number;
  status: string;
  category: string;
  subcategory?: string;
  specs?: Record<string, string[]>;
  badge: string;
  sold: number;
  revenue: string;
  desc: string;
  variants: string[];
  active?: boolean;
  trackInventory?: boolean;
  allowWhatsApp?: boolean;
}

interface ProductDetailSheetProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function DetailRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="detail-row">
      <span className="label">{label}</span>
      <span className="value" style={color ? { color } : undefined}>{value}</span>
    </div>
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductDetailSheet({ open, product, onClose, onEdit, onDelete }: ProductDetailSheetProps) {
  if (!product) return null;

  const discountPercent = product.original > product.price
    ? Math.round((1 - product.price / product.original) * 100)
    : 0;

  // Find category icon from categoryData
  let categoryIcon = '📦';
  if (product.category) {
    const catEntry = Object.entries(categoryData).find(([, cat]) =>
      cat.name.toLowerCase().includes(product.category.toLowerCase())
    );
    if (catEntry) categoryIcon = catEntry[1].icon;
  }

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content" style={{ paddingBottom: 40 }}>

          {/* ── Hero Image ── */}
          <div
            className="detail-hero"
            style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 } : undefined}
          >
            {!product.imageUrl && product.emoji}
          </div>

          {/* ── Name ── */}
          <div className="detail-name">{product.name}</div>

          {/* ── Price Row ── */}
          <div className="detail-price-row">
            <span className="detail-price">KSh {product.price.toLocaleString()}</span>
            {product.original > product.price && (
              <>
                <span className="detail-original">KSh {product.original.toFixed(2)}</span>
                <span className="detail-discount">-{discountPercent}%</span>
              </>
            )}
          </div>

          {/* ── Status Badges ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {/* Stock status */}
            {product.status === 'in' && <Badge label="In Stock" color="var(--success)" />}
            {product.status === 'low' && <Badge label="Low Stock" color="var(--warning)" />}
            {product.status === 'out' && <Badge label="Out of Stock" color="var(--error)" />}

            {/* Product badge */}
            {product.badge === 'hot' && <Badge label="Hot" color="var(--warning)" />}
            {product.badge === 'new' && <Badge label="New" color="var(--success)" />}
            {product.badge === 'low' && <Badge label="Low Stock" color="var(--warning)" />}

            {/* Toggle badges */}
            {product.active !== false && <Badge label="Active" color="var(--accent-primary)" />}
            {product.active === false && <Badge label="Inactive" color="var(--text-muted)" />}
            {product.allowWhatsApp !== false && <Badge label="WhatsApp" color="#25d366" />}
          </div>

          {/* ── Category & Subcategory ── */}
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
            {product.subcategory && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
              }}>
                {product.subcategory}
              </span>
            )}
          </div>

          {/* ── Specs ── */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <>
              <SectionDivider title="Specifications" />
              {Object.entries(product.specs).map(([specKey, values]) => (
                <DetailRow key={specKey} label={specKey.charAt(0).toUpperCase() + specKey.slice(1)} value={
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {values.map((v, i) => (
                      <span key={i} className="variant-tag" style={{ fontSize: 11, padding: '3px 10px' }}>{v}</span>
                    ))}
                  </div>
                } />
              ))}
            </>
          )}

          {/* ── Description ── */}
          <SectionDivider title="Description" />
          <p className="detail-description" style={{ marginBottom: 16 }}>{product.desc}</p>

          {/* ── Stats ── */}
          <div className="detail-stats-row">
            <div className="detail-stat">
              <div className="detail-stat-value" style={{ color: 'var(--warning)' }}>{product.stock}</div>
              <div className="detail-stat-label">In Stock</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value" style={{ color: 'var(--accent-primary)' }}>{product.sold}</div>
              <div className="detail-stat-label">Sold</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value" style={{ color: 'var(--success)' }}>KSh {product.revenue}</div>
              <div className="detail-stat-label">Revenue</div>
            </div>
          </div>

          {/* ── Product Info ── */}
          <SectionDivider title="Product Info" />
          <DetailRow label="Product ID" value={`#${product.id}`} />
          <DetailRow label="Stock" value={
            <span style={{ color: product.stock > 10 ? 'var(--success)' : product.stock > 0 ? 'var(--warning)' : 'var(--error)' }}>
              {product.stock} units
            </span>
          } />
          <DetailRow label="Track Inventory" value={
            <Badge
              label={product.trackInventory !== false ? 'Enabled' : 'Disabled'}
              color={product.trackInventory !== false ? 'var(--success)' : 'var(--text-muted)'}
            />
          } />
          <DetailRow label="WhatsApp Selling" value={
            <Badge
              label={product.allowWhatsApp !== false ? 'Allowed' : 'Blocked'}
              color={product.allowWhatsApp !== false ? '#25d366' : 'var(--error)'}
            />
          } />

          {/* ── Variants ── */}
          {product.variants.length > 0 && (
            <>
              <SectionDivider title={`Variants (${product.variants.length})`} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {product.variants.map((v, i) => (
                  <span key={i} className="variant-tag">{v}</span>
                ))}
              </div>
            </>
          )}

          {/* ── Actions ── */}
          <div className="detail-actions">
            <button className="btn btn-secondary" onClick={() => { onEdit(product.id); onClose(); }}>
              <i className="fas fa-pen"></i> Edit
            </button>
            <button className="btn btn-primary" onClick={() => {}}>
              <i className="fab fa-whatsapp"></i> Share
            </button>
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => { onDelete(product.id); onClose(); }}>
            <i className="fas fa-trash" style={{ color: 'var(--error)' }}></i>
            <span style={{ color: 'var(--error)' }}>Delete Product</span>
          </button>
        </div>
      </div>
    </>
  );
}
