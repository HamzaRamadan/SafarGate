'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt, ShieldCheck, Ticket } from "lucide-react";
import { useCountryPricing } from "@/hooks/use-country-pricing";

interface BookingSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tripDetails: {
    origin: string;
    destination: string;
    carrierName: string;
  };
  countryCode?: string; // Default 'JO'
}

export function BookingSummarySheet({ isOpen, onClose, onConfirm, tripDetails, countryCode = 'JO' }: BookingSummaryProps) {
  // استخدام المجس الذكي لجلب الأسعار الحية
  const { rule, loading } = useCountryPricing(countryCode);

  const calculateTotal = () => {
    if (!rule) return 0;
    const total = rule.travelerBookingFee - rule.travelerDiscount;
    return total > 0 ? total : 0;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-xl px-6 pb-8 pt-4 h-auto max-h-[90vh]">
        <div className="mx-auto w-12 h-1.5 bg-gray-200 rounded-full mb-6" />
        
        <SheetHeader className="text-right mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Receipt className="w-5 h-5 text-blue-600" />
            ملخص الحجز المالي
          </SheetTitle>
          <SheetDescription>
            يرجى مراجعة تفاصيل الفاتورة قبل تأكيد المقعد.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : rule ? (
          <div className="space-y-6">
            {/* تفاصيل الرحلة */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الرحلة:</span>
                    <span className="font-semibold">{tripDetails.origin} ⬅ {tripDetails.destination}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الناقل:</span>
                    <span className="font-medium">{tripDetails.carrierName}</span>
                </div>
            </div>

            {/* الفاتورة الصفرية - The Zero Invoice Logic */}
            <div className="space-y-3">
                <div className="flex justify-between items-center font-extrabold text-white">
                    <span>رسوم خدمة المنصة</span>
                    <span className="font-mono line-through decorations-red-500 decoration-2">
                        {rule.travelerBookingFee.toFixed(2)} {rule.currency}
                    </span>
                </div>
                
                <div className="flex justify-between items-center text-green-800 font-bold bg-green-50 p-2 rounded">
                    <span className="flex items-center gap-1"><Ticket className="w-4 h-4" /> خصم الفترة الترويجية</span>
                    <span className="font-mono">
                        -{rule.travelerDiscount.toFixed(2)} {rule.currency}
                    </span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>المطلوب دفعه الآن</span>
                    <span className="font-mono text-2xl">
                        {calculateTotal().toFixed(2)} <span className="text-sm">{rule.currency}</span>
                    </span>
                </div>
            </div>

            {/* رسالة الطمأنة */}
            <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-md text-xs text-blue-700">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                    نحن في فترة الإطلاق التجريبي. لقد تحملت إدارة "سفريات" كافة الرسوم عنك. استمتع برحلتك!
                </p>
            </div>

            <SheetFooter className="mt-4">
                <Button onClick={onConfirm} className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg">
                    تأكيد الحجز المجاني ✅
                </Button>
            </SheetFooter>
          </div>
        ) : (
            <div className="text-center text-red-500">خطأ في تحميل بيانات التسعير</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
