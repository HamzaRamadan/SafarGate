'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, limit, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { AlertCircle, Route, Search, Star, ShieldCheck, Sparkles, ChevronLeft, Award, ArrowRightLeft, Zap } from 'lucide-react';
import { BookingActionCard } from '@/components/carrier/booking-action-card';
import { MyTripsList } from '@/components/carrier/my-trips-list';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Trip, CarrierTier } from '@/lib/data';
import { EditTripDialog, type EditTripFormValues } from '@/components/carrier/edit-trip-dialog';
import { CarrierTrustSheet } from '@/components/carrier/carrier-trust-sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useUserProfile } from '@/hooks/use-user-profile';
import { SubscriptionStatusCard } from '@/components/carrier/subscription-status-card';

// Helper: Get Icon
const getTierIcon = (tier?: CarrierTier) => {
    switch(tier) {
        case 'PLATINUM': return <Sparkles className="h-4 w-4 text-cyan-400" />;
        case 'GOLD': return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
        case 'SILVER': return <ShieldCheck className="h-4 w-4 text-slate-400" />;
        default: return <Award className="h-4 w-4 text-orange-400" />;
    }
};

// Helper: Get Label & Style
const getTierLabel = (locale: string, tier?: CarrierTier) => {

    const labels = {
        'PLATINUM': { ar: 'نخبة', en: 'Elite', bg: 'bg-slate-900 text-white border-slate-700' },
        'GOLD': { ar: 'ذهبي', en: 'Gold', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        'SILVER': { ar: 'فضي', en: 'Silver', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
        'BRONZE': { ar: 'برونزي', en: 'Bronze', bg: 'bg-orange-50 text-orange-700 border-orange-200' }
    };
    const key = tier || 'BRONZE';
    return { text: labels[key][locale as 'ar' | 'en'], bg: labels[key].bg };
};

export default function CarrierDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { profile: userProfile, isLoading: isLoadingProfile } = useUserProfile();
  const { toast } = useToast();
  const t = useTranslations('carrier');
  const locale = useLocale();
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [isMyTrustSheetOpen, setIsMyTrustSheetOpen] = useState(false);
  
  // --- 1. Queries (The Eyes of the Operations Room) ---
  
  // A. Pending Confirmations (Standard)
  const pendingBookingsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'bookings'), where('carrierId', '==', user.uid), where('status', '==', 'Pending-Carrier-Confirmation'), limit(3));
  }, [user, firestore]);

  // B. Next Trip (Direct Fetch - Protocol 88 Compliant)
  const nextTripRef = useMemo(() => {
    if (!firestore || !userProfile?.currentActiveTripId) return null;
    return doc(firestore, 'trips', userProfile.currentActiveTripId);
  }, [firestore, userProfile]);

  // [SC-148] C. Urgent Transfers (Emergency Radar)
  const urgentTransfersQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'transferRequests'), where('toCarrierId', '==', user.uid), where('status', '==', 'pending'), limit(1));
  }, [user, firestore]);

  // [SC-148] D. Direct Requests (VIP Radar)
  const directRequestsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'trips'), where('targetCarrierId', '==', user.uid), where('requestType', '==', 'Direct'), where('status', '==', 'Awaiting-Offers'), limit(1));
  }, [user, firestore]);

  // --- Data Fetching ---
  const { data: pendingBookings, isLoading: loadingBookings } = useCollection(pendingBookingsQuery);
  const { data: nextTrip, isLoading: loadingTrip } = useDoc<Trip>(nextTripRef);
  const { data: urgentTransfers } = useCollection(urgentTransfersQuery); // [SC-148]
  const { data: directRequests } = useCollection(directRequestsQuery);   // [SC-148]

  const hasUrgentTransfers = urgentTransfers && urgentTransfers.length > 0;
  const hasDirectRequests = directRequests && directRequests.length > 0;

  // --- Handlers ---
  const handleBookingReject = async (bookingId: string) => {
      if (!firestore) return;
      const bookingRef = doc(firestore, 'bookings', bookingId);
      try {
          await updateDoc(bookingRef, { status: 'Rejected', updatedAt: serverTimestamp() });
          toast({ title: t('bookingRejected') });
      } catch (error) {
          toast({ variant: 'destructive', title: t('operationFailed') });
          throw error;
      }
  };

  const handleEditTrip = (trip: Trip) => setTripToEdit(trip);
  
  const handleConfirmEdit = async (trip: Trip, data: EditTripFormValues) => {
    if (!firestore) return;
    const tripRef = doc(firestore, 'trips', trip.id);
    updateDocumentNonBlocking(tripRef, { ...data, updatedAt: serverTimestamp() });
    toast({ title: t('tripUpdated'), description: t('tripUpdatedDesc') });
    setTripToEdit(null);
  };
  
  const isLoading = loadingBookings || isLoadingProfile || loadingTrip;

  return (
    <>
      <div className="space-y-6 p-4 pb-20 animate-in fade-in slide-in-from-bottom-2">
         
         {/* 1. Identity & Reputation Card (Visual Anchor) */}
         <div className="mb-6 space-y-4">
            <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
                <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                
                <div className="p-4 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                <AvatarImage src={userProfile?.photoURL || ""} alt="User" />
                                <AvatarFallback>{userProfile?.firstName?.[0]}</AvatarFallback>
                            </Avatar>
                            {/* <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full shadow-sm border border-border">
                                {getTierIcon(userProfile?.ratingStats?.tier)}
                            </div> */}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
                                {userProfile?.firstName} {userProfile?.lastName}
                            </h1>
                            <span className="text-sm font-normal text-muted-foreground bg-secondary px-3 -mr-3 py-1.5 rounded-full">
                                  {t('title')}
                                </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsMyTrustSheetOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                    >
                        <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center shadow-sm border border-border hover:bg-muted">
                            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">{t('record')}</span>
                    </button>
                </div>
            </Card>
         </div>

         <SubscriptionStatusCard />

         {/* [SC-148] 2. Emergency & Direct Alerts (The Radar) */}
         {(hasUrgentTransfers || hasDirectRequests) && (
             <div className="space-y-3 animate-pulse">
                 {hasUrgentTransfers && (
                     <Link href="/carrier/bookings">
                        <Alert className="bg-red-50 border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                            <ArrowRightLeft className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-700 font-bold">{t('urgentTransfer')}</AlertTitle>
                            <AlertDescription className="text-red-600 text-xs">{t('urgentTransferDesc')}</AlertDescription>
                        </Alert>
                     </Link>
                 )}
                 {hasDirectRequests && (
                     <Link href="/carrier/bookings">
                        <Alert className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-700 font-bold">{t('directRequest')}</AlertTitle>
                            <AlertDescription className="text-blue-600 text-xs">{t('directRequestDesc')}</AlertDescription>
                        </Alert>
                     </Link>
                 )}
             </div>
         )}

         {/* 3. Action Section */}
         <section className="space-y-3">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-orange-600 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {t('pendingRequests')}</h3>
               {pendingBookings && pendingBookings.length > 0 && <Link href="/carrier/bookings" className="text-xs text-primary hover:underline">{t('viewAll')}</Link>}
            </div>
            
            {loadingBookings ? (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
            ) : pendingBookings && pendingBookings.length > 0 ? (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingBookings.map(booking => (
                     <BookingActionCard key={booking.id} booking={booking} onReject={handleBookingReject} />
                  ))}
               </div>
            ) : (
               <Alert className="bg-muted/30 border-dashed">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <AlertTitle className="text-sm">{t('noPending')}</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">{t('noPendingDesc')}</AlertDescription>
               </Alert>
            )}
         </section>

         {isLoading ? <Skeleton className="h-48 w-full" /> : nextTrip ? (
             <section className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2"><Route className="h-4 w-4 text-blue-600"/> {t('nextTrip')}</h3>
                <MyTripsList trips={[nextTrip]} isLoading={false} onEdit={handleEditTrip} />
             </section>
         ) : null}
      </div>

      <EditTripDialog isOpen={!!tripToEdit} onOpenChange={(open) => !open && setTripToEdit(null)} trip={tripToEdit} onConfirm={handleConfirmEdit} />
      
      <CarrierTrustSheet 
          isOpen={isMyTrustSheetOpen} 
          onClose={() => setIsMyTrustSheetOpen(false)} 
          carrierId={user?.uid || null} 
      />
    </>
  );
}
