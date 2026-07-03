'use client';

interface PromotionRowProps {
  title: string;
  icon: string;
  color: string;
  products: any[];
  onProductClick: (product: any) => void;
  onViewAll: () => void;
}

export default function PromotionRow({ title, icon, color, products, onProductClick, onViewAll }: PromotionRowProps) {
  if (!products.length) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="section-header">
        <span className="section-title"><i className={`fas ${icon}`} style={{ color }}></i> {title}</span>
        <span className="section-action" onClick={onViewAll}>View All</span>
      </div>
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
      }}>
        {products.slice(0, 10).map((item: any) => {
          const img = item.images?.[0] || item.imageUrl || '';
          return (
            <div
              key={item.id || item.name}
              onClick={() => onProductClick(item)}
              style={{
                flex: '0 0 140px', scrollSnapAlign: 'start',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden', cursor: 'pointer',
              }}
            >
              <div style={{
                width: '100%', height: 140,
                background: img ? `url(${img}) center/cover no-repeat` : 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!img && <span style={{ fontSize: 40 }}>{item.emoji || '📦'}</span>}
              </div>
              <div style={{ padding: 10 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  KSh {item.price?.toFixed(0) || '0'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
