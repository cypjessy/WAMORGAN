import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || "",
});

export interface AIContext {
  businessName: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    category?: string;
    categoryName?: string;
    stock?: number;
    description?: string;
    imageUrl?: string;
    emoji?: string;
    brand?: string;
    condition?: string;
    colors?: string[];
    sizes?: string[];
    sku?: string;
    warranty?: string;
    variants?: Array<{
      id: string;
      specs: Record<string, string>;
      price: number;
      stock: number;
    }>;
  }>;
  recentOrders?: Array<{
    id: string;
    orderNumber?: string;
    customerName: string;
    status: string;
    total: number;
  }>;
  businessProfile?: {
    tagline?: string;
    description?: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  shippingMethods?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  paymentMethods?: {
    mpesa?: { enabled: boolean; buyGoods?: { tillNumber?: string }; paybill?: { paybillNumber?: string } };
    bank?: { enabled: boolean; bankName?: string; accountNumber?: string };
    card?: { enabled: boolean };
    cash?: { enabled: boolean };
  };
  productSettings?: {
    storeDescription?: string;
    returnPolicy?: string;
    warrantyInfo?: string;
  };
}

export async function generateAIResponse(
  message: string,
  context: AIContext,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const systemPrompt = `
You are an AI sales assistant for "${context.businessName}", a WhatsApp-based e-commerce store.

BUSINESS INFO:
- Name: ${context.businessName}
${context.businessProfile?.tagline ? `- Tagline: ${context.businessProfile.tagline}` : ''}
${context.businessProfile?.description ? `- Description: ${context.businessProfile.description}` : ''}
${context.businessProfile?.phone ? `- Phone: ${context.businessProfile.phone}` : ''}
${context.businessProfile?.whatsappNumber ? `- WhatsApp: ${context.businessProfile.whatsappNumber}` : ''}
${context.businessProfile?.website ? `- Website: ${context.businessProfile.website}` : ''}
${context.businessProfile?.address ? `- Address: ${context.businessProfile.address}` : ''}

PRODUCTS:
${context.products.map(p => {
  const stockInfo = p.stock && p.stock > 0 ? `(${p.stock} in stock)` : "(Out of stock)";
  const priceInfo = p.salePrice
    ? `KSh ${p.salePrice} (was KSh ${p.price})`
    : `KSh ${p.price}`;
  return `- ${p.emoji || '📦'} ${p.name} - ${priceInfo} ${stockInfo}${p.description ? `\n  ${p.description}` : ''}${p.brand ? `\n  Brand: ${p.brand}` : ''}${p.colors ? `\n  Colors: ${p.colors.join(', ')}` : ''}${p.sizes ? `\n  Sizes: ${p.sizes.join(', ')}` : ''}`;
}).join('\n')}

${context.shippingMethods?.length ? `SHIPPING:\n${context.shippingMethods.map(s => `- ${s.name}: KSh ${s.price}`).join('\n')}` : ''}

${context.productSettings?.returnPolicy ? `RETURN POLICY: ${context.productSettings.returnPolicy}` : ''}
${context.productSettings?.warrantyInfo ? `WARRANTY: ${context.productSettings.warrantyInfo}` : ''}

${context.recentOrders?.length ? `RECENT ORDERS:\n${context.recentOrders.map(o => `- ${o.orderNumber || o.id}: ${o.customerName} - ${o.status} - KSh ${o.total}`).join('\n')}` : ''}

Guidelines:
1. Be friendly, helpful, and concise
2. Recommend products based on customer needs
3. Provide accurate pricing and stock information
4. Help customers place orders
5. Check order status when asked
6. If you don't know something, say so honestly
7. Keep responses under 200 words
8. Use emojis sparingly
`.trim();

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...conversationHistory
          .filter(msg => msg.content && msg.content.trim() !== "")
          .map(msg => ({ role: msg.role === "user" ? "user" as const : "assistant" as const, content: msg.content })),
        { role: "user", content: message },
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 500,
        top_p: 0.8,
      });

      const response = chatCompletion.choices[0]?.message?.content || "";
      return response.trim();
    } catch (error) {
      lastError = error;
      console.error(`[AI] Attempt ${attempt}/${maxRetries} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
}
