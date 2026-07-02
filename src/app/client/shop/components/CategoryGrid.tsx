'use client';

import { useState, useEffect } from 'react';
import { productService } from '@/lib/db';
import categoryData from '@/app/products/lib/categoryData';

interface CategoryGridProps {
  onCategoryClick: (label: string) => void;
}

const allCategories = Object.values(categoryData).map(cat => ({
  emoji: cat.icon,
  label: cat.name,
}));

export default function CategoryGrid({ onCategoryClick }: CategoryGridProps) {
  const [availableCategories, setAvailableCategories] = useState<typeof allCategories>(allCategories);

  useEffect(() => {
    productService.getProducts().then(products => {
      const usedNames = new Set(products.map((p: any) => p.category).filter(Boolean));
      setAvailableCategories(allCategories.filter(c => usedNames.has(c.label)));
    }).catch(() => {});
  }, []);

  return (
    <div className="category-grid">
      {availableCategories.map((cat) => (
        <div
          key={cat.label}
          className="category-item"
          onClick={() => onCategoryClick(cat.label)}
        >
          <div className="cat-img">{cat.emoji}</div>
          <span>{cat.label}</span>
        </div>
      ))}
    </div>
  );
}
