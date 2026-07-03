'use client';

import { useState } from 'react';

interface SearchHeaderProps {
  initialQuery: string;
  onBack: () => void;
  onSearch: (query: string) => void;
  onChange?: (value: string) => void;
}

export default function SearchHeader({ initialQuery, onBack, onSearch, onChange }: SearchHeaderProps) {
  const [value, setValue] = useState(initialQuery);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    onChange?.(v);
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSearch(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleClear = () => {
    setValue('');
    onChange?.('');
  };

  return (
    <div className="search-header">
      <button className="back-btn" onClick={onBack}><i className="fas fa-arrow-left"></i></button>
      <div className="search-box">
        <input
          type="text"
          value={value}
          placeholder="Search products..."
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button className="clear-btn" onClick={handleClear}><i className="fas fa-xmark"></i></button>
        )}
      </div>
      <button
        onClick={handleSubmit}
        style={{
          height: 40, padding: '0 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-primary)', color: 'white', border: 'none',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <i className="fas fa-search"></i> Search
      </button>
    </div>
  );
}
