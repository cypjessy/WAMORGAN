'use client';

interface SavedItem {
  name: string;
  price: string;
  imageUrl: string;
}

interface SavedItemsProps {
  items: SavedItem[];
  onMoveToCart: (item: SavedItem) => void;
  onRemove: (item: SavedItem) => void;
}

export default function SavedItems({ items, onMoveToCart, onRemove }: SavedItemsProps) {
  return (
    <div className="saved-section">
      <h3><i className="fas fa-bookmark" style={{ marginRight: 8, color: 'var(--warning)' }}></i>Saved for Later</h3>
      {items.map((item) => (
        <div key={item.name} className="saved-item">
          <div className="saved-item-img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!item.imageUrl && <span style={{ fontSize: 32 }}>📦</span>}
          </div>
          <div className="saved-item-info">
            <h4>{item.name}</h4>
            <div className="price">{item.price}</div>
            <div className="saved-item-actions">
              <button className="primary" onClick={() => onMoveToCart(item)}>Move to Cart</button>
              <button onClick={() => onRemove(item)}>Remove</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
