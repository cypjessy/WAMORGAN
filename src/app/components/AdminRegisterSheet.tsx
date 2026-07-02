'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createUserDocument } from '@/lib/db';

interface AdminRegisterSheetProps {
  open: boolean;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function AdminRegisterSheet({ open, onClose, showToast }: AdminRegisterSheetProps) {
  const { signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    setEmailError(false);
    setPasswordError(false);

    if (!email.includes('@')) { setEmailError(true); valid = false; }
    if (password.length < 6) { setPasswordError(true); valid = false; }
    if (!valid) return;

    setLoading(true);
    try {
      const cred = await signUp(email, password);
      await createUserDocument(cred.user.uid, email, {
        displayName: email.split('@')[0],
        role: 'admin',
      });

      try {
        const instanceName = `tenant_${cred.user.uid}`;
        await fetch('/api/evolution/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceName, userId: cred.user.uid }),
        });
      } catch {
        // Non-critical
      }

      showToast('Admin account created!', 'success');
      onClose();
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [email, password, signUp, showToast, onClose, router]);

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom" style={{ padding: '8px 24px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-gradient-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: 24, color: 'var(--accent-primary)',
            }}>
              <i className="fas fa-shield-halved"></i>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Admin Registration</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Create an admin account to manage your store
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="adminEmail">Email</label>
              <div className="input-wrapper">
                <input
                  type="email" id="adminEmail"
                  className={`form-input ${emailError ? 'error' : ''}`}
                  placeholder="admin@store.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(false); }}
                  style={{ paddingLeft: 40 }}
                  autoFocus
                />
                <i className="fas fa-envelope input-icon" style={{ left: 14, right: 'auto' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="adminPassword">Password</label>
              <div className="input-wrapper">
                <input
                  type="password" id="adminPassword"
                  className={`form-input ${passwordError ? 'error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(false); }}
                  style={{ paddingLeft: 40 }}
                />
                <i className="fas fa-lock input-icon" style={{ left: 14, right: 'auto' }} />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" /> : <span>Create Admin Account</span>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}