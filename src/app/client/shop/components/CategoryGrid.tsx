'use client';

interface CategoryGridProps {
  onCategoryClick: (label: string) => void;
}

const items = [
  { icon: 'fa-tshirt', label: "Men's Clothing" },
  { icon: 'fa-female', label: "Women's Clothing" },
  { icon: 'fa-shoe-prints', label: 'Shoes & Footwear' },
  { icon: 'fa-shopping-bag', label: 'Bags & Luggage' },
];

export default function CategoryGrid({ onCategoryClick }: CategoryGridProps) {
  return (
    <div className="category-grid">
      {items.map((item) => (
        <div
          key={item.label}
          className="category-item"
          onClick={() => onCategoryClick(item.label)}
        >
          <div className="cat-img">
            <i className={`fas ${item.icon}`}></i>
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
