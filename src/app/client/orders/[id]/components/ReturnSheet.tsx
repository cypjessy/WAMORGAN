'use client';

import { useState } from 'react';

interface ReturnItem {
  imageUrl: string;
  name: string;
  variant: string;
}

interface ReturnSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: string[], reason: string) => void;
  items: ReturnItem[];
}

const reasons = ['Wrong Size', 'Defective', 'Not as Described', 'Changed Mind'];

export default function ReturnSheet({ open, onClose, onSubmit, items }: ReturnSheetProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));
  const [reason, setReason] = useState('Wrong Size');

  const toggleCheck = (i: number) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setChecked(next);
  };

  const handleSubmit = () => {
    if (checked.size === 0) return;
    const selectedItems = Array.from(checked).map(i => items[i]?.name).filter(Boolean);
    onSubmit(selectedItems, reason);
    setChecked(new Set([0]));
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Return Items</h3>
          <p className="sheet-subtitle">Select items to return</p>
          {items.map((item, i) => (
            <div key={i} className="return-item">
              <div className={`check ${checked.has(i) ? 'checked' : ''}`} onClick={() => toggleCheck(i)}></div>
              <div className="item-img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                {!item.imageUrl && <span style={{ fontSize: 24 }}>📦</span>}
              </div>
              <div className="info">
                <h4>{item.name}</h4>
                <p>{item.variant}</p>
              </div>
            </div>
          ))}
          <div style={{ margin: '16px 0' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Return Reason</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {reasons.map((r) => (
                <button
                  key={r}
                  className={`filter-chip ${reason === r ? 'active' : ''}`}
                  onClick={() => setReason(r)}
                  style={{ padding: '8px 14px' }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={checked.size === 0}>
            Request Return
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}
