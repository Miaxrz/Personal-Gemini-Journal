import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import type { JournalInteraction } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Initialize Firebase App
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use specified custom firestoreDatabaseId if provisioned, or default
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Utility to strip undefined and deeply sanitize objects before Firestore insertion
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

/**
 * Sign in with Google with seamless fallback for iframe sandboxes
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    console.warn('Google popup sign-in encountered an issue (e.g. iframe popup policy), attempting guest session...', err);
    // If popup is blocked by iframe policies, allow guest authentication so the user can test the app uninterrupted
    const anonResult = await signInAnonymously(auth);
    return anonResult.user;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Subscribe to current auth user changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save or update a journal interaction in user-isolated Firestore subcollection
 * Path: /users/{userId}/interactions/{interactionId}
 */
export async function saveUserInteraction(userId: string, interaction: JournalInteraction): Promise<void> {
  if (!userId) throw new Error('User ID is required to save interaction.');
  if (!interaction.id) throw new Error('Interaction ID is missing.');

  const interactionRef = doc(db, 'users', userId, 'interactions', interaction.id);
  const cleanData = sanitizeForFirestore({
    ...interaction,
    userId,
    updatedAt: Date.now(),
  });

  await setDoc(interactionRef, cleanData, { merge: true });
}

/**
 * Delete a journal interaction
 */
export async function deleteUserInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) throw new Error('User ID and Interaction ID are required.');
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(interactionRef);
}

/**
 * Toggle favorite status on an interaction
 */
export async function toggleInteractionFavorite(userId: string, interactionId: string, isFavorite: boolean): Promise<void> {
  if (!userId || !interactionId) throw new Error('User ID and Interaction ID are required.');
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await updateDoc(interactionRef, { isFavorite });
}

/**
 * Real-time listener for user's isolated interactions collection
 */
export function subscribeToUserInteractions(
  userId: string, 
  onData: (items: JournalInteraction[]) => void, 
  onError?: (err: Error) => void
) {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const interactionsCol = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsCol, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q, 
    (snapshot) => {
      const items: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as JournalInteraction);
      });
      onData(items);
    },
    (error) => {
      console.error('Firestore snapshot error:', error);
      if (onError) onError(error);
    }
  );
}
