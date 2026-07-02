'use client';

import { useState, useRef } from 'react';

export default function SearchSection({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!query.trim()) return;
    onSearch(query.trim());
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="search-section">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search products, brands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          onClick={handleSubmit}
          style={{
            height: 48, padding: '0 18px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)', color: 'white', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <i className="fas fa-search"></i> Search
        </button>
      </div>
    </div>
  );
}
