// // 'use client';

// // import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
// // import { Button } from "@/components/ui/button";
// // import { Separator } from "@/components/ui/separator";
// // import { Badge } from "@/components/ui/badge";
// // import { Loader2, Receipt, ShieldCheck, Ticket } from "lucide-react";
// // import { useCountryPricing } from "@/hooks/use-country-pricing";
// // import type { Trip } from '@/lib/data';

// // interface BookingSummaryProps {
// //   isOpen: boolean;
// //   onClose: () => void;
// //   onConfirm: () => void;
// //   tripDetails: {
// //     origin: string;
// //     destination: string;
// //     carrierName: string;
// //   };
// //     trip: Trip; 
// //   confirmedEmail: string;   

// //   countryCode?: string; // Default 'JO'
// // }

// // export function BookingSummarySheet({ isOpen, onClose, onConfirm, tripDetails, countryCode = 'JO' }: BookingSummaryProps) {
// //   // استخدام المجس الذكي لجلب الأسعار الحية
// //   const { rule, loading } = useCountryPricing(countryCode);

// //   const calculateTotal = () => {
// //     if (!rule) return 0;
// //     const total = rule.travelerBookingFee - rule.travelerDiscount;
// //     return total > 0 ? total : 0;
// //   };

// //   return (
// //     <Sheet open={isOpen} onOpenChange={onClose}>
// //       <SheetContent side="bottom" className="rounded-t-xl px-6 pb-8 pt-4 h-auto max-h-[90vh]">
// //         <div className="mx-auto w-12 h-1.5 bg-gray-200 rounded-full mb-6" />
        
// //         <SheetHeader className="text-right mb-6">
// //           <SheetTitle className="flex items-center gap-2 text-xl">
// //             <Receipt className="w-5 h-5 text-blue-600" />
// //             ملخص الحجز المالي
// //           </SheetTitle>
// //           <SheetDescription>
// //             يرجى مراجعة تفاصيل الفاتورة قبل تأكيد المقعد.
// //           </SheetDescription>
// //         </SheetHeader>

// //         {loading ? (
// //           <div className="flex justify-center py-12">
// //             <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
// //           </div>
// //         ) : rule ? (
// //           <div className="space-y-6">
// //             {/* تفاصيل الرحلة */}
// //             <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
// //                 <div className="flex justify-between text-sm">
// //                     <span className="text-gray-500">الرحلة:</span>
// //                     <span className="font-semibold">{tripDetails.origin} ⬅ {tripDetails.destination}</span>
// //                 </div>
// //                 <div className="flex justify-between text-sm">
// //                     <span className="text-gray-500">الناقل:</span>
// //                     <span className="font-medium">{tripDetails.carrierName}</span>
// //                 </div>
// //             </div>

// //             {/* الفاتورة الصفرية - The Zero Invoice Logic */}
// //             <div className="space-y-3">
// //                 <div className="flex justify-between items-center font-extrabold text-white">
// //                     <span>رسوم خدمة المنصة</span>
// //                     <span className="font-mono line-through decorations-red-500 decoration-2">
// //                         {rule.travelerBookingFee.toFixed(2)} {rule.currency}
// //                     </span>
// //                 </div>
                
// //                 <div className="flex justify-between items-center text-green-800 font-bold bg-green-50 p-2 rounded">
// //                     <span className="flex items-center gap-1"><Ticket className="w-4 h-4" /> خصم الفترة الترويجية</span>
// //                     <span className="font-mono">
// //                         -{rule.travelerDiscount.toFixed(2)} {rule.currency}
// //                     </span>
// //                 </div>

// //                 <Separator className="my-2" />

// //                 <div className="flex justify-between items-center text-lg font-bold text-gray-900">
// //                     <span>المطلوب دفعه الآن</span>
// //                     <span className="font-mono text-2xl">
// //                         {calculateTotal().toFixed(2)} <span className="text-sm">{rule.currency}</span>
// //                     </span>
// //                 </div>
// //             </div>

// //             {/* رسالة الطمأنة */}
// //             <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-md text-xs text-blue-700">
// //                 <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
// //                 <p>
// //                     نحن في فترة الإطلاق التجريبي. لقد تحملت إدارة "سفريات" كافة الرسوم عنك. استمتع برحلتك!
// //                 </p>
// //             </div>

// //             <SheetFooter className="mt-4">
// //                 <Button onClick={onConfirm} className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg">
// //                     تأكيد الحجز المجاني ✅
// //                 </Button>
// //             </SheetFooter>
// //           </div>
// //         ) : (
// //             <div className="text-center text-red-500">خطأ في تحميل بيانات التسعير</div>
// //         )}
// //       </SheetContent>
// //     </Sheet>
// //   );
// // }



// 'use client';

// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Loader2, Receipt, Send, Ticket } from "lucide-react";
// import { useCountryPricing } from "@/hooks/use-country-pricing";
// import { Trip } from "@/lib/data";
// import { useTranslations } from "next-intl";
// import { useState } from "react";
// import { useToast } from "@/hooks/use-toast";

// interface BookingSummaryProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
//   trip?: Trip;
//   countryCode?: string;
//   confirmedEmail?: string;
// }

// // ✅ دالة إرسال الإيميل عن طريق EmailJS
// async function sendBookingEmail({
//   email,
//   trip,
//   depositAmt,
//   totalDue,
//   currency,
// }: {
//   email: string;
//   trip: Trip;
//   depositAmt: number;
//   totalDue: number;
//   currency: string;
// }) {
//   // ⚠️ ضع بيانات EmailJS الخاصة بك هنا
//   const SERVICE_ID = 'service_uwp1oi3';
//   const TEMPLATE_ID = 'template_gsa0ofn';
//   const PUBLIC_KEY = 'v4uANy5gK0AVyX0by';

//   const templateParams = {
//     to_email: email,
//     trip_origin: trip.origin || '--',
//     trip_destination: trip.destination || '--',
//     carrier_name: trip.carrierName || '--',
//     ticket_price: `${trip.price} ${trip.currency}`,
//     deposit_amount: `${depositAmt.toFixed(2)} ${currency}`,
//     total_due: `${totalDue.toFixed(2)} ${currency}`,
//     departure_time: trip.departureTime || '--',
//     meeting_point: trip.meetingPoint || '--',
//     stops: trip.numberOfStops ?? '--',
//     bags: trip.bagsPerSeat ?? '--',
//     conditions: trip.conditions || 'لا توجد شروط خاصة',
//   };

//   const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       service_id: SERVICE_ID,
//       template_id: TEMPLATE_ID,
//       user_id: PUBLIC_KEY,
//       template_params: templateParams,
//     }),
//   });

//   if (!res.ok) throw new Error('Email send failed');
// }

 
// export function BookingSummarySheet({
//   isOpen,
//   onClose,
//   onConfirm,
//   trip,
//   countryCode = 'JO',
//   confirmedEmail = '',
// }: BookingSummaryProps) {

//   const t = useTranslations('booking');
//   const { toast } = useToast();
//   const { rule, loading } = useCountryPricing(countryCode);
//   const [isConfirming, setIsConfirming] = useState(false);

//   const platformFee = rule?.travelerBookingFee ?? 0;
//   const depositAmt = parseFloat(((trip?.price ?? 0) * ((trip?.depositPercentage ?? 0) / 100)).toFixed(2));
//   const totalDue = parseFloat((depositAmt + platformFee).toFixed(2));
//   const currency = rule?.currency ?? 'JOD';

//   const handleConfirm = async () => {
//     setIsConfirming(true);
//     try {
//       // ✅ ابعت الإيميل لو في إيميل مؤكد
//       if (confirmedEmail && trip) {
//         await sendBookingEmail({ email: confirmedEmail, trip, depositAmt, totalDue, currency });
//         toast({
//           title: '✅ تم إرسال تفاصيل الرحلة',
//           description: `تم إرسال رسالة تأكيد إلى ${confirmedEmail}`,
//         });
//       }
//       await onConfirm();
//     } catch (error) {
//       console.error('Email error:', error);
//       // حتى لو فشل الإيميل، نكمل الحجز
//       toast({
//         title: 'تنبيه',
//         description: 'تم تأكيد الحجز ولكن فشل إرسال الإيميل',
//         variant: 'destructive',
//       });
//       await onConfirm();
//     } finally {
//       setIsConfirming(false);
//     }
//   };

//   function calculateTotal() {
//     throw new Error("Function not implemented.");
//   }

//   return (
//     <Sheet open={isOpen} onOpenChange={onClose}>
//       <SheetContent side="bottom" className="rounded-t-xl px-6 pb-8 pt-4 h-auto max-h-[90vh]">

//         <SheetHeader className="text-right mb-6">
//           <SheetTitle className="flex items-center gap-2 text-xl">
//             <Receipt className="w-5 h-5 text-blue-600" />
//             {t('title')}
//           </SheetTitle>
//           <SheetDescription>
//             {t('description')}
//             {confirmedEmail && (
//               <span className="block mt-1 text-xs text-green-600">
//                 📧 سيتم إرسال التفاصيل إلى: <span className="font-medium ltr">{confirmedEmail}</span>
//               </span>
//             )}
//           </SheetDescription>
//         </SheetHeader>

//         {loading ? (
//           <div className="flex justify-center py-12">
//             <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
//           </div>
//         ) : rule ? (
//           <div className="space-y-6">

//             {/* تفاصيل الرحلة */}
//             <div className="bg-gray-900 p-4 rounded-lg border space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span>{t('route')}</span>
//                 <span className="font-semibold">{trip?.origin || '--'} ⬅ {trip?.destination || '--'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>{t('carrier')}</span>
//                 <span>{trip?.carrierName || '--'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>{t('ticketPrice')}</span>
//                 <span className="font-semibold">{trip?.price ?? '--'} {trip?.currency || ''}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>{t('duration')}</span>
//                 <span>{trip?.estimatedDurationHours ? `${trip.estimatedDurationHours} ${t('hours')}` : t('notSpecified')}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>{t('stops')}</span>
//                 <span>{trip?.numberOfStops ?? '--'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>{t('meetingPoint')}</span>
//                 <span>{trip?.meetingPoint || '--'}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>{t('availableSeats')}</span>
//                 <span>{trip?.availableSeats ?? '--'}</span>
//               </div>
              
//             </div>

//             {/* الفاتورة */}
          
// <div className="space-y-3">
//                 <div className="flex justify-between items-center font-extrabold text-white">
//                     <span>رسوم خدمة المنصة</span>
//                     <span className="font-mono line-through decorations-red-500 decoration-2">
//                         {rule.travelerBookingFee.toFixed(2)} {rule.currency}
//                     </span>
//                 </div>
                
//                 <div className="flex justify-between items-center text-green-800 font-bold bg-green-50 p-2 rounded">
//                     <span className="flex items-center gap-1"><Ticket className="w-4 h-4" /> خصم الفترة الترويجية</span>
//                     <span className="font-mono">
//                         -{rule.travelerDiscount.toFixed(2)} {rule.currency}
//                     </span>
//                 </div>

//                 <Separator className="my-2" />

//                 <div className="flex justify-between items-center text-lg font-bold text-gray-900">
//                     <span>المطلوب دفعه الآن</span>
//                     <span className="font-mono text-2xl">
//                         {calculateTotal().toFixed(2)} <span className="text-sm">{rule.currency}</span>
//                     </span>
//                 </div>
//             </div>




//             <SheetFooter>
//               <Button
//                 onClick={handleConfirm}
//                 disabled={isConfirming}
//                 className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
//               >
//                 {isConfirming ? (
//                   <>
//                     <Loader2 className="ml-2 h-5 w-5 animate-spin" />
//                     جاري التأكيد...
//                   </>
//                 ) : (
//                   <>
//                     <Send className="ml-2 h-5 w-5" />
//                     {t('confirm')}
//                   </>
//                 )}
//               </Button>
//             </SheetFooter>

//           </div>
//         ) : (
//           <div className="text-center text-red-500">{t('pricingError')}</div>
//         )}

//       </SheetContent>
//     </Sheet>
//   );
// }




'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Receipt, Send, Ticket } from "lucide-react";
import { useCountryPricing } from "@/hooks/use-country-pricing";
import { Trip } from "@/lib/data";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BookingSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trip?: Trip;
  countryCode?: string;
  confirmedEmail?: string;
}

async function sendBookingEmail({
  email, trip, depositAmt, totalDue, currency,
}: {
  email: string;
  trip: Trip;
  depositAmt: number;
  totalDue: number;
  currency: string;
}) {
  const SERVICE_ID = 'service_uwp1oi3';
  const TEMPLATE_ID = 'template_gsa0ofn';
  const PUBLIC_KEY = 'v4uANy5gK0AVyX0by';

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: email,
        trip_origin: trip.origin || '--',
        trip_destination: trip.destination || '--',
        carrier_name: trip.carrierName || '--',
        ticket_price: `${trip.price} ${trip.currency}`,
        deposit_amount: `${depositAmt.toFixed(2)} ${currency}`,
        total_due: `${totalDue.toFixed(2)} ${currency}`,
        departure_time: trip.departureTime || '--',
        meeting_point: trip.meetingPoint || '--',
        stops: trip.numberOfStops ?? '--',
        bags: trip.bagsPerSeat ?? '--',
        conditions: trip.conditions || 'لا توجد شروط خاصة',
      },
    }),
  });

  if (!res.ok) throw new Error('Email send failed');
}

export function BookingSummarySheet({
  isOpen, onClose, onConfirm, trip, countryCode = 'JO', confirmedEmail = '',
}: BookingSummaryProps) {

  const t = useTranslations('booking');
  const { toast } = useToast();
  const { rule, loading } = useCountryPricing(countryCode);
  const [isConfirming, setIsConfirming] = useState(false);

  const platformFee = rule?.travelerBookingFee ?? 0;
  const discount = rule?.travelerDiscount ?? 0;
  const depositAmt = parseFloat(((trip?.price ?? 0) * ((trip?.depositPercentage ?? 0) / 100)).toFixed(2));
  const totalDue = parseFloat((platformFee - discount).toFixed(2)) > 0
    ? parseFloat((platformFee - discount).toFixed(2))
    : 0;
  const currency = rule?.currency ?? 'JOD';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      if (confirmedEmail && trip) {
        await sendBookingEmail({ email: confirmedEmail, trip, depositAmt, totalDue, currency });
        toast({
          title: '✅ تم إرسال تفاصيل الرحلة',
          description: `تم إرسال رسالة تأكيد إلى ${confirmedEmail}`,
        });
      }
      await onConfirm();
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: 'تنبيه',
        description: 'تم تأكيد الحجز ولكن فشل إرسال الإيميل',
        variant: 'destructive',
      });
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-xl px-6 pb-8 pt-4 h-auto max-h-[90vh]">

        <SheetHeader className="text-right mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Receipt className="w-5 h-5 text-blue-600" />
            {t('title')}
          </SheetTitle>
          <SheetDescription>
            {t('description')}
            {confirmedEmail && (
              <span className="block mt-1 text-xs text-green-600">
                📧 سيتم إرسال التفاصيل إلى: <span className="font-medium ltr">{confirmedEmail}</span>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : rule ? (
          <div className="space-y-6">

            {/* تفاصيل الرحلة */}
            <div className="bg-gray-900 p-4 rounded-lg border space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('route')}</span>
                <span className="font-semibold">{trip?.origin || '--'} ⬅ {trip?.destination || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('carrier')}</span>
                <span>{trip?.carrierName || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('ticketPrice')}</span>
                <span className="font-semibold">{trip?.price ?? '--'} {trip?.currency || ''}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('duration')}</span>
                <span>{trip?.estimatedDurationHours ? `${trip.estimatedDurationHours} ${t('hours')}` : t('notSpecified')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('stops')}</span>
                <span>{trip?.numberOfStops ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('meetingPoint')}</span>
                <span>{trip?.meetingPoint || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('availableSeats')}</span>
                <span>{trip?.availableSeats ?? '--'}</span>
              </div>
            </div>

            {/* الفاتورة */}
            <div className="space-y-3">
              <div className="flex justify-between items-center font-extrabold text-white">
                <span>رسوم مزود الخدمة</span>
                <span className="font-mono line-through decoration-red-500 decoration-2">
                  {rule.travelerBookingFee.toFixed(2)} {rule.currency}
                </span>
              </div>

              <div className="flex justify-between items-center text-green-800 font-bold bg-green-50 p-2 rounded">
                <span className="flex items-center gap-1">
                  <Ticket className="w-4 h-4" /> خصم الفترة الترويجية
                </span>
                <span className="font-mono">
                  -{rule.travelerDiscount.toFixed(2)} {rule.currency}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between items-center text-lg font-bold text-white">
                <span>المطلوب دفعه الآن</span>
                <span className="font-mono text-2xl">
                  {totalDue.toFixed(2)} <span className="text-sm">{rule.currency}</span>
                </span>
              </div>
            </div>

            <SheetFooter>
              <Button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
              >
                {isConfirming ? (
                  <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري التأكيد...</>
                ) : (
                  <><Send className="ml-2 h-5 w-5" />{t('confirm')}</>
                )}
              </Button>
            </SheetFooter>

          </div>
        ) : (
          <div className="text-center text-red-500">{t('pricingError')}</div>
        )}

      </SheetContent>
    </Sheet>
  );
}