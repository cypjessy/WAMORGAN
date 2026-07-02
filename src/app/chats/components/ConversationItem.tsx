'use client';

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  online: boolean;
  lastMsg: string;
  time: string;
  unread: number;
  type: string;
  ai: boolean;
  status: string;
}

interface ConversationItemProps {
  conv: Conversation;
  onClick: () => void;
}

export default function ConversationItem({ conv, onClick }: ConversationItemProps) {
  const statusIcon = conv.status === 'read'
    ? '<i class="fas fa-check-double" style="color: #60dfff;"></i>'
    : conv.status === 'delivered'
    ? '<i class="fas fa-check-double"></i>'
    : '<i class="fas fa-check"></i>';

  return (
    <div className="conv-item" onClick={onClick}>
      <div className={`conv-avatar ${conv.online ? 'online' : ''}`}>
        {conv.avatar}
        {conv.ai && (
          <div className="ai-badge"><i className="fas fa-robot"></i></div>
        )}
      </div>
      <div className="conv-info">
        <div className="conv-info-header">
          <span className="conv-name">{conv.name}</span>
          <span className="conv-time">{conv.time}</span>
        </div>
        <div className="conv-preview">
          <span className={`conv-preview-text ${conv.unread > 0 ? 'unread' : ''}`}>{conv.lastMsg}</span>
          {conv.unread === 0 && (
            <span className="message-status" style={{ fontSize: '10px', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: statusIcon }} />
          )}
        </div>
      </div>
      {conv.unread > 0 && <span className="conv-unread">{conv.unread}</span>}
    </div>
  );
}
