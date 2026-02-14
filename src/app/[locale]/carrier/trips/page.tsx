'use client';
import { useMemo, useState } from 'react';
import { MyTripsList } from '@/components/carrier/my-trips-list';
import type { Trip } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { EditTripDialog, type EditTripFormValues } from '@/components/carrier/edit-trip-dialog';
import { useTripActions } from '@/hooks/use-trip-actions';
import { useUserProfile } from '@/hooks/use-user-profile';

function LoadingState() {
    return (
      <div className="space-y-6">
          <Skeleton key="header-1" className="h-8 w-48 rounded-lg mb-4" />
          <div className="space-y-3">
              {[...Array(1)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
          </div>
      </div>
    );
}

export default function CarrierTripsPage() {
    const { profile, isLoading: isLoadingProfile } = useUserProfile();
    const firestore = useFirestore();
    
    const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
    const { editTrip } = useTripActions();

    const activeTripRef = useMemo(() => {
        if (!firestore || !profile?.currentActiveTripId) return null;
        return doc(firestore, 'trips', profile.currentActiveTripId);
    }, [firestore, profile]);

    const { data: activeTrip, isLoading: isLoadingTrip } = useDoc<Trip>(activeTripRef);
    
    const handleEditTrip = (trip: Trip) => {
        setTripToEdit(trip);
    };

    const handleConfirmEdit = async (trip: Trip, data: EditTripFormValues) => {
        const success = await editTrip(trip, data);
        if (success) {
            setTripToEdit(null);
        }
    };

    const isLoading = isLoadingProfile || isLoadingTrip;
    const tripsToShow = activeTrip ? [activeTrip] : [];

    if (isLoading) {
        return <LoadingState />;
    }

    return (
        <>
            <div className="space-y-8 w-full">
                <header>
                    <h1 className="text-xl md:text-2xl font-bold">إدارة رحلتك النشطة</h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                       أدرْ رحلتك النشطة حالياً، وعدّل تفاصيلها، وتابع المسافرين المؤكدين فيها.
                    </p>
                </header>
                
                <main className="space-y-8">
                    <MyTripsList 
                        trips={tripsToShow}
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
