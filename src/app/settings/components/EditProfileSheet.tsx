'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { businessProfileService } from '@/lib/db';

interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditProfileSheet({ open, onClose, onSave }: EditProfileSheetProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      businessProfileService.getProfile(),
    ]).then(([bp]) => {
      setName(bp?.businessName || user?.displayName || '');
      setEmail(user?.email || '');
      setPhone(bp?.phone || bp?.whatsappNumber || '');
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [open, user]);

  const handleSave = async () => {
    try {
      await businessProfileService.saveProfile({ businessName: name, phone });
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  if (loading) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Edit Profile</div>
          <div className="sheet-subtitle">Update your personal information</div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white', fontWeight: 700, boxShadow: '0 0 30px rgba(232,168,56,0.3)' }}>
                {(name || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid var(--bg-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer' }}>
                <i className="fas fa-camera"></i>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your business name" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fas fa-check"></i> Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}