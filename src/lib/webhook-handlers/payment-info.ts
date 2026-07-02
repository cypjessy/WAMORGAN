// ─── Payment Info Handler ────────────────────────────────────────────────────
// Displays business payment methods via WhatsApp, adapted from WhatsApp WAMORGAN.
//
// ⚡ No Firebase dependency — uses static mock data.

export interface PaymentInfoDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  startTyping?: (tenantId: string, phone: string) => Promise<void>;
  stopTyping?: (tenantId: string, phone: string) => Promise<void>;
  getPaymentMethods?: () => Promise<any>;
}

export async function sendPaymentInfo(
  tenantId: string,
  phone: string,
  deps: PaymentInfoDeps
): Promise<void> {
  if (deps.startTyping) await deps.startTyping(tenantId, phone);

  try {
    let paymentText = `💳 *Accepted Payment Methods*\n\n`;
    let hasMethods = false;

    const methods = deps.getPaymentMethods ? await deps.getPaymentMethods() : null;

    if (methods?.mpesa?.enabled) {
      hasMethods = true;
      const mpesa = methods.mpesa;
      paymentText += `🟢 *M-Pesa*\n`;
      if (mpesa.buyGoods?.enabled && mpesa.buyGoods.tillNumber) {
        paymentText += `   Till Number: *${mpesa.buyGoods.tillNumber}*\n`;
      }
      if (mpesa.paybill?.enabled && mpesa.paybill.paybillNumber) {
        paymentText += `   Paybill: *${mpesa.paybill.paybillNumber}*\n`;
        if (mpesa.paybill.accountNumber) {
          paymentText += `   Account: *${mpesa.paybill.accountNumber}*\n`;
        }
      }
      paymentText += '\n';
    }

    if (methods?.bank?.enabled) {
      hasMethods = true;
      paymentText += `🏦 *Bank Transfer*\n`;
      if (methods.bank.bankName) paymentText += `   Bank: ${methods.bank.bankName}\n`;
      if (methods.bank.accountName) paymentText += `   Account: ${methods.bank.accountName}\n`;
      if (methods.bank.accountNumber) paymentText += `   Account Number: *${methods.bank.accountNumber}*\n`;
      paymentText += '\n';
    }

    if (methods?.card?.enabled) {
      hasMethods = true;
      paymentText += `💳 *Card Payments*\n` +
        `   Visa / Mastercard accepted\n\n`;
    }

    if (methods?.cash?.enabled) {
      hasMethods = true;
      paymentText += `💵 *Cash on Delivery*\n` +
        `   Pay when you receive your order\n\n`;
    }

    if (!hasMethods) {
      paymentText = `💳 *Accepted Payment Methods*\n\n` +
        `❌ No payment methods have been configured yet.\n\n` +
        `Please contact the business directly to complete your payment.\n\n` +
        `📞 Call/WhatsApp: *+254 700 000 000*\n`;
    }

    const response = paymentText +
      `━━━━━━━━━━━━━━━\n` +
      `💡 *How to Pay:*\n` +
      `1️⃣ Choose your preferred method\n` +
      `2️⃣ Complete the payment\n` +
      `3️⃣ Share transaction ID with us\n` +
      `4️⃣ We'll confirm and process your order\n\n` +
      `Need help? Reply *0* for main menu.`;

    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
  } catch (error) {
    console.error('[PaymentInfo] Error:', error);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone,
      '❌ Unable to fetch payment info. Please try again later.'
    );
  }
}
