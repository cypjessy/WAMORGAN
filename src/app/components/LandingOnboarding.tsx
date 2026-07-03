'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface LandingOnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    emoji: '🤖',
    title: 'AI Shopping Assistant',
    desc: 'Let our intelligent AI find the perfect products for you through natural conversation. Just tell it what you need.',
  },
  {
    emoji: '💬',
    title: 'Shop on WhatsApp',
    desc: 'Browse, order, and track deliveries — all through your favorite chat app. No downloads needed for your customers.',
  },
  {
    emoji: '⚡',
    title: 'Lightning Fast Delivery',
    desc: 'Real-time order tracking, instant notifications, and same-day delivery options for your local customers.',
  },
  {
    emoji: '🔒',
    title: 'Secure Payments',
    desc: 'Enterprise-grade encryption, multiple payment methods, and buyer protection on every transaction.',
  },
];

export default function LandingOnboarding({ onComplete }: LandingOnboardingProps) {
  const [phase, setPhase] = useState<'splash' | 'onboarding' | 'done'>('splash');
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);

  // Splash → Onboarding transition (matches CSS animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('onboarding');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  const completeOnboarding = useCallback(() => {
    setPhase('done');
    setTimeout(onComplete, 500);
  }, [onComplete]);

  const touchEnd = useCallback((e: React.TouchEvent) => {
    const diffX = touchStartX.current - e.changedTouches[0].screenX;
    if (diffX > 50 && currentSlide < slides.length - 1) nextSlide();
    if (diffX < -50 && currentSlide > 0) prevSlide();
  }, [currentSlide, nextSlide, prevSlide]);

  const isLast = currentSlide === slides.length - 1;

  // Splash Phase
  if (phase === 'splash') {
    return (
      <div className="lo-splash">
        <div className="lo-splash-logo">
          <i className="fas fa-bag-shopping"></i>
        </div>
        <div className="lo-splash-brand">SellFlow</div>
        <div className="lo-splash-tagline">AI-Powered Commerce</div>
        <div className="lo-splash-loader">
          <div className="lo-splash-loader-bar" />
        </div>
      </div>
    );
  }

  // Done phase
  if (phase === 'done') {
    return <div className="lo-done" />;
  }

  // Onboarding phase
  return (
    <div
      className="lo-container"
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].screenX; }}
      onTouchEnd={touchEnd}
    >
      {/* Background mesh + noise */}
      <div className="lo-bg-mesh" />
      <div className="lo-noise" />

      {/* Skip button */}
      {!isLast && (
        <button className="lo-skip-top" onClick={completeOnboarding}>
          Skip
        </button>
      )}

      {/* Slides */}
      <div className="lo-slides-wrap">
        {slides.map((s, i) => (
          <div key={i} className={`lo-slide ${currentSlide === i ? 'active' : ''} ${currentSlide > i ? 'exit-left' : ''}`}>
            <div className="lo-slide-image-wrap">
              <div className="lo-slide-image">
                <span className="lo-slide-emoji">{s.emoji}</span>
              </div>
            </div>
            <h2 className="lo-slide-title">{s.title}</h2>
            <p className="lo-slide-desc">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="lo-bottom">
        <div className="lo-dots">
          {slides.map((_, i) => (
            <div key={i} className={`lo-dot ${currentSlide === i ? 'active' : ''}`} onClick={() => goToSlide(i)} />
          ))}
        </div>
        <div className="lo-bottom-buttons">
          {currentSlide > 0 && (
            <button className="lo-btn-back" onClick={prevSlide}>
              Back
            </button>
          )}
          <button className="lo-btn-next" onClick={nextSlide}>
            <span>{isLast ? 'Get Started' : 'Next'}</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
