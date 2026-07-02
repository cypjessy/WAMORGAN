'use client';

interface RefreshIndicatorProps {
  visible: boolean;
  spinning: boolean;
}

export default function RefreshIndicator({ visible, spinning }: RefreshIndicatorProps) {
  return (
    <div className={`refresh-indicator ${visible ? 'show' : ''} ${spinning ? 'spin' : ''}`}>
      <i className={`fas ${spinning ? 'fa-spinner' : 'fa-arrow-down'}`}></i>
    </div>
  );
}
