// ─── Order Status Handler ────────────────────────────────────────────────────
// Handles order status inquiries via WhatsApp and order cancellation requests.
// Adapted from WhatsApp WAMORGAN pattern.
// Uses real Firestore data via deps.

export interface OrderStatusDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  startTyping?: (tenantId: string, phone: string) => Promise<void>;
  stopTyping?: (tenantId: string, phone: string) => Promise<void>;
  setFlowState?: (tenantId: string, phone: string, state: any) => Promise<void>;
  clearFlowState?: (tenantId: string, phone: string) => Promise<void>;
  getOrders?: (customerPhone?: string) => Promise<any[]>;
  createCancellationRequest?: (data: {
    orderId: string;
    orderNumber: string;
    customerPhone: string;
    customerName: string;
    reason: string;
  }) => Promise<void>;
  updateOrderStatus?: (orderId: string, status: string) => Promise<void>;
}

function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    pending: '⏳', processing: '🔄', completed: '✅',
    cancelled: '❌', refunded: '💰', shipped: '🚚',
  };
  return map[status?.toLowerCase()] || '📦';
}

function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export function isEligibleForCancellation(status: string): boolean {
  const ineligible = ['shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refunded', 'cancellation_requested'];
  return !ineligible.includes(status?.toLowerCase());
}

// ─── Main Handlers ──────────────────────────────────────────────────────────

export async function handleOrderStatusLookup(
  tenantId: string,
  phone: string,
  query: string,
  deps: OrderStatusDeps
): Promise<void> {
  if (deps.startTyping) await deps.startTyping(tenantId, phone);

  try {
    const input = query.trim().toUpperCase();
    const normalizedPhone = phone.replace(/[^0-9]/g, '').replace(/^0+/, '254');
    const orders = deps.getOrders ? await deps.getOrders(normalizedPhone) : [];

    if (input.startsWith('ORD-')) {
      const order = orders.find((o: any) => o.orderNumber === input);
      if (order) {
        await sendOrderDetails(tenantId, phone, order, deps);
      } else {
        if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
        await deps.sendMessage(tenantId, phone,
          `❌ Order *${input}* not found.\n\n` +
          `Please check the order number and try again.\n\n` +
          `0️⃣ Back to main menu`
        );
      }
    } else {
      await showRecentOrders(tenantId, phone, deps, orders);
    }
  } catch (error) {
    console.error('[OrderStatus] Error:', error);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, '❌ Error fetching order status. Please try again.');
  }
}

async function showRecentOrders(
  tenantId: string,
  phone: string,
  deps: OrderStatusDeps,
  orders?: any[]
): Promise<void> {
  const allOrders = orders || (deps.getOrders ? await deps.getOrders() : []);
  const recentOrders = allOrders.slice(0, 5);

  if (recentOrders.length === 0) {
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone,
      `📦 *No Orders Found*\n\n` +
      `You haven't placed any orders yet.\n\n` +
      `Reply *1* to browse products or *0* for main menu`
    );
    return;
  }

  let message = `📦 *Your Recent Orders*\n\n`;

  recentOrders.forEach((order: any, idx: number) => {
    const statusEmoji = getStatusEmoji(order.status);
    const date = order.createdAt?.toLocaleDateString
      ? order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    message += `${idx + 1}️⃣ *${order.orderNumber || order.id}*\n`;
    message += `    📅 ${date}\n`;

    const items = order.products || order.items || [];
    if (items.length > 0) {
      items.forEach((item: any) => {
        message += `    📦 ${item.name} x${item.quantity}\n`;
        if (item.orderLink) message += `    🔗 ${item.orderLink}\n`;
      });
    }

    message += `   💰 KSh ${Number(order.total || 0).toFixed(2)}\n`;
    message += `   📊 ${statusEmoji} ${capitalizeFirst(order.status)}\n\n`;
  });

  message += `━━━━━━━━━━━━━━━\n\n`;
  message += `Reply with a number (1-${recentOrders.length}) for details,\n`;
  message += `or type an Order Number (e.g., ${recentOrders[0]?.orderNumber?.slice(0, 8) || 'ORD-...'})\n`;
  message += `or *0* for main menu`;

  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);

  if (deps.setFlowState) {
    await deps.setFlowState(tenantId, phone, {
      step: 'order_selection',
      data: { recentOrders },
      lastActivity: new Date().toISOString(),
    });
  }
}

async function sendOrderDetails(
  tenantId: string,
  phone: string,
  order: any,
  deps: OrderStatusDeps
): Promise<void> {
  const statusEmoji = getStatusEmoji(order.status);
  const date = order.createdAt?.toLocaleDateString
    ? order.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  let message = `✅ *Order Found!*\n\n`;
  message += `📦 *${order.orderNumber || order.id}*\n`;
  message += `📅 ${date}\n`;
  message += `💰 Total: KSh ${Number(order.total || 0).toFixed(2)}\n`;
  message += `📊 ${statusEmoji} ${capitalizeFirst(order.status)}\n\n`;

  const items = order.products || order.items || [];
  if (items.length > 0) {
    message += `📋 *Items:*\n`;
    items.forEach((item: any, idx: number) => {
      message += `${idx + 1}. ${item.name} x${item.quantity} — KSh ${(item.price * item.quantity).toFixed(2)}\n`;
      if (item.orderLink) message += `   🔗 Order again: ${item.orderLink}\n`;
    });
    message += '\n';
  }

  if (order.deliveryAddress || order.pickupLocation) {
    message += `📍 *${order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}:* ${order.pickupLocation || order.deliveryAddress}\n`;
  }
  if (order.paymentMethod) message += `💳 *Payment:* ${order.paymentMethod}\n`;
  if (order.paymentStatus) {
    const payEmoji = order.paymentStatus === 'paid' ? '✅' : '⏳';
    message += `${payEmoji} *Payment Status:* ${capitalizeFirst(order.paymentStatus)}\n`;
  }

  message += `\n━━━━━━━━━━━━━━━\n`;

  // Add cancellation option if eligible
  if (isEligibleForCancellation(order.status)) {
    message += `\n1️⃣ - Request Cancellation & Refund\n`;
  }

  message += `0️⃣ Back to main menu`;

  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);

  // Set flow state so we can handle the cancellation selection
  if (deps.setFlowState && isEligibleForCancellation(order.status)) {
    await deps.setFlowState(tenantId, phone, {
      step: 'order_detail',
      flowName: 'order_cancellation',
      data: { order },
      lastActivity: new Date().toISOString(),
    });
  }
}

// ─── Cancellation Flow ──────────────────────────────────────────────────────

export async function handleOrderCancellation(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: OrderStatusDeps
): Promise<void> {
  const text = message.trim();
  const order = flowState.data?.order;

  if (!order) {
    await deps.sendMessage(tenantId, phone, '❌ Order not found. Reply *0* for main menu.');
    if (deps.clearFlowState) await deps.clearFlowState(tenantId, phone);
    return;
  }

  // Handle "back" or "cancel" at any step
  if (text === '0') {
    if (deps.clearFlowState) await deps.clearFlowState(tenantId, phone);
    await deps.sendMessage(tenantId, phone, '0️⃣ Back to main menu');
    return;
  }

  const step = flowState.currentStep || 'init';

  if (step === 'init') {
    // User replied with 1 → directly process cancellation with default reason
    if (text === '1') {
      await processCancellation(tenantId, phone, order, 'Customer requested cancellation via WhatsApp', deps);
    } else {
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone,
        `Reply *1️⃣* to request cancellation or *0️⃣* to go back.`
      );
    }
  }
}

async function processCancellation(
  tenantId: string,
  phone: string,
  order: any,
  reason: string,
  deps: OrderStatusDeps
): Promise<void> {
  try {
    // Create cancellation request in Firestore
    if (deps.createCancellationRequest) {
      await deps.createCancellationRequest({
        orderId: order.id || order._firestoreId || '',
        orderNumber: order.orderNumber || order.id,
        customerPhone: phone,
        customerName: order.customerName || order.customer || 'Customer',
        reason: reason || 'Customer requested cancellation',
      });
    }

    // Update order status to cancellation_requested
    if (deps.updateOrderStatus && (order.id || order._firestoreId)) {
      await deps.updateOrderStatus(order.id || order._firestoreId, 'cancellation_requested');
    }

    if (deps.clearFlowState) await deps.clearFlowState(tenantId, phone);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone,
      `✅ *Cancellation Requested*\n\n` +
      `Your cancellation request for *${order.orderNumber || order.id}* has been submitted.\n\n` +
      `🕐 The admin will review and confirm your cancellation shortly.\n` +
      `You'll receive a notification once it's processed.\n\n` +
      `0️⃣ Back to main menu`
    );
  } catch (error) {
    console.error('[OrderStatus] Cancellation error:', error);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone,
      `❌ Sorry, we couldn't process your cancellation request. Please try again later.\n\n0️⃣ Back to main menu`
    );
  }
}
