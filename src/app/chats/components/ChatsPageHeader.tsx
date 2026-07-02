'use client';

interface ChatsPageHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function ChatsPageHeader({ searchQuery, onSearchChange }: ChatsPageHeaderProps) {
  return (
    <div className="conv-header">
      <div className="conv-header-top">
        <h1>Chats</h1>
      </div>
      <div className="search-bar-chat">
        <i className="fas fa-search search-icon-chat"></i>
        <input
          type="text"
          className="search-input-chat"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
