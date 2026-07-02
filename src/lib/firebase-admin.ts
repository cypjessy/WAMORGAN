let adminDb: any = null;
let adminApp: any = null;
let initAttempted = false;

function getProjectId(): string | undefined {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

function getClientEmail(): string | undefined {
  return process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
}

function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  clean = clean.replace(/\\n/g, '\n');
  clean = clean.trim();
  return clean;
}

function normalizePrivateKey(key: string): string {
  let normalized = key.replace(/\r/g, '');
  if (!normalized.endsWith('\n')) normalized += '\n';
  return normalized;
}

function hasValidCredentials(): boolean {
  const projectId = getProjectId();
  const clientEmail = getClientEmail();
  const privateKey = getPrivateKey();
  if (!projectId || !clientEmail || !privateKey) return false;
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) return false;
  if (!privateKey.includes('-----END PRIVATE KEY-----')) return false;
  return true;
}

async function initFirebaseAdmin(): Promise<void> {
  if (initAttempted) return;
  initAttempted = true;

  if (!hasValidCredentials()) {
    console.warn('Firebase Admin SDK credentials not configured');
    return;
  }

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    adminApp = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: getProjectId()!,
            clientEmail: getClientEmail()!,
            privateKey: normalizePrivateKey(getPrivateKey()!)
          })
        })
      : getApps()[0];

    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    initAttempted = false;
  }
}

export async function getAdminDb(): Promise<any> {
  if (!adminDb && !initAttempted) await initFirebaseAdmin();
  return adminDb;
}

export async function getAdminAuth() {
  if (!adminApp && !initAttempted) await initFirebaseAdmin();
  if (!adminApp) return null;
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(adminApp);
}

export { adminDb };

// Lazily-loaded firestore utilities to avoid static import of firebase-admin modules (Vercel compat)
let _FieldValue: any = null;
let _Timestamp: any = null;

async function ensureFirestoreUtils() {
  if (!_FieldValue) {
    const mod = await import('firebase-admin/firestore');
    _FieldValue = mod.FieldValue;
    _Timestamp = mod.Timestamp;
  }
}

export async function getFieldValue() {
  await ensureFirestoreUtils();
  return _FieldValue;
}

export async function getTimestamp() {
  await ensureFirestoreUtils();
  return _Timestamp;
}