'use client';

import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const notifIcons: Record<string, string> = {
  booking_confirmed:   '✅',
  new_booking_request: '🎟️',
  trip_update:         '✏️',
  new_offer:           '🏷️',
  rating_request:      '⭐',
  payment_reminder:    '💳',
  group_chat_message:  '💬',
};

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markOneAsRead } = useNotifications();
  const router = useRouter();

  const handleClick = async (notif: any) => {
    await markOneAsRead(notif.id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full p-0 text-[10px] animate-in zoom-in"
            >
              {unreadCount > 9 ? '+9' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">الإشعارات</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2" dir="rtl">
          <DropdownMenuLabel className="p-0 text-sm font-bold">
            الإشعارات {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              قراءة الكل
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2" dir="rtl">
            <BellOff className="h-8 w-8 opacity-40" />
            <p className="text-xs">لا توجد إشعارات جديدة</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto" dir="rtl">
            {notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  'w-full text-right px-3 py-3 hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0',
                  'flex gap-3 items-start'
                )}
              >
                <span className="text-lg shrink-0 mt-0.5">
                  {notifIcons[notif.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-tight">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}