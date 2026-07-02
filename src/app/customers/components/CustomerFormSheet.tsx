'use client';

import { useState, useEffect } from 'react';

interface CustomerFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsApp?: string;
  address?: string;
  segment?: string;
  waAutomation?: boolean;
  emailNotifs?: boolean;
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
  const [phone, setPhone] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [address, setAddress] = useState('');
  const [segment, setSegment] = useState('regular');
  const [waAutomation, setWaAutomation] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setWhatsApp(initialData.whatsApp || '');
      setAddress(initialData.address || '');
      setSegment(initialData.segment || 'regular');
      setWaAutomation(initialData.waAutomation ?? true);
      setEmailNotifs(initialData.emailNotifs ?? true);
      setSelectedAvatar('JD');
    } else if (open && mode === 'add') {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setWhatsApp('');
      setAddress('');
      setSegment('regular');
      setSelectedAvatar('JD');
      setWaAutomation(true);
      setEmailNotifs(true);
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
      whatsApp,
      address,
      segment,
      waAutomation,
      emailNotifs,
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

          {/* Phone */}
          <div className="form-group">
            <div className="form-label">Phone Number</div>
            <input
              type="tel"
              className="form-input"
              placeholder="+1 234 567 890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* WhatsApp */}
          <div className="form-group">
            <div className="form-label">WhatsApp Number</div>
            <input
              type="tel"
              className="form-input"
              placeholder="+1 234 567 890"
              value={whatsApp}
              onChange={(e) => setWhatsApp(e.target.value)}
            />
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

          {/* Toggles */}
          <div className="form-group">
            <div className="toggle-row" onClick={() => setWaAutomation(!waAutomation)}>
              <div className="toggle-label">
                <h4>WhatsApp Automation</h4>
                <p>Allow AI to message this customer</p>
              </div>
              <div className={`toggle-switch ${waAutomation ? 'active' : ''}`}></div>
            </div>
            <div className="toggle-row" onClick={() => setEmailNotifs(!emailNotifs)}>
              <div className="toggle-label">
                <h4>Email Notifications</h4>
                <p>Send order updates via email</p>
              </div>
              <div className={`toggle-switch ${emailNotifs ? 'active' : ''}`}></div>
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
