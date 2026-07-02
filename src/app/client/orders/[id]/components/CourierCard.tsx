'use client';

interface CourierCardProps {
  avatar: string;
  name: string;
  onCall: () => void;
  onMessage: () => void;
}

export default function CourierCard({ avatar, name, onCall, onMessage }: CourierCardProps) {
  return (
    <div className="courier-card">
      <div className="courier-avatar">{avatar}</div>
      <div className="courier-info">
        <h4>{name}</h4>
        <p>Your delivery partner</p>
      </div>
      <div className="courier-actions">
        <button className="courier-btn call" onClick={onCall}><i className="fas fa-phone"></i></button>
        <button className="courier-btn msg" onClick={onMessage}><i className="fas fa-message"></i></button>
      </div>
    </div>
  );
}
