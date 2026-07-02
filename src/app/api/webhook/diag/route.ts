import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getAdminDb();
    if (db) {
      await db.collection('webhookDiag').add({
        body,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true, captured: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const db = await getAdminDb();
  if (!db) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const snap = await db.collection('webhookDiag').orderBy('timestamp', 'desc').limit(5).get();
  const entries: any[] = [];
  snap.forEach(d => entries.push({ id: d.id, ...d.data() }));
  return NextResponse.json(entries);
}

async function getAdminDb() {
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKeyRaw) return null;
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n').replace(/^"/, '').replace(/"$/, '');
    const app = getApps().length === 0
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      : getApps()[0];
    return getFirestore(app);
  } catch { return null; }
}
