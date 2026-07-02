import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { instanceName, userId } = await request.json();

    if (!instanceName) {
      return NextResponse.json({ error: 'instanceName is required' }, { status: 400 });
    }

    const evolutionApiUrl = process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_URL || '';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '';

    if (!evolutionApiUrl || !evolutionApiKey) {
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 500 });
    }

    const baseUrl = evolutionApiUrl.endsWith('/') ? evolutionApiUrl.slice(0, -1) : evolutionApiUrl;

    // Step 1: Create Evolution instance
    console.log('[Evolution Setup] Creating instance:', instanceName);
    const createRes = await fetch(`${baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: false,
        integration: 'WHATSAPP-BAILEYS',
        reject_call: false,
        groups_ignore: true,
        always_online: true,
        read_messages: true,
        read_status: true,
        sync_full_history: false,
      }),
    });

    if (!createRes.ok && createRes.status !== 409) {
      const errText = await createRes.text().catch(() => '');
      console.error('[Evolution Setup] Create instance failed:', createRes.status, errText);
      // 409 means instance already exists — that's fine
    }

    // Step 2: Set webhook
    const deploymentUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host') || 'localhost:3000'}`;
    const webhookUrl = `${deploymentUrl.replace(/\/+$/, '')}/api/webhook/evolution`;

    console.log('[Evolution Setup] Setting webhook:', webhookUrl);
    const webhookRes = await fetch(`${baseUrl}/instance/setWebhook/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: true,
          webhookBase64: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED',
          ],
        },
      }),
    });

    if (!webhookRes.ok) {
      const errText = await webhookRes.text().catch(() => '');
      console.error('[Evolution Setup] Webhook set failed:', webhookRes.status, errText);
    }

    // Step 3: Save instance name to business profile
    try {
      const { getAdminDb } = await import('@/lib/firebase-admin');
      const db = await getAdminDb();
      if (db) {
        await db.collection('businessProfiles').doc('main').set({
          whatsappInstanceName: instanceName,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (dbErr) {
      console.error('[Evolution Setup] Failed to save to Firestore:', dbErr);
    }

    return NextResponse.json({
      ok: true,
      instanceName,
      webhookUrl,
    });
  } catch (error: any) {
    console.error('[Evolution Setup] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
