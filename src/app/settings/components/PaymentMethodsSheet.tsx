'use client';

import { useState, useEffect } from 'react';
import { businessProfileService } from '@/lib/db';

interface PaymentMethodsSheetProps {
  open: boolean;
  onClose: () => void;
}

type MpesaTab = 'buyGoods' | 'paybill' | 'personal';

export default function PaymentMethodsSheet({ open, onClose }: PaymentMethodsSheetProps) {
  const [loading, setLoading] = useState(true);

  // M-Pesa
  const [mpesaEnabled, setMpesaEnabled] = useState(false);
  const [mpesaActiveTab, setMpesaActiveTab] = useState<MpesaTab>('buyGoods');
  const [mpesaBusinessName, setMpesaBusinessName] = useState('');
  const [tillNumber, setTillNumber] = useState('');
  const [paybillNumber, setPaybillNumber] = useState('');
  const [paybillAccount, setPaybillAccount] = useState('');
  const [personalName, setPersonalName] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');

  // Bank
  const [bankEnabled, setBankEnabled] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankSwiftCode, setBankSwiftCode] = useState('');

  // Card & Cash
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cashEnabled, setCashEnabled] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    businessProfileService.getProfile().then(bp => {
      const pm = bp?.paymentMethods;
      if (pm) {
        setMpesaEnabled(pm.mpesa?.enabled || false);
        setTillNumber(pm.mpesa?.buyGoods?.tillNumber || '');
        setPaybillNumber(pm.mpesa?.paybill?.paybillNumber || '');
        setPaybillAccount(pm.mpesa?.paybill?.accountNumber || '');
        setBankEnabled(pm.bank?.enabled || false);
        setBankName(pm.bank?.bankName || '');
        setBankAccountName(pm.bank?.accountName || '');
        setBankAccountNumber(pm.bank?.accountNumber || '');
        setCardEnabled(pm.card?.enabled || false);
        setCashEnabled(pm.cash?.enabled || false);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  const handleSave = async () => {
    try {
      await businessProfileService.savePaymentMethods({
        mpesa: {
          enabled: mpesaEnabled,
          buyGoods: { enabled: mpesaEnabled && mpesaActiveTab === 'buyGoods', tillNumber },
          paybill: { enabled: mpesaEnabled && mpesaActiveTab === 'paybill', paybillNumber, accountNumber: paybillAccount },
        },
        bank: { enabled: bankEnabled, bankName, accountName: bankAccountName, accountNumber: bankAccountNumber },
        card: { enabled: cardEnabled },
        cash: { enabled: cashEnabled },
      });
      onClose();
    } catch {
      console.error('Failed to save payment methods');
    }
  };

  if (loading) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Payment Methods</div>
          <div className="sheet-subtitle" style={{ marginBottom: 20 }}>Configure how customers can pay you</div>

          {/* M-Pesa */}
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mpesaEnabled ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--success)' }}>
                  <i className="fas fa-mobile-screen"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700 }}>M-Pesa</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Kenya mobile money</p>
                </div>
              </div>
              <div className={`toggle-switch ${mpesaEnabled ? 'active' : ''}`} onClick={() => setMpesaEnabled(!mpesaEnabled)}
                style={{ width: 44, height: 24, borderRadius: 12, background: mpesaEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${mpesaEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: mpesaEnabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'all 0.2s ease' }} />
              </div>
            </div>

            {mpesaEnabled && (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, marginTop: 8 }}>
                  {[
                    { id: 'buyGoods' as MpesaTab, label: 'Buy Goods', icon: 'fa-store' },
                    { id: 'paybill' as MpesaTab, label: 'Paybill', icon: 'fa-building' },
                    { id: 'personal' as MpesaTab, label: 'Personal', icon: 'fa-user' },
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setMpesaActiveTab(tab.id)}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: mpesaActiveTab === tab.id ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)', border: `1px solid ${mpesaActiveTab === tab.id ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`, color: mpesaActiveTab === tab.id ? 'var(--success)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.2s ease' }}
                    >
                      <i className={`fas ${tab.icon}`}></i> {tab.label}
                    </button>
                  ))}
                </div>

                {mpesaActiveTab === 'buyGoods' && (
                  <div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Till Number</label>
                      <input className="form-input" value={tillNumber} onChange={(e) => setTillNumber(e.target.value)} placeholder="e.g. 123456" style={{ paddingLeft: 16, paddingRight: 16 }} />
                    </div>
                  </div>
                )}

                {mpesaActiveTab === 'paybill' && (
                  <div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Paybill Number</label>
                      <input className="form-input" value={paybillNumber} onChange={(e) => setPaybillNumber(e.target.value)} placeholder="e.g. 400200" style={{ paddingLeft: 16, paddingRight: 16 }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Account Number (optional)</label>
                      <input className="form-input" value={paybillAccount} onChange={(e) => setPaybillAccount(e.target.value)} placeholder="e.g. SELLFLOW001" style={{ paddingLeft: 16, paddingRight: 16 }} />
                    </div>
                  </div>
                )}

                {mpesaActiveTab === 'personal' && (
                  <div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Account Name</label>
                      <input className="form-input" value={personalName} onChange={(e) => setPersonalName(e.target.value)} placeholder="e.g. John Doe" style={{ paddingLeft: 16, paddingRight: 16 }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Phone Number</label>
                      <input className="form-input" value={personalPhone} onChange={(e) => setPersonalPhone(e.target.value)} placeholder="e.g. 0712345678" style={{ paddingLeft: 16, paddingRight: 16 }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bank Transfer */}
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bankEnabled ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--info)' }}>
                  <i className="fas fa-building-columns"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700 }}>Bank Transfer</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Direct bank deposits</p>
                </div>
              </div>
              <div className={`toggle-switch ${bankEnabled ? 'active' : ''}`} onClick={() => setBankEnabled(!bankEnabled)}
                style={{ width: 44, height: 24, borderRadius: 12, background: bankEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${bankEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: bankEnabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'all 0.2s ease' }} />
              </div>
            </div>
            {bankEnabled && (
              <>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Bank Name</label>
                  <input className="form-input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. First National Bank" style={{ paddingLeft: 16, paddingRight: 16 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Account Name</label>
                  <input className="form-input" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Your business name" style={{ paddingLeft: 16, paddingRight: 16 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Account Number</label>
                  <input className="form-input" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="e.g. 1002003004" style={{ paddingLeft: 16, paddingRight: 16 }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SWIFT Code (optional)</label>
                  <input className="form-input" value={bankSwiftCode} onChange={(e) => setBankSwiftCode(e.target.value)} placeholder="e.g. XYZBKENX" style={{ paddingLeft: 16, paddingRight: 16 }} />
                </div>
              </>
            )}
          </div>

          {/* Card Payments */}
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--accent-primary)' }}>
                  <i className="fas fa-credit-card"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700 }}>Card Payments</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Visa / Mastercard</p>
                </div>
              </div>
              <div className={`toggle-switch ${cardEnabled ? 'active' : ''}`} onClick={() => setCardEnabled(!cardEnabled)}
                style={{ width: 44, height: 24, borderRadius: 12, background: cardEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${cardEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: cardEnabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'all 0.2s ease' }} />
              </div>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div style={{ marginBottom: 24, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--warning)' }}>
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700 }}>Cash on Delivery</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Pay when you receive</p>
                </div>
              </div>
              <div className={`toggle-switch ${cashEnabled ? 'active' : ''}`} onClick={() => setCashEnabled(!cashEnabled)}
                style={{ width: 44, height: 24, borderRadius: 12, background: cashEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${cashEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: cashEnabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'all 0.2s ease' }} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fas fa-check"></i> Save Payment Methods
          </button>
        </div>
      </div>
    </>
  );
}