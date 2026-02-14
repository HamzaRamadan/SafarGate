'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Trip } from '@/lib/data';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';

const cities: { [key: string]: string } = {
    damascus: 'دمشق', aleppo: 'حلب', homs: 'حمص', amman: 'عمّان', irbid: 'إربد', zarqa: 'الزرقاء',
    riyadh: 'الرياض', jeddah: 'جدة', dammam: 'الدمام', cairo: 'القاهرة', alexandria: 'الاسكندرية', giza: 'الجيزة',
};

const getCityName = (key: string) => cities[key] || key;

export function RecentTrips() {
  const firestore = useFirestore();

  const tripsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'trips'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: trips, isLoading } = useCollection<Trip>(tripsQuery);
  
  if (isLoading) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>آخر الرحلات المسجلة</CardTitle>
                <CardDescription>نظرة سريعة على آخر 5 رحلات في النظام.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>آخر الرحلات المسجلة</CardTitle>
        <CardDescription>
            نظرة سريعة على آخر 5 رحلات في النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرحلة</TableHead>
              <TableHead>الناقل</TableHead>
              <TableHead className="text-center">المقاعد</TableHead>
              <TableHead className="text-left">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips && trips.map(trip => (
                <TableRow key={trip.id}>
                    <TableCell>
                        <div className="font-medium flex items-center gap-1">
                          {getCityName(trip.origin)} <ArrowRight className="h-3 w-3"/> {getCityName(trip.destination)}
                        </div>
                    </TableCell>
                    <TableCell>{trip.carrierName || 'غير معروف'}</TableCell>
                    <TableCell className="text-center">{trip.passengers || trip.availableSeats || 'N/A'}</TableCell>
                    <TableCell className="text-left">
                        <Badge variant={
                            trip.status === 'Completed' ? 'default' :
                            trip.status === 'In-Transit' ? 'secondary' :
                            trip.status === 'Cancelled' ? 'destructive' :
                            'outline'
                        }>{trip.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
