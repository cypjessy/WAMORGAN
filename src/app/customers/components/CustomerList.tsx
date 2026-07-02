'use client';

import CustomerItem from './CustomerItem';
import type { Customer } from './CustomerItem';

interface CustomerListProps {
  customers: Customer[];
  onCustomerClick: (id: string) => void;
  onAddCustomer?: () => void;
}

export default function CustomerList({ customers, onCustomerClick, onAddCustomer }: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <div className="empty-state show">
        <div className="empty-icon">
          <i className="fas fa-users"></i>
        </div>
        <h3>No customers found</h3>
        <p>Try adjusting your search or add a new customer to get started.</p>
        {onAddCustomer && (
          <button className="btn btn-primary" onClick={onAddCustomer}>
            <i className="fas fa-plus"></i> Add Customer
          </button>
        )}
      </div>
    );
  }

  // Sort alphabetically
  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));

  // Group by first letter
  let currentLetter = '';
  const rows: { type: 'letter' | 'customer'; value: string | Customer }[] = [];

  sorted.forEach((c) => {
    const firstLetter = c.name[0].toUpperCase();
    if (firstLetter !== currentLetter) {
      currentLetter = firstLetter;
      rows.push({ type: 'letter', value: firstLetter });
    }
    rows.push({ type: 'customer', value: c });
  });

  return (
    <div className="customer-list">
      {rows.map((row, i) => {
        if (row.type === 'letter') {
          return (
            <div key={`letter-${row.value}`} className="section-letter" data-letter={row.value}>
              {row.value as string}
            </div>
          );
        }
        const customer = row.value as Customer;
        return (
          <CustomerItem
            key={customer.id}
            customer={customer}
            onClick={onCustomerClick}
          />
        );
      })}
    </div>
  );
}
