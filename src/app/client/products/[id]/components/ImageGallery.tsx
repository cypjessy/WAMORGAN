'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ImageGalleryProps {
  slides: string[];
  badge?: string;
  badgeType?: 'discount' | 'new';
}

function isImageUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/');
}

export default function ImageGallery({ slides, badge, badgeType = 'discount' }: ImageGalleryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);

  const goToSlide = useCallback((index: number) => {
    const idx = Math.max(0, Math.min(index, slides.length - 1));
    setCurrentSlide(idx);
  }, [slides.length]);

  // Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (diff > 50 && currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
    if (diff < -50 && currentSlide > 0) goToSlide(currentSlide - 1);
  };

  return (
    <div className="gallery-container">
      <div className="gallery-main" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {badge && <span className={`gallery-badge ${badgeType === 'new' ? 'new' : ''}`}>{badge}</span>}
        <div className="gallery-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {slides.map((slide, i) => (
            <div key={i} className="gallery-slide">
              {isImageUrl(slide) ? (
                <img src={slide} alt="" className="gallery-slide-img" />
              ) : (
                <span style={{ fontSize: 80 }}>{slide}</span>
              )}
            </div>
          ))}
        </div>
        <div className="gallery-dots">
          {slides.map((_, i) => (
            <div key={i} className={`gallery-dot ${i === currentSlide ? 'active' : ''}`} onClick={() => goToSlide(i)} />
          ))}
        </div>
      </div>
      <div className="gallery-thumbs">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`gallery-thumb ${i === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(i)}
          >
            {isImageUrl(slide) ? (
              <img src={slide} alt="" className="gallery-thumb-img" />
            ) : (
              <span>{slide}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
