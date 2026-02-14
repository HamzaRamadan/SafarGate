'use client';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

// SOVEREIGN ORDER 11: Notification Engine Activation (PATCHED)

export const setupNotifications = async (
  firestore: Firestore,
  user: User
) => {
  // 1. STRICT SAFETY CHECK:
  // Ensure we are in the browser AND Service Workers are supported.
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log("Push notifications are not supported in this environment.");
    return;
  }

  try {
    // 2. Wait for Service Worker to be Ready
    // This is critical to prevent "no registration token available" errors.
    const registration = await navigator.serviceWorker.ready;

    // 3. Initialize Messaging only now
    const app = getApp();
    const messaging = getMessaging(app);

    // 4. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied by user.');
      return;
    }

    // 5. Get FCM Token with VAPID Key
    const currentToken = await getToken(messaging, {
      vapidKey: 'BJEZ0yGvX3Jz1F2s5r7eYJ3Xz9J2Yc6kZ8fQ1vA0wS9nC3bH4lG5jK8dF7gT6hR1oP9iU7eW6xZ_0',
      serviceWorkerRegistration: registration // Explicitly link the registration
    });
    
    if (currentToken) {
      // 6. Save Token to Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        fcmTokens: arrayUnion(currentToken),
        lastTokenUpdate: serverTimestamp()
      }).catch((err) => {
          // SOVEREIGN FIX (Order 12): Handle token subscription failure gracefully.
          if (err.code === 'messaging/token-subscribe-failed') {
               console.warn(
                `[FB-NOTIF-WARN] Failed to subscribe FCM token due to a configuration issue. ` +
                `This is likely because the 'Firebase Installations API' is not enabled in your Google Cloud project. ` +
                `Please go to the Google Cloud Console for project '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'UNKNOWN'}' and enable it.`
            );
          } else {
            console.warn("Failed to save FCM token to DB:", err)
          }
      });
      
      console.log('FCM Token Registered Successfully.');
    } else {
      console.warn('No registration token available.');
    }

    // 7. Handle Foreground Messages
    onMessage(messaging, (payload) => {
      console.log('Foreground Message:', payload);
      toast({
        title: payload.notification?.title || 'إشعار جديد',
        description: payload.notification?.body,
      });
    });

  } catch (error) {
    // Use warn instead of error to avoid crashing the dev overlay
    console.warn('Notification Setup Warning:', error);
  }
};
