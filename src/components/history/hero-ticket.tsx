'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc } from '@/firebase';
import { UserCheck, MapPin, CreditCard, MessageSquare, Flag, Ban, Link as LinkIcon, AlertTriangle, Info, ArrowRightLeft, Share2, QrCode } from 'lucide-react';
import type { Trip, Booking, UserProfile } from '@/lib/data';
import { getCityName } from '@/lib/constants';
import { formatDate } from '@/lib/formatters';
import { doc } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { isFuture, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { QRDialog } from './qr-dialog';
import { useLocale } from 'next-intl';

interface HeroTicketProps {
    trip: Trip;
    booking: Booking;
    onRateTrip: (trip: Trip) => void;
    onCancelBooking: (trip: Trip, booking: Booking) => void;
    onMessageCarrier: () => void;
}

type TicketState = 'scheduled' | 'active' | 'archived';

export const HeroTicket = ({ trip, booking, onRateTrip, onCancelBooking, onMessageCarrier }: HeroTicketProps) => {
    const firestore = useFirestore();
    const locale = useLocale();
    const [ticketState, setTicketState] = useState<TicketState>('scheduled');
    const [isQROpen, setIsQROpen] = useState(false);
    
    const carrierProfileRef = useMemo(() => {
        if (!firestore || !trip.carrierId) return null;
        return doc(firestore, 'users', trip.carrierId);
    }, [firestore, trip.carrierId]);
    
    const { data: liveCarrier, isLoading } = useDoc<UserProfile>(carrierProfileRef);

    useEffect(() => {
        const checkStatus = () => {
            const departureDate = new Date(trip.departureDate);
            if (booking.status === 'Completed' || booking.status === 'Cancelled' || trip.status === 'Completed' || trip.status === 'Cancelled') {
                setTicketState('archived');
            } 
            else if (isPast(departureDate)) {
                setTicketState('active');
            } 
            else {
                setTicketState('scheduled');
            }
        };

        checkStatus();
        
        const departureDate = new Date(trip.departureDate);
        if (isFuture(departureDate)) {
            const msUntilDeparture = departureDate.getTime() - Date.now();
            if (msUntilDeparture < 86400000) { 
                const timer = setTimeout(() => {
                    setTicketState('active');
                }, msUntilDeparture);
                return () => clearTimeout(timer);
            }
        }

    }, [trip.departureDate, trip.status, booking.status]);

    const displayCarrierName = liveCarrier?.firstName || trip.carrierName;
    const isTransferred = trip.transferStatus === 'Transferred';
    const depositAmount = (booking.totalPrice * ((trip.depositPercentage || 20) / 100));
    const remainingAmount = booking.totalPrice - depositAmount;

    const stateStyles = {
        scheduled: {
            card: "border-primary",
            header: "from-blue-600 to-blue-800",
            badge: "bg-primary",
            badgeText: "تذكرة مؤكدة"
        },
        active: {
            card: "border-green-500 animate-pulse ring-1 ring-green-500/50",
            header: "from-green-600 to-green-800",
            badge: "bg-green-500 animate-pulse",
            badgeText: "الرحلة جارية الآن 🚌"
        },
        archived: {
            card: "border-muted-foreground/30 grayscale opacity-90",
            header: "from-slate-700 to-slate-900",
            badge: "bg-muted-foreground",
            badgeText: booking.status === 'Cancelled' ? 'ملغاة' : 'مكتملة'
        }
    };
    
    const currentStyle = stateStyles[ticketState];

    const cancellationDisplay = useMemo(() => {
        if (booking.status !== 'Cancelled') return null;
        if (trip.cancellationReason?.includes('System Auto-Expiry')) {
            return { title: "إلغاء آلي", description: "تم إلغاء الرحلة تلقائياً لانتهاء وقتها الافتراضي.", variant: 'default' as const };
        }
        if (booking.cancelledBy === 'carrier') {
            return { title: "إلغاء من الناقل", description: "نعتذر، لقد قام الناقل بإلغاء الحجز بشكل اضطراري.", variant: 'destructive' as const};
        }
        return { title: "إلغاء من المسافر", description: "تم إلغاء الحجز من طرفك.", variant: 'default' as const };
    }, [booking, trip]);

    return (
        <>
            <Card className={cn("bg-gradient-to-br shadow-lg mb-6 transition-all duration-700 relative", currentStyle.card)}>
                <div className="absolute top-4 left-4 z-10">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-10 w-10 bg-white/10 hover:bg-white/30 border-white/20 text-white backdrop-blur-md shadow-sm transition-transform hover:scale-105"
                        onClick={() => setIsQROpen(true)}
                    >
                        <QrCode className="h-5 w-5" />
                    </Button>
                </div>
                <CardHeader className={cn("text-white transition-colors duration-700", currentStyle.header)}>
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant="default" className={cn("w-fit mb-2 transition-colors duration-500 shadow-sm border-0", currentStyle.badge)}>{currentStyle.badgeText}</Badge>
                            <CardTitle className="pt-1 text-xl">{getCityName(trip.origin, locale)} <span className="text-white/70 mx-1">◄</span> {getCityName(trip.destination, locale)}</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm pt-4">
                    {isTransferred && (
                        <div className="p-2 text-xs bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <ArrowRightLeft className="h-4 w-4" />
                            <span>تنبيه: تم نقل هذه الرحلة إلى كابتن جديد.</span>
                        </div>
                    )}
                    {cancellationDisplay && (
                        <div className="p-2 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>{cancellationDisplay.description}</span>
                        </div>
                    )}

                    <div className="p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20 space-y-2 shadow-sm">
                        <p className="font-bold text-xs flex items-center gap-1 text-muted-foreground"><UserCheck className="h-4 w-4 text-primary"/> بيانات الناقل</p>
                        {isLoading ? <Skeleton className="h-8 w-full" /> : (
                            <>
                            <div className="flex justify-between items-center text-xs"><span>اسم الناقل:</span><span className="font-bold text-base">{displayCarrierName}</span></div>
                            <div className="flex justify-between items-center text-xs"><span>رقم الهاتف:</span>{liveCarrier?.phoneNumber ? <a href={`tel:${liveCarrier.phoneNumber}`} className="font-bold hover:underline dir-ltr">{liveCarrier.phoneNumber}</a> : <span className="font-bold">غير متوفر</span>}</div>
                            </>
                        )}
                    </div>
                    
                    <div className="p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20 space-y-2 shadow-sm">
                        <p className="font-bold text-xs flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4 text-primary"/> نقطة وتوقيت الانطلاق</p>
                        <div className="text-xs space-y-1">
                            <div className="flex justify-between"><span>التاريخ:</span> <span className="font-bold">{formatDate(trip.departureDate, 'd MMM yyyy', locale)}</span></div>
                            <div className="flex justify-between"><span>الوقت:</span> <span className="font-bold">{formatDate(trip.departureDate, 'h:mm a', locale)}</span></div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-primary/20"><span>المكان:</span> <span className="font-bold">{trip.meetingPoint}</span></div>
                        </div>
                        {trip.meetingPointLink && <a href={trip.meetingPointLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium text-xs flex items-center gap-1 hover:underline mt-1"><LinkIcon className="h-3 w-3" /> عرض على الخريطة</a>}
                    </div>

                    <div className="p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-primary/20 space-y-2 shadow-sm">
                        <p className="font-bold text-xs flex items-center gap-1 text-muted-foreground"><CreditCard className="h-4 w-4 text-primary"/> التفاصيل المالية</p>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span>السعر الإجمالي:</span> <span className="font-bold">{booking.totalPrice.toFixed(2)} {booking.currency}</span></div>
                            <div className="flex justify-between"><span>العربون المدفوع:</span> <span className="font-bold text-green-600">{depositAmount.toFixed(2)} {booking.currency}</span></div>
                            <div className="flex justify-between border-t border-dashed border-primary/20 mt-2 pt-2"><span>المبلغ المتبقي (للكابتن):</span> <span className="font-bold text-base">{remainingAmount.toFixed(2)} {booking.currency}</span></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="grid grid-cols-1 gap-3 pt-2">
                    {ticketState === 'scheduled' && onCancelBooking && (
                        <Button variant="destructive" className="w-full" onClick={() => onCancelBooking(trip, booking)}>
                            <Ban className="ml-2 h-4 w-4" /> إلغاء الحجز
                        </Button>
                    )}

                    {ticketState === 'active' && (
                        <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700">
                            <Share2 className="ml-2 h-4 w-4" /> مشاركة موقعي (أمان)
                        </Button>
                    )}

                    {ticketState === 'archived' && booking.status === 'Completed' && onRateTrip && (
                        <Button variant="secondary" className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800" onClick={() => onRateTrip(trip)}>
                            <Flag className="ml-2 h-4 w-4" /> تقييم الرحلة
                        </Button>
                    )}

                    {ticketState !== 'archived' && (
                        <Button variant="outline" className="w-full" onClick={onMessageCarrier}>
                            <MessageSquare className="ml-2 h-4 w-4" /> دردشة الرحلة
                        </Button>
                    )}
                </CardFooter>
            </Card>
            <QRDialog 
                isOpen={isQROpen} 
                onOpenChange={setIsQROpen}
                data={{
                    tripId: trip.id,
                    bookingId: booking.id,
                    passengerName: booking.passengersDetails?.[0]?.name || 'مسافر',
                    seats: booking.seats,
                    pickup: trip.meetingPoint || getCityName(trip.origin, locale)
                }}
            />
        </>
    );
};