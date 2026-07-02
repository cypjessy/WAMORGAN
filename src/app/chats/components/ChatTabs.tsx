'use client';

interface ChatTabsProps {
  activeTab: string;
  onSelect: (tab: string) => void;
}

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread', badge: 3 },
  { key: 'ai', label: 'AI Handled' },
  { key: 'manual', label: 'Manual' },
  { key: 'customers', label: 'Customers' },
];

export default function ChatTabs({ activeTab, onSelect }: ChatTabsProps) {
  return (
    <div className="chat-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`chat-tab ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
          {tab.badge !== undefined && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}
