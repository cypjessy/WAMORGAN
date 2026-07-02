'use client';

export interface ResultProduct {
  name: string;
  price: string;
  oldPrice?: string;
  emoji: string;
  badge?: string;
  badgeType?: 'sale' | 'new' | 'hot';
  rating: number;
  reviewCount: string;
  image?: string;
}

interface ResultCardProps {
  product: ResultProduct;
  wishlisted: boolean;
  onWishClick: (name: string) => void;
  onCardClick: (product: ResultProduct) => void;
  onAddToCart: (product: ResultProduct) => void;
}

export default function ResultCard({ product, wishlisted, onWishClick, onCardClick, onAddToCart }: ResultCardProps) {
  const fullStars = Math.floor(product.rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(i < fullStars ? 'fas fa-star' : 'far fa-star');
  }

  return (
    <div className="product-card" onClick={() => onCardClick(product)}>
      <div className="prod-img" style={product.image ? { backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        {!product.image && <span style={{ fontSize: 56 }}>{product.emoji}</span>}
        {product.badge && (
          <span className={`badge ${product.badgeType || 'sale'}`}>{product.badge}</span>
        )}
        <button className="wish-btn" onClick={(e) => { e.stopPropagation(); onWishClick(product.name); }}>
          <i className={`${wishlisted ? 'fas' : 'far'} fa-heart`}></i>
        </button>
        <button className="add-cart-btn" onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}>
          <i className="fas fa-plus"></i>
        </button>
      </div>
      <div className="prod-info">
        <h4>{product.name}</h4>
        <div className="prod-price">
          {product.price}
          {product.oldPrice && <span className="old">{product.oldPrice}</span>}
        </div>
        <div className="prod-rating">
          {stars.map((cls, i) => <i key={i} className={cls}></i>)}
          <span>{product.reviewCount}</span>
        </div>
      </div>
    </div>
  );
}
