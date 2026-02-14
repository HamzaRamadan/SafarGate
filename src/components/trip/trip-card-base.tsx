import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowDown, Users } from 'lucide-react';
import { getCityName } from '@/lib/constants';
import { Trip } from '@/lib/data';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

interface TripCardBaseProps {
  trip: Trip;
  children?: React.ReactNode; // منطقة "غرفة القيادة" (Footer)
  headerAction?: React.ReactNode; // شريط الحالة التفاعلي
  vehicleAction?: React.ReactNode; // زر معاينة المركبة
}

export function TripCardBase({ trip, children, headerAction, vehicleAction }: TripCardBaseProps) {
  // حساب المقاعد الشاغرة
  const occupied = (trip.passengers || 0); // أو حسب منطق الحجوزات
  const capacity = trip.vehicleCapacity || 0; // أو من البروفايل
  const isFull = trip.availableSeats === 0;

  return (
    <Card className="overflow-hidden border-0 shadow-md flex flex-col h-full">
      {/* 1. الأفق الحي (Header) */}
      <div className={cn("p-4 text-white relative", 
          trip.status === 'Planned' ? "bg-gradient-to-r from-blue-600 to-blue-800" :
          trip.status === 'In-Transit' ? "bg-gradient-to-r from-green-600 to-green-800" :
          "bg-gradient-to-r from-slate-700 to-slate-900"
      )}>
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{getCityName(trip.destination)}</h2>
                <p className="text-blue-100 text-sm flex items-center gap-1">
                    من: {getCityName(trip.origin)}
                </p>
            </div>
            <div className="flex flex-col items-end gap-1">
                {headerAction || (
                    <Badge variant="secondary" className="glass-badge">
                        {trip.status === 'Planned' ? 'مجدولة' : trip.status}
                    </Badge>
                )}
            </div>
        </div>
      </div>

      {/* 2. الخط الزمني (Body) */}
      <div className="p-5 flex-1 relative bg-white dark:bg-slate-950">
        <div className="flex gap-4 h-full">
            {/* العمود الزمني */}
            <div className="flex flex-col items-center pt-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900" />
                <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-500 to-green-500 my-1 border-dashed" />
                <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900" />
            </div>

            {/* المحتوى */}
            <div className="flex-1 space-y-6">
                {/* الانطلاق */}
                <div>
                    <p className="text-xs text-muted-foreground">وقت الانطلاق</p>
                    <p className="font-semibold text-lg">
                        {formatDate(trip.departureDate, "hh:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(trip.departureDate, "EEEE, dd MMM")}
                    </p>
                </div>

                {/* المركبة والمقاعد */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                    <div className="flex items-center gap-3">
                        {vehicleAction} {/* زر معاينة المركبة */}
                        <div>
                            <p className="text-xs font-bold text-muted-foreground">المركبة</p>
                            <p className="text-sm font-medium">{trip.vehicleCategory === 'bus' ? 'حافلة' : 'سيارة'}</p>
                        </div>
                    </div>
                    
                    {/* العداد الرقمي للمقاعد */}
                    <div className={cn("px-3 py-1.5 rounded text-center min-w-[70px]", isFull ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                        <p className="text-xs font-bold">المتاح</p>
                        <p className="text-lg font-black font-mono leading-none mt-0.5">
                            {trip.availableSeats} <span className="text-[10px] opacity-60">/ {trip.vehicleCapacity || '?'}</span>
                        </p>
                    </div>
                </div>

                {/* الوصول (تقديري) */}
                <div>
                    <p className="text-xs text-muted-foreground">الوصول (تقديري)</p>
                    <p className="font-semibold text-lg opacity-60">--:--</p>
                </div>
            </div>
        </div>
      </div>

      {/* 3. غرفة القيادة (Footer) */}
      {children && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t flex flex-col gap-3">
              {children}
          </div>
      )}
    </Card>
  );
}
