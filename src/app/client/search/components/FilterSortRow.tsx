'use client';

interface FilterSortRowProps {
  filterCount: number;
  resultCount: string;
  onFilterClick: () => void;
  onSortClick: () => void;
}

export default function FilterSortRow({ filterCount, resultCount, onFilterClick, onSortClick }: FilterSortRowProps) {
  return (
    <div className="filter-sort-row">
      <button className="filter-btn" onClick={onFilterClick}>
        <i className="fas fa-sliders"></i> Filter
        {filterCount > 0 && <span className="count">{filterCount}</span>}
      </button>
      <button className="sort-btn" onClick={onSortClick}>
        <i className="fas fa-arrow-down-wide-short"></i> Sort
      </button>
      <span className="results-count">{resultCount}</span>
    </div>
  );
}
