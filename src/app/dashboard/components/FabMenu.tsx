'use client';

interface FabMenuProps {
  open: boolean;
  onAction?: (action: string) => void;
}

const items = [
  { id: 'add-product', icon: 'fa-box', label: 'Add Product' },
  { id: 'new-order', icon: 'fa-file-invoice-dollar', label: 'New Order' },
  { id: 'customers', icon: 'fa-users', label: 'Customers' },
  { id: 'store-settings', icon: 'fa-store', label: 'Store Setup' },
];

export default function FabMenu({ open, onAction }: FabMenuProps) {
  return (
    <div className={`fab-menu ${open ? 'active' : ''}`}>
      {items.map((item) => (
        <button key={item.id} className="fab-menu-item" onClick={() => onAction?.(item.id)}>
          <i className={`fas ${item.icon}`}></i> {item.label}
        </button>
      ))}
    </div>
  );
}
