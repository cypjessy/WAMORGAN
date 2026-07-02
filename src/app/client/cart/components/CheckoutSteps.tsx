'use client';

interface CheckoutStepsProps {
  currentStep: number; // 0=cart, 1=shipping, 2=payment, 3=success
}

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const steps = [0, 1, 2, 3];

  return (
    <div className="checkout-steps">
      {steps.map((step, i) => (
        <span key={step}>
          {i > 0 && <span className={`step-line ${currentStep >= step ? 'active' : ''}`} />}
          <span className={`step-dot ${currentStep >= step ? 'active' : ''}`} />
        </span>
      ))}
    </div>
  );
}
