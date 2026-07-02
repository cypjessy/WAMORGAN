'use client';

import { useState } from 'react';

interface PromoCodeProps {
  onApply: (success: boolean, discount: number) => void;
  applied: boolean;
  discount: number;
}

const VALID_CODE = 'SAVE20';

export default function PromoCode({ onApply, applied, discount }: PromoCodeProps) {
  const [code, setCode] = useState('');

  const handleApply = () => {
    if (code.trim().toUpperCase() === VALID_CODE) {
      onApply(true, 0.10); // 10% off
    } else {
      onApply(false, 0);
    }
  };

  const handleRemove = () => {
    onApply(false, 0);
    setCode('');
  };

  return (
    <div className="promo-section">
      <h4><i className="fas fa-tag" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i>Promo Code</h4>
      {!applied ? (
        <div className="promo-input-row">
          <input
            type="text"
            className="promo-input"
            placeholder="Enter code (try: SAVE20)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
          <button className="promo-apply" onClick={handleApply}>Apply</button>
        </div>
      ) : (
        <div className="promo-applied" style={{ display: 'flex' }}>
          <i className="fas fa-check-circle"></i>
          <span>SAVE20 applied - ${discount.toFixed(2)} off</span>
          <span className="remove-promo" onClick={handleRemove}>Remove</span>
        </div>
      )}
    </div>
  );
}
