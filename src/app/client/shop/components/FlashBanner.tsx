'use client';

import { useState, useEffect } from 'react';

function secondsUntilNextHour(): number {
  const now = new Date();
  return (60 - now.getMinutes()) * 60 - now.getSeconds();
}

export default function FlashBanner({ onClick }: { onClick: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSeconds(secondsUntilNextHour());
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) return secondsUntilNextHour();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (!mounted) return null;

  return (
    <div className="flash-banner" onClick={onClick}>
      <div className="flash-info">
        <h4><i className="fas fa-bolt"></i> Flash Deals</h4>
        <p>Limited time offers ending soon</p>
      </div>
      <div className="flash-countdown">
        <span className="cd-box">{h.toString().padStart(2, '0')}</span>
        <span className="cd-sep">:</span>
        <span className="cd-box">{m.toString().padStart(2, '0')}</span>
        <span className="cd-sep">:</span>
        <span className="cd-box">{s.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
}
