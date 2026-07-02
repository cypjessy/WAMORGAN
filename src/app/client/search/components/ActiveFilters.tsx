'use client';

interface ActiveFiltersProps {
  filters: string[];
  onRemove: (filter: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="active-filters">
      {filters.map((f) => (
        <div key={f} className="active-chip" onClick={() => onRemove(f)}>
          {f} <i className="fas fa-xmark"></i>
        </div>
      ))}
      <button className="clear-all-chip" onClick={onClearAll}>Clear All</button>
    </div>
  );
}
