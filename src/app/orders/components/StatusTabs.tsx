'use client';

interface StatusTabsProps {
  activeStatus: string;
  counts: Record<string, number>;
  onSelect: (status: string) => void;
}

const statuses = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function StatusTabs({ activeStatus, counts, onSelect }: StatusTabsProps) {
  return (
    <div className="status-tabs">
      {statuses.map((s) => (
        <button
          key={s.key}
          className={`status-tab ${activeStatus === s.key ? 'active' : ''}`}
          onClick={() => onSelect(s.key)}
        >
          {s.label}
          <span className="count">{counts[s.key] || 0}</span>
        </button>
      ))}
    </div>
  );
}
