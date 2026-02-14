'use client';

import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Briefcase, Users, Ship } from 'lucide-react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

export function AdminDashboardStats() {
  const firestore = useFirestore();
  const [counts, setCounts] = useState<{ users: number, carriers: number, trips: number }>({ users: 0, carriers: 0, trips: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchCounts = async () => {
      try {
        const usersQuery = collection(firestore, 'users');
        const carriersQuery = query(collection(firestore, 'users'), where('role', '==', 'carrier'));
        const tripsQuery = collection(firestore, 'trips');
        
        const [usersSnap, carriersSnap, tripsSnap] = await Promise.all([
          getCountFromServer(usersQuery),
          getCountFromServer(carriersQuery),
          getCountFromServer(tripsQuery),
        ]);

        setCounts({
          users: usersSnap.data().count,
          carriers: carriersSnap.data().count,
          trips: tripsSnap.data().count,
        });

      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        // Set counts to a placeholder error state if needed
        setCounts({ users: -1, carriers: -1, trips: -1 });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCounts();

  }, [firestore]);


  const stats = [
    {
      title: 'إجمالي المستخدمين',
      value: counts.users >= 0 ? counts.users.toString() : 'خطأ',
      icon: Users,
    },
    {
      title: 'إجمالي الناقلين',
      value: counts.carriers >= 0 ? counts.carriers.toString() : 'خطأ',
      icon: Briefcase,
    },
    {
      title: 'إجمالي الرحلات',
      value: counts.trips >= 0 ? counts.trips.toString() : 'خطأ',
      icon: Ship,
    },
    {
      title: 'إجمالي الأرباح (محاكاة)',
      value: '1,250 د.أ',
      icon: DollarSign,
    },
  ];

  if (isLoading) {
    return (
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
            <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
        ))}
       </div>
    )
  }

  return (
    <div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
            <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
