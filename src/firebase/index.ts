// 'use client';

// import React from 'react';
// import { firebaseConfig } from '@/firebase/config';
// import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// import { getAuth, type Auth, onAuthStateChanged, type User } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getFunctions, type Functions } from 'firebase/functions';
// import { FirebaseContext } from './provider';
// import { getStorage, type FirebaseStorage } from "firebase/storage";

// // --- Singleton Initialization Pattern ---
// export function initializeFirebase() {
//   if (!getApps().length) {
//     let firebaseApp;
//     try {
//       firebaseApp = initializeApp();
//     } catch (e) {
//       if (process.env.NODE_ENV === "production") {
//         console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
//       }
//       firebaseApp = initializeApp(firebaseConfig);
//     }
//     return getSdks(firebaseApp);
//   }
//   return getSdks(getApp());
// }


// // --- SDK Exporter ---
// export function getSdks(app: FirebaseApp) {
//   return {
//     firebaseApp: app,
//     auth: getAuth(app),
//     firestore: getFirestore(app),
//     functions: getFunctions(app),
//         storage: getStorage(app), 

//   };
// }

// // --- Re-exports for Application Usage ---
// // This is now a pure re-export barrel file.
// export * from './provider';
// export * from './client-provider';
// export * from './firestore/use-collection';
// export * from './firestore/use-doc';
// export * from './non-blocking-updates';
// export * from './errors';
// export * from './error-emitter';


'use client';

import React from 'react';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from "firebase/storage";

// --- Singleton Initialization Pattern ---
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

// --- SDK Exporter ---
export function getSdks(app: FirebaseApp) {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    functions: getFunctions(app),
    storage: getStorage(app),
  };
}

// --- Re-exports for Application Usage ---
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';