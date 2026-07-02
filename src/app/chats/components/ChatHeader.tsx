'use client';

interface ChatHeaderProps {
  avatar: string;
  name: string;
  online: boolean;
  onBack: () => void;
  onCall: () => void;
  onInfo: () => void;
}

export default function ChatHeader({ avatar, name, online, onBack, onCall, onInfo }: ChatHeaderProps) {
  return (
    <div className="chat-header">
      <button className="chat-back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i>
      </button>
      <div className={`chat-header-avatar ${online ? 'online' : ''}`}>{avatar}</div>
      <div className="chat-header-info">
        <h3>{name}</h3>
        <p className={online ? '' : 'offline'}>{online ? 'Online' : 'Last seen recently'}</p>
      </div>
      <div className="chat-header-actions">
        <button className="chat-header-btn" onClick={onCall}>
          <i className="fas fa-phone"></i>
        </button>
        <button className="chat-header-btn" onClick={onInfo}>
          <i className="fas fa-ellipsis-vertical"></i>
        </button>
      </div>
    </div>
  );
}
