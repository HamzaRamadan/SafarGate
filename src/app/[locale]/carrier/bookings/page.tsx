'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, arrayUnion, writeBatch, getDocs } from 'firebase/firestore';
import { BookingActionCard } from '@/components/carrier/booking-action-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, ArrowRightLeft, Zap, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Booking, Trip, TransferRequest, UserProfile } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCityName } from '@/lib/constants';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { OfferDialog } from '@/components/carrier/offer-dialog';
import { useOfferDialog } from '@/hooks/use-offer-dialog';
import { useTranslations, useLocale } from 'next-intl';

// --- Helper Component: FromCarrierInfo ---
function FromCarrierInfo({ carrierId }: { carrierId: string }) {
    const firestore = useFirestore();
    const carrierRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'users', carrierId);
    }, [firestore, carrierId]);

    const { data: carrier, isLoading } = useDoc<UserProfile>(carrierRef);
    const t = useTranslations('bookingRequests');

    if (isLoading) return <Skeleton className="h-8 w-32 rounded-full" />;
    
    if (!carrier) return <p className="text-xs text-muted-foreground">{t('unknownCarrier')}</p>;

    return (
        <div className="flex items-center gap-3">
             <Avatar className="h-8 w-8">
                <AvatarFallback>{carrier.firstName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
                 <p className="text-sm font-bold">{carrier.firstName} {carrier.lastName}</p>
                 <p className="text-xs text-muted-foreground">{t('fellowCarrier')}</p>
            </div>
        </div>
    );
}

export default function BookingRequestsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const t = useTranslations('bookingRequests');
  const locale = useLocale();

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

  // --- Real-Time Streams ---
  const bookingReqQuery = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return query(
      collection(firestore, 'bookings'),
      where('carrierId', '==', user.uid),
      where('status', '==', 'Pending-Carrier-Confirmation')
    );
  }, [user, firestore]);

  const directReqQuery = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return query(
      collection(firestore, 'trips'),
      where('targetCarrierId', '==', user.uid),
      where('requestType', '==', 'Direct'),
      where('status', '==', 'Awaiting-Offers')
    );
  }, [user, firestore]);

  const transferReqQuery = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return query(
      collection(firestore, 'transferRequests'),
      where('toCarrierId', '==', user.uid),
      where('status', '==', 'pending')
    );
  }, [user, firestore]);

  const { data: bookingsRaw, isLoading: loadBookings } = useCollection<Booking>(bookingReqQuery);
  const { data: directTripsRaw, isLoading: loadDirect } = useCollection<Trip>(directReqQuery);
  const { data: transfersRaw, isLoading: loadTransfers } = useCollection<TransferRequest>(transferReqQuery);

  // Sort client-side (avoids need for Firestore composite indexes)
  const sortByDate = <T extends { createdAt?: any }>(arr: T[] | null) =>
    arr ? [...arr].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    }) : null;

  const bookings = sortByDate(bookingsRaw);
  const directTrips = sortByDate(directTripsRaw);
  const transfers = sortByDate(transfersRaw);

  const isLoading = loadBookings || loadDirect || loadTransfers;

  // --- Action Handlers ---
  const handleBookingUpdate = async (bookingId: string, newStatus: 'Confirmed' | 'Rejected') => {
      if (!firestore) return;
      const bookingRef = doc(firestore, 'bookings', bookingId);
      try {
          await updateDoc(bookingRef, { status: newStatus, updatedAt: serverTimestamp() });
          toast({ title: newStatus === 'Confirmed' ? t('bookingConfirmed') : t('bookingRejected') });
      } catch (error) {
          toast({ variant: 'destructive', title: t('operationFailed') });
      }
  };

  const handleAcceptTransfer = async (request: TransferRequest) => {
      if (!firestore || !user) return;
      
      try {
          const bookingsQuery = query(
              collection(firestore, 'bookings'), 
              where('tripId', '==', request.originalTripId),
              where('status', '==', 'Confirmed')
          );
          const bookingsSnap = await getDocs(bookingsQuery);

          const batch = writeBatch(firestore);
          const tripRef = doc(firestore, 'trips', request.originalTripId);
          batch.update(tripRef, { 
               carrierId: user.uid, 
               transferStatus: 'Transferred',
               originalCarrierId: request.fromCarrierId 
           });

          const reqRef = doc(firestore, 'transferRequests', request.id);
          batch.update(reqRef, { status: 'accepted', updatedAt: serverTimestamp() });

          const chatRef = doc(firestore, 'chats', request.originalTripId);
          batch.update(chatRef, { participants: arrayUnion(user.uid) });

          const sysMsgRef = doc(collection(firestore, 'chats', request.originalTripId, 'messages'));
          batch.set(sysMsgRef, {
              content: t('systemTransferNotice'),
              type: 'system',
              senderId: 'system',
              timestamp: serverTimestamp()
          });

          bookingsSnap.docs.forEach((bookingDoc) => {
              batch.update(bookingDoc.ref, { 
                  carrierId: user.uid,
                  updatedAt: serverTimestamp()
              });
          });

          await batch.commit();
          toast({ title: t('transferSuccess'), description: t('transferSuccessDesc') });
          
      } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: t('transferFailed'), description: t('transferFailedDesc') });
      }
  };
  
  const hasItems = (bookings?.length || 0) + (directTrips?.length || 0) + (transfers?.length || 0) > 0;

  return (
    <>
        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        )}

        {!isLoading && !hasItems && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <Inbox className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{t('inboxCleanTitle')}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{t('inboxCleanDesc')}</p>
            </div>
        )}
        
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {transfers && transfers.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" /> {t('emergencyTransfers')}
                        <Badge variant="destructive" className="h-5 px-1.5">{transfers.length}</Badge>
                    </h2>
                    {transfers.map(req => (
                        <div key={req.id} className="border-2 border-red-100 bg-red-50/50 rounded-xl p-4 space-y-3 shadow-sm">
                            <FromCarrierInfo carrierId={req.fromCarrierId} />
                            <div className="text-xs text-muted-foreground bg-background/60 p-2 rounded">
                                <p><strong>{t('tripLabel')}:</strong> {getCityName(req.tripDetails.origin, locale)} ➝ {getCityName(req.tripDetails.destination, locale)}</p>
                                <p><strong>{t('passengersLabel')}:</strong> {req.tripDetails.passengerCount}</p>
                                <p><strong>{t('dateLabel')}:</strong> {new Date(req.tripDetails.departureDate).toLocaleDateString()}</p>
                            </div>
                            <Button variant="destructive" className="w-full" onClick={() => handleAcceptTransfer(req)}>
                                <Check className="ml-2 h-4 w-4" />
                                {t('acceptAndReceive')}
                            </Button>
                        </div>
                    ))}
                </section>
            )}

            {directTrips && directTrips.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-blue-600 flex items-center gap-2">
                        <Zap className="h-4 w-4" /> {t('directRequests')}
                        <Badge className="bg-blue-100 text-blue-700 h-5 px-1.5 hover:bg-blue-200">{directTrips.length}</Badge>
                    </h2>
                    {directTrips.map(trip => (
                        <div key={trip.id} className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-sm">{t('specialRequestForYou')}</span>
                                <span className="text-xs text-muted-foreground">{t('waitingOffer')}</span>
                            </div>
                            <div className="text-sm font-medium mb-4">
                                {getCityName(trip.origin, locale)} ⬅ {getCityName(trip.destination, locale)}
                            </div>
                            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => openOfferDialog(trip)}>
                                تقديم عرض سعر
                            </Button>
                        </div>
                    ))}
                </section>
            )}

            {bookings && bookings.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Inbox className="h-4 w-4" /> {t('pendingBookings')}
                        <Badge variant="secondary" className="h-5 px-1.5">{bookings.length}</Badge>
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {bookings.map(booking => (
                            <BookingActionCard 
                                key={booking.id} 
                                booking={booking}  
                                onReject={async () => {}} 
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
        
        {selectedTrip && (
            <OfferDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                trip={selectedTrip}
                suggestion={priceSuggestion}
                onSuggestPrice={handleSuggestPrice}
                isSuggestingPrice={isSuggestingPrice}
                onSendOffer={handleSendOffer}
            />
        )}
    </>
  );
}