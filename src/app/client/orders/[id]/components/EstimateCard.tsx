'use client';

interface EstimateCardProps {
  estimate: string;
  daysLeft: string;
}

export default function EstimateCard({ estimate, daysLeft }: EstimateCardProps) {
  return (
    <div className="estimate-card">
      <div className="estimate-icon"><i className="fas fa-calendar-check"></i></div>
      <div className="estimate-text">
        <h4>Estimated Delivery</h4>
        <p>{estimate}</p>
      </div>
      <div className="estimate-date">{daysLeft}</div>
    </div>
  );
}
