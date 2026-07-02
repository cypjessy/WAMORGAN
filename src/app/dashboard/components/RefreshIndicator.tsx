'use client';

interface RefreshIndicatorProps {
  visible: boolean;
  spinning: boolean;
}

export default function RefreshIndicator({ visible, spinning }: RefreshIndicatorProps) {
  return (
    <div className={`refresh-indicator ${visible ? 'show' : ''} ${spinning ? 'spin' : ''}`} id="refreshInd">
      <i className={spinning ? 'fas fa-spinner' : 'fas fa-arrow-down'}></i>
    </div>
  );
}
