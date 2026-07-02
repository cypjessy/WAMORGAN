'use client';

interface RefreshIndicatorProps {
  visible: boolean;
  spinning: boolean;
  offset?: number;
}

export default function RefreshIndicator({ visible, spinning, offset = 0 }: RefreshIndicatorProps) {
  return (
    <div
      className={`refresh-indicator ${visible ? 'show' : ''} ${spinning ? 'spin' : ''}`}
      style={{ transform: `translateX(-50%) translateY(${offset * 0.3}px)` }}
    >
      <i className={`fas ${spinning ? 'fa-spinner' : 'fa-arrow-down'}`}></i>
    </div>
  );
}
