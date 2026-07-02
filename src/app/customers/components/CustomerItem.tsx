'use client';

export interface Customer {
  id: string;
  name: string;
  initials?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  spent: number;
  orders: number;
  avg: number;
  lastOrder: string;
  notes?: string;
}

export const segmentConfig: Record<string, { color: string; tag: string; label: string }> = {
  vip: { color: 'vip', tag: 'tag-vip', label: 'VIP' },
  regular: { color: 'regular', tag: 'tag-regular', label: 'Regular' },
  new: { color: 'new', tag: 'tag-new', label: 'New' },
  inactive: { color: 'inactive', tag: 'tag-inactive', label: 'Inactive' },
};

interface CustomerItemProps {
  customer: Customer;
  onClick: (id: string) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function CustomerItem({ customer, onClick }: CustomerItemProps) {
  const cfg = segmentConfig[customer.segment];

  return (
    <div className="customer-item" onClick={() => onClick(customer.id)}>
      <div className={`customer-avatar ${cfg.color}`}>
        {customer.initials || getInitials(customer.name)}
        {customer.segment === 'vip' && (
          <div className="vip-crown"><i className="fas fa-crown"></i></div>
        )}
      </div>
      <div className="customer-info">
        <h4>
          {customer.name}
          <span className={`customer-tag ${cfg.tag}`}>{cfg.label}</span>
        </h4>
        <p>{customer.phone || ''} &bull; {customer.lastOrder}</p>
      </div>
      <div className="customer-meta">
        <div className="customer-spent">KSh {customer.spent.toLocaleString()}</div>
        <div className="customer-orders">{customer.orders} orders</div>
      </div>
    </div>
  );
}
