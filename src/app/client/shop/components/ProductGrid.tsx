'use client';

interface Product {
  name: string;
  price: string;
  emoji: string;
  badge?: string;
  badgeStyle?: string;
  rating: string;
  reviews: string;
  image?: string;
}

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product, index?: number) => void;
  onWishClick: (name: string) => void;
  wishlist?: Set<string>;
}

export default function ProductGrid({ products, onProductClick, onWishClick, wishlist }: ProductGridProps) {
  return (
    <div className="product-grid">
      {products.map((item, idx) => (
        <div
          key={item.name}
          className="product-card"
          onClick={() => onProductClick(item, idx)}
        >
          <div className="prod-img" style={item.image ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
            {!item.image && <span style={{ fontSize: 56 }}>{item.emoji}</span>}
            {item.badge && (
              <span className="discount-badge" style={item.badgeStyle ? { background: item.badgeStyle } : undefined}>
                {item.badge}
              </span>
            )}
            <button
              className={`wish-btn ${wishlist?.has(item.name) ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onWishClick(item.name); }}
            >
              <i className={`${wishlist?.has(item.name) ? 'fas' : 'far'} fa-heart`}></i>
            </button>
          </div>
          <div className="prod-info">
            <h4>{item.name}</h4>
            <div className="prod-price">{item.price}</div>
            <div className="prod-rating">
              <i className="fas fa-star"></i> {item.rating} <span>({item.reviews})</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
