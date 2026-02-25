import { collection, addDoc, serverTimestamp, type Firestore } from 'firebase/firestore';

interface WriteNotificationParams {
  firestore: Firestore;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function writeNotification({
  firestore,
  userId,
  type,
  title,
  message,
  link,
}: WriteNotificationParams) {
  try {
    await addDoc(collection(firestore, 'users', userId, 'notifications'), {
      type,
      title,
      message,
      isRead: false,
      link: link || null,
      createdAt: serverTimestamp(),
      userId,
    });
  } catch (e) {
    // Fail silently - notifications are non-critical
    console.warn('[Notification] Failed to write:', e);
  }
}