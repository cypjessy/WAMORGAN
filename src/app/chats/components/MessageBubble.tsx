'use client';

interface ProductData {
  emoji: string;
  name: string;
  price: number;
  desc: string;
}

interface MessageBubbleProps {
  type: 'sent' | 'received';
  text?: string;
  time: string;
  status?: string;
  ai?: boolean;
  product?: ProductData;
  onAddToCart?: () => void;
}

export default function MessageBubble({ type, text, time, status, ai, product, onAddToCart }: MessageBubbleProps) {
  if (product) {
    return (
      <div className={`message-row ${type}`}>
        <div className={`message-bubble ${type} product-card-msg`}>
          {ai && (
            <div className="ai-badge-msg"><i className="fas fa-robot"></i> AI Assistant</div>
          )}
          <div className="product-msg-img">{product.emoji}</div>
          <div className="product-msg-info">
            <h4>{product.name}</h4>
            <p>{product.desc}</p>
            <div className="product-msg-price">KSh {product.price}</div>
            <button className="product-msg-btn" onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}>
              <i className="fas fa-cart-plus"></i> Add to Cart
            </button>
          </div>
          <div className="message-meta">
            <span className="message-time">{time}</span>
            {type === 'sent' && (
              <span className={`message-status ${status || ''}`}><i className="fas fa-check-double"></i></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-row ${type}`}>
      <div className={`message-bubble ${type}`}>
        {ai && (
          <div className="ai-badge-msg"><i className="fas fa-robot"></i> AI Assistant</div>
        )}
        {text}
        <div className="message-meta">
          <span className="message-time">{time}</span>
          {type === 'sent' && (
            <span className={`message-status ${status || ''}`}><i className="fas fa-check-double"></i></span>
          )}
        </div>
      </div>
    </div>
  );
}
