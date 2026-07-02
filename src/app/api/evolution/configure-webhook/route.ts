import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { instanceName, webhookUrl, events } = await request.json();

    if (!instanceName || !webhookUrl) {
      return NextResponse.json({ error: 'instanceName and webhookUrl are required' }, { status: 400 });
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_URL;
    const apiKey = process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY;

    if (!evolutionUrl || !apiKey) {
      return NextResponse.json({ error: 'Evolution API not configured on server' }, { status: 500 });
    }

    const url = `${evolutionUrl.replace(/\/+$/, '')}/webhook/set/${instanceName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          events: events ?? [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED',
          ],
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Webhook-Server] Evolution API error:', response.status, errorText);
      return NextResponse.json({
        error: `Evolution API error (${response.status})`,
        details: errorText,
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Webhook-Server] Failed to set webhook:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to set webhook',
    }, { status: 500 });
  }
}
