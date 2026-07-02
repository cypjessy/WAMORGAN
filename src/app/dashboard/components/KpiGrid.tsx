'use client';

interface KpiGridProps {
  orderCount?: number;
  revenue?: number;
  customerCount?: number;
  productCount?: number;
  onCardClick?: (type: string) => void;
}

export default function KpiGrid({ orderCount = 0, revenue = 0, customerCount = 0, productCount = 0, onCardClick }: KpiGridProps) {
  const kpiData = [
    { type: 'revenue', icon: 'fa-coins', value: `KSh ${revenue.toLocaleString()}`, label: 'Revenue', trend: { direction: 'up' as const, value: 'Live' } },
    { type: 'orders', icon: 'fa-shopping-bag', value: orderCount.toString(), label: 'Orders', trend: { direction: 'up' as const, value: 'Total' } },
    { type: 'products', icon: 'fa-boxes-stacked', value: productCount.toString(), label: 'Products', trend: { direction: 'up' as const, value: 'Active' } },
    { type: 'chats', icon: 'fa-comments', value: customerCount.toString(), label: 'Customers', trend: { direction: 'up' as const, value: 'Total' } },
  ];

  return (
    <div className="kpi-grid">
      {kpiData.map((card) => (
        <div key={card.type} className={`kpi-card ${card.type}`} onClick={() => onCardClick?.(card.type)}>
          <div className="kpi-icon"><i className={`fas ${card.icon}`}></i></div>
          <div className="kpi-value">{card.value}</div>
          <div className="kpi-label">{card.label}</div>
          <div className={`kpi-trend ${card.trend.direction}`}>
            <i className={`fas fa-arrow-${card.trend.direction}`}></i> {card.trend.value}
          </div>
        </div>
      ))}
    </div>
  );
}
