// ─── Customer Registration Handler ──────────────────────────────────────────
// Sends welcome messages to new customers registered via the admin portal.
//
// ⚡ Uses the Evolution API directly.

import { sendMessage } from '@/lib/evolution';
import { businessProfileService } from '@/lib/db';

export interface CustomerRegistrationDeps {
  evolutionUrl?: string;
  evolutionApiKey?: string;
  instanceName?: string;
}

async function resolveInstanceName(deps?: CustomerRegistrationDeps): Promise<string> {
  if (deps?.instanceName) return deps.instanceName;
  try {
    const profile = await businessProfileService.getProfile();
    if (profile?.whatsappInstanceName) return profile.whatsappInstanceName;
  } catch {}
  return 'wamorgan-instance-01';
}

/**
 * Send a welcome message to a newly registered customer via WhatsApp.
 */
export async function sendCustomerWelcomeMessage(
  phone: string,
  customerName: string,
  deps?: CustomerRegistrationDeps
): Promise<void> {
  try {
    const message = `🎉 *Welcome to WAMORGAN, ${customerName}!*\n\n` +
      `We're excited to have you on board! 🛍️\n\n` +
      `Here's what you can do:\n\n` +
      `1️⃣ *Browse Products* - Check out our latest collection\n` +
      `2️⃣ *Track Orders* - Get real-time updates on your purchases\n` +
      `3️⃣ *Special Offers* - Be the first to know about deals\n\n` +
      `Reply *MENU* to see the main menu and start shopping!\n\n` +
      `Thank you for choosing us! 💪`;

    const instanceName = await resolveInstanceName(deps);
    await sendMessage(instanceName, phone, message);
  } catch (error) {
    console.error('[CustomerRegistration] Error sending welcome message:', error);
    // Don't throw — welcome message failure shouldn't block registration
  }
}
