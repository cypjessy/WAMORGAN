'use client';

interface LoadMoreProps {
  loading: boolean;
  onLoadMore: () => void;
}

export default function LoadMore({ loading, onLoadMore }: LoadMoreProps) {
  return (
    <div className="load-more">
      <button className={`load-more-btn ${loading ? 'loading' : ''}`} onClick={onLoadMore} disabled={loading}>
        {loading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
