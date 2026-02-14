'use client';
import { useUser } from '@/firebase';
import type { Message } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

const safeFormat = (timestamp: any) => {
    try {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'p', { locale: arSA });
    } catch (e) {
        return '';
    }
}

export function MessageList({ messages, isLoading }: { messages: Message[], isLoading: boolean }) {
  const { user } = useUser();

  if (isLoading) {
    return (
        <div className="flex-1 p-4 space-y-4">
             <Skeleton className="h-16 w-3/4 rounded-lg" />
             <Skeleton className="h-12 w-1/2 ml-auto rounded-lg" />
             <Skeleton className="h-20 w-2/3 rounded-lg" />
        </div>
    )
  }
  
  if (messages.length === 0) {
      return (
          <div className="flex-1 p-4 flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center">لا توجد رسائل بعد. ابدأ المحادثة!</p>
          </div>
      )
  }
  
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-background/50" dir="rtl">
      <div className="flex flex-col gap-4">
        {messages.map(message => {
          const isSender = message.senderId === user?.uid;
          return (
            <div
              key={message.id}
              className={cn(
                'flex flex-col max-w-[75%]',
                isSender ? 'self-end items-end' : 'self-start items-start'
              )}
            >
              <div
                className={cn(
                  'p-3 rounded-lg',
                  isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              <span className="text-xs text-muted-foreground mt-1 px-1">
                 {safeFormat(message.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
