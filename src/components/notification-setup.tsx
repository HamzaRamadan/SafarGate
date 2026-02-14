'use client';
import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { setupNotifications } from '@/lib/notification-manager';

export function NotificationSetup() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Wait for auth to settle and ensure we have a user and firestore instance
    if (!isUserLoading && user && firestore) {
      // Call the setup function to request permission and save the token
      setupNotifications(firestore, user);
    }
  }, [user, isUserLoading, firestore]);

  // This component does not render anything to the UI
  return null;
}
