'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supportTicketService } from '@/lib/db';
import type { SupportTicket } from '@/lib/db';
import ClientBottomNav from '../components/ClientBottomNav';
import Snackbar from './components/Snackbar';

function timeAgo(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const statusColors: Record<string, string> = { open: 'var(--success)', closed: 'var(--text-muted)', pending: 'var(--warning)' };
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 20px', marginBottom: 8, borderRadius: 'var(--radius-md)',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{ticket.subject || 'Support Ticket'}</h4>
        <span style={{ fontSize: 11, fontWeight: 600, color: statusColors[ticket.status] || 'var(--text-muted)' }}>
          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
        </span>
      </div>
      {ticket.lastMessage && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ticket.lastMessage}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(ticket.lastMessageTime || ticket.createdAt)}</span>
        {(ticket.unread || 0) > 0 && (
          <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient-soft)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700 }}>
            {ticket.unread} new
          </span>
        )}
      </div>
    </div>
  );
}

export default function ClientMessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    return supportTicketService.onUserTickets(user.uid, (userTickets) => {
      setTickets(userTickets);
      setLoading(false);
    });
  }, [user]);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  return (
    <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      <div className="main-scroll" style={{ paddingTop: 0, paddingBottom: 80 }}>
        <div style={{ padding: '16px 20px 20px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Messages</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Chat with our support team</p>
        </div>

        {!user ? (
          <div className="empty-state show" style={{ padding: '40px 20px' }}>
            <div className="empty-icon"><i className="fas fa-user-lock"></i></div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Sign in required</h3>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Please log in to contact support</p>
            <button className="btn btn-primary" onClick={() => router.push('/')}>
              <i className="fas fa-sign-in-alt"></i> Sign In
            </button>
          </div>
        ) : loading ? (
          <div className="loading-state"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '32px auto' }} /></div>
        ) : tickets.length === 0 ? (
          <div className="empty-state show" style={{ padding: '40px 20px' }}>
            <div className="empty-icon"><i className="fas fa-comment-dots"></i></div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>No messages yet</h3>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Start a conversation with our support team</p>
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  const ticket = await supportTicketService.createTicket({
                    userId: user!.uid,
                    userName: user!.displayName || user!.email || 'Member',
                    email: user!.email || '',
                    subject: 'Support Request',
                    status: 'open',
                    lastMessage: 'Hello! I need help.',
                    lastMessageTime: new Date().toISOString(),
                    unread: 0,
                  });
                  await supportTicketService.sendMessage(ticket.id, { type: 'sent', text: 'Hello! I need help.', time: new Date().toLocaleTimeString() });
                  router.push(`/client/messages/${ticket.id}`);
                } catch (e) {
                  showToast('Failed to create ticket');
                }
              }}
            >
              <i className="fas fa-plus"></i> New Conversation
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            <button
              className="btn btn-primary"
              style={{ marginBottom: 12 }}
              onClick={async () => {
                try {
                  const ticket = await supportTicketService.createTicket({
                    userId: user!.uid,
                    userName: user!.displayName || user!.email || 'Member',
                    email: user!.email || '',
                    subject: 'Support Request',
                    status: 'open',
                    lastMessage: 'Hello! I need help.',
                    lastMessageTime: new Date().toISOString(),
                    unread: 0,
                  });
                  await supportTicketService.sendMessage(ticket.id, { type: 'sent', text: 'Hello! I need help.', time: new Date().toLocaleTimeString() });
                  router.push(`/client/messages/${ticket.id}`);
                } catch (e) {
                  showToast('Failed to create ticket');
                }
              }}
            >
              <i className="fas fa-plus"></i> New Conversation
            </button>
            {tickets.map(t => (
              <TicketCard key={t.id} ticket={t} onClick={() => router.push(`/client/messages/${t.id}`)} />
            ))}
          </div>
        )}
      </div>

      <ClientBottomNav activeIndex={2} />
      <Snackbar visible={toastVisible} message={toastMessage} type="success" onHide={() => setToastVisible(false)} />
    </div>
  );
}
