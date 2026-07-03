'use client';

interface PriceBreakdownProps {
  subtotal: number;
  discount: number;
  shipping: string;
  tax: string;
  total: number;
  compact?: boolean;
}

export default function PriceBreakdown({ subtotal, discount, shipping, tax, total, compact }: PriceBreakdownProps) {
  return (
    <div className="price-breakdown">
      <div className="price-row"><span className="label">Subtotal</span><span className="value">KSh {subtotal.toFixed(2)}</span></div>
      {discount > 0 && <div className="price-row"><span className="label">Discount</span><span className="value discount">-${discount.toFixed(2)}</span></div>}
      <div className="price-row"><span className="label">Shipping</span><span className="value">{shipping}</span></div>
      <div className="price-row"><span className="label">Tax</span><span className="value">{tax}</span></div>
      <div className="price-row total"><span className="label">Total</span><span className="value">KSh {total.toFixed(2)}</span></div>
    </div>
  );
}
