'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { hapticsImpact, takePhoto } from '@/lib/capacitor';
import { conversationService, supportTicketService, orderService } from '@/lib/db';
import type { Message, SupportTicket, SupportMessage, Order } from '@/lib/db';
import BottomNav from '../components/BottomNav';
import ChatsPageHeader from './components/ChatsPageHeader';
import ConversationItem from './components/ConversationItem';
import type { Conversation } from './components/ConversationItem';
import ChatHeader from './components/ChatHeader';
import MessageBubble from './components/MessageBubble';
import ChatInputArea from './components/ChatInputArea';
import AttachMenu from './components/AttachMenu';
import ContactInfoSheet from './components/ContactInfoSheet';
import NewChatSheet from './components/NewChatSheet';
import TemplateSheet from './components/TemplateSheet';
import MediaPreview from './components/MediaPreview';
import BlockDialog from './components/BlockDialog';
import AiDialog from './components/AiDialog';
import Snackbar from './components/Snackbar';
import MoreSheet from '../components/MoreSheet';
import { sendCatalogMessage, sendMessage } from '@/lib/evolution';
import { productService } from '@/lib/db';
import { useInstanceName } from '@/utils/useInstanceName';
import './chats.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type LocalMessage = {
  type: 'date' | 'sent' | 'received';
  text: string;
  time: string;
  status?: string;
  ai?: boolean;
  product?: { emoji: string; name: string; price: number; desc: string };
};

type Channel = 'whatsapp' | 'inapp';

// ─── Converters ───────────────────────────────────────────────────────────────

function toLocalConv(c: import('@/lib/db').Conversation): Conversation {
  let timeStr = '';
  const ts = c.lastMessageTime?.toDate ? c.lastMessageTime.toDate() : c.lastMessageTime ? new Date(c.lastMessageTime) : null;
  if (ts) {
    const diff = Date.now() - ts.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) timeStr = 'now';
    else if (mins < 60) timeStr = `${mins}m`;
    else if (mins < 1440) timeStr = `${Math.floor(mins / 60)}h`;
    else timeStr = `${Math.floor(mins / 1440)}d`;
  }
  return {
    id: c.id,
    name: c.name,
    avatar: '👤',
    phone: c.phone || '',
    online: false,
    lastMsg: c.lastMessage || '',
    time: timeStr,
    unread: c.unread || 0,
    type: 'customer',
    ai: c.ai || false,
    status: c.status || 'read',
  };
}

function toLocalMsg(m: Message): LocalMessage {
  return {
    type: m.type as 'date' | 'sent' | 'received',
    text: m.text,
    time: m.time || '',
    status: m.status,
    ai: m.ai,
    product: m.product,
  };
}

interface TicketConv {
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

function toTicketConv(t: SupportTicket): TicketConv {
  let timeStr = '';
  const ts = t.lastMessageTime?.toDate ? t.lastMessageTime.toDate() : t.lastMessageTime ? new Date(t.lastMessageTime) : null;
  if (ts) {
    const diff = Date.now() - ts.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) timeStr = 'now';
    else if (mins < 60) timeStr = `${mins}m`;
    else if (mins < 1440) timeStr = `${Math.floor(mins / 60)}h`;
    else timeStr = `${Math.floor(mins / 1440)}d`;
  }
  return {
    id: t.id,
    name: t.userName,
    avatar: '👤',
    phone: t.email,
    online: false,
    lastMsg: t.lastMessage || '',
    time: timeStr,
    unread: t.unread || 0,
    type: 'customer',
    ai: false,
    status: t.status,
  };
}

// ─── Channel Toggle ───────────────────────────────────────────────────────────

function ChannelToggle({ channel, onChange }: { channel: Channel; onChange: (c: Channel) => void }) {
  return (
    <div style={{
      display: 'flex', margin: '0 20px 12px', padding: 4,
      borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
    }}>
      {(['whatsapp', 'inapp'] as const).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-full)',
            background: channel === c ? 'var(--accent-gradient)' : 'transparent',
            color: channel === c ? 'white' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <i className={`fas ${c === 'whatsapp' ? 'fa-whatsapp' : 'fa-comment-dots'}`}></i>
          {c === 'whatsapp' ? 'WhatsApp' : 'In-App'}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const router = useRouter();
  const instanceName = useInstanceName();

  // ─── Channel toggle ────────────────────────────────────────────────────────
  const [channel, setChannel] = useState<Channel>('whatsapp');

  // ─── Search ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ─── WhatsApp Conversations (real-time) ────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let loaded = false;

    // Subscribe with incremental updates via docChanges()
    const unsub = conversationService.onConversations('whatsapp', (dbConvs, changes) => {
      if (cancelled) return;

      if (dbConvs) {
        // First snapshot — full list
        setConversations(dbConvs.map(toLocalConv));
        loaded = true;
        setConvLoading(false);
      } else if (changes.length > 0) {
        // Subsequent snapshots — only apply changed conversations
        setConversations(prev => {
          const next = [...prev];
          for (const change of changes) {
            const idx = next.findIndex(c => c.id === change.doc.id);
            const updated = change.type !== 'removed' ? toLocalConv(change.doc) : null;
            if (change.type === 'removed') {
              if (idx !== -1) next.splice(idx, 1);
            } else if (change.type === 'modified' && idx !== -1) {
              // Remove from old position, unshift to front (newest message = top)
              next.splice(idx, 1);
              next.unshift(updated!);
            } else if (idx !== -1) {
              // 'added' but already exists (edge case)
              next[idx] = updated!;
            } else {
              // New conversation — add to front
              next.unshift(updated!);
            }
          }
          return next;
        });
        if (!loaded) { loaded = true; setConvLoading(false); }
      }
    }, (error: any) => {
      // Subscription failed (likely missing composite index) — fall back to one-time fetch
      console.warn('[Chats] Conversation snapshot failed, falling back to fetch:', error.message);
      if (!cancelled) {
        conversationService.getConversations('whatsapp').then((dbConvs) => {
          if (!cancelled) {
            setConversations(dbConvs.map(toLocalConv));
            setConvLoading(false);
          }
        }).catch((fetchErr) => {
          console.error('[Chats] Fallback fetch also failed:', fetchErr);
          if (!cancelled) setConvLoading(false);
        });
      }
    });

    // Safety timeout — force-load via fetch if snapshot never fired after 8s
    const timeout = setTimeout(() => {
      if (!cancelled && !loaded) {
        console.warn('[Chats] Snapshot timeout, fallback fetching conversations');
        conversationService.getConversations('whatsapp').then((dbConvs) => {
          if (!cancelled) {
            setConversations(dbConvs.map(toLocalConv));
            setConvLoading(false);
          }
        }).catch(() => {
          if (!cancelled) setConvLoading(false);
        });
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  // ─── WhatsApp Messages (real-time) ─────────────────────────────────────────
  const [messages, setMessages] = useState<Record<string, LocalMessage[]>>({});

  // ─── In-App Tickets (real-time) ────────────────────────────────────────────
  const [tickets, setTickets] = useState<TicketConv[]>([]);
  const [ticketLoading, setTicketLoading] = useState(true);

  useEffect(() => {
    const unsub = supportTicketService.onTickets((dbTickets) => {
      setTickets(dbTickets.map(toTicketConv));
      setTicketLoading(false);
    });
    return unsub;
  }, []);

  // ─── In-App Messages (real-time) ──────────────────────────────────────────
  const [ticketMessages, setTicketMessages] = useState<Record<string, SupportMessage[]>>({});

  // ─── Shared chat view state ────────────────────────────────────────────────
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inChatView, setInChatView] = useState(false);

  // Subscribe to messages based on channel + active chat
  useEffect(() => {
    if (!activeChatId) return;
    if (channel === 'whatsapp') {
      const unsub = conversationService.onMessages(activeChatId, (dbMessages) => {
        setMessages(prev => ({ ...prev, [activeChatId]: dbMessages.map(toLocalMsg) }));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });
      return unsub;
    } else {
      const unsub = supportTicketService.onMessages(activeChatId, (dbMessages) => {
        setTicketMessages(prev => ({ ...prev, [activeChatId]: dbMessages }));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      });
      return unsub;
    }
  }, [activeChatId, channel]);

  // ─── Nav ───────────────────────────────────────────────────────────────────
  const [navIndex, setNavIndex] = useState(2);
  const [fabOpen, setFabOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // ─── Sheets & dialogs ──────────────────────────────────────────────────────
  const [attachOpen, setAttachOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [mediaPreviewOpen, setMediaPreviewOpen] = useState(false);
  const [mediaPreviewEmoji, setMediaPreviewEmoji] = useState('');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [deleteMsgTarget, setDeleteMsgTarget] = useState<{ convId: string; msgIndex: number } | null>(null);

  // ─── Toast ─────────────────────────────────────────────────────────────────
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const activeConvList = channel === 'whatsapp' ? conversations : tickets;
  const loading = channel === 'whatsapp' ? convLoading : ticketLoading;

  const filteredConvs = useMemo(() =>
    activeConvList.filter((c) => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }),
  [activeConvList, searchQuery]);

  const activeConv = useMemo(() => activeConvList.find((c) => c.id === activeChatId), [activeConvList, activeChatId]);
  const activeMessages: any[] = activeChatId
    ? channel === 'whatsapp'
      ? messages[activeChatId] || []
      : ticketMessages[activeChatId] || []
    : [];

  // ─── Contact info stats ────────────────────────────────────────────────────
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [contactOrders, setContactOrders] = useState(0);
  const [contactSpent, setContactSpent] = useState(0);
  const [contactSince, setContactSince] = useState('');

  useEffect(() => {
    if (!contactInfoOpen || !activeConv || channel !== 'whatsapp') return;
    const phone = (activeConv as any)?.phone || '';
    if (!phone) return;
    orderService.getOrders().then(all => {
      const customerOrders = all.filter((o: Order) => o.customerPhone === phone || o.customerName === activeConv.name);
      setContactOrders(customerOrders.length);
      setContactSpent(customerOrders.reduce((sum: number, o: Order) => sum + (o.total || 0), 0));
      if (customerOrders.length > 0) {
        const dates = customerOrders.map((o: Order) => o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0));
        const earliest = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
        setContactSince(earliest.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }));
      } else {
        setContactSince('');
      }
    }).catch(() => {});
  }, [contactInfoOpen, activeConv, channel]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const openChat = useCallback(async (id: string) => {
    await hapticsImpact('light');
    setActiveChatId(id);
    setInChatView(true);
    // Mark unread as 0 locally + persist to Firestore
    if (channel === 'whatsapp') {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
      conversationService.markConversationAsRead(id).catch(err =>
        console.error('Failed to mark conversation as read:', err)
      );
    } else {
      setTickets(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    }
  }, [channel]);

  const handleBackToList = useCallback(() => {
    setInChatView(false);
    setActiveChatId(null);
    setAttachOpen(false);
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeChatId || !activeConv) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    try {
      if (channel === 'whatsapp') {
        await conversationService.sendMessage(activeChatId, { type: 'sent', text, time });
        // Send via Evolution API directly
        if ((activeConv as any).phone) {
          sendMessage(instanceName, (activeConv as any).phone, text)
            .catch(err => console.error('Evolution send failed:', err));
        }
      } else {
        await supportTicketService.sendMessage(activeChatId, { type: 'sent', text, time });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send message', 'error');
    }

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [activeChatId, activeConv, channel, showToast]);

  const handleSendQuickReply = useCallback((text: string) => handleSendMessage(text), [handleSendMessage]);
  const handleSendTemplate = useCallback((text: string) => { setTemplateOpen(false); handleSendMessage(text); }, [handleSendMessage]);

  const handleSendCatalog = useCallback(async () => {
    setTemplateOpen(false);
    if (!activeChatId || !activeConv || channel !== 'whatsapp') return;
    try {
      const products = await productService.getProducts();
      if (products.length === 0) {
        handleSendMessage('📦 Our catalog is currently empty. Check back soon!');
        return;
      }
      const topProducts = products.slice(0, 5).map(p => ({
        title: p.name,
        description: p.description || '',
        imageUrl: p.imageUrl || '',
        price: p.salePrice || p.price,
        sku: p.sku,
      }));
      const conv = activeConv as any;
      await sendCatalogMessage(
        instanceName,
        conv.phone,
        '🛍️ Our Products',
        'Check out our latest collection!',
        'WAMORGAN Store',
        topProducts
      );
      const now = new Date();
      const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      await conversationService.sendMessage(activeChatId, { type: 'sent', text: '📨 Sent product catalog', time, ai: true });
      showToast('Catalog sent!', 'success');
    } catch (err) {
      console.error('Failed to send catalog:', err);
      showToast('Failed to send catalog', 'error');
    }
  }, [activeChatId, activeConv, channel, instanceName, handleSendMessage, showToast]);

  const handleDeleteMessage = useCallback((msgIndex: number) => {
    if (!activeChatId) return;
    if (!activeMessages[msgIndex]) return;
    setDeleteMsgTarget({ convId: activeChatId, msgIndex });
  }, [activeChatId, channel, activeMessages]);

  const handleConfirmDeleteMessage = useCallback(async () => {
    if (!deleteMsgTarget) return;
    const { convId } = deleteMsgTarget;
    try {
      if (channel === 'whatsapp') {
        // Get the messages snapshot to find actual doc ID
        const dbMessages = await conversationService.getMessages(convId);
        // Find message by matching from activeMessages state
        const msgIndex = deleteMsgTarget.msgIndex;
        const localMsg = activeMessages[msgIndex];
        if (localMsg) {
          // Match by content to find the Firestore doc
          const match = dbMessages.find(m => m.text === localMsg.text && m.time === localMsg.time && m.type === localMsg.type);
          if (match?.id) {
            await conversationService.deleteMessage(convId, match.id);
            showToast('Message deleted', 'success');
          } else {
            showToast('Could not find message to delete', 'error');
          }
        }
      } else {
        const dbMessages = await supportTicketService.getMessages(convId);
        const msgIndex = deleteMsgTarget.msgIndex;
        const localMsg = activeMessages[msgIndex];
        if (localMsg) {
          const match = dbMessages.find(m => m.text === localMsg.text && m.time === localMsg.time && m.type === localMsg.type);
          if (match?.id) {
            await supportTicketService.deleteMessage(convId, match.id);
            showToast('Message deleted', 'success');
          } else {
            showToast('Could not find message to delete', 'error');
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      showToast('Failed to delete message', 'error');
    }
    setDeleteMsgTarget(null);
  }, [deleteMsgTarget, channel, activeMessages, showToast]);

  const handleAttachAction = useCallback(async (action: string) => {
    setAttachOpen(false);
    await hapticsImpact('light');
    if (action === 'camera') {
      const photo = await takePhoto();
      if (photo) showToast('Photo captured', 'success');
      return;
    }
    if (action === 'gallery') {
      const { pickFromGallery } = await import('@/lib/capacitor');
      const image = await pickFromGallery();
      if (image) showToast('Image selected', 'success');
      return;
    }
    showToast(action.charAt(0).toUpperCase() + action.slice(1) + ' opened', 'success');
  }, [showToast]);

  const handleNewChat = useCallback((name: string, avatar: string, phone: string) => {
    showToast(`Started chat with ${name}`, 'success');
  }, [showToast]);

  // Cleanup
  useEffect(() => () => clearTimeout(toastTimeout.current), []);

  const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'In-App';

  return (
    <AuthGuard requiredRole="admin">
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Chat pages container */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* ========== CONVERSATION LIST ========== */}
        <div className={`chat-page ${!inChatView ? 'active' : 'exit'}`}>
          <div className="conv-list-scroll">
            <ChatsPageHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              
            />

            <ChannelToggle channel={channel} onChange={(c) => { setChannel(c); setSearchQuery(''); }} />

            <div id="conversationsList">
              {loading ? (
                <div className="loading-state"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '32px auto' }} /></div>
              ) : filteredConvs.length === 0 ? (
                <div className="empty-state show" style={{ padding: '32px 16px' }}>
                  <div className="empty-icon"><i className={`fas ${channel === 'whatsapp' ? 'fa-whatsapp' : 'fa-comment-dots'}`}></i></div>
                  <h3 style={{ fontSize: 15, marginBottom: 4 }}>No {channelLabel} messages</h3>
                  <p style={{ fontSize: 13, marginBottom: 0 }}>
                    {channel === 'whatsapp' ? 'WhatsApp conversations will appear here' : 'Member support messages will appear here'}
                  </p>
                </div>
              ) : (
                filteredConvs.map((conv) => (
                  <ConversationItem key={conv.id} conv={conv} onClick={() => openChat(conv.id)} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========== CHAT VIEW ========== */}
        <div className={`chat-page ${inChatView ? 'active' : ''}`}>
          <div className="chat-view">
            <ChatHeader
              avatar={activeConv?.avatar || '👤'}
              name={activeConv?.name || ''}
              online={activeConv?.online || false}
              onBack={handleBackToList}
              onCall={() => showToast('Voice call coming soon', 'info')}
              onInfo={() => setContactInfoOpen(true)}
            />

            <div className="messages-area">
              {activeMessages.map((msg: any, i) => {
                if (msg.type === 'date') return <div key={i} className="message-date">{msg.text}</div>;
                return (
                  <MessageBubble
                    key={i}
                    type={msg.type as 'sent' | 'received'}
                    text={msg.text}
                    time={msg.time}
                    status={msg.status}
                    ai={msg.ai}
                    product={msg.product}
                    onAddToCart={() => showToast('Product added to cart', 'success')}
                    onDelete={() => handleDeleteMessage(i)}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <AttachMenu open={attachOpen} onAction={handleAttachAction} />

            <ChatInputArea
              onSend={handleSendMessage}
              onAttachToggle={() => setAttachOpen(!attachOpen)}
              onQuickReply={handleSendQuickReply}
              onOpenTemplates={() => { if (channel === 'whatsapp') setTemplateOpen(true); }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ display: inChatView ? 'none' : 'block' }}>
        <BottomNav
          activeIndex={navIndex}
          fabOpen={fabOpen}
          onNavClick={(i) => { setNavIndex(i); router.push(['/dashboard', '/products', '/chats', '/orders'][i]); }}
          onFabClick={() => { setFabOpen(!fabOpen); setNewChatOpen(true); }}
          onMoreClick={() => setMoreSheetOpen(true)}
        />
      </div>

      {/* Sheets */}
      <ContactInfoSheet
        open={contactInfoOpen}
        avatar={activeConv?.avatar || '👤'} name={activeConv?.name || ''}
        phone={channel === 'whatsapp' ? (activeConv as any)?.phone || '' : (activeConv as any)?.phone || ''}
        customerSince={contactSince || undefined}
        totalOrders={contactOrders}
        totalSpent={contactSpent}
        onClose={() => setContactInfoOpen(false)}
        onBlock={() => { setContactInfoOpen(false); setBlockDialogOpen(true); }}
        onMediaClick={(emoji) => { setMediaPreviewEmoji(emoji); setMediaPreviewOpen(true); }}
      />
      <NewChatSheet open={newChatOpen} onClose={() => { setNewChatOpen(false); setFabOpen(false); }} onStartChat={handleNewChat} />
      <TemplateSheet open={templateOpen} onClose={() => setTemplateOpen(false)} onSendTemplate={handleSendTemplate} onSendCatalog={handleSendCatalog} />
      <MediaPreview open={mediaPreviewOpen} emoji={mediaPreviewEmoji} onClose={() => setMediaPreviewOpen(false)} />
      <BlockDialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)} onConfirm={() => { setBlockDialogOpen(false); showToast('Contact blocked', 'success'); }} />

      {/* Delete Message Dialog */}
      <div className={`dialog-overlay ${deleteMsgTarget ? 'active' : ''}`} onClick={() => setDeleteMsgTarget(null)}>
        <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-icon danger" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--error-soft)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
            <i className="fas fa-trash-alt"></i>
          </div>
          <h3>Delete Message?</h3>
          <p>This will permanently delete this message from the conversation.</p>
          <div className="dialog-actions">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteMsgTarget(null)}>Cancel</button>
            <button className="btn" style={{
              flex: 1, background: 'var(--error)', color: 'white', border: 'none',
              borderRadius: 'var(--radius-sm)', height: 48, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }} onClick={handleConfirmDeleteMessage}>
              <i className="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </div>
      </div>
      <AiDialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} onConfirm={() => { setAiDialogOpen(false); showToast('AI Assistant activated', 'success'); }} />
      <MoreSheet open={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} />
      <Snackbar visible={toastVisible} message={toastMessage} type={toastType} />
    </div>
    </AuthGuard>
  );
}
