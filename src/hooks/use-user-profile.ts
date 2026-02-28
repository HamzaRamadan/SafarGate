// 'use client';

// import { useEffect, useState, useMemo } from 'react';
// import { useUser, useFirestore } from '@/firebase/provider';
// import { doc, onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
// import type { UserProfile } from '@/lib/data';

// // This combines user auth state with the firestore profile document
// export function useUserProfile() {
//   const { user, isUserLoading, userError } = useUser();
//   const firestore = useFirestore();
  
//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [profileLoading, setProfileLoading] = useState(true);
//   const [profileError, setProfileError] = useState<Error | null>(null);

//   const userProfileRef = useMemo<DocumentReference<DocumentData> | null>(() => {
//     if (user && firestore) {
//       return doc(firestore, 'users', user.uid);
//     }
//     return null;
//   }, [user, firestore]);

//   useEffect(() => {
//     // If there's no user reference (e.g., logged out),
//     // ensure profile state is cleared once auth state is confirmed.
//     if (!userProfileRef) {
//       if (!isUserLoading) {
//         setProfile(null);
//         setProfileLoading(false);
//       }
//       return;
//     }

//     // Start loading profile data
//     setProfileLoading(true);

//     const unsubscribe = onSnapshot(
//       userProfileRef,
//       (docSnapshot) => {
//         if (docSnapshot.exists()) {
//           setProfile({ id: docSnapshot.id, ...docSnapshot.data() } as UserProfile);
//         } else {
//           // The user is authenticated, but there's no profile document.
//           // This can happen during sign-up before the doc is created.
//           setProfile(null);
//         }
//         setProfileLoading(false);
//         setProfileError(null);
//       },
//       (error) => {
//         console.error("useUserProfile snapshot error:", error);
//         setProfileError(error);
//         setProfile(null);
//         setProfileLoading(false);
//       }
//     );

//     // Cleanup subscription on unmount
//     return () => unsubscribe();
//   }, [userProfileRef, isUserLoading]); // Rerun when user changes

//   return {
//     user, // The raw Firebase Auth user object
//     profile, // The Firestore user profile document
//     userProfileRef, // The direct reference to the user's document
//     isLoading: isUserLoading || profileLoading, // Combined loading state
//     error: userError || profileError, // Combined error state
//   };
// }







'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase/provider';
import { doc, onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';

export function useUserProfile() {
  const { user, isUserLoading, userError } = useUser();
  const firestore = useFirestore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const userProfileRef = useMemo<DocumentReference<DocumentData> | null>(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  useEffect(() => {
    // ✅ امسح الـ listener القديم الأول
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (e) {
        // ignore Firestore internal errors on cleanup
      }
      unsubscribeRef.current = null;
    }

    if (!userProfileRef) {
      if (!isUserLoading) {
        setProfile(null);
        setProfileLoading(false);
      }
      return;
    }

    setProfileLoading(true);

    try {
      const unsubscribe = onSnapshot(
        userProfileRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setProfile({ id: docSnapshot.id, ...docSnapshot.data() } as UserProfile);
          } else {
            setProfile(null);
          }
          setProfileLoading(false);
          setProfileError(null);
        },
        (error) => {
          console.warn("useUserProfile snapshot error:", error.code);
          setProfileError(error);
          setProfile(null);
          setProfileLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (e) {
      console.warn("useUserProfile setup error:", e);
      setProfileLoading(false);
    }

    // ✅ Cleanup بدون ما يعمل crash
    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (e) {
          // ignore Firestore internal errors
        }
        unsubscribeRef.current = null;
      }
    };
  }, [userProfileRef, isUserLoading]);

  return {
    user,
    profile,
    userProfileRef,
    isLoading: isUserLoading || profileLoading,
    error: userError || profileError,
  };
}