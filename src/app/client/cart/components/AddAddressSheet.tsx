'use client';

import { useState } from 'react';

interface AddAddressSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (address: { name: string; street: string; city: string; zip: string; state: string; phone: string; default: boolean }) => void;
}

export default function AddAddressSheet({ open, onClose, onSave }: AddAddressSheetProps) {
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSave = () => {
    onSave({ name, street, city, zip, state, phone, default: isDefault });
    setName(''); setStreet(''); setCity(''); setZip(''); setState(''); setPhone(''); setIsDefault(false);
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Add Address</h3>
          <p className="sheet-subtitle">Enter your delivery details</p>
          <div className="form-group"><label>Full Name</label><input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="form-group"><label>Street Address</label><input type="text" placeholder="123 Main Street" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>City</label><input type="text" placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="form-group"><label>ZIP Code</label><input type="text" placeholder="10001" value={zip} onChange={(e) => setZip(e.target.value)} /></div>
          </div>
          <div className="form-group"><label>State</label><input type="text" placeholder="NY" value={state} onChange={(e) => setState(e.target.value)} /></div>
          <div className="form-group"><label>Phone</label><input type="tel" placeholder="+1 234 567 890" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <label className="checkbox-row">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <span>Set as default address</span>
          </label>
          <button className="btn btn-primary" onClick={handleSave}>Save Address</button>
        </div>
      </div>
    </>
  );
}
