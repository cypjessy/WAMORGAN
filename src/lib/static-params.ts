// ─── Build-time Firestore query utility ───────────────────────────────────
// Used by generateStaticParams() in dynamic route pages during static export.
// Runs in Node.js at build time, queries Firestore for all document IDs.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBd1gk-jFVOjMm3l3qPxoEfWx9Cwidsbtk",
  authDomain: "campuslink-24uoo.firebaseapp.com",
  projectId: "campuslink-24uoo",
  storageBucket: "campuslink-24uoo.firebasestorage.app",
  messagingSenderId: "861350319130",
  appId: "1:861350319130:web:00ba244a84acefcb4cada3",
};

let buildDb: ReturnType<typeof getFirestore> | null = null;

function getBuildDb() {
  if (buildDb) return buildDb;
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  buildDb = getFirestore(app);
  return buildDb;
}

/**
 * Fetch all product IDs from Firestore for static pre-rendering.
 */
export async function getAllProductIds(): Promise<string[]> {
  const db = getBuildDb();
  const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return snap.docs.map(doc => doc.id);
}

/**
 * Fetch the most recent order IDs from Firestore for static pre-rendering.
 * Orders are user-specific, so we pre-render a reasonable number of recent
 * orders — each page loads its actual data client-side via useAuth + Firestore.
 */
export async function getRecentOrderIds(max: number = 200): Promise<string[]> {
  const db = getBuildDb();
  const snap = await getDocs(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(max))
  );
  return snap.docs.map(doc => doc.id);
}

/**
 * Fetch the most recent support ticket IDs for static pre-rendering.
 */
export async function getRecentTicketIds(max: number = 100): Promise<string[]> {
  const db = getBuildDb();
  const snap = await getDocs(
    query(collection(db, 'supportTickets'), orderBy('lastMessageTime', 'desc'), limit(max))
  );
  return snap.docs.map(doc => doc.id);
}
