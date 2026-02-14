// IMPORTANT: This file is for server-side use only.
// It does not contain any 'use client' directive.

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// A private singleton instance of the Firestore DB.
let db: Firestore;

/**
 * Initializes a server-side Firebase connection if one doesn't already exist.
 * This is safe to call multiple times.
 * @returns An object containing the Firestore instance.
 */
function getServerFirebase() {
  if (!db) {
    // Check if an app is already initialized, otherwise initialize a new one.
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  }
  return { firestore: db };
}

// Export a ready-to-use Firestore instance for server components.
export const serverFirestore = getServerFirebase().firestore;
