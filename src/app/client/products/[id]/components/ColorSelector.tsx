'use client';

interface ColorOption {
  color: string;
  label: string;
}

interface ColorSelectorProps {
  options: ColorOption[];
  selected: string;
  onSelect: (label: string) => void;
}

export default function ColorSelector({ options, selected, onSelect }: ColorSelectorProps) {
  return (
    <div className="variant-section">
      <div className="variant-label">Color <span>{selected}</span></div>
      <div className="color-options">
        {options.map((opt) => (
          <div
            key={opt.label}
            className={`color-option ${selected === opt.label ? 'active' : ''}`}
            style={{ background: opt.color }}
            onClick={() => onSelect(opt.label)}
          >
            <i className="fas fa-check check"></i>
          </div>
        ))}
      </div>
    </div>
  );
}
