'use client';

interface SortSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (sort: string) => void;
  selected: string;
}

const sortOptions = [
  { value: 'popular', icon: 'fas fa-fire', label: 'Most Popular' },
  { value: 'price-high', icon: 'fas fa-arrow-down-9-1', label: 'Price: High to Low' },
  { value: 'price-low', icon: 'fas fa-arrow-up-1-9', label: 'Price: Low to High' },
  { value: 'rating', icon: 'fas fa-star', label: 'Highest Rated' },
  { value: 'newest', icon: 'fas fa-clock', label: 'Newest First' },
  { value: 'discount', icon: 'fas fa-percent', label: 'Biggest Discount' },
];

export default function SortSheet({ open, onClose, onSelect, selected }: SortSheetProps) {
  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Sort By</h3>
          {sortOptions.map((opt) => (
            <div
              key={opt.value}
              className={`sort-option ${selected === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <i className={opt.icon}></i>
              <div className="info"><h4>{opt.label}</h4></div>
              <i className="fas fa-check check"></i>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
