'use client';

interface DetailHeaderProps {
  onBack: () => void;
  onShare: () => void;
  wishlisted: boolean;
  onWishlistToggle: () => void;
}

export default function DetailHeader({ onBack, onShare, wishlisted, onWishlistToggle }: DetailHeaderProps) {
  return (
    <div className="detail-header">
      <button className="back-btn" onClick={onBack}><i className="fas fa-arrow-left"></i></button>
      <div className="header-actions">
        <button className={`icon-btn ${wishlisted ? 'active' : ''}`} onClick={onWishlistToggle}>
          <i className={`${wishlisted ? 'fas' : 'far'} fa-heart`}></i>
        </button>
        <button className="icon-btn" onClick={onShare}><i className="fas fa-share-nodes"></i></button>
      </div>
    </div>
  );
}
