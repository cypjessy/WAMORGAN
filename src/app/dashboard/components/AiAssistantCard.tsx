'use client';

interface AiAssistantCardProps {
  onClick?: () => void;
}

export default function AiAssistantCard({ onClick }: AiAssistantCardProps) {
  return (
    <div className="ai-card" onClick={onClick}>
      <div className="ai-header">
        <div className="ai-avatar">
          <div className="pulse-ring"></div>
          <i className="fas fa-robot"></i>
        </div>
        <div className="ai-title">
          <h4>AI Sales Assistant</h4>
          <p>Automating your WhatsApp sales</p>
        </div>
      </div>
      <div className="ai-stats">
        <div className="ai-stat">
          <div className="ai-stat-value" style={{ color: 'var(--success)' }}>89%</div>
          <div className="ai-stat-label">Response Rate</div>
        </div>
        <div className="ai-stat">
          <div className="ai-stat-value" style={{ color: 'var(--accent-primary)' }}>142</div>
          <div className="ai-stat-label">Sales Closed</div>
        </div>
        <div className="ai-stat">
          <div className="ai-stat-value" style={{ color: 'var(--info)' }}>3.2s</div>
          <div className="ai-stat-label">Avg Response</div>
        </div>
      </div>
    </div>
  );
}
