'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Hourglass, Radar, AlertTriangle, RefreshCcw, XCircle } from 'lucide-react';
import type { Trip, Booking } from '@/lib/data';
import { getCityName } from '@/lib/constants';
import { Button } from '@/components/ui/button';

// بطاقة انتظار الدفع (Pending Payment)
export const PendingPaymentCard = ({ booking, trip, onClick }: { booking: Booking, trip?: Trip | null, onClick: () => void }) => (
    <Card className="border-orange-500 border-2 bg-orange-500/5 cursor-pointer hover:bg-orange-500/10 mb-4" onClick={onClick}>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{trip ? `${getCityName(trip.origin)} - ${getCityName(trip.destination)}` : 'جاري التحميل...'}</CardTitle>
                    <CardDescription>مع الناقل: {trip?.carrierName || '...'}</CardDescription>
                </div>
                 <Badge variant="outline" className="flex items-center gap-2 bg-orange-100 text-orange-800 border-orange-300">
                    <CreditCard className="h-4 w-4 animate-pulse" />
                    بانتظار دفع العربون
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <p className="font-bold text-center text-orange-600">
                وافق الناقل على طلبك. اضغط هنا لإتمام عملية الدفع وتأكيد حجزك.
            </p>
        </CardContent>
    </Card>
);

// بطاقة انتظار الموافقة (Pending Confirmation)
export const PendingConfirmationCard = ({ booking, trip }: { booking: Booking, trip?: Trip | null }) => (
    <Card className="border-primary border-2 bg-primary/5 mb-4">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{trip ? `${getCityName(trip.origin)} - ${getCityName(trip.destination)}` : 'جاري التحميل...'}</CardTitle>
                    <CardDescription>مع الناقل: {trip?.carrierName || '...'}</CardDescription>
                </div>
                 <Badge variant="outline" className="flex items-center gap-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                    <Hourglass className="h-4 w-4 animate-spin" />
                    بانتظار موافقة الناقل
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-sm space-y-1">
                <p><strong>عدد المقاعد:</strong> {booking.seats}</p>
                <p><strong>السعر الإجمالي:</strong> {booking.totalPrice.toFixed(2)} {booking.currency}</p>
            </div>
        </CardContent>
    </Card>
);

// بطاقة انتظار العروض (Awaiting Offers) - [SC-164 & SC-165 Enhanced]
export const AwaitingOffersCard = ({ trip, offerCount, matchingTripCount, onClick, onWithdraw }: { trip: Trip, offerCount: number, matchingTripCount?: number, onClick: () => void, onWithdraw?: () => void }) => {
    const router = useRouter();

    // [SC-164] Smart Mirror Logic: Calculate Stagnation Locally
    const isStagnant = useMemo(() => {
        if (!trip.createdAt || offerCount > 0) return false;
        
        const createdTime = trip.createdAt.seconds ? trip.createdAt.seconds * 1000 : new Date(trip.createdAt).getTime();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        return createdTime < oneHourAgo;
    }, [trip.createdAt, offerCount]);

    return (
        <Card className="border-primary border-2 bg-primary/5 transition-colors mb-4 overflow-hidden">
            {/* [SC-165] Smart Link: Reverse Radar Notification */}
            {matchingTripCount && matchingTripCount > 0 && (
                <div onClick={onClick} className="bg-green-100 dark:bg-green-900/30 p-2 text-center text-xs font-bold text-green-700 dark:text-green-300 border-b border-green-200 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                    🚀 وجدنا {matchingTripCount} رحلة مجدولة تطابق طلبك! اضغط هنا للحجز فوراً.
                </div>
            )}
            
            <div className="cursor-pointer hover:bg-primary/10 transition-colors" onClick={onClick}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">{getCityName(trip.origin)} - {getCityName(trip.destination)}</CardTitle>
                            <CardDescription>طلبك منشور في السوق الآن</CardDescription>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-2 bg-blue-100 text-blue-800 border-blue-300">
                            <Radar className="h-4 w-4 animate-pulse" />
                            بانتظار العروض
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pb-4">
                    <p className="font-bold text-center text-primary">
                        {offerCount > 0 ? `تم استلام ${offerCount} عرض. اضغط للاستعراض.` : "سيتم إعلامك فور وصول عروض جديدة."}
                    </p>
                </CardContent>
            </div>
            
            {/* [SC-164] Stagnation Warning */}
            {isStagnant && (
                <div className="p-4 border-t border-primary/10">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg animate-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">الطلب متأخر قليلاً</h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                    مرت ساعة ولم تصلك عروض. قد يكون السعر منخفضاً أو لا توجد مركبات متاحة.
                                </p>
                                
                                <div className="flex gap-2 mt-3">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-xs bg-white dark:bg-black border-amber-300 hover:bg-amber-100 text-amber-900"
                                        onClick={() => router.push(`/dashboard?origin=${trip.origin}&dest=${trip.destination}`)}
                                    >
                                        <RefreshCcw className="h-3 w-3 mr-1" />
                                        بحث في المجدول
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* [SC-165] Disengagement Button (Escape Hatch) */}
            {onWithdraw && (
                <CardFooter className="p-0 border-t">
                     <Button 
                        variant="ghost" 
                        className="w-full h-10 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-t-none transition-colors"
                        onClick={(e) => {
                            e.stopPropagation(); // منع فتح تفاصيل البطاقة عند الضغط
                            onWithdraw();
                        }}
                    >
                        <XCircle className="ml-2 h-3 w-3" />
                        سحب الطلب من السوق
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};
