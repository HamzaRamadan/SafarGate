'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin, Receipt, Send, Ticket } from "lucide-react";
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
              {trip?.meetingPointLink && (
                <div className="flex justify-end">
                  <a
                    href={trip.meetingPointLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                  >
                    <MapPin className="h-3 w-3" />
                    عرض على الخريطة
                  </a>
                </div>
              )}
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
                  <><Send className="ml-2 h-5 w-5" />تأكيد الحجز ← إدخال الإيميل</>
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