'use client';

import { useState } from 'react';

interface CancelSheetProps {
  open: boolean;
  onClose: () => void;
  onContinue: (reason: string) => void;
}

const reasons = ['Changed my mind', 'Found better price', 'Ordered by mistake', 'Shipping too slow', 'Other reason'];

export default function CancelSheet({ open, onClose, onContinue }: CancelSheetProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      onContinue(selected);
      setSelected(null);
    }
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Cancel Order</h3>
          <p className="sheet-subtitle">Why do you want to cancel?</p>
          {reasons.map((reason) => (
            <div
              key={reason}
              className={`cancel-reason ${selected === reason ? 'selected' : ''}`}
              onClick={() => setSelected(reason)}
            >
              <div className="radio" />
              <div className="info"><h4>{reason}</h4></div>
            </div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleContinue} disabled={!selected}>
            Continue
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onClose}>Keep Order</button>
        </div>
      </div>
    </>
  );
}
