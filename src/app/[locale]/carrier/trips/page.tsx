'use client';

import { useMemo, useState, useEffect } from 'react';
import { MyTripsList } from '@/components/carrier/my-trips-list';
import type { Trip } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EditTripDialog, type EditTripFormValues } from '@/components/carrier/edit-trip-dialog';
import { useTripActions } from '@/hooks/use-trip-actions';
import { useTranslations } from 'next-intl';

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 rounded-lg mb-4" />
      <div className="space-y-3">
        {[...Array(1)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ====== DEBUG PANEL - احذفه بعد ما تحل المشكلة ======
function DebugPanel({ userId, firestore }: { userId: string, firestore: any }) {
  const [info, setInfo] = useState<any>({ loading: true });

  useEffect(() => {
    if (!firestore || !userId) return;
    async function run() {
      const results: any = { userId };
      try {
        // 1. كل رحلاتي بدون فلتر
        const allQ = query(collection(firestore, 'trips'), where('carrierId', '==', userId));
        const allSnap = await getDocs(allQ);
        results.allTrips = allSnap.docs.map(d => ({ id: d.id, status: d.data().status, carrierId: d.data().carrierId }));
      } catch(e: any) { results.allTripsError = e.message; }

      try {
        // 2. بفلتر status
        const filtQ = query(collection(firestore, 'trips'), where('carrierId', '==', userId), where('status', 'in', ['Planned', 'In-Transit']));
        const filtSnap = await getDocs(filtQ);
        results.filteredTrips = filtSnap.docs.map(d => ({ id: d.id, status: d.data().status }));
      } catch(e: any) { results.filteredError = e.message; }

      setInfo({ ...results, loading: false });
    }
    run();
  }, [firestore, userId]);

  if (info.loading) return <div className="p-3 bg-yellow-50 border border-yellow-300 rounded text-xs">جاري الفحص...</div>;

  return (
    <div className="p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-xs font-mono space-y-2 mb-4">
      <p className="font-bold text-yellow-800">🔍 DEBUG PANEL (احذفه بعد الحل)</p>
      <p><b>User ID:</b> {info.userId}</p>
      <p><b>كل رحلاتي (بدون فلتر):</b> {info.allTripsError ? <span className="text-red-600">خطأ: {info.allTripsError}</span> : JSON.stringify(info.allTrips)}</p>
      <p><b>بعد فلتر Planned/In-Transit:</b> {info.filteredError ? <span className="text-red-600">خطأ: {info.filteredError}</span> : JSON.stringify(info.filteredTrips)}</p>
    </div>
  );
}
// ====================================================

export default function CarrierTripsPage() {
  const t = useTranslations('carrierTripsPage');
  const { user } = useUser();
  const firestore = useFirestore();
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const { editTrip } = useTripActions();

  const activeTripsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'trips'),
      where('carrierId', '==', user.uid),
      where('status', 'in', ['Planned', 'In-Transit'])
    );
  }, [firestore, user]);

  const { data: trips, isLoading } = useCollection<Trip>(activeTripsQuery);

  const sortedTrips = useMemo(() => {
    if (!trips) return [];
    return [...trips].sort((a, b) => {
      const aDate = new Date(a.departureDate || 0).getTime();
      const bDate = new Date(b.departureDate || 0).getTime();
      return aDate - bDate;
    });
  }, [trips]);

  const handleEditTrip = (trip: Trip) => setTripToEdit(trip);

  const handleConfirmEdit = async (trip: Trip, data: EditTripFormValues) => {
    const success = await editTrip(trip, data);
    if (success) setTripToEdit(null);
  };

  if (isLoading) return <LoadingState />;

  return (
    <>
      <div className="space-y-8 w-full">
        <header>
          <h1 className="text-xl md:text-2xl font-bold">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('description')}
          </p>
        </header>

        {/* DEBUG - احذفه بعد الحل */}
        {user && firestore && <DebugPanel userId={user.uid} firestore={firestore} />}

        <main className="space-y-8">
          <MyTripsList
            trips={sortedTrips}
            isLoading={isLoading}
            onEdit={handleEditTrip}
          />
        </main>
      </div>

      <EditTripDialog
        isOpen={!!tripToEdit}
        onOpenChange={(open) => !open && setTripToEdit(null)}
        trip={tripToEdit}
        onConfirm={handleConfirmEdit}
      />
    </>
  );
}