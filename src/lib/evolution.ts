// ─── Evolution API Client Library ───────────────────────────────────────────
// Routes all calls through the server-side proxy at /api/evolution/[...path]
// to avoid exposing API credentials to the client.

import { buildApiUrl } from '@/lib/api-config';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
}

export interface InstanceData {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  apiKey?: string;
  qrCode?: string;
  pairingCode?: string;
  phoneNumber?: string;
}

// ─── Config Management ──────────────────────────────────────────────────────

let cachedConfig: EvolutionConfig | null = null;

export async function getEvolutionConfig(): Promise<EvolutionConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const res = await fetch(buildApiUrl('/api/evolution-config'));
    cachedConfig = await res.json() as EvolutionConfig;
    return cachedConfig;
  } catch {
    return { apiUrl: '', apiKey: '' };
  }
}

export function clearEvolutionConfigCache() {
  cachedConfig = null;
}

// ─── API Call Helper ─────────────────────────────────────────────────────────

async function callEvolutionApi(
  method: string,
  path: string,
  body?: any,
): Promise<any> {
  const config = await getEvolutionConfig();
  const apiKey = config?.apiKey || '';

  const url = buildApiUrl(`/api/evolution/${path}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Evolution API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

// ─── Instance Management ─────────────────────────────────────────────────────

export async function createInstance(instanceName: string): Promise<any> {
  try {
    return await callEvolutionApi('POST', `instance/create`, {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      reject_call: false,
      groups_ignore: true,
      always_online: true,
      read_messages: true,
      read_status: true,
      sync_full_history: false,
    });
  } catch (error: any) {
    if (error.message?.includes('409') || error.message?.includes('already exists')) {
      return { alreadyExists: true, instanceName };
    }
    throw error;
  }
}

export async function createInstanceWithPairing(
  instanceName: string,
  phoneNumber: string
): Promise<any> {
  return callEvolutionApi('POST', `instance/create`, {
    instanceName,
    qrcode: false,
    number: phoneNumber,
    integration: 'WHATSAPP-BAILEYS',
    reject_call: false,
    groups_ignore: true,
    always_online: true,
    read_messages: true,
    read_status: true,
    sync_full_history: false,
  });
}

export async function deleteInstance(instanceName: string): Promise<any> {
  return callEvolutionApi('DELETE', `instance/delete/${instanceName}`);
}

export async function getInstanceDetails(instanceName: string): Promise<any> {
  return callEvolutionApi('GET', `instance/connect/${instanceName}`);
}

export async function fetchInstanceApiKey(instanceName: string): Promise<string | null> {
  try {
    const data = await callEvolutionApi('GET', `instance/fetchApiKey/${instanceName}`);
    if (data?.apikey) return data.apikey;
    if (data?.token) return data.token;
    if (data?.hash) return data.hash;
    if (Array.isArray(data) && data.length > 0) {
      return data[0].apikey || data[0].token || data[0].hash || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkInstanceExists(instanceName: string): Promise<boolean> {
  try {
    await callEvolutionApi('GET', `instance/connect/${instanceName}`);
    return true;
  } catch {
    return false;
  }
}

export async function getConnectionState(instanceName: string): Promise<{
  state: string;
  isConnected: boolean;
  phone?: string;
}> {
  try {
    const data = await callEvolutionApi('GET', `instance/connectionState/${instanceName}`);
    const state = data?.state || data?.instance?.state || 'disconnected';
    const phone = data?.instance?.phone?.number || data?.phone?.number || '';
    return {
      state,
      isConnected: state === 'open' || state === 'connected',
      phone: phone || undefined,
    };
  } catch {
    return { state: 'error', isConnected: false };
  }
}

// ─── QR / Pairing Code ──────────────────────────────────────────────────────

export async function getQRCode(instanceName: string): Promise<string | null> {
  try {
    const data = await callEvolutionApi('GET', `instance/qrcode/${instanceName}`);
    if (data?.qrcode) return data.qrcode;
    if (data?.code) return data.code;
    if (typeof data === 'string') return data;
    return null;
  } catch {
    return null;
  }
}

export async function getPairingCode(
  instanceName: string,
  phoneNumber: string
): Promise<string | null> {
  try {
    const data = await callEvolutionApi('POST', `instance/pairingCode/${instanceName}`, {
      number: phoneNumber,
    });
    return data?.pairingCode || data?.code || data?.pairing_code || null;
  } catch {
    return null;
  }
}

export async function logoutInstance(instanceName: string): Promise<any> {
  return callEvolutionApi('POST', `instance/logout/${instanceName}`);
}

export async function disconnectInstance(instanceName: string): Promise<any> {
  return callEvolutionApi('POST', `instance/disconnect/${instanceName}`);
}

// ─── Messaging ──────────────────────────────────────────────────────────────

export async function sendMessage(
  instanceName: string,
  number: string,
  text: string
): Promise<any> {
  const formattedNumber = `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  return callEvolutionApi('POST', `message/sendText/${instanceName}`, {
    number: formattedNumber,
    text,
  });
}

export async function sendMediaMessage(
  instanceName: string,
  number: string,
  mediaType: 'image' | 'document' | 'video' | 'audio',
  mediaUrl: string,
  caption?: string
): Promise<any> {
  const formattedNumber = `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

  return callEvolutionApi('POST', `message/sendMedia/${instanceName}`, {
    number: formattedNumber,
    mediaType,
    media: mediaUrl,
    caption: caption || '',
  });
}

export async function sendTypingIndicator(
  instanceName: string,
  number: string,
  presence: 'composing' | 'recording' | 'paused'
): Promise<any> {
  const formattedNumber = `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

  return callEvolutionApi('POST', `chat/sendPresence/${instanceName}`, {
    number: formattedNumber,
    presence,
    delay: 1000,
  });
}

export async function markMessageAsRead(
  instanceName: string,
  number: string,
  messageId: string
): Promise<any> {
  const formattedNumber = `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

  return callEvolutionApi('POST', `chat/markMessageAsRead/${instanceName}`, {
    number: formattedNumber,
    messageId,
  });
}

// ─── Webhook Management ─────────────────────────────────────────────────────

export async function setWebhook(
  instanceName: string,
  webhookUrl: string,
  webhookByEvents: boolean = true,
  events?: string[]
): Promise<any> {
  return callEvolutionApi('POST', `instance/setWebhook/${instanceName}`, {
    webhook: {
      url: webhookUrl,
      webhookByEvents,
      events: events ?? [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ],
    },
  });
}

export async function getWebhook(instanceName: string): Promise<any> {
  return callEvolutionApi('GET', `instance/fetchWebhook/${instanceName}`);
}

// ─── Product Catalog (List Message) ─────────────────────────────────────────

export async function sendCatalogMessage(
  instanceName: string,
  number: string,
  title: string,
  body: string,
  footer: string,
  products: Array<{
    title: string;
    description: string;
    imageUrl?: string;
    price: number;
    sku?: string;
  }>
): Promise<any> {
  const formattedNumber = `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

  const sections = products.map((p, i) => ({
    title: `${i + 1}. ${p.title}`,
    rows: [
      {
        title: p.title,
        description: `${p.description.slice(0, 60)}... KSh ${p.price.toFixed(2)}${p.sku ? ` (${p.sku})` : ''}`,
      },
    ],
  }));

  return callEvolutionApi('POST', `message/sendList/${instanceName}`, {
    number: formattedNumber,
    title,
    description: body,
    buttonText: 'View Products',
    footer,
    sections,
  });
}
