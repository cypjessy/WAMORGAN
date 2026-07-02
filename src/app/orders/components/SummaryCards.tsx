'use client';

interface SummaryCardsProps {
  totalRevenue: number;
  totalOrders: number;
}

export default function SummaryCards({ totalRevenue, totalOrders }: SummaryCardsProps) {
  return (
    <div className="summary-row">
      <div className="summary-card revenue">
        <div className="summary-icon"><i className="fas fa-coins"></i></div>
        <div className="summary-value">KSh {totalRevenue.toLocaleString()}</div>
        <div className="summary-label">Total Revenue</div>
      </div>
      <div className="summary-card orders">
        <div className="summary-icon"><i className="fas fa-shopping-bag"></i></div>
        <div className="summary-value">{totalOrders}</div>
        <div className="summary-label">Total Orders</div>
      </div>
    </div>
  );
}
