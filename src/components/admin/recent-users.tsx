'use client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';

export function RecentUsers() {
  const firestore = useFirestore();

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'users'), 
        orderBy('createdAt', 'desc'), 
        limit(5)
    );
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>آخر المستخدمين المسجلين</CardTitle>
                <CardDescription>قائمة بآخر 5 مستخدمين انضموا للنظام.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="grid gap-1 w-full">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>آخر المستخدمين المسجلين</CardTitle>
            <CardDescription>
                قائمة بآخر 5 مستخدمين انضموا للنظام.
            </CardDescription>
        </CardHeader>
      <CardContent className="grid gap-8">
        {users && users.map((user, i) => (
            <div key={i} className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>{user.firstName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="ml-auto font-medium">
                    <Badge variant={user.role === 'carrier' ? 'secondary' : 'outline'}>
                        {user.role === 'carrier' ? 'ناقل' : 'مسافر'}
                    </Badge>
                </div>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
