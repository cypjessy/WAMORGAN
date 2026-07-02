'use client';

import { useState } from 'react';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: (min: number, max: number, category: string, rating: string) => void;
  onReset: () => void;
  categories: string[];
}

export default function FilterSheet({ open, onClose, onApply, onReset, categories }: FilterSheetProps) {
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(99999);
  const [cat, setCat] = useState('All');
  const [rating, setRating] = useState('Any');

  const handleApply = () => {
    onApply(min, max, cat, rating);
  };

  const handleReset = () => {
    setMin(0);
    setMax(99999);
    setCat('All');
    setRating('Any');
    onReset();
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Filter Products</h3>
          <p className="sheet-subtitle">Refine your search</p>

          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="price-range">
              <input type="number" placeholder="Min" value={min} onChange={e => setMin(Number(e.target.value))} />
              <span>-</span>
              <input type="number" placeholder="Max" value={max === 99999 ? '' : max} onChange={e => setMax(e.target.value ? Number(e.target.value) : 99999)} />
            </div>
          </div>

          <div className="filter-section">
            <h4>Category</h4>
            <div className="filter-options">
              {['All', ...categories].map((c) => (
                <button
                  key={c}
                  className={`filter-chip ${cat === c ? 'active' : ''}`}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4>Rating</h4>
            <div className="filter-options">
              {['Any', '4+ Stars', '3+ Stars'].map((r) => (
                <button
                  key={r}
                  className={`filter-chip ${rating === r ? 'active' : ''}`}
                  onClick={() => setRating(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleApply}>Apply Filters</button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={handleReset}>Reset</button>
        </div>
      </div>
    </>
  );
}
