'use client';

import { useMemo } from 'react';

interface CategoryPillsProps {
  activeCategory: string;
  onSelect: (category: string) => void;
  products?: Array<{ category: string }>;
}

export default function CategoryPills({ activeCategory, onSelect, products }: CategoryPillsProps) {
  const categories = useMemo(() => {
    if (!products || products.length === 0) return [{ id: 'all', label: 'All' }];
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return [
      { id: 'all', label: 'All' },
      ...Array.from(cats).sort().map(c => ({ id: c, label: c })),
    ];
  }, [products]);

  return (
    <div className="categories-scroll">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
