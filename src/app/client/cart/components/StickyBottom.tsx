'use client';

interface StickyBottomProps {
  total: number;
  label: string;
  buttonText: string;
  buttonIcon: string;
  onAction: () => void;
}

export default function StickyBottom({ total, label, buttonText, buttonIcon, onAction }: StickyBottomProps) {
  return (
    <div className="sticky-bottom">
      <div className="total-row">
        <span className="label">{label}</span>
        <span className="value">KSh {total.toFixed(2)}</span>
      </div>
      <button className="btn btn-primary" onClick={onAction}>
        <i className={buttonIcon}></i> {buttonText}
      </button>
    </div>
  );
}
