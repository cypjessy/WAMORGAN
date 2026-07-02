// ─── Evolution Webhook Handler ──────────────────────────────────────────────
// Receives WhatsApp messages from the Evolution API and processes them.
// Handles: product searches, order status checks, customer interactions.
// Persists conversations and messages to Firestore in real-time.

import { NextRequest, NextResponse } from 'next/server';
import { handleProductSearch as handleProductSearchHandler } from '@/lib/webhook-handlers/product-search';
import { handleOrderStatusLookup } from '@/lib/webhook-handlers/order-status';
import { startProductBrowseFlow, handleProductBrowseInput } from '@/lib/webhook-handlers/product-browse';
import { sendPaymentInfo } from '@/lib/webhook-handlers/payment-info';
import { logWebhookEvent, extractSenderInfo, extractMessageText, isGroupMessage } from '@/lib/webhook-logger';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlowState {
  step: string;
  data?: any;
  context?: Record<string, any>;
  expiresAt: number;
}

// In-memory cache for flow states (primary source for speed, backed by Firestore)
const flowStateCache = new Map<string, FlowState>();

// ─── Flow State Helpers (Firestore-backed) ─────────────────────────────────

const FLOW_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function getFlowState(phone: string, instance: string): Promise<FlowState | null> {
  const key = `${instance}:${phone}`;

  // Check in-memory cache first
  const cached = flowStateCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached;
  flowStateCache.delete(key);

  // Fall back to Firestore
  try {
    const db = getAdminDb();
    if (!db) return null;
    const snap = await db.collection('flowStates').doc(key).get();
    if (!snap.exists) return null;
    const data = snap.data() as FlowState;
    if (data.expiresAt > Date.now()) {
      flowStateCache.set(key, data);
      return data;
    }
    // Expired — clean up
    await db.collection('flowStates').doc(key).delete().catch(() => {});
    return null;
  } catch {
    return null;
  }
}

async function setFlowState(phone: string, instance: string, state: Omit<FlowState, 'expiresAt'>) {
  const key = `${instance}:${phone}`;
  const expiresAt = Date.now() + FLOW_TTL_MS;
  const data: FlowState = { ...state, expiresAt };

  // Update cache
  flowStateCache.set(key, data);

  // Persist to Firestore
  try {
    const db = getAdminDb();
    if (!db) return;
    await db.collection('flowStates').doc(key).set({
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch {
    // Firestore write failure — non-critical, cache still works
  }
}

async function clearFlowState(phone: string, instance: string) {
  const key = `${instance}:${phone}`;
  flowStateCache.delete(key);

  try {
    const db = getAdminDb();
    if (!db) return;
    await db.collection('flowStates').doc(key).delete().catch(() => {});
  } catch {
    // Non-critical
  }
}

// ─── Firestore Helpers ───────────────────────────────────────────────────────

async function getOrCreateConversation(phone: string, name: string): Promise<{ id: string; isNew: boolean }> {
  const db = getAdminDb();
  if (!db) return { id: phone, isNew: false };

  const convRef = db.collection('conversations');
  const existing = await convRef.where('phone', '==', phone).limit(1).get();
  if (!existing.empty) {
    return { id: existing.docs[0].id, isNew: false };
  }

  const docRef = await convRef.add({
    phone,
    name,
    channel: 'whatsapp',
    lastMessage: '',
    unread: 0,
    ai: true,
    status: 'read',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { id: docRef.id, isNew: true };
}

async function saveMessageToFirestore(conversationId: string, msg: { type: string; text: string; time: string; ai?: boolean }) {
  const db = getAdminDb();
  if (!db) return;
  await db.collection('messages').add({
    conversationId,
    type: msg.type,
    text: msg.text,
    time: msg.time,
    ai: msg.ai || false,
    status: msg.type === 'sent' ? 'read' : 'received',
    createdAt: new Date().toISOString(),
  });
}

async function updateConversationLastMessage(conversationId: string, text: string, isReceived: boolean) {
  const db = getAdminDb();
  if (!db) return;
  const update: Record<string, any> = {
    lastMessage: text,
    lastMessageTime: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  if (isReceived) {
    update.unread = FieldValue.increment(1);
  }
  await db.collection('conversations').doc(conversationId).set(update, { merge: true });
}

// ─── Firestore Data Fetchers ─────────────────────────────────────────────────

async function fetchProducts(): Promise<any[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snap = await db.collection('products')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    // Fallback: query without status filter if composite index doesn't exist
    const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p: any) => p.status === 'active' || !p.status);
  }
}

async function fetchOrders(customerPhone?: string): Promise<any[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    let query: any = db.collection('orders');
    if (customerPhone) {
      const normalized = customerPhone.replace(/[^0-9]/g, '');
      query = query.where('customerPhone', '==', normalized);
    }
    query = query.orderBy('createdAt', 'desc');
    const snap = await query.get();
    return snap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });
  } catch {
    // Fallback: fetch all and filter in-memory if composite index doesn't exist
    const snap = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const allOrders = snap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });
    if (customerPhone) {
      const normalized = customerPhone.replace(/[^0-9]/g, '');
      return allOrders.filter((o: any) => {
        const phone = (o.customerPhone || '').replace(/[^0-9]/g, '');
        return phone === normalized;
      });
    }
    return allOrders;
  }
}

async function fetchPaymentMethods(): Promise<any> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection('businessProfiles').doc('main').get();
  if (!snap.exists) return null;
  return snap.data()?.paymentMethods || null;
}

async function fetchWhatsAppSettings(): Promise<any> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection('whatsappSettings').doc('main').get();
  if (!snap.exists) return null;
  return snap.data();
}

// ─── Automation Helpers ──────────────────────────────────────────────────────

async function sendAutomationMessages(
  isNewConversation: boolean,
  phone: string,
  instanceName: string,
  conversationId: string
): Promise<string | null> {
  try {
    const settings = await fetchWhatsAppSettings();
    if (!settings) return null;

    let autoMsg: string | null = null;

    // Welcome message (first contact only)
    if (isNewConversation && settings.welcomeMessageEnabled && settings.welcomeMessage) {
      autoMsg = settings.welcomeMessage;
    }

    // Away message (takes priority over auto-reply when enabled)
    if (!autoMsg && settings.awayMessageEnabled && settings.awayMessage) {
      autoMsg = settings.awayMessage;
    }

    // Auto-reply (fallback if no welcome or away was sent)
    if (!autoMsg && settings.autoReplyEnabled && settings.autoReplyMessage) {
      autoMsg = settings.autoReplyMessage;
    }

    if (autoMsg) {
      await sendWhatsAppMessage(instanceName, phone, autoMsg);
      await saveMessageToFirestore(conversationId, {
        type: 'sent',
        text: autoMsg,
        time: new Date().toLocaleTimeString(),
        ai: true,
      });
      await updateConversationLastMessage(conversationId, autoMsg, false);
    }

    return autoMsg;
  } catch (err) {
    console.error('[Webhook] Automation error:', err);
    return null;
  }
}

// ─── Typing Indicator via Evolution API ──────────────────────────────────────

async function sendTypingIndicatorViaAPI(instanceName: string, phone: string, presence: 'composing' | 'paused') {
  try {
    const { url, apiKey } = getEvolutionCredentials();
    if (!url || !apiKey) return;
    const formattedNumber = await formatJid(phone);
    await fetch(`${url.replace(/\/+$/, '')}/chat/sendPresence/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ number: formattedNumber, presence, delay: 1000 }),
    });
  } catch {
    // Non-critical
  }
}


// ─── Menu System ─────────────────────────────────────────────────────────────
function buildMainMenu(): string {
  return `👋 *Welcome to WAMORGAN!*\n\nI can help you with:\n\n1️⃣ 🔍 *Browse Products*\n2️⃣ 📦 *Order Status*\n3️⃣ 📝 *Place an Order*\n4️⃣ ℹ️ *Contact Us*\n5️⃣ 💳 *Payment Info*\n\nReply with the number of your choice, or just type what you're looking for!`;
}

function buildOrderStatusMenu(): string {
  return `📦 *Order Status*\n\nSend me your *Order ID* (e.g., ORD-2841) and I'll check the status for you.\n\nOr type *0* to go back to the main menu.`;
}

// ─── Send Message Via Evolution API ─────────────────────────────────────────

async function formatJid(phone: string): Promise<string> {
  const cleanNumber = phone.replace(/[^0-9]/g, '');
  return cleanNumber.startsWith('254')
    ? `${cleanNumber}@s.whatsapp.net`
    : cleanNumber.startsWith('0')
    ? `254${cleanNumber.slice(1)}@s.whatsapp.net`
    : `${cleanNumber}@s.whatsapp.net`;
}

function getEvolutionCredentials() {
  return {
    url: process.env.NEXT_PUBLIC_EVOLUTION_URL || process.env.EVOLUTION_API_URL || '',
    apiKey: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || '',
  };
}

async function markMessageAsRead(instanceName: string, phone: string, messageId: string): Promise<void> {
  try {
    const { url, apiKey } = getEvolutionCredentials();
    if (!url || !apiKey) return;
    const formattedNumber = await formatJid(phone);
    await fetch(`${url.replace(/\/+$/, '')}/chat/markMessageAsRead/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ number: formattedNumber, messageId }),
    });
  } catch {
    // Non-critical
  }
}

async function sendWhatsAppMessage(tenantId: string, phone: string, message: string): Promise<void> {
  try {
    const { url, apiKey } = getEvolutionCredentials();
    if (!url || !apiKey) {
      console.warn('[Webhook] Evolution API not configured, cannot send message');
      return;
    }
    const formattedNumber = await formatJid(phone);
    await fetch(`${url.replace(/\/+$/, '')}/message/sendText/${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ number: formattedNumber, text: message }),
    });
  } catch (error) {
    console.error('[Webhook] Failed to send WhatsApp message:', error);
  }
}

// ─── Main Webhook Handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tenantId = 'default';
  let phone = '';
  let messageText = '';

  try {
    const webhookData = await request.json();
    console.log('[Webhook] Received:', JSON.stringify(webhookData).slice(0, 300));

    // Extract instance name from webhook data
    const instanceName = webhookData.instance || webhookData.instanceName || 'default';
    tenantId = instanceName;

    // ─── Handle CONNECTION_UPDATE events ──────────────────────────────────
    const eventType = webhookData.event || webhookData.eventType || '';
    if (eventType === 'CONNECTION_UPDATE' || webhookData.event === 'connection.update') {
      const state = webhookData?.data?.state || webhookData?.state || 'unknown';
      const phone = webhookData?.data?.phone?.number || webhookData?.phone?.number || '';
      const db = getAdminDb();
      if (db) {
        await db.collection('businessProfiles').doc('main').set({
          whatsappConnection: {
            instanceName,
            state,
            phone,
            lastChecked: Timestamp.now(),
            isConnected: state === 'open' || state === 'connected',
          },
          updatedAt: Timestamp.now(),
        }, { merge: true });
      }
      return NextResponse.json({ ok: true, event: 'CONNECTION_UPDATE', state });
    }

    // ─── Extract message data ─────────────────────────────────────────────
    const data = webhookData.data || webhookData;
    const msg = data.message || data;
    const key = msg.key || {};

    phone = extractSenderInfo(msg).phone;
    messageText = extractMessageText(msg);

    // Skip group messages
    if (isGroupMessage(msg)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Skip status broadcasts
    if (key.fromMe || key.remoteJid === 'status@broadcast') {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Skip empty messages (image/video without caption)
    if (!messageText) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    console.log(`[Webhook] From: ${phone}, Message: "${messageText.slice(0, 100)}"`);

    // Persist to Firestore: get or create conversation + save customer message
    let conversationId = phone;
    let isNewConversation = false;
    let customerName = phone;
    const senderInfo = extractSenderInfo(msg);
    if (senderInfo.pushName) customerName = senderInfo.pushName;

    try {
      const conv = await getOrCreateConversation(phone, customerName);
      conversationId = conv.id;
      isNewConversation = conv.isNew;
      await saveMessageToFirestore(conversationId, {
        type: 'received',
        text: messageText,
        time: new Date().toLocaleTimeString(),
        ai: false,
      });
      await updateConversationLastMessage(conversationId, messageText, true);
      // Mark message as read on WhatsApp
      if (key.id) {
        markMessageAsRead(instanceName, phone, key.id).catch(() => {});
      }
    } catch (err) {
      console.error('[Webhook] Failed to persist incoming message:', err);
    }

    // ─── Automation: send welcome/auto-reply/away ─────────────────────────
    const automationResponse = await sendAutomationMessages(
      isNewConversation, phone, instanceName, conversationId
    );

    // Send typing indicator before processing
    await sendTypingIndicatorViaAPI(instanceName, phone, 'composing').catch(() => {});

    // Process the message based on flow state
    const flowState = await getFlowState(phone, instanceName);
    let response = await processMessage(messageText, flowState, phone, instanceName);

    // If an automation message was already sent (welcome/auto-reply), suppress the
    // main menu to avoid double-greeting the customer. Command responses still go through.
    if (response === buildMainMenu() && automationResponse) {
      response = null;
    }

    // Stop typing indicator
    await sendTypingIndicatorViaAPI(instanceName, phone, 'paused').catch(() => {});

    // If there's a response, send it via WhatsApp + persist to Firestore
    if (response) {
      await sendWhatsAppMessage(instanceName, phone, response);

      try {
        await saveMessageToFirestore(conversationId, {
          type: 'sent',
          text: response,
          time: new Date().toLocaleTimeString(),
          ai: true,
        });
        await updateConversationLastMessage(conversationId, response, false);
      } catch (err) {
        console.error('[Webhook] Failed to persist bot response:', err);
      }
    }

    // Log success
    await logWebhookEvent({
      tenantId,
      eventType: 'messages.upsert',
      phone,
      message: messageText,
      processingTimeMs: Date.now() - startTime,
      status: 'success',
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('[Webhook] Error:', error);

    await logWebhookEvent({
      tenantId,
      eventType: 'messages.upsert',
      phone,
      message: messageText,
      processingTimeMs: Date.now() - startTime,
      status: 'error',
      errorMessage: error.message,
    });

    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Evolution webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

// ─── Message Processing ─────────────────────────────────────────────────────

async function processMessage(
  text: string,
  flowState: FlowState | null,
  phone: string,
  instanceName: string
): Promise<string | null> {
  const normalizedText = text.trim().toLowerCase();

  // Handle "0" to go back to main menu
  if (normalizedText === '0') {
    await clearFlowState(phone, instanceName);
    return buildMainMenu();
  }

  // If user is in a flow, continue it
  if (flowState) {
    return handleFlowStep(normalizedText, flowState, phone, instanceName);
  }

  // Check for menu selection
  const menuChoice = normalizedText.match(/^(\d+)$/)?.[1];
  if (menuChoice) {
    return handleMenuChoice(menuChoice, phone, instanceName);
  }

  // Check for order ID (looks like ORD-XXXX or similar)
  const orderIdMatch = text.match(/(ORD[-:]\s*\d+)/i);
  if (orderIdMatch) {
    await handleOrderStatusLookup(instanceName, phone, orderIdMatch[1], {
      sendMessage: (tid, p, msg) => sendWhatsAppMessage(tid, p, msg),
      startTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'composing'),
      stopTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'paused'),
      setFlowState: async (tid, p, state) => { await setFlowState(p, tid, state); },
      getOrders: fetchOrders,
    });
    return null;
  }

  // Default: show main menu so the customer knows their options
  await clearFlowState(phone, instanceName);
  return buildMainMenu();
}

async function handleMenuChoice(
  choice: string,
  phone: string,
  instanceName: string
): Promise<string | null> {
  switch (choice) {
    case '1': {
      await setFlowState(phone, instanceName, {
        step: 'browsing_products',
        data: {},
      });
      // Use the product browse flow with Firestore data
      startProductBrowseFlow(instanceName, phone, {
        sendMessage: (tid, p, msg) => sendWhatsAppMessage(tid, p, msg),
        startTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'composing'),
        stopTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'paused'),
        setFlowState: async (tid, p, state) => { await setFlowState(p, tid, state); },
        getProducts: fetchProducts,
      }).catch(console.error);
      return null;
    }

    case '2':
      await setFlowState(phone, instanceName, {
        step: 'order_status',
        data: {},
      });
      return buildOrderStatusMenu();

    case '3':
      return `📝 *Place an Order*\n\nTo place an order, please contact our team directly:\n📞 Call/WhatsApp: *+254 700 000 000*\n✉️ Email: *orders@sellflow.ai*\n\nOr browse our products and we'll help you order!`;

    case '4':
      return `ℹ️ *Contact Us*\n\n📍 *Location:* Nairobi, Kenya\n📞 *Phone:* +254 700 000 000\n✉️ *Email:* hello@sellflow.ai\n🕐 *Hours:* Mon-Sat, 8AM - 6PM\n\nWe're here to help! 💪`;

    case '5':
      await setFlowState(phone, instanceName, {
        step: 'payment_info',
        data: {},
      });
      return `💳 *Payment Methods*\n\nI'll show you the available payment options. One moment please...`;

    default:
      return `I didn't understand that choice. Please reply with a number from the menu, or type *0* to see the menu again.\n\n${buildMainMenu()}`;
  }
}

async function handleFlowStep(
  text: string,
  flowState: FlowState,
  phone: string,
  instanceName: string
): Promise<string | null> {
  switch (flowState.step) {
    case 'browsing_products': {
      if (text === '0') {
        await clearFlowState(phone, instanceName);
        return buildMainMenu();
      }

      const browseDeps = {
        sendMessage: (tid: string, p: string, msg: string) => sendWhatsAppMessage(tid, p, msg),
        startTyping: (t: string, p: string) => sendTypingIndicatorViaAPI(t, p, 'composing'),
        stopTyping: (t: string, p: string) => sendTypingIndicatorViaAPI(t, p, 'paused'),
        setFlowState: async (tid: string, p: string, state: any) => { await setFlowState(p, tid, state); },
        getProducts: fetchProducts,
      };

      // Try browse flow first; if it throws GO_TO_MENU or fails, fall back to search
      try {
        if (flowState.data?.categories || flowState.data?.subcategories) {
          await handleProductBrowseInput(instanceName, phone, text, flowState.data, browseDeps);
          return null;
        }
      } catch (browseErr: any) {
        if (browseErr.message === 'GO_TO_MENU') {
          await clearFlowState(phone, instanceName);
          return buildMainMenu();
        }
      }

      await setFlowState(phone, instanceName, {
        step: 'product_search',
        data: { query: text },
      });

      try {
        await handleProductSearchHandler(instanceName, phone, text, {
          sendTypingIndicator: (t, p) => sendTypingIndicatorViaAPI(t, p, 'composing'),
          stopTypingIndicator: (t, p) => sendTypingIndicatorViaAPI(t, p, 'paused'),
          sendMessage: (tenantId: string, phoneNum: string, msg: string) =>
            sendWhatsAppMessage(tenantId, phoneNum, msg),
          setFlowState: async (tenantId: string, phoneNum: string, state: any) => {
            await setFlowState(phoneNum, tenantId, state);
          },
          getProducts: fetchProducts,
        });
        return null;
      } catch (err) {
        return `🔍 I couldn't find "${text}". Try a different keyword or type *0* for the main menu.`;
      }
    }

    case 'order_status': {
      if (text === '0') {
        await clearFlowState(phone, instanceName);
        return buildMainMenu();
      }

      await handleOrderStatusLookup(instanceName, phone, text, {
        sendMessage: (tid, p, msg) => sendWhatsAppMessage(tid, p, msg),
        startTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'composing'),
        stopTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'paused'),
        setFlowState: async (tid, p, state) => { await setFlowState(p, tid, state); },
        getOrders: fetchOrders,
      });
      return null;
    }

    case 'order_selection': {
      if (text === '0') {
        await clearFlowState(phone, instanceName);
        return buildMainMenu();
      }

      const num = parseInt(text);
      const orders = flowState.data?.recentOrders || [];
      if (!isNaN(num) && num >= 1 && num <= orders.length) {
        const order = orders[num - 1];
        const statusEmoji: Record<string, string> = {
          pending: '⏳', processing: '🔄', completed: '✅',
          cancelled: '❌', refunded: '💰', shipped: '🚚',
        };
        const emoji = statusEmoji[order.status?.toLowerCase()] || '📦';
        const date = order.createdAt?.toLocaleDateString
          ? order.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : '';

        let msg = `✅ *${order.orderNumber}*\n`;
        msg += `📅 ${date}\n`;
        msg += `💰 Total: KSh ${Number(order.total || 0).toFixed(2)}\n`;
        msg += `${emoji} Status: ${order.status}\n\n`;

        const items = order.products || order.items || [];
        if (items.length > 0) {
          msg += `📋 *Items:*\n`;
          items.forEach((item: any, i: number) => {
            msg += `${i + 1}. ${item.name} x${item.quantity} — KSh ${(item.price * item.quantity).toFixed(2)}\n`;
          });
          msg += '\n';
        }

        if (order.deliveryAddress) msg += `📍 *Delivery:* ${order.deliveryAddress}\n`;
        if (order.paymentMethod) msg += `💳 *Payment:* ${order.paymentMethod}\n`;
        if (order.paymentStatus) {
          const payEmoji = order.paymentStatus === 'paid' ? '✅' : '⏳';
          msg += `${payEmoji} *Payment Status:* ${order.paymentStatus}\n`;
        }

        msg += `\n0️⃣ Back to main menu`;
        await clearFlowState(phone, instanceName);
        return msg;
      }

      // Invalid number — show recent orders again
      await handleOrderStatusLookup(instanceName, phone, '', {
        sendMessage: (tid, p, msg) => sendWhatsAppMessage(tid, p, msg),
        startTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'composing'),
        stopTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'paused'),
        setFlowState: async (tid, p, state) => { await setFlowState(p, tid, state); },
        getOrders: fetchOrders,
      });
      return null;
    }

    case 'payment_info': {
      if (text === '0') {
        await clearFlowState(phone, instanceName);
        return buildMainMenu();
      }

      await sendPaymentInfo(instanceName, phone, {
        sendMessage: (tid, p, msg) => sendWhatsAppMessage(tid, p, msg),
        startTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'composing'),
        stopTyping: (t, p) => sendTypingIndicatorViaAPI(t, p, 'paused'),
        getPaymentMethods: fetchPaymentMethods,
      });
      await clearFlowState(phone, instanceName);
      return null;
    }

    case 'product_search': {
      if (text === '0') {
        await clearFlowState(phone, instanceName);
        return buildMainMenu();
      }

      try {
        await handleProductSearchHandler(instanceName, phone, text, {
          sendTypingIndicator: (t, p) => sendTypingIndicatorViaAPI(t, p, 'composing'),
          stopTypingIndicator: (t, p) => sendTypingIndicatorViaAPI(t, p, 'paused'),
          sendMessage: (tenantId: string, phoneNum: string, msg: string) =>
            sendWhatsAppMessage(tenantId, phoneNum, msg),
          setFlowState: async (tenantId: string, phoneNum: string, state: any) => {
            await setFlowState(phoneNum, tenantId, state);
          },
          getProducts: fetchProducts,
        });
        return null;
      } catch (err) {
        await clearFlowState(phone, instanceName);
        return `🔍 Couldn't find anything for "${text}". Type *0* for the main menu.`;
      }
    }

    default:
      await clearFlowState(phone, instanceName);
      return buildMainMenu();
  }
}


