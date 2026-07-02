// ─── Order Status Handler ────────────────────────────────────────────────────
// Handles order status inquiries via WhatsApp, adapted from WhatsApp WAMORGAN
// for WAMORGAN's in-memory data model.
//
// ⚡ No Firebase dependency — uses static mock data.

export interface OrderStatusDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  startTyping?: (tenantId: string, phone: string) => Promise<void>;
  stopTyping?: (tenantId: string, phone: string) => Promise<void>;
  setFlowState?: (tenantId: string, phone: string, state: any) => Promise<void>;
  getOrders?: (customerPhone?: string) => Promise<any[]>;
}

// ─── Mock Orders ─────────────────────────────────────────────────────────────

const MOCK_ORDERS = [
  { orderNumber: 'ORD-2841', total: 185.00, status: 'pending', products: [{ name: 'Nike Air Max 270', quantity: 1, price: 185 }], createdAt: new Date('2026-06-29'), deliveryAddress: 'CBD Branch (Pickup)', paymentMethod: 'M-Pesa', paymentStatus: 'unpaid', customerPhone: '254712345678' },
  { orderNumber: 'ORD-2840', total: 399.00, status: 'processing', products: [{ name: 'Apple Watch Series 9', quantity: 1, price: 399 }], createdAt: new Date('2026-06-29'), deliveryAddress: '456 Oak Ave, Los Angeles', paymentMethod: 'Credit Card', paymentStatus: 'paid', customerPhone: '254712345678' },
  { orderNumber: 'ORD-2839', total: 640.32, status: 'pending', products: [{ name: 'Sony WH-1000XM5', quantity: 2, price: 348 }], createdAt: new Date('2026-06-29'), deliveryAddress: 'Westlands Mall (Pickup)', paymentMethod: 'Bank Transfer', paymentStatus: 'unpaid', customerPhone: '254712345678' },
  { orderNumber: 'ORD-2838', total: 1199.00, status: 'completed', products: [{ name: 'iPhone 15 Pro Max', quantity: 1, price: 1199 }], createdAt: new Date('2026-06-28'), deliveryAddress: '321 Elm St, Miami', paymentMethod: 'Credit Card', paymentStatus: 'paid', customerPhone: '254798765432' },
  { orderNumber: 'ORD-2837', total: 249.00, status: 'processing', products: [{ name: 'Leather Jacket', quantity: 1, price: 249 }], createdAt: new Date('2026-06-28'), deliveryAddress: 'Nyali Centre (Pickup)', paymentMethod: 'M-Pesa', paymentStatus: 'paid', customerPhone: '254712345678' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

    // Normalize phone to a consistent format for matching
    const normalizedPhone = phone.replace(/[^0-9]/g, '').replace(/^0+/, '254');
    const orders = deps.getOrders ? await deps.getOrders(normalizedPhone) : MOCK_ORDERS;

    // Check if it's an order number
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
      // Show recent orders
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
  const allOrders = orders || (deps.getOrders ? await deps.getOrders() : MOCK_ORDERS);
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

  recentOrders.forEach((order, idx) => {
    const statusEmoji = getStatusEmoji(order.status);
    const date = order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    message += `${idx + 1}️⃣ *${order.orderNumber}*\n`;
    message += `    📅 ${date}\n`;

    const items = order.products || order.items || [];
    if (items.length > 0) {
      items.forEach((item: any) => {
        message += `    📦 ${item.name} x${item.quantity}\n`;
        if (item.orderLink) message += `    🔗 ${item.orderLink}\n`;
      });
    }

    message += `   💰 KSh ${order.total.toFixed(2)}\n`;
    message += `   📊 ${statusEmoji} ${capitalizeFirst(order.status)}\n\n`;
  });

  message += `━━━━━━━━━━━━━━━\n\n`;
  message += `Reply with a number (1-${recentOrders.length}) for details,\n`;
  message += `or type an Order Number (e.g., ORD-2841)\n`;
  message += `or *0* for main menu`;

  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);

  if (deps.setFlowState) {
    await deps.setFlowState(tenantId, phone, {
      step: 'order_selection',
      data: { recentOrders },
      context: { lastActivity: new Date().toISOString() },
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
  const date = order.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  let message = `✅ *Order Found!*\n\n`;
  message += `📦 *${order.orderNumber}*\n`;
  message += `📅 ${date}\n`;
  message += `💰 Total: KSh ${order.total.toFixed(2)}\n`;
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

  if (order.deliveryAddress) {
    message += `📍 *Delivery:* ${order.deliveryAddress}\n`;
  }

  if (order.paymentMethod) {
    message += `💳 *Payment:* ${order.paymentMethod}\n`;
  }

  if (order.paymentStatus) {
    const paymentEmoji = order.paymentStatus === 'paid' ? '✅' : '⏳';
    message += `${paymentEmoji} *Payment Status:* ${capitalizeFirst(order.paymentStatus)}\n`;
  }

  message += `\n━━━━━━━━━━━━━━━\n`;
  message += `0️⃣ Back to main menu`;

  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);
}
