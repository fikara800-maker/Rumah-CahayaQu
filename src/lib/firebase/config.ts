import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;

let dbInstance;
try {
  const settings = {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  };
  if (dbId && dbId !== '(default)') {
    dbInstance = initializeFirestore(app, settings, dbId);
  } else {
    dbInstance = initializeFirestore(app, settings);
  }
} catch {
  // If already initialized, fallback to getFirestore
  dbInstance = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = dbInstance;

// Suppress non-fatal network reconnect notices from Firestore SDK logs
try {
  setLogLevel('silent');
} catch {
  // Ignore if unsupported
}

export { app };

