'use client';

interface RelatedProduct {
  name: string;
  price: string;
  imageUrl: string;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
  onClick: (product: RelatedProduct) => void;
}

export default function RelatedProducts({ products, onClick }: RelatedProductsProps) {
  return (
    <div className="related-section">
      <h3>You May Also Like</h3>
      <div className="related-scroll">
        {products.map((item) => (
          <div key={item.name} className="related-card" onClick={() => onClick(item)}>
            <div className="rel-img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
              {!item.imageUrl && <span style={{ fontSize: 28 }}>📦</span>}
            </div>
            <div className="rel-info">
              <h4>{item.name}</h4>
              <div className="rel-price">KSh {item.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
