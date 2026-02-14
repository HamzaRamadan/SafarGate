'use client';

import { useAdminTrips } from '@/hooks/use-admin-trips';
import { TripRowActions } from '@/components/admin/trips/trip-row-actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Bus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminTripsPage() {
  // [SC-206] Logic Injection - handleCancelTrip is removed.
  const { 
    trips, 
    loading, 
    loadingMore, 
    hasMore, 
    fetchTrips, 
    setStatusFilter, 
    statusFilter
  } = useAdminTrips();

  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Planned': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">مجدولة</Badge>;
      case 'Awaiting-Offers': return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">بانتظار العروض</Badge>;
      case 'Pending-Carrier-Confirmation': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">بانتظار الناقل</Badge>;
      case 'In-Transit': return <Badge className="bg-purple-100 text-purple-700 animate-pulse">جارية</Badge>;
      case 'Completed': return <Badge className="bg-green-100 text-green-700">مكتملة</Badge>;
      case 'Cancelled': return <Badge variant="destructive">ملغاة</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Bus className="h-6 w-6 text-primary" />
                برج مراقبة الرحلات
              </CardTitle>
              <CardDescription>Sovereign Trip Command Center • Live Operations</CardDescription>
            </div>
            
            {/* Control Bar */}
            <div className="flex gap-2">
                <Select onValueChange={setStatusFilter} defaultValue={statusFilter}>
                    <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="حالة الرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل الحالات</SelectItem>
                        <SelectItem value="Planned">🔵 مجدولة</SelectItem>
                        <SelectItem value="Awaiting-Offers">🟡 بانتظار العروض</SelectItem>
                        <SelectItem value="Pending-Carrier-Confirmation">🟠 بانتظار الناقل</SelectItem>
                        <SelectItem value="In-Transit">🟣 جارية الآن</SelectItem>
                        <SelectItem value="Completed">🟢 مكتملة</SelectItem>
                        <SelectItem value="Cancelled">🔴 ملغاة</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={() => fetchTrips(false)} variant="default">
                    تحديث 🔍
                </Button>
            </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-right py-4">المسار</TableHead>
                <TableHead className="text-right">المسافر / الناقل</TableHead>
                <TableHead className="text-right">التوقيت</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center w-[50px]">⚙️</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && trips.length === 0 ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell colSpan={6}><Skeleton className="h-12 w-full rounded-md" /></TableCell>
                    </TableRow>
                ))
              ) : trips.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        لا توجد رحلات مطابقة للفلاتر الحالية.
                    </TableCell>
                </TableRow>
              ) : trips.map((trip) => (
                <TableRow key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                            <span className="text-green-600">●</span> {trip.origin}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                            <span className="text-red-600">●</span> {trip.destination}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                        <span className="font-semibold text-slate-800">{trip.passengerName || 'طلب عام'}</span>
                        {trip.carrierName ? (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                                <Bus className="h-3 w-3" /> {trip.carrierName}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 italic">-- بانتظار ناقل --</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs font-mono text-slate-600">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> 
                            {trip.departureDate?.toDate ? new Date(trip.departureDate.toDate()).toLocaleDateString('ar-JO') : '-'}
                        </span>
                        <span>
                            {trip.departureDate?.toDate ? new Date(trip.departureDate.toDate()).toLocaleTimeString('ar-JO', {hour: '2-digit', minute:'2-digit'}) : '-'}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">
                    {trip.price || trip.targetPrice || '-'} {trip.currency || 'د.أ'}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(trip.status)}</TableCell>
                  <TableCell className="text-center">
                    <TripRowActions 
                        tripId={trip.id} 
                        onView={() => router.push(`/admin/users/${trip.userId}`)} // Placeholder view action
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t py-6 bg-gray-50/30">
        <Button onClick={() => fetchTrips(true)} variant="outline" disabled={loadingMore || !hasMore} className="w-[200px]">
          {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : hasMore ? 'تحميل المزيد' : 'نهاية السجلات'}
        </Button>
      </CardFooter>
    </Card>
  );
}
