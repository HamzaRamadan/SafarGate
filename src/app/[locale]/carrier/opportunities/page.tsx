'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';
import type { Trip, UserProfile } from '@/lib/data';
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


export default function OpportunitiesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter(); // PROTOCOL 16: Will be removed
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  
  // SC-056: Carrier Active Trip Monitor
  const activeTripRef = useMemo(() => {
      if (!firestore || !profile?.currentActiveTripId) return null;
      return doc(firestore, 'trips', profile.currentActiveTripId);
  }, [firestore, profile?.currentActiveTripId]);

  const { data: activeTrip } = useDoc<Trip>(activeTripRef);

  // [SC-090] Unified Offer Dialog Logic
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

  // [SC-022] Logic Injection: Server-Side Vehicle Filtering
  const opportunitiesQuery = useMemo(() => {
    if (!firestore || !user || !profile || !profile.vehicleCapacity) return null;

    const myCategory = (profile as any).vehicleCategory || 'small';

    // 1. Core Filter: Only active trips in the future + Capacity Guard (Protocol 88)
    const constraints: any[] = [
      where('status', '==', 'Awaiting-Offers'),
      where('departureDate', '>=', new Date().toISOString()),
      where('passengers', '<=', profile.vehicleCapacity),
      // الحقن الجراحي: فلترة المركبة سحابياً
      where('preferredVehicle', 'in', ['any', myCategory]),
      orderBy('departureDate', 'asc'),
      limit(50)
    ];

    // 2. Jurisdiction & Return Trip Logic
    if (profile.currentActiveTripId && activeTrip) {
       // Mode A: Return Trip (Guidance)
       constraints.push(where('origin', '==', activeTrip.destination));
    } else if (profile.jurisdiction?.origin) {
       // Mode B: Jurisdiction (Normal)
       constraints.push(where('origin', 'in', [profile.jurisdiction.origin, profile.jurisdiction.destination]));
    } else {
       // Mode C: General Pool (Fallback)
       constraints.push(where('requestType', '==', 'General'));
    }

    return query(collection(firestore, 'trips'), ...constraints);
  }, [firestore, user, profile, activeTrip]);

  const { data: rawOpportunities, isLoading: isFetching } = useCollection<Trip>(opportunitiesQuery);

  // [SC-022] Cleaned Client Logic (Only removes own trips)
  const opportunities = useMemo(() => {
    if (!rawOpportunities || !user) return [];
    // تمت إزالة فلترة المركبة المحلية
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

  // 1. Block: Incomplete Profile (Corrected with `isPartial`)
  if (profile.isPartial) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-4">
              <div className="bg-yellow-100 p-4 rounded-full"><AlertCircle className="h-12 w-12 text-yellow-600" /></div>
              <h2 className="text-xl font-bold text-foreground">الحساب غير مكتمل</h2>
              <p className="text-muted-foreground max-w-xs">يرجى إكمال بياناتك الشخصية والمركبة لتتمكن من رؤية الطلبات.</p>
              <Button onClick={() => router.push('/carrier/profile')}>إكمال الملف الشخصي</Button>
          </div>
      );
  }

  // 2. Guidance: Active Trip Mode
  if (hasActiveTrip && activeTrip) {
      return (
          <div className="container mx-auto p-4 space-y-4 pb-24">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                  <div>
                      <h3 className="font-bold text-blue-800">وضع رحلة العودة</h3>
                      <p className="text-sm text-blue-600">
                          بما أنك في رحلة نشطة إلى <strong>{getCityName(activeTrip.destination)}</strong>، 
                          يقوم النظام الآن بالبحث حصراً عن طلبات تعيدك من هناك.
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
                      <p>لا توجد طلبات عودة متاحة حالياً من {getCityName(activeTrip.destination)}.</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                سوق الفرص
            </h1>
            <p className="text-xs text-muted-foreground">
                طلبات الركاب المتاحة ضمن نطاقك ({getCityName(profile.jurisdiction?.origin || '')} - {getCityName(profile.jurisdiction?.destination || '')})
            </p>
        </div>
        {/* [SC-019] Removed Manual Refresh Button - The stream is now LIVE */}
      </div>

      {/* List */}
      {opportunities && opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((trip) => (
            <RequestCard key={trip.id} tripRequest={trip} onOffer={() => openOfferDialog(trip)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 border-2 border-dashed rounded-lg">
          <div className="bg-muted p-4 rounded-full"><DollarSign className="h-8 w-8 text-muted-foreground" /></div>
          <h3 className="text-lg font-semibold">لا توجد فرص متاحة حالياً</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            سيتم إعلامك فور وصول طلبات جديدة تناسب مسارك وسعة مركبتك.
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
