import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBd1gk-jFVOjMm3l3qPxoEfWx9Cwidsbtk",
  authDomain: "campuslink-24uoo.firebaseapp.com",
  projectId: "campuslink-24uoo",
  storageBucket: "campuslink-24uoo.firebasestorage.app",
  messagingSenderId: "861350319130",
  appId: "1:861350319130:web:00ba244a84acefcb4cada3",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined") {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    auth = getAuth(app);

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('[Firebase] Auth persistence set to LOCAL');
      })
      .catch((error) => {
        console.error('[Firebase] Failed to set auth persistence:', error);
      });

    db = getFirestore(app);
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export { app, auth, db };
