'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputAreaProps {
  onSend: (text: string) => void;
  onAttachToggle: () => void;
  onQuickReply: (text: string) => void;
  onOpenTemplates: () => void;
}

const quickReplies = [
  { text: 'Hello! How can I help you today?', label: 'Greeting', ai: true },
  { text: 'Here is our catalog: [link]', label: 'Send Catalog', ai: false },
  { text: 'Your order is being processed!', label: 'Order Status', ai: false },
  { text: 'Thank you for your purchase!', label: 'Thank You', ai: false },
];

export default function ChatInputArea({ onSend, onAttachToggle, onQuickReply, onOpenTemplates }: ChatInputAreaProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    autoResize();
  }, [text]);

  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <button className="chat-attach-btn" onClick={onAttachToggle}>
          <i className="fas fa-paperclip" id="attachIcon"></i>
        </button>
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Type a message..."
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="chat-send-btn" onClick={handleSend} disabled={!text.trim()}>
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
      <div className="quick-replies">
        {quickReplies.map((qr, i) => (
          <button
            key={i}
            className={`quick-reply ${qr.ai ? 'ai' : ''}`}
            onClick={() => onQuickReply(qr.text)}
          >
            {qr.ai && <i className="fas fa-robot" style={{ fontSize: '10px' }}></i>} {qr.label}
          </button>
        ))}
        <button className="quick-reply" onClick={onOpenTemplates}>
          <i className="fas fa-layer-group" style={{ fontSize: '10px' }}></i> Templates
        </button>
      </div>
    </div>
  );
}
