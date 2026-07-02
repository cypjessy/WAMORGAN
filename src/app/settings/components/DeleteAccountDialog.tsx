'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const BATCH_LIMIT = 500;

async function deleteCollection(collectionName: string): Promise<void> {
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) return;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + BATCH_LIMIT);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

async function deleteUserSubcollections(userId: string): Promise<void> {
  const subcollections = [`users/${userId}/addresses`, `users/${userId}/payments`];
  for (const path of subcollections) {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) continue;
    for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = snap.docs.slice(i, i + BATCH_LIMIT);
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

export default function DeleteAccountDialog({ open, onClose, onShowToast }: DeleteAccountDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'confirm' | 'reauth'>('confirm');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleClose = () => {
    if (deleting) return;
    setStep('confirm');
    setPassword('');
    setError('');
    setProgress('');
    onClose();
  };

  const startDeletion = () => {
    setStep('reauth');
    setError('');
  };

  const executeDeletion = async () => {
    if (!user) return;
    if (!password.trim()) {
      setError('Please enter your password to confirm');
      return;
    }
    setDeleting(true);
    setError('');

    try {
      // 1. Re-authenticate before deleting
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // 2. Wipe all Firestore collections (do this BEFORE auth deletion)
      const collections = [
        'products',
        'orders',
        'customers',
        'conversations',
        'messages',
        'supportTickets',
        'supportMessages',
        'cancellation_requests',
        'searchAnalytics',
        'whatsappSettings',
        'productSettings',
      ];

      for (const name of collections) {
        setProgress(`Deleting ${name}...`);
        try {
          await deleteCollection(name);
        } catch { /* collection may not exist */ }
      }

      // 3. Delete business profile
      setProgress('Deleting business profile...');
      try { await deleteDoc(doc(db, 'businessProfiles', 'main')); } catch {}

      // 4. Delete user doc + subcollections
      if (user.uid) {
        setProgress('Deleting user data...');
        try { await deleteUserSubcollections(user.uid); } catch {}
        try { await deleteDoc(doc(db, 'users', user.uid)); } catch {}
      }

      setProgress('Deleting account...');

      // 5. Delete auth user (this invalidates their token)
      await deleteUser(user);

      onShowToast('Account permanently deleted', 'success');
      handleClose();
      // Redirect happens via auth state change
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before deleting');
      } else {
        setError(err.message || 'Failed to delete account');
      }
    }
    setDeleting(false);
    setProgress('');
  };

  return (
    <div className={`dialog-overlay ${open ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="dialog-box">
        {step === 'confirm' ? (
          <>
            <div className="dialog-icon danger"><i className="fas fa-triangle-exclamation"></i></div>
            <h3>Delete Account?</h3>
            <p>This will permanently delete your account, all products, orders, and customer data. This action cannot be undone.</p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn btn-danger" onClick={startDeletion}>
                <i className="fas fa-trash"></i> Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="dialog-icon danger"><i className="fas fa-lock"></i></div>
            <h3>Confirm Password</h3>
            <p>Enter your password to permanently delete your account and all associated data.</p>
            <div style={{ padding: '12px 0' }}>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') executeDeletion(); }}
                placeholder="Your password"
                style={{ textAlign: 'center', fontSize: 16, height: 48 }}
                autoFocus
              />
              {error && (
                <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </p>
              )}
              {progress && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: 11 }}></i>
                  {progress}
                </p>
              )}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={handleClose} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger" onClick={executeDeletion} disabled={deleting || !password.trim()} style={{ opacity: deleting || !password.trim() ? 0.5 : 1 }}>
                {deleting ? (
                  <><i className="fas fa-spinner fa-spin"></i> Deleting...</>
                ) : (
                  <><i className="fas fa-trash"></i> Permanently Delete</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
