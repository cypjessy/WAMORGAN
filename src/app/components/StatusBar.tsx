'use client';

interface StatusBarProps {
  clock: string;
}

export default function StatusBar({ clock }: StatusBarProps) {
  return (
    <div className="status-bar">
      <span className="time" id="clock">{clock}</span>
      <div className="icons">
        <i className="fas fa-signal"></i>
        <i className="fas fa-wifi"></i>
        <i className="fas fa-battery-full"></i>
      </div>
    </div>
  );
}
