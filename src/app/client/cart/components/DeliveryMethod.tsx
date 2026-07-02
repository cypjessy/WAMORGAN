'use client';

interface DeliveryOption {
  name: string;
  description: string;
  price: string;
  value: string;
}

interface DeliveryMethodProps {
  options: DeliveryOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export default function DeliveryMethod({ options, selected, onSelect }: DeliveryMethodProps) {
  return (
    <>
      {options.map((opt) => (
        <div
          key={opt.value}
          className={`delivery-option ${selected === opt.value ? 'selected' : ''}`}
          onClick={() => onSelect(opt.value)}
        >
          <div className="radio" />
          <div className="info">
            <h4>{opt.name}</h4>
            <p>{opt.description}</p>
          </div>
          <div className="price">{opt.price}</div>
        </div>
      ))}
    </>
  );
}
