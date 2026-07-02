'use client';

import { useState, useEffect } from 'react';
import { businessProfileService } from '@/lib/db';

interface CurrencySheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const currencies = [
  { code: 'USD', label: 'USD ($)', desc: 'US Dollar' },
  { code: 'EUR', label: 'EUR (€)', desc: 'Euro' },
  { code: 'GBP', label: 'GBP (£)', desc: 'British Pound' },
  { code: 'NGN', label: 'NGN (₦)', desc: 'Nigerian Naira' },
  { code: 'BRL', label: 'BRL (R$)', desc: 'Brazilian Real' },
];

export default function CurrencySheet({ open, onClose, onShowToast }: CurrencySheetProps) {
  const [selected, setSelected] = useState('USD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    businessProfileService.getProfile().then(bp => {
      if (bp?.currency) setSelected(bp.currency);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  const handleSelect = async (code: string) => {
    setSelected(code);
    try {
      await businessProfileService.saveProfile({ currency: code });
      onShowToast('Currency updated', 'success');
    } catch {
      onShowToast('Failed to save currency', 'error');
    }
  };

  if (loading) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Currency</div>
          <div className="sheet-subtitle">Choose your store currency</div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {currencies.map((cur, i) => (
              <div
                key={cur.code}
                onClick={() => handleSelect(cur.code)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < currencies.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
              >
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600 }}>{cur.label}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{cur.desc}</p>
                </div>
                {selected === cur.code && (
                  <i className="fas fa-check" style={{ color: 'var(--accent-primary)', fontSize: 16 }}></i>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
