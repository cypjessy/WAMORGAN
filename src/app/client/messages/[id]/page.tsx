'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supportTicketService } from '@/lib/db';
import type { SupportMessage } from '@/lib/db';
import Snackbar from '../components/Snackbar';

function Bubble({ msg }: { msg: SupportMessage }) {
  const isSent = msg.type === 'sent';
  return (
    <div style={{
      display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start',
      marginBottom: 8, padding: '0 16px',
    }}>
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
        background: isSent ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
        color: isSent ? 'white' : 'var(--text-primary)',
        fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
        borderBottomRightRadius: isSent ? 4 : 16,
        borderBottomLeftRadius: isSent ? 16 : 4,
      }}>
        <div>{msg.text}</div>
        <div style={{
          fontSize: 10, marginTop: 4, opacity: 0.7,
          textAlign: isSent ? 'right' : 'left',
        }}>
          {msg.time || ''}
        </div>
      </div>
    </div>
  );
}

export default function ClientTicketChatPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('Support Ticket');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState('9:41');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time messages
  useEffect(() => {
    if (!ticketId) return;
    const unsub = supportTicketService.onMessages(ticketId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return unsub;
  }, [ticketId]);

  // Fetch ticket metadata
  useEffect(() => {
    if (!ticketId || !user) return;
    const unsub = supportTicketService.onTickets((all) => {
      const ticket = all.find(t => t.id === ticketId);
      if (ticket) {
        setSubject(ticket.subject || 'Support Ticket');
        setStatus(ticket.status);
        // Reset unread
        if ((ticket.unread || 0) > 0) {
          supportTicketService.updateTicket(ticketId, { unread: 0 });
        }
      }
    });
    return unsub;
  }, [ticketId, user]);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !ticketId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await supportTicketService.sendMessage(ticketId, {
        type: 'sent',
        text,
        time: new Date().toLocaleTimeString(),
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      showToast('Failed to send');
    } finally {
      setSending(false);
    }
  }, [input, ticketId, sending, showToast]);

  if (!user) {
    return (
      <div className="app-container">
        <div className="empty-state show" style={{ paddingTop: 80 }}>
          <div className="empty-icon"><i className="fas fa-user-lock"></i></div>
          <h3>Sign in required</h3>
          <button className="btn btn-primary" onClick={() => router.push('/')}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
      {/* Status Bar */}
      <div className="status-bar">
        <span className="time">{clock}</span>
        <div className="icons"><i className="fas fa-signal"></i><i className="fas fa-wifi"></i><i className="fas fa-battery-full"></i></div>
      </div>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer', padding: 4 }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{subject}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '12px 0', paddingBottom: 80, overflowY: 'auto' }}>
        {loading ? (
          <div className="loading-state" style={{ paddingTop: 60 }}>
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state show" style={{ padding: '40px 20px' }}>
            <div className="empty-icon"><i className="fas fa-comment-dots"></i></div>
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>No messages yet</h3>
            <p style={{ fontSize: 13 }}>Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} msg={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '10px 16px', background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', gap: 8, alignItems: 'flex-end',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
            background: input.trim() ? 'var(--accent-gradient)' : 'var(--bg-primary)',
            color: input.trim() ? 'white' : 'var(--text-muted)',
            fontSize: 16, cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>

      <Snackbar visible={toastVisible} message={toastMessage} type="success" onHide={() => setToastVisible(false)} />
    </div>
  );
}
