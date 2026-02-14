// // 'use client';

// // import React, { useMemo, type ReactNode } from 'react';
// // import { FirebaseProvider } from '@/firebase/provider';
// // import { initializeFirebase } from '@/firebase';

// // interface FirebaseClientProviderProps {
// //   children: ReactNode;
// // }

// // export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
// //   const firebaseServices = useMemo(() => {
// //     // Initialize Firebase on the client side, once per component mount.
// //     return initializeFirebase();
// //   }, []); // Empty dependency array ensures this runs only once on mount

// //   return (
// //     <FirebaseProvider
// //       firebaseApp={firebaseServices.firebaseApp}
// //       auth={firebaseServices.auth}
// //       firestore={firebaseServices.firestore}
// //       functions={firebaseServices.functions}
// //     >
// //       {children}
// //     </FirebaseProvider>
// //   );
// // }




// 'use client';

// import React, { useMemo, type ReactNode } from 'react';
// import { FirebaseProvider, useFirebaseApp } from '@/firebase/provider';
// import { initializeFirebase } from '@/firebase';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getFunctions } from 'firebase/functions';
// import { getStorage } from 'firebase/storage';

// interface FirebaseClientProviderProps {
//   children: ReactNode;
// }

// export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
//   const firebaseServices = useMemo(() => {
//     // Initialize Firebase on the client side, once per component mount.
//     return initializeFirebase();
//   }, []); // Empty dependency array ensures this runs only once on mount

//   return (
//     <FirebaseProvider
//       firebaseApp={firebaseServices.firebaseApp}
//       auth={firebaseServices.auth}
//       firestore={firebaseServices.firestore}
//       functions={firebaseServices.functions}
//       storage={firebaseServices.storage}
//     >
//       {children}
//     </FirebaseProvider>
//   );
// }

// // ✅ أضف الـ Hooks هنا
// export function useAuth() {
//   const app = useFirebaseApp();
//   return getAuth(app);
// }

// export function useFirestore() {
//   const app = useFirebaseApp();
//   return getFirestore(app);
// }

// export function useFunctions() {
//   const app = useFirebaseApp();
//   return getFunctions(app);
// }

// export function useStorage() {
//   const app = useFirebaseApp();
//   return getStorage(app);
// }



'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      functions={firebaseServices.functions}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}

// ❌ احذف كل الـ hooks من هنا
// useAuth, useFirestore, useFunctions, useStorage
// كلهم موجودين في provider.tsx