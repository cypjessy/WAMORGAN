'use client';

interface SuccessStepProps {
  onStartShopping: () => void;
}

export default function SuccessStep({ onStartShopping }: SuccessStepProps) {
  return (
    <div className="onboarding-page success-page">
      <div className="success-ring">
        <i className="fas fa-check"></i>
      </div>
      <h2>You&apos;re All Set!</h2>
      <p>Your personalized shopping experience is ready. Start exploring products curated just for you.</p>
      <button className="btn btn-primary" onClick={onStartShopping}>
        Start Shopping
        <i className="fas fa-bag-shopping"></i>
      </button>
    </div>
  );
}
