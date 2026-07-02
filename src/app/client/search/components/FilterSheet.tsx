'use client';

import { useState, useMemo } from 'react';
import categoryData from '@/app/products/lib/categoryData';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: { minPrice: string; maxPrice: string; categories: string[]; subcategories: string[]; rating: number }) => void;
  onReset: () => void;
}

const topCategories = Object.values(categoryData);

export default function FilterSheet({ open, onClose, onApply, onReset }: FilterSheetProps) {
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('500');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [rating, setRating] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const subcategories = useMemo(() => {
    const cat = topCategories.find(c => c.name === selectedCat);
    return cat ? Object.values(cat.subcategories) : [];
  }, [selectedCat]);

  const toggleSub = (name: string) => {
    const next = new Set(selectedSubs);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedSubs(next);
  };

  const handleApply = () => {
    onApply({
      minPrice, maxPrice,
      categories: selectedCat ? [selectedCat] : [],
      subcategories: Array.from(selectedSubs),
      rating,
    });
  };

  const handleReset = () => {
    setMinPrice(''); setMaxPrice(''); setRating(0);
    setSelectedCat(''); setSelectedSubs(new Set());
    setResetKey(k => k + 1);
    onReset();
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Filter Products</h3>
          <p className="sheet-subtitle">Refine your search results</p>

          <div className="filter-section" key={`price-${resetKey}`}>
            <h4><i className="fas fa-coins"></i> Price Range</h4>
            <div className="price-range">
              <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <span>-</span>
              <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
          </div>

          <div className="filter-section" key={`cat-${resetKey}`}>
            <h4><i className="fas fa-tag"></i> Category</h4>
            <div className="filter-options">
              <button
                className={`filter-chip ${!selectedCat ? 'active' : ''}`}
                onClick={() => { setSelectedCat(''); setSelectedSubs(new Set()); }}
              >
                All
              </button>
              {topCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-chip ${selectedCat === cat.name ? 'active' : ''}`}
                  onClick={() => { setSelectedCat(cat.name); setSelectedSubs(new Set()); }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {selectedCat && subcategories.length > 0 && (
            <div className="filter-section" key={`sub-${selectedCat}-${resetKey}`}>
              <h4><i className="fas fa-layer-group"></i> Subcategory</h4>
              <div className="filter-options">
                {subcategories.map((sub) => (
                  <button
                    key={sub.name}
                    className={`filter-chip ${selectedSubs.has(sub.name) ? 'active' : ''}`}
                    onClick={() => toggleSub(sub.name)}
                  >
                    <i className={`fas ${sub.icon}`} style={{ marginRight: 4 }}></i>
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-section" key={`rating-${resetKey}`}>
            <h4><i className="fas fa-star"></i> Minimum Rating</h4>
            <div className="filter-options">
              {[
                { label: 'Any Rating', stars: [], value: 0 },
                { label: '5 Stars', stars: [1, 1, 1, 1, 1], value: 5 },
                { label: '4+ Stars', stars: [1, 1, 1, 1, 0], value: 4 },
                { label: '3+ Stars', stars: [1, 1, 1, 0, 0], value: 3 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`rating-option ${rating === opt.value ? 'active' : ''}`}
                  onClick={() => setRating(rating === opt.value ? 0 : opt.value)}
                >
                  {opt.stars.length > 0 && (
                    <span className="stars">{opt.stars.map((s, i) => <i key={i} className={s ? 'fas fa-star' : 'far fa-star'}></i>)}</span>
                  )}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleApply}>Apply Filters</button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={handleReset}>Reset All</button>
        </div>
      </div>
    </>
  );
}
