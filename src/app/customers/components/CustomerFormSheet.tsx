'use client';

import { useState, useEffect } from 'react';

interface CustomerFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  segment?: string;
  waAutomation?: boolean;
}

interface CustomerFormSheetProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialData?: CustomerFormData | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const avatarOptions = [
  { initials: 'JD', gradient: 'linear-gradient(135deg, #E8A838, #D4762A)' },
  { initials: 'AB', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { initials: 'MK', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { initials: 'SL', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  { initials: 'RJ', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { initials: 'TW', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
];

export default function CustomerFormSheet({ open, mode, initialData, onClose, onSave }: CustomerFormSheetProps) {
  const [selectedAvatar, setSelectedAvatar] = useState('JD');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254 ');
  const [address, setAddress] = useState('');
  const [segment, setSegment] = useState('regular');
  const [waAutomation, setWaAutomation] = useState(true);

  useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '+254 ');
      setAddress(initialData.address || '');
      setSegment(initialData.segment || 'regular');
      setWaAutomation(initialData.waAutomation ?? true);
      setSelectedAvatar('JD');
    } else if (open && mode === 'add') {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('+254 ');
      setAddress('');
      setSegment('regular');
      setSelectedAvatar('JD');
      setWaAutomation(true);
    }
  }, [open, mode, initialData]);

  const handleSave = () => {
    if (!firstName || !lastName) return;
    onSave({
      initials: selectedAvatar,
      firstName,
      lastName,
      email,
      phone,
      address,
      segment,
      waAutomation,
    });
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">{mode === 'add' ? 'Add Customer' : 'Edit Customer'}</h3>
          <p className="sheet-subtitle">
            {mode === 'add' ? 'Create a new customer profile' : 'Update customer information'}
          </p>

          {/* Avatar Picker */}
          <div className="form-group">
            <div className="form-label">Avatar</div>
            <div className="avatar-picker">
              {avatarOptions.map((opt) => (
                <div
                  key={opt.initials}
                  className={`avatar-option ${selectedAvatar === opt.initials ? 'selected' : ''}`}
                  style={{ background: opt.gradient }}
                  onClick={() => setSelectedAvatar(opt.initials)}
                >
                  {opt.initials}
                </div>
              ))}
            </div>
          </div>

          {/* Name Row */}
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">First Name</div>
              <input
                type="text"
                className="form-input"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <div className="form-label">Last Name</div>
              <input
                type="text"
                className="form-input"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <div className="form-label">Email</div>
            <input
              type="email"
              className="form-input"
              placeholder="john@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* WhatsApp Number (single phone field) */}
          <div className="form-group">
            <div className="form-label">WhatsApp Number</div>
            <input
              type="tel"
              className="form-input"
              placeholder="+254 712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="form-hint">
              <i className="fas fa-info-circle"></i> Used for all WhatsApp communication with this customer
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <div className="form-label">Address</div>
            <input
              type="text"
              className="form-input"
              placeholder="Street, City, State, ZIP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Segment Select */}
          <div className="form-group">
            <div className="form-label">Segment</div>
            <select
              className="form-input form-select"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
            >
              <option value="regular">Regular</option>
              <option value="vip">VIP</option>
              <option value="new">New</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Toggle */}
          <div className="form-group">
            <div className="toggle-row" onClick={() => setWaAutomation(!waAutomation)}>
              <div className="toggle-label">
                <h4>WhatsApp Automation</h4>
                <p>Allow AI to message this customer</p>
              </div>
              <div className={`toggle-switch ${waAutomation ? 'active' : ''}`}></div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fas fa-check"></i> {mode === 'add' ? 'Save Customer' : 'Update Customer'}
          </button>
          <button className="btn btn-secondary" style={{ marginTop: '10px' }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
