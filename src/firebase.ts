import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Kept only for the one-time Firebase-to-Sheets migration utility.
const legacyDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const legacyDb = legacyDatabaseId ? getFirestore(app, legacyDatabaseId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
