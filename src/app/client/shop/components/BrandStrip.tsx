'use client';

import { useState } from 'react';
import categoryData from '@/app/products/lib/categoryData';

interface BrandStripProps {
  onBrandClick: (label: string) => void;
}

const iconToEmoji: Record<string, string> = {
  'fa-tshirt': '👕', 'fa-female': '👗', 'fa-shoe-prints': '👟',
  'fa-shopping-bag': '👜', 'fa-clock': '⌚', 'fa-gem': '💎',
  'fa-globe-africa': '🌍',
};

const fashionSubs = Object.values(categoryData.fashion.subcategories);

export default function BrandStrip({ onBrandClick }: BrandStripProps) {
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const selectedSubObj = selectedSub
    ? fashionSubs.find(s => s.name === selectedSub) || null
    : null;

  const typeOptions = selectedSubObj?.specs?.type?.options || [];

  const handleSubClick = (name: string) => {
    setSelectedSub(prev => prev === name ? null : name);
  };

  const handleTypeClick = (type: string) => {
    onBrandClick(type);
    setSelectedSub(null);
  };

  return (
    <div>
      {/* Subcategories of Fashion & Apparel */}
      <div className="brand-strip" style={{ marginBottom: selectedSub ? 12 : 0 }}>
        {fashionSubs.map((sub) => (
          <div
            key={sub.name}
            className={`brand-item ${selectedSub === sub.name ? 'active' : ''}`}
            onClick={() => handleSubClick(sub.name)}
          >
            <span style={{ fontSize: 24 }}>{iconToEmoji[sub.icon] || '📦'}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4, textAlign: 'center', lineHeight: 1.2 }}>{sub.name}</span>
          </div>
        ))}
      </div>

      {/* Type options as chips */}
      {selectedSubObj && typeOptions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 20px', marginBottom: 16 }}>
          {typeOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => handleTypeClick(opt)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-elevated)',
                border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}