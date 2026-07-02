'use client';

interface OrdersPageHeaderProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onFilterClick: () => void;
  filterActive: boolean;
  pendingCancellations?: number;
  onCancellationsClick?: () => void;
}

export default function OrdersPageHeader({
  totalCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onFilterClick,
  filterActive,
  pendingCancellations = 0,
  onCancellationsClick,
}: OrdersPageHeaderProps) {
  return (
    <div className="orders-page-header">
      <div className="page-header-top">
        <h1>Orders</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="header-count" style={{ cursor: 'default' }}>{totalCount} orders</span>
          {pendingCancellations > 0 && (
            <button
              onClick={onCancellationsClick}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: 'var(--warning-soft)', border: '1.5px solid var(--border-subtle)',
                color: 'var(--warning)', fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap',
              }}
              title="View cancellation requests"
            >
              <i className="fas fa-ban" style={{ fontSize: 10 }}></i>
              {pendingCancellations}
            </button>
          )}
        </div>
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
