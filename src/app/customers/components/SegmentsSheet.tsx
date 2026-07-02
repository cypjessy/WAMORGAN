'use client';

import { useMemo } from 'react';
import type { Customer } from './CustomerItem';

export type SegmentType = 'vip' | 'regular' | 'new' | 'inactive';

interface SegmentsSheetProps {
  open: boolean;
  customers: Customer[];
  onClose: () => void;
  onSelectSegment: (segment: SegmentType) => void;
}

const segmentDefs = [
  { key: 'vip' as SegmentType, icon: 'fa-crown', iconClass: 'vip', label: 'VIP Customers', desc: 'High spenders, frequent buyers' },
  { key: 'regular' as SegmentType, icon: 'fa-user', iconClass: 'regular', label: 'Regular Customers', desc: 'Consistent repeat buyers' },
  { key: 'new' as SegmentType, icon: 'fa-seedling', iconClass: 'new', label: 'New Customers', desc: 'First purchase within 30 days' },
  { key: 'inactive' as SegmentType, icon: 'fa-moon', iconClass: 'inactive', label: 'Inactive', desc: 'No purchase in 90+ days' },
];

export default function SegmentsSheet({ open, customers, onClose, onSelectSegment }: SegmentsSheetProps) {
  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = { vip: 0, regular: 0, new: 0, inactive: 0 };
    for (const c of customers) {
      const seg = c.segment || 'regular';
      if (counts[seg] !== undefined) counts[seg]++;
    }
    return counts;
  }, [customers]);

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content safe-bottom">
          <h3 className="sheet-title">Customer Segments</h3>
          <p className="sheet-subtitle">Organize customers by value</p>

          {segmentDefs.map((seg) => (
            <div
              key={seg.key}
              className="segment-card"
              onClick={() => { onSelectSegment(seg.key); onClose(); }}
            >
              <div className={`segment-icon ${seg.iconClass}`}>
                <i className={`fas ${seg.icon}`}></i>
              </div>
              <div className="segment-info">
                <h4>{seg.label}</h4>
                <p>{seg.desc}</p>
              </div>
              <div className="segment-count">{segmentCounts[seg.key]}</div>
            </div>
          ))}

          <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => {}}>
            <i className="fas fa-plus"></i> Create New Segment
          </button>
        </div>
      </div>
    </>
  );
}
