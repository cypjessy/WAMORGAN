'use client';

interface CustomersPageHeaderProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSegmentClick: () => void;
}

export default function CustomersPageHeader({
  totalCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onSegmentClick,
}: CustomersPageHeaderProps) {
  return (
    <div className="customers-page-header">
      <div className="page-header-top">
        <h1>Customers</h1>
        <span className="header-count">{totalCount} customers</span>
      </div>
      <div className="search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            className={`search-clear ${searchQuery.length > 0 ? 'show' : ''}`}
            onClick={onClearSearch}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <button className="filter-btn" onClick={onSegmentClick}>
          <i className="fas fa-layer-group"></i>
        </button>
      </div>
    </div>
  );
}
