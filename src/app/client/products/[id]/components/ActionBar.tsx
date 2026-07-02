'use client';

interface ActionBarProps {
  quantity: number;
  price: number;
  onChangeQty: (delta: number) => void;
  onAddToCart: () => void;
  onWhatsApp: () => void;
}

export default function ActionBar({ quantity, price, onChangeQty, onAddToCart, onWhatsApp }: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="qty-selector">
        <button onClick={() => onChangeQty(-1)}><i className="fas fa-minus"></i></button>
        <span>{quantity}</span>
        <button onClick={() => onChangeQty(1)}><i className="fas fa-plus"></i></button>
      </div>
      <button className="btn btn-primary btn-cart" onClick={onAddToCart}>
        <i className="fas fa-cart-plus"></i> Add to Cart — KSh {(price * quantity).toLocaleString()}
      </button>
      <button className="btn-wa-sm" onClick={onWhatsApp}>
        <i className="fab fa-whatsapp"></i>
      </button>
    </div>
  );
}
