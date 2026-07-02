'use client';

export interface CartItemData {
  id: number;
  productId?: string;
  name: string;
  imageUrl: string;
  variant: string;
  price: number;
  oldPrice?: number;
  qty: number;
}

interface CartItemsSectionProps {
  items: CartItemData[];
  onUpdateQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}

export default function CartItemsSection({ items, onUpdateQty, onRemove }: CartItemsSectionProps) {
  if (items.length === 0) return null;

  return (
    <div id="cartItems">
      {items.map((item) => (
        <div key={item.id} className="cart-item" data-id={item.id}>
          <div className="cart-item-img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!item.imageUrl && <span style={{ fontSize: 32 }}>📦</span>}
          </div>
          <div className="cart-item-info">
            <h4>{item.name}</h4>
            <div className="variant">{item.variant}</div>
            <div className="price">
              ${item.price.toFixed(2)}
              {item.oldPrice && <span className="old">KSh {item.oldPrice.toFixed(2)}</span>}
            </div>
            <div className="cart-item-actions">
              <div className="qty-control-sm">
                <button onClick={() => onUpdateQty(item.id, -1)}><i className="fas fa-minus"></i></button>
                <span>{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, 1)}><i className="fas fa-plus"></i></button>
              </div>
              <button className="remove-btn" onClick={() => onRemove(item.id)}>
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
