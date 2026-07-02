'use client';

interface SizeOption {
  label: string;
  outOfStock?: boolean;
}

interface SizeSelectorProps {
  label: string;
  options: SizeOption[];
  selected: string;
  onSelect: (label: string) => void;
}

export default function SizeSelector({ label, options, selected, onSelect }: SizeSelectorProps) {
  return (
    <div className="variant-section">
      <div className="variant-label">{label} <span>{selected}</span></div>
      <div className="size-options">
        {options.map((opt) => (
          <button
            key={opt.label}
            className={`size-option ${selected === opt.label ? 'active' : ''} ${opt.outOfStock ? 'out' : ''}`}
            onClick={() => {
              if (opt.outOfStock) return;
              onSelect(opt.label);
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
