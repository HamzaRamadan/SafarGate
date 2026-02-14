'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

/**
 * @file src/hooks/use-unread-chats.ts
 * @description SOVEREIGN HOOK (PROTOCOL 16)
 * This hook encapsulates the logic for fetching and counting unread chat messages
 * for the currently authenticated user. It prevents code duplication across different layouts.
 */
export function useUnreadChats() {
  const { user } = useUser();
  const firestore = useFirestore();

  const chatsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user]);

  const { data: userChats } = useCollection(chatsQuery);

  const unreadCount = useMemo(() => {
    if (!userChats || !user?.uid) return 0;
    return userChats.reduce((acc, chat) => {
      return acc + (chat.unreadCounts?.[user.uid] || 0);
    }, 0);
  }, [userChats, user]);

  return unreadCount;
}
