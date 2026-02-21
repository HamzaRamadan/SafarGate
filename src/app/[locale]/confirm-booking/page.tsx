// import { Suspense } from 'react';
// import ConfirmBookingClient from './confirm-booking-client';
// import { Loader2 } from 'lucide-react';

// export default function ConfirmBookingPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center space-y-4">
//           <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
//           <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
//         </div>
//       </div>
//     }>
//       <ConfirmBookingClient />
//     </Suspense>
//   );
// }




'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingDialog } from '@/components/booking-dialog';
import type { Trip, PassengerDetails } from '@/lib/data';
import { useLocale } from 'next-intl';
import { addDocumentNonBlocking } from '@/firebase';

type Status = 'loading' | 'ready' | 'confirming' | 'success' | 'error' | 'expired';

export default function ConfirmBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const locale = useLocale();

  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>('loading');
  const [tokenData, setTokenData] = useState<any>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token || !firestore) return;

    const verifyToken = async () => {
      try {
        const tokenRef = doc(firestore, 'booking_tokens', token);
        const tokenSnap = await getDoc(tokenRef);

        if (!tokenSnap.exists()) {
          setStatus('error');
          setErrorMsg('الرابط غير صحيح أو منتهي الصلاحية');
          return;
        }

        const data = tokenSnap.data();

        if (data.status === 'used') {
          setStatus('error');
          setErrorMsg('تم استخدام هذا الرابط من قبل');
          return;
        }

        const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        if (new Date() > expiresAt) {
          setStatus('expired');
          return;
        }

        const tripRef = doc(firestore, 'trips', data.tripId);
        const tripSnap = await getDoc(tripRef);

        if (!tripSnap.exists()) {
          setStatus('error');
          setErrorMsg('الرحلة غير موجودة');
          return;
        }

        setTokenData(data);
        setTrip({ id: tripSnap.id, ...tripSnap.data() } as Trip);
        setStatus('ready');

        // ✅ افتح BookingDialog عشان يملأ بيانات الركاب
        setIsDialogOpen(true);
      } catch (err) {
        console.error(err);
        setStatus('error');
        setErrorMsg('حدث خطأ، حاول مرة أخرى');
      }
    };

    verifyToken();
  }, [token, firestore]);

  // ✅ الزرار "تأكيد الحجز" في BookingDialog → بيبعت الطلب للناقل
  const handleConfirmBooking = async (passengers: PassengerDetails[]) => {
    if (!firestore || !tokenData || !trip || !token) throw new Error('Missing data');

    setStatus('confirming');
    try {
      await addDocumentNonBlocking(collection(firestore, 'bookings'), {
        tripId: trip.id,
        userId: user?.uid || 'anonymous',
        carrierId: trip.carrierId,
        seats: passengers.length,
        passengersDetails: passengers,
        status: 'Pending-Carrier-Confirmation',
        totalPrice: (trip.price || 0) * passengers.length,
        currency: trip.currency,
        verifiedEmail: tokenData.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(firestore, 'booking_tokens', token), {
        status: 'used',
        usedAt: serverTimestamp(),
      });

      setIsDialogOpen(false);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('فشل تأكيد الحجز، حاول مرة أخرى');
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      
      {/* Loading */}
      {status === 'loading' && (
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
        </div>
      )}

      {/* Ready / Confirming */}
      {(status === 'ready' || status === 'confirming') && trip && (
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل تفاصيل الحجز...</p>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="text-center space-y-6 max-w-md">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">تم تأكيد الحجز بنجاح! 🎉</h1>
          <p className="text-muted-foreground">
            تم إرسال طلبك للناقل وسيتم التواصل معك قريباً
          </p>
          <Button className="w-full" onClick={() => router.push(`/${locale}/history`)}>
            عرض حجوزاتي
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}/dashboard`)}>
            العودة للرئيسية
          </Button>
        </div>
      )}

      {/* Expired */}
      {status === 'expired' && (
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="h-20 w-20 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold">انتهت صلاحية الرابط</h1>
          <p className="text-muted-foreground">الرابط صالح لمدة 30 دقيقة فقط. ارجع وأعد الحجز مرة أخرى.</p>
          <Button className="w-full" onClick={() => router.push(`/${locale}/dashboard`)}>
            العودة للرئيسية
          </Button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center space-y-6 max-w-md">
          <XCircle className="h-20 w-20 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">حدث خطأ</h1>
          <p className="text-muted-foreground">{errorMsg}</p>
          <Button className="w-full" onClick={() => router.push(`/${locale}/dashboard`)}>
            العودة للرئيسية
          </Button>
        </div>
      )}

      {/* ✅ BookingDialog يظهر بس هنا — المستخدم يملأ بياناته ويضغط "تأكيد الحجز" */}
      {trip && isDialogOpen && (
        <BookingDialog
          isOpen={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open && status === 'ready') router.push(`/${locale}/dashboard`);
          }}
          trip={trip}
          seatCount={tokenData?.seatCount || 1}
          onSubmit={handleConfirmBooking}
          isProcessing={status === 'confirming'}
        />
      )}
    </div>
  );
}