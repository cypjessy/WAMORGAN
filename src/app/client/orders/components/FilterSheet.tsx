'use client';

import { useState } from 'react';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: { status: string[]; dateRange: string; minPrice: string; maxPrice: string }) => void;
  onReset: () => void;
}

const statusOptions = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const dateOptions = ['All Time', 'Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Custom'];

export default function FilterSheet({ open, onClose, onApply, onReset }: FilterSheetProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('All Time');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleApply = () => {
    onApply({ status: selectedStatuses, dateRange, minPrice, maxPrice });
  };

  const handleReset = () => {
    setSelectedStatuses([]);
    setDateRange('All Time');
    setMinPrice('');
    setMaxPrice('');
    onReset();
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Filter Orders</h3>
          <p className="sheet-subtitle">Narrow down your orders</p>

          {/* Status */}
          <div className="filter-section">
            <h4 className="filter-section-title">Status</h4>
            <div className="pill-group">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`pill ${selectedStatuses.includes(status) ? 'active' : ''}`}
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="filter-section" style={{ marginTop: 24 }}>
            <h4 className="filter-section-title">Date Range</h4>
            <div className="pill-group">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  className={`pill ${dateRange === opt ? 'active' : ''}`}
                  onClick={() => setDateRange(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-section" style={{ marginTop: 24 }}>
            <h4 className="filter-section-title">Price Range</h4>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
              <input
                className="filter-input"
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ flex: 1, height: 48, background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 16px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                className="filter-input"
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ flex: 1, height: 48, background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 16px', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={handleReset} style={{ flex: 1 }}>Reset</button>
            <button className="btn btn-primary" onClick={handleApply} style={{ flex: 2 }}>Apply Filters</button>
          </div>
        </div>
      </div>
    </>
  );
}
