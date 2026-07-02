// ─── Webhook Logger ─────────────────────────────────────────────────────────
// Logs Evolution API webhook events for debugging and monitoring.

interface WebhookLogData {
  tenantId: string;
  eventType: string;
  phone: string;
  message: string;
  processingTimeMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  context?: Record<string, any>;
}

/**
 * Log a webhook processing result.
 * In production, this would write to Firestore or a logging service.
 */
export async function logWebhookEvent(data: WebhookLogData): Promise<void> {
  const timestamp = new Date().toISOString();
  const logEntry = { ...data, timestamp };

  // For now, just console log
  if (data.status === 'error') {
    console.error('[Webhook Error]', logEntry);
  } else {
    console.log('[Webhook Success]', logEntry);
  }
}

/**
 * Format phone number from Evolution API format (e.g., "254712345678@s.whatsapp.net").
 */
export function extractPhone(rawNumber: string): string {
  return rawNumber.replace(/@s\.whatsapp\.net$/, '').trim();
}

/**
 * Extract sender info from a webhook message.
 */
export function extractSenderInfo(msg: any): { phone: string; name?: string; pushName?: string } {
  const key = msg.key || {};
  const pushName = msg.pushName || '';

  // Extract phone from remoteJid (e.g., "254712345678@s.whatsapp.net")
  const remoteJid = key.remoteJid || '';
  const phone = extractPhone(remoteJid);

  return { phone, name: pushName || undefined, pushName };
}

/**
 * Check if a message is from a group chat.
 */
export function isGroupMessage(msg: any): boolean {
  const remoteJid = msg.key?.remoteJid || '';
  return remoteJid.includes('@g.us');
}

/**
 * Extract the text content from a message.
 */
export function extractMessageText(msg: any): string {
  const message = msg.message || {};
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.buttonsResponseMessage?.selectedButtonId ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    ''
  );
}

/**
 * Generate a unique message/conversation ID.
 */
export function generateChatId(phone: string, instanceName: string): string {
  return `${instanceName}_${phone}`;
}
