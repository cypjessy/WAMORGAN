'use client';

import { useState } from 'react';

interface SortSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (label: string) => void;
}

const options = [
  { icon: 'fa-fire', label: 'Most Popular' },
  { icon: 'fa-arrow-down-9-1', label: 'Price: High to Low' },
  { icon: 'fa-arrow-up-1-9', label: 'Price: Low to High' },
  { icon: 'fa-star', label: 'Highest Rated' },
  { icon: 'fa-clock', label: 'Newest First' },
];

export default function SortSheet({ open, onClose, onSelect }: SortSheetProps) {
  const [selected, setSelected] = useState('Most Popular');

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Sort By</h3>
          {options.map((opt, i) => (
            <div
              key={i}
              className={`sort-option ${selected === opt.label ? 'selected' : ''}`}
              onClick={() => { setSelected(opt.label); onSelect(opt.label); }}
            >
              <i className={`fas ${opt.icon}`}></i>
              <div className="info"><h4>{opt.label}</h4></div>
              {selected === opt.label && <i className="fas fa-check check"></i>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
