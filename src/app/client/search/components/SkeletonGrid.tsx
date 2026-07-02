'use client';

export default function SkeletonGrid() {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img"></div>
          <div className="skeleton-text">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
            <div className="skeleton-line price"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
