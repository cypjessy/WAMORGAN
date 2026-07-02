'use client';

interface Address {
  label: string;
  address: string;
  isDefault?: boolean;
}

interface AddressCardProps {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}

export default function AddressCard({ address, selected, onSelect }: AddressCardProps) {
  return (
    <div className={`address-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="check-icon"><i className="fas fa-check"></i></div>
      <h4>{address.label}</h4>
      <p>{address.address}</p>
      {address.isDefault && <span className="tag">Default</span>}
    </div>
  );
}
