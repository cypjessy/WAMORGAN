'use client';

interface QuickTagsProps {
  onTagClick: (label: string) => void;
}

const tags = [
  { label: 'Hot Deals', icon: 'fa-fire', cls: 'hot' },
  { label: 'New', icon: 'fa-sparkles', cls: 'new' },
  { label: 'Best Sellers', cls: '' },
  { label: 'Trending', cls: '' },
  { label: 'Under KSh 50', cls: '' },
  { label: 'Free Shipping', cls: '' },
];

export default function QuickTags({ onTagClick }: QuickTagsProps) {
  return (
    <div className="quick-tags">
      {tags.map((tag) => (
        <button
          key={tag.label}
          className={`quick-tag ${tag.cls}`}
          onClick={() => onTagClick(tag.label)}
        >
          {tag.icon && <i className={`fas ${tag.icon}`} style={{ marginRight: 4 }}></i>}
          {tag.label}
        </button>
      ))}
    </div>
  );
}
