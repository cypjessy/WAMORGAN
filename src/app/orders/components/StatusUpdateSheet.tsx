'use client';

import { useState } from 'react';

interface StatusUpdateSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (status: string) => void;
  currentStatus?: string;
}

const statusOptions = [
  { key: 'pending', icon: 'fa-clock', label: 'Pending', desc: 'Order received, awaiting payment', iconClass: 'pending' },
  { key: 'processing', icon: 'fa-box', label: 'Processing', desc: 'Payment confirmed, preparing order', iconClass: 'processing' },
  { key: 'completed', icon: 'fa-check', label: 'Completed', desc: 'Order delivered successfully', iconClass: 'completed' },
  { key: 'cancelled', icon: 'fa-ban', label: 'Cancelled', desc: 'Order cancelled by customer or admin', iconClass: 'cancelled' },
];

export default function StatusUpdateSheet({ open, onClose, onSave, currentStatus }: StatusUpdateSheetProps) {
  const [selected, setSelected] = useState(currentStatus || 'completed');

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle"></div>
        <div className="sheet-content">
          <h3 className="sheet-title">Update Status</h3>
          <p className="sheet-subtitle">Change the current order status</p>

          {statusOptions.map((opt) => (
            <div
              key={opt.key}
              className={`status-option ${selected === opt.key ? 'selected' : ''}`}
              onClick={() => setSelected(opt.key)}
            >
              <div className={`status-option-icon ${opt.iconClass}`}>
                <i className={`fas ${opt.icon}`}></i>
              </div>
              <div className="status-option-text">
                <h4>{opt.label}</h4>
                <p>{opt.desc}</p>
              </div>
              <div className="status-option-check">
                <i className="fas fa-check"></i>
              </div>
            </div>
          ))}

          <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => { onSave(selected); onClose(); }}>
            <i className="fas fa-check"></i> Update Status
          </button>
          <button className="btn btn-secondary" style={{ marginTop: '10px' }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
