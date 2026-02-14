'use client';

// [Protocol 16]: Removed default React import
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trip, Offer, Booking } from '@/lib/data';
import { PackageOpen, MessageSquare, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, serverTimestamp, collection, query, where, runTransaction, increment, writeBatch, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { OfferDecisionRoom } from '@/components/offer-decision-room';
import { RateTripDialog } from '@/components/trip-closure/rate-trip-dialog';
import { CancellationDialog } from '@/components/booking/cancellation-dialog';
import { ChatDialog } from '@/components/chat/chat-dialog';
import { BookingPaymentDialog } from '@/components/booking/booking-payment-dialog';
import { PendingPaymentCard, PendingConfirmationCard, AwaitingOffersCard } from '@/components/history/status-cards';
import { HeroTicket } from '@/components/history/hero-ticket';

export default function HistoryPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Dialog and Active State Management
  const [activeTripRequest, setActiveTripRequest] = useState<Trip | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedTripForClosure, setSelectedTripForClosure] = useState<Trip | null>(null);
  const [isCancellationDialogOpen, setIsCancellationDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [itemToCancel, setItemToCancel] = useState<{ trip: Trip, booking: Booking } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatInfo, setSelectedChatInfo] = useState<{ id: string; title: string; otherPartyId?: string } | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

  // --- Secure, Independent Data Queries (Protocol 88 Compliant) ---
  
  const allBookingsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'bookings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection<Booking>(allBookingsQuery);

  const requestsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'trips'), 
        where('userId', '==', user.uid),
        where('status', '==', 'Awaiting-Offers')
    );
  }, [firestore, user]);
  const { data: allRequests, isLoading: isRequestsLoading } = useCollection<Trip>(requestsQuery);

  // --- In-Memory Data Segregation (Efficient) ---
  const { confirmed, pendingConfirmation, pendingPayment } = useMemo(() => {
    const confirmedB: Booking[] = [], pendingConfirmB: Booking[] = [], pendingPaymentB: Booking[] = [];
    allBookings?.forEach(b => {
        if (b.status === 'Confirmed' || b.status === 'Completed' || b.status === 'Rated') confirmedB.push(b);
        else if (b.status === 'Pending-Carrier-Confirmation') pendingConfirmB.push(b);
        else if (b.status === 'Pending-Payment') pendingPaymentB.push(b);
    });
    return { confirmed: confirmedB, pendingConfirmation: pendingConfirmB, pendingPayment: pendingPaymentB };
  }, [allBookings]);

  // --- On-Demand Data for Dialogs ---
  const tripForPaymentRef = useMemo(() => {
    if (!firestore || !selectedBookingForPayment) return null;
    return doc(firestore, 'trips', selectedBookingForPayment.tripId);
  }, [firestore, selectedBookingForPayment]);
  const { data: tripForPayment } = useDoc<Trip>(tripForPaymentRef);

  const offersQuery = useMemo(() => {
      if (!firestore || !activeTripRequest) return null;
      return query(collection(firestore, 'trips', activeTripRequest.id, 'offers'));
  }, [firestore, activeTripRequest]);
  const { data: offersForActiveTrip, isLoading: isLoadingOffers } = useCollection<Offer>(offersQuery);

  // [SC-165] Reverse Radar: Query for matching scheduled trips
  const mostRecentRequest = useMemo(() => {
    if (!allRequests || allRequests.length === 0) return null;
    return allRequests[0];
  }, [allRequests]);

  const matchingTripsQuery = useMemo(() => {
    if (!firestore || !mostRecentRequest) return null;
    return query(
      collection(firestore, 'trips'),
      where('status', '==', 'Planned'),
      where('origin', '==', mostRecentRequest.origin),
      where('destination', '==', mostRecentRequest.destination),
      where('availableSeats', '>=', mostRecentRequest.passengers || 1)
    );
  }, [firestore, mostRecentRequest]);

  const { data: matchingTrips } = useCollection<Trip>(matchingTripsQuery);

  // --- Action Handlers ---
  const handleAcceptOffer = async (trip: Trip, offer: Offer) => {
    if (!firestore || !user) {
        setIsProcessing(false);
        return;
    }
    setIsProcessing(true);
    runTransaction(firestore, async (transaction) => {
        const tripRef = doc(firestore, 'trips', trip.id);
        const offerRef = doc(firestore, 'trips', trip.id, 'offers', offer.id);
        const bookingRef = doc(collection(firestore, 'bookings'));
        
        const newBookingData = { 
            tripId: trip.id, 
            userId: user.uid,
            carrierId: offer.carrierId, 
            seats: trip.passengers || 1, 
            passengersDetails: trip.passengersDetails || [], 
            totalPrice: offer.price, 
            currency: offer.currency, 
            status: 'Pending-Carrier-Confirmation' 
        };
        
        transaction.set(bookingRef, { ...newBookingData, id: bookingRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        transaction.update(tripRef, { 
            status: 'Pending-Carrier-Confirmation', 
            acceptedOfferId: offer.id, 
            bookingIds: [bookingRef.id],
            estimatedDurationHours: offer.estimatedDurationHours || 3
        });
        transaction.update(offerRef, { status: 'Accepted' });
    }).then(() => {
        toast({ title: "تم قبول العرض!", description: "بانتظار موافقة الناقل النهائية." });
        setActiveTripRequest(null);
        setIsProcessing(false);
    }).catch((e: any) => {
        if (e.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: `transaction on trips/${trip.id} and bookings`,
                requestResourceData: { offerId: offer.id }
            });
            errorEmitter.emit('permission-error', contextualError);
        } else {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل قبول العرض.' });
        }
        setIsProcessing(false);
    });
  };

  const handleConfirmPayment = async () => {
    if (!firestore || !selectedBookingForPayment || !tripForPayment) {
        setIsConfirmingPayment(false);
        return;
    }
    setIsConfirmingPayment(true);
    // [SC-020] Logic Injection: Atomic Seat Locking (Race Condition Fix)
    await runTransaction(firestore, async (transaction) => {
        const tripRef = doc(firestore, 'trips', selectedBookingForPayment.tripId);
        const bookingRef = doc(firestore, 'bookings', selectedBookingForPayment.id);

        const tripDoc = await transaction.get(tripRef);
        if (!tripDoc.exists()) {
            throw new Error("الرحلة لم تعد موجودة.");
        }

        const currentSeats = tripDoc.data().availableSeats || 0;
        const requiredSeats = selectedBookingForPayment.seats;

        if (currentSeats < requiredSeats) {
            throw new Error(`عذراً، لم يتبق سوى ${currentSeats} مقاعد متاحة. لقد سبقك شخص آخر.`);
        }

        transaction.update(tripRef, { 
            availableSeats: increment(-requiredSeats),
            updatedAt: serverTimestamp() 
        });

        transaction.update(bookingRef, {
            status: 'Confirmed',
            updatedAt: serverTimestamp(),
            consentTimestamp: serverTimestamp(),
        });
    }).then(() => {
        toast({ title: "تم تأكيد الحجز وتوثيقه!", description: "تم حجز مقعدك وتوثيق موافقتك. رحلة سعيدة." });
        setIsPaymentDialogOpen(false); 
        setSelectedBookingForPayment(null);
        setIsConfirmingPayment(false);
    }).catch((e: any) => {
        if (e.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: `transaction on bookings/${selectedBookingForPayment.id} and trips/${selectedBookingForPayment.tripId}`,
                requestResourceData: { bookingId: selectedBookingForPayment.id }
            });
            errorEmitter.emit('permission-error', contextualError);
        } else {
            toast({ variant: "destructive", title: "فشل تأكيد الدفع", description: e.message }); 
        }
        setIsConfirmingPayment(false);
    });
  };

  const handleConfirmCancellation = async () => {
    if (!firestore || !itemToCancel || !user) {
        setIsCancelling(false);
        return;
    };
    setIsCancelling(true);
    const { trip, booking } = itemToCancel;
    const batch = writeBatch(firestore);
    const bookingRef = doc(firestore, 'bookings', booking.id);
    const tripRef = doc(firestore, 'trips', trip.id);
    const chatRef = doc(firestore, 'chats', booking.id);

    const now = new Date();
    const departure = new Date(trip.departureDate);
    const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilDeparture < 24;
    const depositAmount = (booking.totalPrice * (trip.depositPercentage || 0)) / 100;
    
    const documentationPayload = {
        cancellationFee: isLateCancellation ? depositAmount : 0,
        refundStatus: isLateCancellation ? 'Non-Refundable (Late)' : 'Refundable (Early)',
        cancellationPolicySnapshot: '24h_Standard_Rule'
    };

    batch.update(bookingRef, {
        status: 'Cancelled',
        cancelledBy: 'traveler',
        cancellationReason: 'إلغاء من المسافر',
        cancelledAt: serverTimestamp(),
        ...documentationPayload
    });

    batch.update(tripRef, { availableSeats: increment(booking.seats) });
    batch.update(chatRef, { isClosed: true });

    const messageRef = doc(collection(firestore, 'chats', booking.id, 'messages'));
    const systemMessage = `⚠️ تم إلغاء الحجز من قبل المسافر. حالة العربون الموثقة: ${documentationPayload.refundStatus === 'Non-Refundable (Late)' ? 'غير مسترد (إلغاء متأخر)' : 'قابل للاسترداد (إلغاء مبكر)'}.`;
    batch.set(messageRef, {
        content: systemMessage,
        senderId: 'system',
        type: 'system',
        timestamp: serverTimestamp()
    });

    batch.commit().then(() => {
        toast({ title: 'تم توثيق الإلغاء', description: 'تم إلغاء الحجز وتوثيق حالة الاستحقاق المالي.' });
        setIsCancellationDialogOpen(false);
        setItemToCancel(null);
        setIsCancelling(false);
    }).catch((e: any) => {
        if (e.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: `[BATCH_WRITE] bookings/${booking.id}`,
                requestResourceData: { note: 'Batch update for cancellation' }
            });
            errorEmitter.emit('permission-error', contextualError);
        } else {
            toast({ variant: 'destructive', title: 'فشل الإلغاء' });
        }
        setIsCancelling(false);
    });
  };

  // [SC-165] Disengagement Logic (Escape Hatch)
  const handleWithdrawRequest = async (trip: Trip) => {
    if (!firestore) return;
    const tripRef = doc(firestore, 'trips', trip.id);
    try {
        // [Protocol 88]: Clean delete to prevent DB pollution
        await deleteDoc(tripRef);
        toast({
            title: "تم سحب الطلب بنجاح",
            description: "لقد قمت بإلغاء طلبك من السوق.",
        });
        // Note: Dashboard listener will automatically update available options
    } catch (error) {
        toast({
            variant: "destructive",
            title: "فشل سحب الطلب",
        });
    }
  };

  const openChat = (booking: Booking, trip: Trip) => {
    setSelectedChatInfo({ id: booking.id, title: `رحلة مع ${trip.carrierName}`, otherPartyId: trip.carrierId });
    setIsChatOpen(true);
  };
  
  // --- Render Logic ---
  const isLoading = isUserLoading || isBookingsLoading || isRequestsLoading;
  
  const ConfirmedTripWrapper = ({ booking }: { booking: Booking }) => {
    const tripRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'trips', booking.tripId);
    }, [firestore, booking.tripId]);
    const { data: trip } = useDoc<Trip>(tripRef);
    if (!trip) return <Skeleton className="h-48 w-full rounded-lg mb-4" />;
    return <HeroTicket trip={trip} booking={booking} onRateTrip={(t) => { setSelectedTripForClosure(t); setIsRatingDialogOpen(true); }} onCancelBooking={(t, b) => { setItemToCancel({trip: t, booking: b}); setIsCancellationDialogOpen(true); }} onMessageCarrier={() => openChat(booking, trip)} />;
  };

  const renderContent = () => {
    if (isLoading) return <div className="text-center py-10"><PackageOpen className="h-10 w-10 animate-pulse mx-auto"/></div>;
    if (activeTripRequest) return <OfferDecisionRoom trip={activeTripRequest} offers={offersForActiveTrip || []} onAcceptOffer={handleAcceptOffer} isProcessing={isProcessing || isLoadingOffers} onBack={() => setActiveTripRequest(null)} />;
    
    const hasPendingItems = pendingConfirmation.length > 0 || pendingPayment.length > 0 || (allRequests && allRequests.length > 0);
    const hasConfirmedItems = confirmed.length > 0;

    if (!hasPendingItems && !hasConfirmedItems) {
        return (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-primary/50 rounded-lg">
                <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
                <p className="font-bold">لا توجد حجوزات نشطة حالياً.</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">اذهب للوحة التحكم</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {hasPendingItems && (
                <div className="space-y-4">
                     {pendingPayment.map(b => <PendingPaymentCard key={b.id} booking={b} trip={null} onClick={() => { setSelectedBookingForPayment(b); setIsPaymentDialogOpen(true); }} />)}
                     {pendingConfirmation.map(b => <PendingConfirmationCard key={b.id} booking={b} trip={null} />)}
                     {allRequests?.map(t => (
                        <AwaitingOffersCard 
                            key={t.id} 
                            trip={t} 
                            offerCount={offersForActiveTrip?.length || 0} 
                            onClick={() => setActiveTripRequest(t)} 
                            matchingTripCount={t.id === mostRecentRequest?.id ? (matchingTrips?.length || 0) : 0} 
                            onWithdraw={() => handleWithdrawRequest(t)} 
                        />
                     ))}
                </div>
            )}
            {confirmed.map(b => <ConfirmedTripWrapper key={b.id} booking={b} />)}
        </div>
    );
  };

  return (
    <AppLayout>
      <div className="w-full p-4 space-y-6 pb-24">
        <Card className="bg-card border border-primary/50">
           <CardHeader><CardTitle>غرفة عمليات الحجز</CardTitle><CardDescription>تابع كل طلباتك وحجوزاتك النشطة.</CardDescription></CardHeader>
        </Card>
        {renderContent()}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-2 z-50 shadow-up">
        <div className="container max-w-md mx-auto flex justify-around items-center">
            <Button variant="ghost" className="flex flex-col gap-1 h-auto py-3 px-6" onClick={() => router.push('/dashboard')}><LayoutGrid className="h-6 w-6" /><span className="text-[10px] font-bold">الرئيسية</span></Button>
            <Button variant="ghost" className="flex flex-col gap-1 h-auto py-3 px-6" onClick={() => router.push('/chats')}><MessageSquare className="h-6 w-6" /><span className="text-[10px] font-bold">الدردشات</span></Button>
        </div>
      </div>

      {/* Dialogs */}
      <RateTripDialog isOpen={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen} trip={selectedTripForClosure} onConfirm={() => {}} />
      <CancellationDialog 
        isOpen={isCancellationDialogOpen} 
        onOpenChange={setIsCancellationDialogOpen} 
        isCancelling={isCancelling} 
        onConfirm={handleConfirmCancellation}
        trip={itemToCancel?.trip}
        booking={itemToCancel?.booking}
      />
      {selectedChatInfo && <ChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} bookingId={selectedChatInfo.id} otherPartyName={selectedChatInfo.title} otherPartyId={selectedChatInfo.otherPartyId} />}
      {tripForPayment && selectedBookingForPayment && <BookingPaymentDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} trip={tripForPayment} booking={selectedBookingForPayment} onConfirm={handleConfirmPayment} isProcessing={isConfirmingPayment} />}
    </AppLayout>
  );
}
