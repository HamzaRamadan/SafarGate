'use client';
import { initializeFirebase } from '@/firebase';
import { getAnalytics, logEvent as firebaseLogEvent, isSupported } from "firebase/analytics";

let analytics: any;

// A one-time check to see if analytics is supported.
isSupported().then(supported => {
  if (supported) {
    const { firebaseApp } = initializeFirebase();
    analytics = getAnalytics(firebaseApp);
  }
});


/**
 * Logs a custom analytics event.
 * Ensures that analytics is supported by the browser before attempting to log.
 * @param eventName - The name of the event to log.
 * @param eventParams - An object containing additional data to log with the event.
 */
export const logEvent = (eventName: string, eventParams?: { [key: string]: any }) => {
  // Only proceed if analytics has been initialized.
  if (!analytics) {
    return;
  }
  
  // This function doesn't return anything. The logging happens in the background.
  // The .catch() is removed to prevent the FirebaseError from being thrown.
  firebaseLogEvent(analytics, eventName, eventParams);
}
