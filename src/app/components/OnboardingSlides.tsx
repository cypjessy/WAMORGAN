'use client';

interface OnboardingSlidesProps {
  currentSlide: number;
  totalSlides: number;
  onNext: () => void;
  onSkip: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const slides = [
  {
    icon: 'fa-robot',
    title: 'AI-Powered Sales',
    desc: 'Let our intelligent assistant handle WhatsApp conversations, recommend products, and close sales automatically.',
  },
  {
    icon: 'fa-boxes-stacked',
    title: 'Manage Products',
    desc: 'Organize your catalog, track inventory, and manage orders — all from one beautiful dashboard.',
  },
  {
    icon: 'fab fa-whatsapp',
    title: 'WhatsApp Automation',
    desc: 'Connect Evolution API and turn your WhatsApp into a 24/7 sales machine with zero manual effort.',
  },
];

export default function OnboardingSlides({
  currentSlide,
  totalSlides,
  onNext,
  onSkip,
  onTouchStart,
  onTouchEnd,
}: OnboardingSlidesProps) {
  return (
    <div className="onboarding-slides" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button className="skip-btn" onClick={onSkip}>Skip</button>

      {slides.map((slide, i) => (
        <div key={i} className={`slide ${currentSlide === i ? 'active' : ''}`} data-slide={i}>
          <div className="slide-illustration">
            <i className={slide.icon}></i>
          </div>
          <h2>{slide.title}</h2>
          <p>{slide.desc}</p>
        </div>
      ))}

      <div className="slide-nav">
        <div className="slide-dots">
          {slides.map((_, i) => (
            <div key={i} className={`slide-dot ${currentSlide === i ? 'active' : ''}`}></div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onNext}>
          {currentSlide === totalSlides - 1 ? 'Get Started' : 'Next'}
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
