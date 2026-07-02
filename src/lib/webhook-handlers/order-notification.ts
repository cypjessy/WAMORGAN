// ─── Order Notification Handler ─────────────────────────────────────────────
// Sends order confirmations, status updates, and cancellation notifications
// via WhatsApp to customers. Adapted from WhatsApp WAMORGAN's pattern.

import { sendMessage } from '@/lib/evolution';
import { businessProfileService } from '@/lib/db';

export interface OrderNotificationDeps {
  evolutionUrl?: string;
  evolutionApiKey?: string;
  instanceName?: string;
}

async function resolveInstanceName(deps?: OrderNotificationDeps): Promise<string> {
  if (deps?.instanceName) return deps.instanceName;
  try {
    const profile = await businessProfileService.getProfile();
    if (profile?.whatsappInstanceName) return profile.whatsappInstanceName;
  } catch {}
  return 'wamorgan-instance-01';
}

// ─── Status Emoji Map ───────────────────────────────────────────────────────

const STATUS_EMOJIS: Record<string, string> = {
  pending: '⏳',
  processing: '🔄',
  shipped: '🚚',
  out_for_delivery: '📦',
  completed: '✅',
  cancelled: '❌',
  refunded: '💰',
};

// ─── Notification Templates ─────────────────────────────────────────────────

function getStatusEmoji(status: string): string {
  return STATUS_EMOJIS[status?.toLowerCase()] || '📦';
}

function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Send order confirmation when a new order is created.
 */
export async function sendOrderConfirmation(
  phone: string,
  order: {
    id: string;
    items: Array<{ name: string; qty: number; price: number; orderLink?: string }>;
    total: number;
    customer: string;
    delivery?: { method: string; address?: string; pickupLocation?: string };
    paymentInfo?: { method: string };
  },
  deps?: OrderNotificationDeps
): Promise<void> {
  try {
    const itemLines = order.items
      .map((item, idx) => {
        let line = `${idx + 1}. ${item.name} x${item.qty} — KSh ${(item.price * item.qty).toFixed(2)}`;
        if (item.orderLink) line += `\n   🔗 Order again: ${item.orderLink}`;
        return line;
      })
      .join('\n');

    const deliveryInfo = order.delivery
      ? order.delivery.method === 'pickup'
        ? `📍 *Pickup Location:* ${order.delivery.pickupLocation || 'Store'}`
        : `📍 *Delivery Address:* ${order.delivery.address || 'To be confirmed'}`
      : '';

    const paymentMethod = order.paymentInfo?.method
      ? `💳 *Payment Method:* ${capitalizeFirst(order.paymentInfo.method)}`
      : '';

    const message = `⏳ *Order Received — Awaiting Payment*\n\n` +
      `Hi *${order.customer}*, your order has been received and is pending payment confirmation.\n\n` +
      `📦 *Order:* ${order.id}\n\n` +
      `📋 *Items:*\n${itemLines}\n\n` +
      `💰 *Total:* KSh ${order.total.toFixed(2)}\n` +
      `${deliveryInfo}\n` +
      `${paymentMethod}\n\n` +
      `🕐 Your order will start processing once payment is confirmed.\n\n` +
      `Reply *STATUS ${order.id.slice(-4)}* to check your order status.`;

    const instanceName = await resolveInstanceName(deps);
    await sendMessage(instanceName, phone, message);
  } catch (error) {
    console.error('[OrderNotification] Error sending confirmation:', error);
  }
}

/**
 * Send order status update notification.
 */
export async function sendOrderStatusUpdate(
  phone: string,
  orderId: string,
  oldStatus: string,
  newStatus: string,
  customerName: string,
  deps?: OrderNotificationDeps
): Promise<void> {
  try {
    const oldEmoji = getStatusEmoji(oldStatus);
    const newEmoji = getStatusEmoji(newStatus);

    const statusMessages: Record<string, string> = {
      pending: 'Your order is pending and awaiting payment confirmation.',
      processing: 'Your order is being processed and prepared!',
      shipped: 'Your order has been shipped and is on its way! 🚚',
      completed: 'Your order has been delivered successfully! ✅',
      cancelled: 'Your order has been cancelled.',
    };

    const statusMessage = statusMessages[newStatus?.toLowerCase()] || `Status updated to ${capitalizeFirst(newStatus)}.`;

    const message = `📦 *Order Update — ${orderId}*\n\n` +
      `Hi *${customerName}*,\n\n` +
      `Your order status has been updated:\n\n` +
      `${oldEmoji} ${capitalizeFirst(oldStatus)} → ${newEmoji} *${capitalizeFirst(newStatus)}*\n\n` +
      `${statusMessage}\n\n` +
      `Reply *STATUS ${orderId.slice(-4)}* to check your order anytime.`;

    const instanceName = await resolveInstanceName(deps);
    await sendMessage(instanceName, phone, message);
  } catch (error) {
    console.error('[OrderNotification] Error sending status update:', error);
  }
}

/**
 * Send cancellation confirmation.
 */
export async function sendOrderCancellation(
  phone: string,
  orderId: string,
  customerName: string,
  deps?: OrderNotificationDeps
): Promise<void> {
  try {
    const message = `❌ *Order Cancelled — ${orderId}*\n\n` +
      `Hi *${customerName}*,\n\n` +
      `Your order has been cancelled as requested.\n\n` +
      `💳 If you've already made a payment, your refund will be processed within 24-48 business hours.\n\n` +
      `We're sorry to see you go! If you change your mind, we're here to help.\n\n` +
      `Reply *MENU* to browse our products.`;

    const instanceName = await resolveInstanceName(deps);
    await sendMessage(instanceName, phone, message);
  } catch (error) {
    console.error('[OrderNotification] Error sending cancellation:', error);
  }
}
