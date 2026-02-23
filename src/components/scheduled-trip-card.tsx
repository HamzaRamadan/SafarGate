'use client';

import type { UserProfile, Trip, Booking } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Flag, Ban, MessageSquare, Wallet, Star, Ticket, ChevronDown, Phone, Car, Image as ImageIcon, Building2, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TripCardBase } from '@/components/trip/trip-card-base';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useDoc, useFirestore } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CarrierTrustSheet } from './carrier/carrier-trust-sheet';
import { BookingSummarySheet } from '@/components/booking/booking-summary-sheet';
import { EmailConfirmDialog } from '@/components/booking/email-confirm-dialog';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function CarrierInfo({ trip }: { trip: Trip }) {
  const t = useTranslations('scheduledTripCard');
  const firestore = useFirestore();
  const [isTrustSheetOpen, setIsTrustSheetOpen] = useState(false);

  const carrierProfileRef = useMemo(() => {
    if (!firestore || !trip.carrierId) return null;
    return doc(firestore, 'users', trip.carrierId);
  }, [firestore, trip.carrierId]);

  const { data: liveCarrier } = useDoc<UserProfile>(carrierProfileRef);
  const carrier = liveCarrier;

  const handleOpenTrustSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrustSheetOpen(true);
  };

  return (
    <>
      <button onClick={handleOpenTrustSheet} className="flex items-center gap-3 w-full text-right hover:bg-muted/50 p-2 rounded-md transition-colors">
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src={carrier?.photoURL || "/default-avatar.png"} alt={carrier?.officeName || carrier?.firstName || "Carrier Avatar"} />
          <AvatarFallback>{carrier?.officeName?.[0] || carrier?.firstName?.[0] || "C"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-bold">{carrier?.officeName || carrier?.firstName || trip.carrierName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span>{carrier?.ratingStats?.average?.toFixed(1) || t('new')}</span>
            </div>
            <span>•</span>
            <span>{carrier?.ratingStats?.count || 0} {t('ratings')}</span>
          </div>
        </div>
      </button>
      <CarrierTrustSheet isOpen={isTrustSheetOpen} onClose={() => setIsTrustSheetOpen(false)} carrierId={carrier?.id || null} carrierName={carrier?.officeName || carrier?.firstName} carrierTier={carrier?.ratingStats?.tier} />
    </>
  );
}

function CarrierDetailsAccordion({ trip, depositLabel }: { trip: Trip; depositLabel: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();

  const carrierProfileRef = useMemo(() => {
    if (!firestore || !trip.carrierId) return null;
    return doc(firestore, 'users', trip.carrierId);
  }, [firestore, trip.carrierId]);

  const { data: carrier } = useDoc<UserProfile>(carrierProfileRef);

  return (
    <div className="border rounded-lg overflow-hidden text-xs">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/70 transition-colors">
        <div className="flex items-center gap-2 font-medium">
          <Car className="h-4 w-4 text-primary" />
          <span>تفاصيل الناقل</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 bg-background">

          {/* ✅ اسم الناقل ورقمه - يظهروا أول حاجة */}
          {(carrier?.firstName || carrier?.officeName) && (
            <div className="flex items-center gap-2 pb-2 ">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">الناقل:</span>
              <span className="font-semibold">
                {carrier?.firstName} {carrier?.lastName}
              </span>
            </div>
          )}
          {(carrier?.phoneNumber || carrier?.officePhone) && (
            <div className="flex items-center gap-2 pb-2 border-b border-dashed">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">الهاتف:</span>
              <a
                href={`tel:${carrier?.phoneNumber || carrier?.officePhone}`}
                className="font-semibold ltr text-blue-600 hover:underline"
                onClick={e => e.stopPropagation()}
              >
                {carrier?.phoneNumber || carrier?.officePhone}
              </a>
            </div>
          )}

          {/* باقي التفاصيل */}
          {carrier?.officeName && (
            <div className="flex items-center gap-2 pb-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">المكتب:</span>
              <span className="font-medium">{carrier.officeName}</span>
            </div>
          )}
          {carrier?.officePhone && carrier?.officePhone !== carrier?.phoneNumber && (
            <div className="flex items-center gap-2 pb-2 border-b border-dashed">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0 " />
              <span className="text-muted-foreground">هاتف المكتب:</span>
              <a
                href={`tel:${carrier.officePhone}`}
                className="font-medium ltr text-blue-600 hover:underline"
                onClick={e => e.stopPropagation()}
              >
                {carrier.officePhone}
              </a>
            </div>
          )}
          {(carrier?.vehicleType || carrier?.vehicleModel || carrier?.vehicleYear || carrier?.plateNumber) && (
            <div className="space-y-1.5">
              <p className="font-semibold text-muted-foreground flex items-center gap-1"><Car className="h-3.5 w-3.5" />المركبة</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pr-5">
                {carrier?.vehicleType && (<div className="flex gap-1"><span className="text-muted-foreground">النوع:</span><span className="font-medium">{carrier.vehicleType}</span></div>)}
                {carrier?.vehicleModel && (<div className="flex gap-1"><span className="text-muted-foreground">الموديل:</span><span className="font-medium">{carrier.vehicleModel}</span></div>)}
                {carrier?.vehicleYear && (<div className="flex gap-1"><span className="text-muted-foreground">السنة:</span><span className="font-medium">{carrier.vehicleYear}</span></div>)}
                {carrier?.plateNumber && (<div className="flex gap-1"><span className="text-muted-foreground">اللوحة:</span><span className="font-medium ltr">{carrier.plateNumber}</span></div>)}
                {carrier?.vehicleCapacity && (<div className="flex gap-1"><span className="text-muted-foreground">السعة:</span><span className="font-medium">{carrier.vehicleCapacity} مقعد</span></div>)}
              </div>
            </div>
          )}
          {carrier?.vehicleImageUrls && carrier.vehicleImageUrls.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-semibold text-muted-foreground flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" />صور المركبة</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {carrier.vehicleImageUrls.map((url, i) => (<img key={i} src={url} alt={`صورة المركبة ${i + 1}`} className="h-20 w-28 object-cover rounded-md shrink-0 border" />))}
              </div>
            </div>
          )}
          {!carrier?.firstName && !carrier?.officeName && !carrier?.phoneNumber && !carrier?.officePhone && !carrier?.vehicleType && !carrier?.vehicleImageUrls?.length && (
            <p className="text-center text-muted-foreground py-2">لا توجد تفاصيل إضافية</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ScheduledTripCard({
  trip, booking, onBookNow, onClosureAction, onCancelBooking, onMessageCarrier, context = 'dashboard'
}: {
  trip: Trip;
  booking?: Booking;
  onBookNow?: (trip: Trip) => void;
  onClosureAction?: (trip: Trip) => void;
  onCancelBooking?: (trip: Trip, booking: Booking) => void;
  onMessageCarrier?: (booking: Booking, trip: Trip) => void;
  context?: 'dashboard' | 'history'
}) {
  const t = useTranslations('scheduledTripCard');
  const firestore = useFirestore();
  const locale = useLocale();
  const { toast } = useToast();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleBookClick = () => {
    if (onBookNow) setIsBookingSheetOpen(true);
  };

  const handleSheetConfirm = () => {
    setIsBookingSheetOpen(false);
    setIsEmailDialogOpen(true);
  };

  const handleEmailConfirmed = async (email: string) => {
    if (!firestore) return;
    setIsSendingEmail(true);
    try {
      const tokenDoc = await addDoc(collection(firestore, 'booking_tokens'), {
        email,
        tripId: trip.id,
        carrierId: trip.carrierId,
        seatCount: 1,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const confirmUrl = `${origin}/${locale}/confirm-booking?token=${tokenDoc.id}`;

      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_uwp1oi3',
          template_id: 'template_gsa0ofn',
          user_id: 'v4uANy5gK0AVyX0by',
          template_params: {
            to_email: email,
            trip_origin: trip.origin || '--',
            trip_destination: trip.destination || '--',
            carrier_name: trip.carrierName || '--',
            ticket_price: `${trip.price} ${trip.currency}`,
            deposit_amount: `${((trip.price ?? 0) * ((trip.depositPercentage ?? 0) / 100)).toFixed(2)}`,
            total_due: `${trip.price} ${trip.currency}`,
            departure_time: trip.departureTime || '--',
            meeting_point: trip.meetingPoint || '--',
            stops: trip.numberOfStops ?? '--',
            bags: trip.bagsPerSeat ?? '--',
            conditions: trip.conditions || 'لا توجد شروط خاصة',
            confirm_url: confirmUrl,
          },
        }),
      });

      setConfirmedEmail(email);
      setIsEmailDialogOpen(false);

      if (onBookNow) await onBookNow(trip);

      toast({
        title: 'تم إرسال رسالة التحقق! ✉️',
        description: `تحقق من بريدك ${email} واضغط على "استكمال الحجز"`,
        duration: 8000,
      });
    } catch (error) {
      console.error('Email error:', error);
      toast({ variant: 'destructive', title: 'فشل إرسال الإيميل', description: 'تحقق من الإيميل وحاول مرة أخرى' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleConfirmBooking = handleSheetConfirm;

  const isMessageable = context === 'history' && booking?.status === 'Confirmed' && onMessageCarrier;
  const isBookable = context === 'dashboard' && onBookNow;
  const hasSeats = trip.availableSeats && trip.availableSeats > 0;

  return (
    <>
      <TripCardBase trip={trip} headerAction={isBookable ? <CarrierInfo trip={trip} /> : undefined}>
        {isBookable && (
          <>
            <CarrierDetailsAccordion trip={trip} depositLabel={`${t('deposit')}: ${trip.depositPercentage || 0}%`} />
            <Button size="lg" className="w-full font-bold mt-2" onClick={handleBookClick} disabled={!hasSeats || isSendingEmail}>
              {!hasSeats ? t('noSeats') : (
                <><Ticket className='ml-2 h-4 w-4' />{t('bookSeat')} ({trip.price} {trip.currency})</>
              )}
            </Button>
          </>
        )}

        {context === 'history' && (
          <>
            {onClosureAction && (
              <Button size="sm" variant="default" className="w-full bg-accent hover:bg-accent/90" onClick={() => onClosureAction(trip)}>
                <Flag className="ml-2 h-4 w-4" />{t('closure')}
              </Button>
            )}
            {onCancelBooking && booking && (
              <Button size="sm" variant="destructive" className="w-full" onClick={() => onCancelBooking(trip, booking)}>
                <Ban className="ml-2 h-4 w-4" />{t('cancel')}
              </Button>
            )}
            {isMessageable && (
              <Button size="sm" variant="outline" className="w-full" onClick={() => onMessageCarrier(booking!, trip)}>
                <MessageSquare className="ml-2 h-4 w-4" />{t('messageCarrier')}
              </Button>
            )}
          </>
        )}
      </TripCardBase>

      {isBookable && (
        <BookingSummarySheet
          isOpen={isBookingSheetOpen}
          onClose={() => setIsBookingSheetOpen(false)}
          onConfirm={handleConfirmBooking}
          trip={trip}
          confirmedEmail={confirmedEmail}
          countryCode="JO"
        />
      )}

      {isBookable && (
        <EmailConfirmDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          onConfirm={handleEmailConfirmed}
          trip={trip}
        />
      )}
    </>
  );
}