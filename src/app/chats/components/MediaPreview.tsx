'use client';

interface MediaPreviewProps {
  open: boolean;
  emoji: string;
  onClose: () => void;
}

export default function MediaPreview({ open, emoji, onClose }: MediaPreviewProps) {
  return (
    <div className={`media-preview-overlay ${open ? 'active' : ''}`} onClick={onClose}>
      <button className="media-preview-close" onClick={onClose}>
        <i className="fas fa-xmark"></i>
      </button>
      <div className="media-preview-box">{emoji}</div>
    </div>
  );
}
