'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { productService, businessProfileService } from '@/lib/db';

interface HeroSlide {
  tag: string;
  title: string;
  desc: string;
  cta: string;
  cls: string;
}

const defaultSlides: HeroSlide[] = [
  { tag: '<i class="fas fa-percent"></i> Summer Sale', title: 'Up to 50% Off', desc: 'On all electronics & accessories', cta: 'Shop Now', cls: 'slide-1' },
  { tag: '<i class="fas fa-bolt"></i> Flash Deal', title: 'Limited Time Offer', desc: 'Grab the best deals before they expire', cta: 'View Deals', cls: 'slide-2' },
  { tag: '<i class="fas fa-truck"></i> Free Delivery', title: 'Free Shipping', desc: 'On orders over KSh 50 this week', cta: 'Shop Now', cls: 'slide-3' },
];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function HeroCarousel({ onCtaClick }: { onCtaClick: (label: string) => void }) {
  const [current, setCurrent] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides);
  const touchStartX = useRef(0);

  useEffect(() => {
    Promise.all([
      productService.getProducts(),
      businessProfileService.getProfile(),
    ]).then(([products, profile]) => {
      setAllProducts(products);
      if (profile?.heroSlides?.length) setSlides(profile.heroSlides);
    }).catch(() => {});
  }, []);

  const daySeed = Math.floor(Date.now() / 86400000);

  const productImages = useMemo(() => {
    const withImages = allProducts.filter((p: any) => p.images?.[0] || p.imageUrl);
    const shuffled = [...withImages].sort((a, b) => {
      const idxA = withImages.indexOf(a);
      const idxB = withImages.indexOf(b);
      return seededRandom(daySeed + idxA) - seededRandom(daySeed + idxB);
    });
    return shuffled.slice(0, 3).map((p: any) => p.images?.[0] || p.imageUrl || '');
  }, [allProducts, daySeed]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % (slides.length || 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (diff > 50 && current < slides.length - 1) goTo(current + 1);
    if (diff < -50 && current > 0) goTo(current - 1);
  };

  return (
    <div className="hero-carousel" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div
        className="hero-slides"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`hero-slide ${slide.cls}`}
            style={productImages[i] ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${productImages[i]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}}
          >
            <span className="tag" dangerouslySetInnerHTML={{ __html: slide.tag }} />
            <h3>{slide.title}</h3>
            <p>{slide.desc}</p>
            <button className="hero-cta" onClick={() => onCtaClick(slide.cta)}>
              {slide.cta} <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        ))}
      </div>
      <div className="hero-dots">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
