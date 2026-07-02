'use client';

import { useState } from 'react';

interface OrdersFilterSheetProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function OrdersFilterSheet({ open, onClose, onApply }: OrdersFilterSheetProps) {
  const [status, setStatus] = useState('All');
  const [payment, setPayment] = useState('All');
  const [source, setSource] = useState('All');

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleReset = () => {
    setStatus('All');
    setPayment('All');
    setSource('All');
  };

  const FilterPills = ({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) => (
    <div className="filter-pills">
      {options.map((o) => (
        <button key={o} className={`filter-pill ${selected === o ? 'active' : ''}`} onClick={() => onSelect(o)}>
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <h3 className="sheet-title">Filter Orders</h3>
          <p className="sheet-subtitle">Refine your order list</p>

          <div className="filter-section">
            <div className="filter-section-title">Status</div>
            <FilterPills options={['All', 'Pending', 'Processing', 'Completed', 'Cancelled']} selected={status} onSelect={setStatus} />
          </div>

          <div className="filter-section">
            <div className="filter-section-title">Payment Status</div>
            <FilterPills options={['All', 'Paid', 'Unpaid', 'Refunded']} selected={payment} onSelect={setPayment} />
          </div>

          <div className="filter-section">
            <div className="filter-section-title">Order Source</div>
            <FilterPills options={['All', 'WhatsApp AI', 'Manual', 'Website']} selected={source} onSelect={setSource} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
            <button className="btn btn-primary" onClick={handleApply}>
              <i className="fas fa-check"></i> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
