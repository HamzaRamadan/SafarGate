'use client';

// [SC-025] Surgical Update: Imports Updated and sterilized
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, ArrowRightLeft, ChevronDown, Loader2 } from 'lucide-react';
import { Trip } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { TripCardBase } from '@/components/trip/trip-card-base';
import { Badge } from '@/components/ui/badge';

type TabValue = 'completed' | 'transferred';

export default function CarrierArchivePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<TabValue>('completed');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const baseQuery = useMemo(() => {
    if (!user || !firestore) return null;
    if (activeTab === 'completed') {
      return query(
        collection(firestore, 'trips'),
        where('carrierId', '==', user.uid),
        where('status', 'in', ['Completed', 'Cancelled']),
        orderBy('departureDate', 'desc')
      );
    } else {
      return query(
        collection(firestore, 'trips'),
        where('originalCarrierId', '==', user.uid),
        orderBy('departureDate', 'desc')
      );
    }
  }, [user, firestore, activeTab]);

  const fetchTrips = useCallback(async (isNextPage = false) => {
    if (!baseQuery) return;
    setLoading(true);
    try {
      let q = query(baseQuery, limit(10));
      if (isNextPage && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const newTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setHasMore(newTrips.length === 10);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setTrips(prev => isNextPage ? [...prev, ...newTrips] : newTrips);
    } catch (error) {
      console.error("Archive fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [baseQuery, lastDoc]);

  useEffect(() => {
    setTrips([]);
    setLastDoc(null);
    setHasMore(true);
    if(baseQuery) { fetchTrips(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseQuery]);


  const renderContent = () => {
    if (loading && trips.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      );
    }
    
    if (trips.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <Archive className="h-10 w-10 mb-2 opacity-20" />
                <p>لا يوجد سجلات في هذا القسم.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map(trip => (
                <TripCardBase 
                     key={trip.id} 
                     trip={trip}
                >
                  {/* Footer Area: Custom Archive Info */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                      <span className="font-mono">REF: {trip.id.slice(-6).toUpperCase()}</span>
                      {activeTab === 'transferred' && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600/50 bg-orange-50">
                              <ArrowRightLeft className="h-3 w-3 ml-1" />
                              منقولة
                          </Badge>
                      )}
                  </div>
                </TripCardBase>
            ))}
        </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-6">
        <Archive className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">الأرشيف والسجلات</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="completed">سجلي التشغيلي</TabsTrigger>
          <TabsTrigger value="transferred" className="flex gap-2 items-center">
             <ArrowRightLeft className="h-3 w-3" />
             رحلات نقلتها
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">{renderContent()}</div>
        
        {hasMore && !loading && (
            <div className="pt-6 flex justify-center">
                <Button 
                    variant="outline" 
                    onClick={() => fetchTrips(true)} 
                    disabled={loading}
                    className="w-full md:w-auto gap-2"
                >
                    <ChevronDown className="h-4 w-4" />
                    عرض المزيد
                </Button>
            </div>
        )}
        
        {loading && trips.length > 0 && (
           <div className="pt-6 flex justify-center">
             <Button variant="outline" disabled={true} className="w-full md:w-auto gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التحميل...
              </Button>
           </div>
        )}
      </Tabs>
    </div>
  );
}
