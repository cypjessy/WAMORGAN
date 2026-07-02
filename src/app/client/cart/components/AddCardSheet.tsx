'use client';

import { useState } from 'react';

interface AddCardSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AddCardSheet({ open, onClose, onSave }: AddCardSheetProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSave = () => {
    onSave();
    setCardNumber(''); setCardName(''); setExpiry(''); setCvv('');
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Add Card</h3>
          <p className="sheet-subtitle">Enter your card details</p>
          <div className="card-inputs">
            <div className="input-group"><label>Card Number</label><input type="text" placeholder="1234 5678 9012 3456" maxLength={19} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} /></div>
            <div className="input-group"><label>Cardholder Name</label><input type="text" placeholder="John Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} /></div>
            <div className="input-row">
              <div className="input-group"><label>Expiry</label><input type="text" placeholder="MM/YY" maxLength={5} value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
              <div className="input-group"><label>CVV</label><input type="text" placeholder="123" maxLength={3} value={cvv} onChange={(e) => setCvv(e.target.value)} /></div>
            </div>
            <div className="card-icons">
              <i className="fab fa-cc-visa"></i>
              <i className="fab fa-cc-mastercard"></i>
              <i className="fab fa-cc-amex"></i>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSave}>Save Card</button>
        </div>
      </div>
    </>
  );
}
