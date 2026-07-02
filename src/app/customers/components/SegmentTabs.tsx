'use client';

export type SegmentType = 'all' | 'vip' | 'regular' | 'new' | 'inactive';

interface SegmentTabsProps {
  currentSegment: SegmentType;
  onSelect: (segment: SegmentType) => void;
}

const segments: { key: SegmentType; label: string }[] = [
  { key: 'all', label: 'All Customers' },
  { key: 'vip', label: 'VIP' },
  { key: 'regular', label: 'Regular' },
  { key: 'new', label: 'New' },
  { key: 'inactive', label: 'Inactive' },
];

export default function SegmentTabs({ currentSegment, onSelect }: SegmentTabsProps) {
  return (
    <div className="segment-tabs">
      {segments.map((seg) => (
        <button
          key={seg.key}
          className={`segment-tab ${currentSegment === seg.key ? 'active' : ''}`}
          onClick={() => onSelect(seg.key)}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
}
