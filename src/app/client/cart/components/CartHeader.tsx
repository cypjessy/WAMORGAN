'use client';

interface CartHeaderProps {
  onBack: () => void;
  title: string;
  itemCount: number;
}

export default function CartHeader({ onBack, title, itemCount }: CartHeaderProps) {
  return (
    <div className="page-header">
      <button className="back-btn" onClick={onBack}><i className="fas fa-arrow-left"></i></button>
      <h2>{title}</h2>
      <span className="count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
    </div>
  );
}
