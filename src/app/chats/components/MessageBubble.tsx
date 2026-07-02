'use client';

import { Fragment } from 'react';

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
  onDelete?: () => void;
}

// ─── WhatsApp Markdown Parser ───────────────────────────────────────────────
// Converts WhatsApp-style formatting to React elements:
//   *bold*   → <strong>
//   _italic_ → <em>
//   ~strike~ → <del>
//   ```code``` → <code>
//   newlines → <br />

function parseInline(text: string): React.ReactNode[] {
  // Split by markdown patterns while preserving the delimiters
  const parts = text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <strong key={i}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      return <del key={i}>{part.slice(1, -1)}</del>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} style={{ background: 'rgba(0,0,0,0.08)', padding: '2px 4px', borderRadius: 4, fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function formatWhatsAppText(text: string): React.ReactNode {
  // Split by newlines, parse each line, join with <br />
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {parseInline(line)}
    </Fragment>
  ));
}

export default function MessageBubble({ type, text, time, status, ai, product, onAddToCart, onDelete }: MessageBubbleProps) {
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
            <button className="msg-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete?.(); }} title="Delete message">
              <i className="fas fa-trash-alt"></i>
            </button>
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
        {text ? formatWhatsAppText(text) : ''}
        <div className="message-meta">
          <span className="message-time">{time}</span>
          {type === 'sent' && (
            <span className={`message-status ${status || ''}`}><i className="fas fa-check-double"></i></span>
          )}
          <button className="msg-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete?.(); }} title="Delete message">
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
