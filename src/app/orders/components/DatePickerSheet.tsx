'use client';

import { useState } from 'react';

interface DatePickerSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: (label: string) => void;
}

const dateOptions = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month', 'Custom Range'];

export default function DatePickerSheet({ open, onClose, onApply }: DatePickerSheetProps) {
  const [selected, setSelected] = useState('This Week');

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <h3 className="sheet-title">Select Period</h3>
          <p className="sheet-subtitle">Choose a date range</p>

          <div className="date-options">
            {dateOptions.map((opt) => (
              <div
                key={opt}
                className={`date-option ${selected === opt ? 'selected' : ''}`}
                onClick={() => setSelected(opt)}
              >
                <h4>{opt}</h4>
                <i className="fas fa-check-circle"></i>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => { onApply(selected); onClose(); }}>
            <i className="fas fa-check"></i> Apply
          </button>
        </div>
      </div>
    </>
  );
}
