'use client';

import { useState } from 'react';

interface ReviewFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => void;
}

export default function ReviewFormSheet({ open, onClose, onSubmit }: ReviewFormSheetProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, text);
    setRating(0);
    setText('');
  };

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Write a Review</h3>
          <p className="sheet-subtitle">Share your experience with this product</p>
          <div className="star-rating-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`${rating >= star ? 'fas' : 'far'} fa-star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <textarea
            className="review-textarea"
            placeholder="Tell us what you liked or didn't like..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSubmit}>
            <i className="fas fa-paper-plane"></i> Submit Review
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </>
  );
}
