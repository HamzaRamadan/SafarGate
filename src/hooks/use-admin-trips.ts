'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, where, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// [SC-206] Corrected Data Schema (Identity Fix)
export interface TripData {
  id: string;
  userId: string;
  passengerName?: string; 
  carrierId?: string;
  carrierName?: string;
  origin: string;
  destination: string;
  departureDate: any; // Firestore Timestamp
  status: 'Planned' | 'In-Transit' | 'Completed' | 'Cancelled' | 'Awaiting-Offers' | 'Pending-Carrier-Confirmation' | 'Pending-Payment';
  price?: number;
  targetPrice?: number;
  currency?: string;
}


export function useAdminTrips() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchTrips = useCallback(async (isNextPage = false) => {
    if (!firestore) return;

    if (isNextPage) setLoadingMore(true);
    else {
      setLoading(true);
      setTrips([]); 
      setLastDoc(null);
    }

    try {
      let constraints: any[] = [orderBy('departureDate', 'desc'), limit(20)];

      if (statusFilter !== 'all') {
          constraints.push(where('status', '==', statusFilter));
      }

      let q = query(collection(firestore, 'trips'), ...constraints);

      if (isNextPage && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetchedTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TripData));

      setHasMore(fetchedTrips.length === 20);
      setTrips(prev => isNextPage ? [...prev, ...fetchedTrips] : fetchedTrips);
      setLastDoc(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null);

    } catch (error) {
      console.error("Trip Query Error (Verify Indexes):", error);
      toast({ variant: "destructive", title: "خطأ في الجلب", description: "تأكد من الفهارس (Indexes) في Firebase." });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [firestore, statusFilter, lastDoc, toast]);

  useEffect(() => {
    fetchTrips(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // [SC-206] handleCancelTrip has been removed in compliance with Broker Policy.

  return {
    trips,
    loading,
    loadingMore,
    hasMore,
    fetchTrips,
    setStatusFilter,
    statusFilter,
  };
}
