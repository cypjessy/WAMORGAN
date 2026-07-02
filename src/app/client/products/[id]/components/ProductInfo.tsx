'use client';

interface ProductInfoProps {
  brand: string;
  name: string;
  rating: number;
  reviewCount: string;
  soldCount: string;
  price: string;
  oldPrice?: string;
  discountLabel?: string;
  stockLabel: string;
  stockLow?: boolean;
}

export default function ProductInfo({
  brand, name, rating, reviewCount, soldCount,
  price, oldPrice, discountLabel, stockLabel, stockLow
}: ProductInfoProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars.push('fas fa-star');
    else if (i === fullStars && hasHalf) stars.push('fas fa-star-half-stroke');
    else stars.push('far fa-star');
  }

  return (
    <div className="product-info">
      <div className="product-brand"><i className="fas fa-badge-check"></i> {brand}</div>
      <h1 className="product-name">{name}</h1>
      <div className="product-meta">
        <div className="product-rating">
          {stars.map((cls, i) => <i key={i} className={cls} style={{ fontSize: 12 }}></i>)}
          <span style={{ marginLeft: 4 }}>{rating}</span>
          <span>({reviewCount})</span>
        </div>
        <div className="product-sold"><strong>{soldCount}</strong> sold</div>
      </div>
      <div className="product-price-row">
        <div className="product-price">
          KSh {parseFloat(price).toLocaleString()}
          {oldPrice && <span className="old">KSh {parseFloat(oldPrice).toLocaleString()}</span>}
        </div>
        {discountLabel && <span className="product-discount">{discountLabel}</span>}
      </div>
      <div className={`product-stock ${stockLow ? 'low' : ''}`}>
        <i className="fas fa-circle"></i> {stockLabel}
      </div>
    </div>
  );
}
