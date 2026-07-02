'use client';

interface TabBarProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
