'use client';

import { useState } from 'react';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  category: string;
  stockStatus: string;
  maxPrice: number;
  sortBy: string;
}

const categories = ['All', 'Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Toys'];
const stockOptions = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];
const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Best Selling'];

export default function FilterSheet({ open, onClose, onApply }: FilterSheetProps) {
  const [category, setCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('All');
  const [maxPrice, setMaxPrice] = useState(500);
  const [sortBy, setSortBy] = useState('Newest');

  const handleApply = () => {
    onApply({ category, stockStatus, maxPrice, sortBy });
    onClose();
  };

  const handleReset = () => {
    setCategory('All');
    setStockStatus('All');
    setMaxPrice(500);
    setSortBy('Newest');
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <div className="sheet-title">Filters</div>
          <div className="sheet-subtitle">Refine your product list</div>

          {/* Category */}
          <div className="filter-section">
            <div className="filter-section-title">Category</div>
            <div className="filter-pills">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`filter-pill ${category === c ? 'active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Status */}
          <div className="filter-section">
            <div className="filter-section-title">Stock Status</div>
            <div className="filter-pills">
              {stockOptions.map((s) => (
                <button
                  key={s}
                  className={`filter-pill ${stockStatus === s ? 'active' : ''}`}
                  onClick={() => setStockStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <div className="filter-section-title">Price Range</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px' }}>
              <span>KSh 0</span>
              <span>KSh 0 - ${maxPrice}</span>
              <span>KSh 1000</span>
            </div>
            <input
              type="range"
              className="range-slider"
              min="0"
              max="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            />
          </div>

          {/* Sort By */}
          <div className="filter-section">
            <div className="filter-section-title">Sort By</div>
            <div className="filter-pills">
              {sortOptions.map((s) => (
                <button
                  key={s}
                  className={`filter-pill ${sortBy === s ? 'active' : ''}`}
                  onClick={() => setSortBy(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
            <button className="btn btn-primary" onClick={handleApply}>
              <i className="fas fa-check"></i> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
