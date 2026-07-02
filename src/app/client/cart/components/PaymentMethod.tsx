'use client';

interface PaymentOption {
  icon: string;
  iconStyle?: React.CSSProperties;
  name: string;
  description: string;
  value: string;
}

interface PaymentMethodProps {
  options: PaymentOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export default function PaymentMethod({ options, selected, onSelect }: PaymentMethodProps) {
  return (
    <>
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`payment-option ${selected === opt.value ? 'selected' : ''}`}
          onClick={() => onSelect(opt.value)}
        >
          <div className="radio" />
          <div className="icon" style={opt.iconStyle}><i className={opt.icon}></i></div>
          <div className="info">
            <h4>{opt.name}</h4>
            <p>{opt.description}</p>
          </div>
          <i className="fas fa-chevron-right arrow"></i>
        </div>
      ))}
    </>
  );
}
