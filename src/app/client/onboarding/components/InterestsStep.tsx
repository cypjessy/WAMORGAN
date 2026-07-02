'use client';

interface InterestsStepProps {
  selected: string[];
  onToggle: (interest: string) => void;
  onBack: () => void;
}

const interests = [
  { emoji: '👟', label: 'Sneakers', desc: 'Footwear' },
  { emoji: '⌚', label: 'Watches', desc: 'Accessories' },
  { emoji: '📱', label: 'Electronics', desc: 'Gadgets' },
  { emoji: '👕', label: 'Fashion', desc: 'Clothing' },
  { emoji: '🏠', label: 'Home', desc: 'Living' },
  { emoji: '💄', label: 'Beauty', desc: 'Cosmetics' },
  { emoji: '🎮', label: 'Gaming', desc: 'Consoles' },
  { emoji: '🎧', label: 'Audio', desc: 'Headphones' },
];

export default function InterestsStep({ selected, onToggle, onBack }: InterestsStepProps) {
  return (
    <div>
      <div className="page-header" style={{ paddingTop: 60 }}>
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Your Interests</h2>
      </div>

      <div className="steps-bar" style={{ marginBottom: 32, padding: '0 24px' }}>
        <div className="step-line active"></div>
        <div className="step-dot active"></div>
        <div className="step-line active"></div>
        <div className="step-dot active"></div>
        <div className="step-line"></div>
        <div className="step-dot"></div>
      </div>

      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, padding: '0 20px', lineHeight: 1.6 }}>
        Select categories you love. We&apos;ll personalize your feed with products you&apos;ll actually want.
      </p>

      <div className="interest-grid">
        {interests.map((item) => {
          const isActive = selected.includes(item.label);
          return (
            <div
              key={item.label}
              className={`interest-card ${isActive ? 'active' : ''}`}
              onClick={() => onToggle(item.label)}
            >
              <span className="check"><i className="fas fa-check"></i></span>
              <span className="emoji">{item.emoji}</span>
              <h4>{item.label}</h4>
              <p>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
