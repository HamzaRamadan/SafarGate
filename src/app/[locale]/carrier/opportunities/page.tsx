'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import type { Trip } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  AlertCircle,
  Navigation,
  Ban
} from 'lucide-react';
import { OfferDialog } from '@/components/carrier/offer-dialog';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useOfferDialog } from '@/hooks/use-offer-dialog';
import { getCityName } from '@/lib/constants';
import { RequestCard } from '@/components/carrier/request-card';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function OpportunitiesPage() {
  const t = useTranslations('opportunities');
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  
  const activeTripRef = useMemo(() => {
      if (!firestore || !profile?.currentActiveTripId) return null;
      return doc(firestore, 'trips', profile.currentActiveTripId);
  }, [firestore, profile?.currentActiveTripId]);

  const { data: activeTrip } = useDoc<Trip>(activeTripRef);

  const {
    selectedTrip,
    isDialogOpen,
    priceSuggestion,
    isSuggestingPrice,
    openOfferDialog,
    setIsDialogOpen,
    handleSuggestPrice,
    handleSendOffer,
  } = useOfferDialog();

  const opportunitiesQuery = useMemo(() => {
    if (!firestore || !user || !profile || !profile.vehicleCapacity) return null;

    const myCategory = (profile as any).vehicleCategory || 'small';
    const constraints: any[] = [
      where('status', '==', 'Awaiting-Offers'),
      where('departureDate', '>=', new Date().toISOString()),
      where('passengers', '<=', profile.vehicleCapacity),
      where('preferredVehicle', 'in', ['any', myCategory]),
      orderBy('departureDate', 'asc'),
      limit(50)
    ];

    if (profile.currentActiveTripId && activeTrip) {
       constraints.push(where('origin', '==', activeTrip.destination));
    } else if (profile.jurisdiction?.origin) {
       constraints.push(where('origin', 'in', [profile.jurisdiction.origin, profile.jurisdiction.destination]));
    } else {
       constraints.push(where('requestType', '==', 'General'));
    }

    return query(collection(firestore, 'trips'), ...constraints);
  }, [firestore, user, profile, activeTrip]);

  const { data: rawOpportunities, isLoading: isFetching } = useCollection<Trip>(opportunitiesQuery);

  const opportunities = useMemo(() => {
    if (!rawOpportunities || !user) return [];
    return rawOpportunities.filter(trip => trip.userId !== user.uid);
  }, [rawOpportunities, user]);

  const hasActiveTrip = !!profile?.currentActiveTripId;

  if (isLoadingProfile || isFetching) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!profile) return null;

  if (profile.isPartial) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-4">
              <div className="bg-yellow-100 p-4 rounded-full"><AlertCircle className="h-12 w-12 text-yellow-600" /></div>
              <h2 className="text-xl font-bold text-foreground">{t('incompleteProfileTitle')}</h2>
              <p className="text-muted-foreground max-w-xs">{t('incompleteProfileDescription')}</p>
              <Button onClick={() => router.push('/carrier/profile')}>{t('completeProfileButton')}</Button>
          </div>
      );
  }

  if (hasActiveTrip && activeTrip) {
      return (
          <div className="container mx-auto p-4 space-y-4 pb-24">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                  <div>
                      <h3 className="font-bold text-blue-800">{t('activeTripModeTitle')}</h3>
                      <p className="text-sm text-blue-600">
                          {t.rich('activeTripModeDescription', { city: getCityName(activeTrip.destination) })}
                      </p>
                  </div>
              </div>
              
              {opportunities && opportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {opportunities.map((trip) => (
                          <RequestCard key={trip.id} tripRequest={trip} onOffer={() => openOfferDialog(trip)} />
                      ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Ban className="h-12 w-12 mb-2 opacity-20" />
                      <p>{t('noReturnRequests', { city: getCityName(activeTrip.destination) })}</p>
                  </div>
              )}
              
              {selectedTrip && (
                <OfferDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    trip={selectedTrip}
                    suggestion={priceSuggestion}
                    isSuggestingPrice={isSuggestingPrice}
                    onSuggestPrice={handleSuggestPrice}
                    onSendOffer={handleSendOffer}
                />
              )}
          </div>
      );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                {t('opportunitiesMarketTitle')}
            </h1>
            <p className="text-xs text-muted-foreground">
                {t.rich('opportunitiesMarketSubtitle', { origin: getCityName(profile.jurisdiction?.origin || ''), destination: getCityName(profile.jurisdiction?.destination || '') })}
            </p>
        </div>
      </div>

      {opportunities && opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((trip) => (
            <RequestCard key={trip.id} tripRequest={trip} onOffer={() => openOfferDialog(trip)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 border-2 border-dashed rounded-lg">
          <div className="bg-muted p-4 rounded-full"><DollarSign className="h-8 w-8 text-muted-foreground" /></div>
          <h3 className="text-lg font-semibold">{t('noOpportunitiesTitle')}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t('noOpportunitiesDescription')}
          </p>
        </div>
      )}

      {selectedTrip && (
        <OfferDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            trip={selectedTrip}
            suggestion={priceSuggestion}
            isSuggestingPrice={isSuggestingPrice}
            onSuggestPrice={handleSuggestPrice}
            onSendOffer={handleSendOffer}
        />
      )}
    </div>
  );
}
