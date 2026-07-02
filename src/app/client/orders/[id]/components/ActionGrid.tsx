'use client';

interface Action {
  icon: string;
  label: string;
  onClick: () => void;
}

interface ActionGridProps {
  actions: Action[];
}

export default function ActionGrid({ actions }: ActionGridProps) {
  return (
    <div className="action-grid">
      {actions.map((action, i) => (
        <button key={i} className="action-btn" onClick={action.onClick}>
          <i className={action.icon}></i>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
