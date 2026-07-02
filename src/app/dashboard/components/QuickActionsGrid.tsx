'use client';

interface QuickActionsGridProps {
  onAction?: (action: string) => void;
}

const actions = [
  { id: 'add-product', icon: 'fa-plus', label: 'Add Product' },
  { id: 'new-order', icon: 'fa-file-invoice', label: 'New Order' },
  { id: 'customers', icon: 'fa-users', label: 'Customers' },
  { id: 'store-settings', icon: 'fa-store', label: 'Store Setup' },
];

export default function QuickActionsGrid({ onAction }: QuickActionsGridProps) {
  return (
    <div className="quick-actions">
      <div className="section-header">
        <span className="section-title">Quick Actions</span>
      </div>
      <div className="quick-actions-grid">
        {actions.map((a) => (
          <div key={a.id} className="quick-action" onClick={() => onAction?.(a.id)}>
            <div className="quick-action-icon"><i className={`fas ${a.icon}`}></i></div>
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
