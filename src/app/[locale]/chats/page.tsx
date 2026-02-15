'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { Chat, Trip } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { MessageSquare, Users, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChatDialog } from '@/components/chat/chat-dialog';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const ChatListItem = ({ chat, onClick }: { chat: Chat, onClick: () => void }) => {
  const t = useTranslations('chatsPage');
  const { user } = useUser();
  const unreadCount = chat.unreadCounts?.[user?.uid || ''] || 0;

  const safeFormatDistance = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: arSA });
    } catch {
      return '';
    }
  };

  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-4">
        <Avatar className="h-12 w-12 border">
          <AvatarFallback>
            {chat.isGroupChat ? <Users /> : <User />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="font-bold">{chat.isGroupChat ? t('groupChat') : t('privateChat')}</p>
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || t('noMessages')}</p>
        </div>
        <div className="text-xs text-muted-foreground self-start">
          {safeFormatDistance(chat.lastMessageTimestamp)}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ChatsPage() {
  const t = useTranslations('chatsPage');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();

  const chatsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc'),
      orderBy('__name__', 'desc')
    );
  }, [firestore, user]);

  const { data: chats, isLoading: isLoadingChats } = useCollection<Chat>(chatsQuery);
  const isLoading = isUserLoading || isLoadingChats;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleChatClick = (chat: Chat) => {
    if (firestore && user && (chat.unreadCounts?.[user.uid] ?? 0) > 0) {
        const chatRef = doc(firestore, 'chats', chat.id);
        updateDoc(chatRef, {
            [`unreadCounts.${user.uid}`]: 0
        });
    }
    setSelectedChat(chat);
    setIsChatOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      );
    }

    if (!chats || chats.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="font-bold">{t('noChatsTitle')}</p>
          <p className="text-sm mt-1">{t('noChatsDescription')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {chats.map(chat => (
          <ChatListItem key={chat.id} chat={chat} onClick={() => handleChatClick(chat)} />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl p-4 space-y-6">
        <Card className="bg-card border-primary/50">
          <CardHeader>
            <h1 className="text-2xl font-bold">{t('headerTitle')}</h1>
            <p className="text-muted-foreground">{t('headerDescription')}</p>
          </CardHeader>
        </Card>
        {renderContent()}
      </div>
      {selectedChat && (
        <ChatDialog
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          trip={selectedChat.isGroupChat ? { id: selectedChat.id } as Trip : undefined}
          bookingId={!selectedChat.isGroupChat ? selectedChat.id : undefined}
          otherPartyName={!selectedChat.isGroupChat ? t('carrier') : undefined}
        />
      )}
    </AppLayout>
  );
}
