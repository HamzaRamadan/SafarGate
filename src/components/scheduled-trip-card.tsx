'use client';

import type { UserProfile, Trip, Booking } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Flag, Ban, MessageSquare, ShieldCheck, Wallet, Star, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TripCardBase } from '@/components/trip/trip-card-base';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { CarrierTrustSheet } from './carrier/carrier-trust-sheet';
import { BookingSummarySheet } from '@/components/booking/booking-summary-sheet';
import { getCityName } from '@/lib/constants';

// Carrier Info Display Component (Extracted for cleanliness and reusability)
function CarrierInfo({ trip }: { trip: Trip }) {
    const firestore = useFirestore();
    const [isTrustSheetOpen, setIsTrustSheetOpen] = useState(false);

    // Protocol 88: Efficient fetch only when needed
    const carrierProfileRef = useMemo(() => {
        if (!firestore || !trip.carrierId) return null;
        return doc(firestore, 'users', trip.carrierId);
    }, [firestore, trip.carrierId]);
    
    const { data: liveCarrier } = useDoc<UserProfile>(carrierProfileRef);
    const carrier = liveCarrier; 

    const handleOpenTrustSheet = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card expansion
        setIsTrustSheetOpen(true);
    };

    return (
        <>
            <button 
                onClick={handleOpenTrustSheet}
                className="flex items-center gap-3 w-full text-right hover:bg-muted/50 p-2 rounded-md transition-colors"
            >
                <Avatar className="h-10 w-10 border-2 border-background">
  <AvatarImage 
    src={carrier?.photoURL || "/default-avatar.png"} 
    alt={carrier?.firstName || "Carrier Avatar"} 
  />
  <AvatarFallback>
    {carrier?.firstName?.[0] || "C"}
  </AvatarFallback>
</Avatar>

                <div className="flex-1">
                    <p className="text-sm font-bold">{carrier?.firstName || trip.carrierName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{carrier?.ratingStats?.average?.toFixed(1) || 'جديد'}</span>
                        </div>
                        <span>•</span>
                        <span>{carrier?.ratingStats?.count || 0} تقييم</span>
                    </div>
                </div>
            </button>
            
            {/* Trust Sheet Injection */}
            <CarrierTrustSheet 
                isOpen={isTrustSheetOpen} 
                onClose={() => setIsTrustSheetOpen(false)} 
                carrierId={carrier?.id || null} 
                carrierName={carrier?.firstName}
                carrierTier={carrier?.ratingStats?.tier}
            />
        </>
    );
}

export function ScheduledTripCard({ 
    trip,
    booking,
    onBookNow, 
    onClosureAction,
    onCancelBooking,
    onMessageCarrier,
    context = 'dashboard' 
}: { 
    trip: Trip; 
    booking?: Booking;
    onBookNow?: (trip: Trip) => void; 
    onClosureAction?: (trip: Trip) => void;
    onCancelBooking?: (trip: Trip, booking: Booking) => void;
    onMessageCarrier?: (booking: Booking, trip: Trip) => void;
    context?: 'dashboard' | 'history' 
}) {
  // [SC-189] State to control the Zero Invoice Sheet
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);

  // [SC-189] Intercept the booking action
  const handleBookClick = () => {
    if (onBookNow) {
        setIsBookingSheetOpen(true);
    }
  };

  // [SC-189] Execute the actual booking after invoice confirmation
  const handleConfirmBooking = async () => {
    if (onBookNow) {
        await onBookNow(trip);
    }
    setIsBookingSheetOpen(false);
  };
  
  const isMessageable = context === 'history' && booking?.status === 'Confirmed' && onMessageCarrier;
  const isBookable = context === 'dashboard' && onBookNow;
  const hasSeats = trip.availableSeats && trip.availableSeats > 0;

  return (
    <>
      <TripCardBase 
          trip={trip} 
          headerAction={ isBookable ? <CarrierInfo trip={trip} /> : undefined }
      >
        {/* Dashboard Actions */}
        {isBookable && (
          <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button size="sm" variant="outline" className="w-full h-auto py-2 flex-col gap-1">
                      <Wallet className="h-4 w-4" />
                      العربون: {trip.depositPercentage || 0}%
                  </Button>
                  <Button size="sm" variant="outline" className="w-full h-auto py-2 flex-col gap-1">
                      <ShieldCheck className="h-4 w-4" />
                      الشروط
                  </Button>
              </div>
              <Button size="lg" className="w-full font-bold mt-2" onClick={handleBookClick} disabled={!hasSeats}>
                  {!hasSeats ? 'لا توجد مقاعد متاحة' : (
                      <>
                          <Ticket className='ml-2 h-4 w-4' />
                          حجز مقعد ({trip.price} {trip.currency})
                      </>
                  )}
              </Button>
          </>
        )}

        {/* History Actions */}
        {context === 'history' && (
            <>
              {onClosureAction && (
                  <Button size="sm" variant="default" className="w-full bg-accent hover:bg-accent/90" onClick={() => onClosureAction(trip)}>
                      <Flag className="ml-2 h-4 w-4"/>
                      إجراءات إغلاق الرحلة
                  </Button>
              )}
              {onCancelBooking && booking && (
                  <Button size="sm" variant="destructive" className="w-full" onClick={() => onCancelBooking(trip, booking)}>
                      <Ban className="ml-2 h-4 w-4" />
                      إلغاء الحجز
                  </Button>
              )}
              {isMessageable && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => onMessageCarrier(booking!, trip)}>
                      <MessageSquare className="ml-2 h-4 w-4" />
                      مراسلة الناقل
                  </Button>
              )}
            </>
        )}
      </TripCardBase>
      
      {/* [SC-189] The Zero Invoice Sheet Injection */}
      {isBookable && isBookingSheetOpen && (
        <BookingSummarySheet
            isOpen={isBookingSheetOpen}
            onClose={() => setIsBookingSheetOpen(false)}
            onConfirm={handleConfirmBooking}
            tripDetails={{
                origin: getCityName(trip.origin),
                destination: getCityName(trip.destination),
                carrierName: trip.carrierName || 'الناقل'
            }}
            countryCode="JO" // Default to JO for now, scalable later
        />
      )}
    </>
  );
}
