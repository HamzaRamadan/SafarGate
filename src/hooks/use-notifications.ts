'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, writeBatch } from 'firebase/firestore';
import type { Notification } from '@/lib/data';

export function useNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('isRead', '==', false)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const unreadCount = notifications?.length || 0;

  const markAllAsRead = async () => {
    if (!firestore || !user?.uid || !notifications || notifications.length === 0) return;
    const batch = writeBatch(firestore);
    notifications.forEach(notif => {
      const ref = doc(firestore, 'users', user.uid, 'notifications', notif.id);
      batch.update(ref, { isRead: true });
    });
    await batch.commit();
  };

  const markOneAsRead = async (notifId: string) => {
    if (!firestore || !user?.uid) return;
    const ref = doc(firestore, 'users', user.uid, 'notifications', notifId);
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(ref, { isRead: true });
  };

  return { notifications: notifications || [], unreadCount, isLoading, markAllAsRead, markOneAsRead };
}