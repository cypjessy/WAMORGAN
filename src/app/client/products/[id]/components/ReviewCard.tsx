'use client';

import { useState } from 'react';

interface ReviewCardProps {
  avatar: string;
  avatarStyle?: string;
  name: string;
  rating: number;
  date: string;
  verified: boolean;
  text: string;
  images?: string[];
  helpfulCount: number;
  onHelpful?: () => void;
  onReply?: () => void;
}

export default function ReviewCard({
  avatar, avatarStyle, name, rating, date, verified,
  text, images, helpfulCount, onHelpful, onReply
}: ReviewCardProps) {
  const [helpful, setHelpful] = useState(helpfulCount);
  const [liked, setLiked] = useState(false);

  const fullStars = Math.floor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(i < fullStars ? 'fas fa-star' : 'far fa-star');
  }

  const handleHelpful = () => {
    if (!liked) {
      setHelpful(prev => prev + 1);
      setLiked(true);
    }
    onHelpful?.();
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar" style={avatarStyle ? { background: avatarStyle } : undefined}>
          {avatar}
        </div>
        <div className="review-meta">
          <h4>{name}</h4>
          <div className="stars">{stars.map((cls, i) => <i key={i} className={cls}></i>)}</div>
          <div className="date">{date} · {verified ? 'Verified Purchase' : ''}</div>
        </div>
      </div>
      <div className="review-text">{text}</div>
      {images && images.length > 0 && (
        <div className="review-images">
          {images.map((img, i) => (
            <div key={i} className="r-img">{img}</div>
          ))}
        </div>
      )}
      <div className="review-actions">
        <button onClick={handleHelpful} style={liked ? { color: 'var(--accent-primary)' } : undefined}>
          <i className={`fas fa-thumbs-up`}></i> Helpful ({helpful})
        </button>
        <button onClick={onReply}><i className="fas fa-reply"></i> Reply</button>
      </div>
    </div>
  );
}
