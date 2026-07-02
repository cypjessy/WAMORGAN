'use client';

export interface WishlistData {
  productId?: string;
  imageUrl: string;
  name: string;
  price: string;
  oldPrice?: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  stockLabel: string;
  priceDrop: boolean;
}

interface WishlistCardProps {
  item: WishlistData;
  onAddToCart: (item: WishlistData) => void;
  onRemove: (item: WishlistData) => void;
}

const stockConfig = {
  'in-stock': { class: 'stock-in', icon: 'fa-check-circle' },
  'low-stock': { class: 'stock-low', icon: 'fa-triangle-exclamation' },
  'out-of-stock': { class: 'stock-out', icon: 'fa-circle-xmark' },
};

export default function WishlistCard({ item, onAddToCart, onRemove }: WishlistCardProps) {
  const stock = stockConfig[item.stock];

  return (
    <div className="wishlist-card">
      <div className="wishlist-img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        {!item.imageUrl && <span style={{ fontSize: 32 }}>📦</span>}
      </div>
      <div className="wishlist-info">
        <h4>{item.name}</h4>
        <div className="price">
          {item.price}
          {item.oldPrice && <span className="old">{item.oldPrice}</span>}
        </div>
        <div className={`stock ${stock.class}`}>
          <i className={`fas ${stock.icon}`}></i> {item.stockLabel}
        </div>
        <div className="wishlist-actions">
          <button
            className="btn-cart"
            onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
          >
            <i className="fas fa-cart-plus"></i> Add to Cart
          </button>
          <button
            className="btn-remove"
            onClick={(e) => { e.stopPropagation(); onRemove(item); }}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
