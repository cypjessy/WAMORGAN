'use client';

interface OrdersPageHeaderProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onFilterClick: () => void;
  filterActive: boolean;
}

export default function OrdersPageHeader({
  totalCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onFilterClick,
  filterActive,
}: OrdersPageHeaderProps) {
  return (
    <div className="orders-page-header">
      <div className="page-header-top">
        <h1>Orders</h1>
        <span className="header-count">{totalCount} orders</span>
      </div>
      <div className="search-bar">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search orders, customers..."
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
        <button className="filter-btn" onClick={onFilterClick}>
          <i className="fas fa-sliders"></i>
          {filterActive && <span className="dot"></span>}
        </button>
      </div>
    </div>
  );
}
