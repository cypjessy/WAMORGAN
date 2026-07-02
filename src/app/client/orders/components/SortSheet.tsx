'use client';

interface SortSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selected: string;
}

const sortOptions = [
  { value: 'recent', icon: 'fas fa-clock', label: 'Most Recent' },
  { value: 'price-high', icon: 'fas fa-arrow-down-9-1', label: 'Price: High to Low' },
  { value: 'price-low', icon: 'fas fa-arrow-up-1-9', label: 'Price: Low to High' },
  { value: 'total-high', icon: 'fas fa-arrow-down-wide-short', label: 'Order Total: High to Low' },
];

export default function SortSheet({ open, onClose, onSelect, selected }: SortSheetProps) {
  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Sort Orders</h3>
          <p className="sheet-subtitle">Choose how to order your list</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortOptions.map((opt) => (
              <div
                key={opt.value}
                className={`sort-option ${selected === opt.value ? 'selected' : ''}`}
                onClick={() => { onSelect(opt.value); }}
              >
                <i className={opt.icon}></i>
                <div className="info">
                  <h4>{opt.label}</h4>
                </div>
                <i className={`fas fa-check check ${selected === opt.value ? '' : ''}`}></i>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
