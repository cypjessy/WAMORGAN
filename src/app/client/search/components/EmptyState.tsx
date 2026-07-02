'use client';

interface EmptyStateProps {
  query: string;
  onClearSearch: () => void;
}

export default function EmptyState({ query, onClearSearch }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><i className="fas fa-search"></i></div>
      <h3>No results found</h3>
      <p>We couldn't find any products matching "{query}". Try adjusting your search or filters.</p>
      <button className="btn btn-secondary" style={{ maxWidth: 200 }} onClick={onClearSearch}>
        Clear Search
      </button>
    </div>
  );
}
