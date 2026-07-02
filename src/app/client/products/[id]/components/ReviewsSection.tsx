'use client';

import ReviewCard from './ReviewCard';

interface Review {
  avatar: string;
  avatarStyle?: string;
  name: string;
  rating: number;
  date: string;
  verified: boolean;
  text: string;
  images?: string[];
  helpfulCount: number;
}

interface ReviewsSectionProps {
  totalReviews: string;
  averageRating: number;
  breakdown: { stars: number; percentage: number; count: number }[];
  reviews: Review[];
  onWriteReview: () => void;
  onSeeAll: () => void;
}

export default function ReviewsSection({
  totalReviews, averageRating, breakdown, reviews, onWriteReview, onSeeAll
}: ReviewsSectionProps) {
  const fullStars = Math.floor(averageRating);
  const hasHalf = averageRating - fullStars >= 0.5;
  const avgStars = [];
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) avgStars.push('fas fa-star');
    else if (i === fullStars && hasHalf) avgStars.push('fas fa-star-half-stroke');
    else avgStars.push('far fa-star');
  }

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h3>Reviews <span>({totalReviews})</span></h3>
        <div className="rating-big">
          <span className="num">{averageRating}</span>
          <span className="stars">{avgStars.map((cls, i) => <i key={i} className={cls}></i>)}</span>
        </div>
      </div>

      <div className="rating-breakdown">
        {breakdown.map((b) => (
          <div key={b.stars} className="rating-bar">
            <span className="star-label">{b.stars}★</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${b.percentage}%` }}></div></div>
            <span className="count">{b.count}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={onWriteReview}>
        <i className="fas fa-pen"></i> Write a Review
      </button>

      {reviews.map((review, i) => (
        <ReviewCard key={i} {...review} />
      ))}

      <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={onSeeAll}>
        See All {totalReviews} Reviews
      </button>
    </div>
  );
}
