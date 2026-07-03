'use client';

interface QuickTagsProps {
  onTagClick: (label: string, route: string) => void;
}

const tags = [
  { label: 'Hot Deals', icon: 'fa-fire', cls: 'hot', route: '/client/search?q=hot-deals' },
  { label: 'New', icon: 'fa-sparkles', cls: 'new', route: '/client/new-arrivals' },
  { label: 'Best Sellers', cls: '', route: '/client/search?q=best-sellers&sort=popular' },
  { label: 'Trending', cls: '', route: '/client/search?q=trending&sort=popular' },
  { label: 'Under KSh 500', cls: '', route: '/client/search?priceMax=500' },
  { label: 'Free Shipping', cls: '', route: '/client/search?q=free-shipping' },
];

export default function QuickTags({ onTagClick }: QuickTagsProps) {
  return (
    <div className="quick-tags">
      {tags.map((tag) => (
        <button
          key={tag.label}
          className={`quick-tag ${tag.cls}`}
          onClick={() => onTagClick(tag.label, tag.route)}
        >
          {tag.icon && <i className={`fas ${tag.icon}`} style={{ marginRight: 4 }}></i>}
          {tag.label}
        </button>
      ))}
    </div>
  );
}
