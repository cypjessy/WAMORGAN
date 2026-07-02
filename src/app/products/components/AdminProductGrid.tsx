import './admin_products.css'; // Admin premium product styling

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
  badge: string;
  sold: number;
  revenue: string;
  desc: string;
  variants: string[];
}

interface AdminProductGridProps {
  products: Product[];
  currentView: 'grid' | 'list';
  onProductClick: (id: number) => void;
  onEditClick: (id: number) => void;
  onDeleteClick: (id: number) => void;
  onAddProduct?: () => void;
}

export default function AdminProductGrid({ products, currentView, onProductClick, onEditClick, onDeleteClick, onAddProduct }: AdminProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="admin-empty-state">
        <div className="admin-empty-icon">
          <i className="fas fa-box-open"></i>
        </div>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters, or add a new product to get started.</p>
        {onAddProduct && (
          <button className="btn btn-primary" onClick={onAddProduct}>
            <i className="fas fa-plus"></i> Add Product
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {currentView === 'grid' ? (
        <div className="admin-product-grid">
          {products.map((p) => (
            <div key={p.id} className="admin-product-card premium-card" onClick={() => onProductClick(p.id)}>
              <div
                className="admin-product-image premium-image"
                style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!p.imageUrl && p.emoji}
                {p.badge && (
                  <span className={`admin-product-badge premium-badge badge-${p.badge}`}>
                    {p.badge === 'low' ? 'Low Stock' : p.badge === 'new' ? 'New' : 'Hot'}
                  </span>
                )}
                <div className="admin-product-actions premium-actions">
                  <button className="admin-product-action-btn premium-action-btn" onClick={(e) => { e.stopPropagation(); onEditClick(p.id); }}>
                    <i className="fas fa-pen"></i>
                  </button>
                  <button className="admin-product-action-btn premium-action-btn" onClick={(e) => { e.stopPropagation(); onDeleteClick(p.id); }}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="admin-product-info premium-info">
                <div className="admin-product-name premium-name">{p.name}</div>
                <div className="admin-product-price-row premium-price-row">
                  <span className="admin-product-price premium-price">KSh {p.price.toLocaleString()}</span>
                  {p.original > p.price && (
                    <span className="admin-product-original premium-original">KSh {p.original.toLocaleString()}</span>
                  )}
                  <span className={`admin-product-stock premium-stock stock-${p.status || 'in'}`}>
                    {p.status === 'out' ? 'Out' : `${p.stock} left`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-product-list premium-list">
          {products.map((p) => (
            <div key={p.id} className="admin-product-list-item premium-list-item" onClick={() => onProductClick(p.id)}>
              <div
                className="admin-product-list-img premium-list-img"
                style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!p.imageUrl && p.emoji}
                {p.badge && (
                  <span className={`admin-product-list-badge premium-list-badge badge-${p.badge}`}>
                    {p.badge === 'low' ? 'Low Stock' : p.badge === 'new' ? 'New' : 'Hot'}
                  </span>
                )}
              </div>
              <div className="admin-product-list-info premium-list-info">
                <h4 className="admin-product-list-title premium-list-title">{p.name}</h4>
                <div className="admin-product-list-meta premium-list-meta">
                  <span className="admin-product-list-category premium-list-category">{p.category}</span>
                  <span className="admin-product-list-stock premium-list-stock">
                    Stock: {p.stock} | Status: <span className={`status-dot status-${p.status}`}></span> {p.status}
                  </span>
                </div>
                <div className="admin-product-list-details premium-list-details">
                  <div className="admin-product-list-price premium-list-price">KSh {p.price.toLocaleString()}</div>
                  <button
                    className="admin-product-list-edit-btn premium-list-edit-btn"
                    onClick={(e) => { e.stopPropagation(); onEditClick(p.id); }}
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button
                    className="admin-product-list-delete-btn premium-list-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteClick(p.id); }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
