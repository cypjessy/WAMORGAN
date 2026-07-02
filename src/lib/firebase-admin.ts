import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminDb: Firestore | null = null;
let adminApp: App | null = null;
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

function initFirebaseAdmin(): void {
  if (initAttempted) return;
  initAttempted = true;

  if (!hasValidCredentials()) {
    console.warn('Firebase Admin SDK credentials not configured');
    return;
  }

  try {
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

export function getAdminDb(): Firestore | null {
  if (!adminDb && !initAttempted) initFirebaseAdmin();
  return adminDb;
}

export function getAdminAuth() {
  if (!adminApp && !initAttempted) initFirebaseAdmin();
  if (!adminApp) return null;
  return getAuth(adminApp);
}

initFirebaseAdmin();
export { adminDb };