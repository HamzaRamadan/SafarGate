import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { getCityName } from "@/lib/constants";
import { Trip } from "@/lib/data";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import { useTranslations, useLocale } from "next-intl";

interface TripCardBaseProps {
  trip: Trip;
  children?: React.ReactNode;
  headerAction?: React.ReactNode;
  vehicleAction?: React.ReactNode;
}

export function TripCardBase({
  trip,
  children,
  headerAction,
  vehicleAction,
}: TripCardBaseProps) {
  const t = useTranslations("trip");
  const locale = useLocale();
  const isFull = trip.availableSeats === 0;

  return (
    <Card className="overflow-hidden border-0 shadow-md flex flex-col h-full">
      {/* ================= HEADER ================= */}
      <div
        className={cn(
          "p-4 text-white relative",
          trip.status === "Planned"
            ? "bg-gradient-to-r from-blue-600 to-blue-800"
            : trip.status === "In-Transit"
              ? "bg-gradient-to-r from-green-600 to-green-800"
              : "bg-gradient-to-r from-slate-700 to-slate-900",
        )}
      >
        <div className="space-y-3">
          {/* السطر العلوي: العنوان + الباج */}
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-1.5 flex-wrap">
              {getCityName(trip.origin, locale)}
              <span className="text-blue-200 font-light">←</span>
              {getCityName(trip.destination, locale)}
            </h2>
          </div>

          {/* معلومات الناقل تحت العنوان */}
          {headerAction && (
            <div className="border-t border-white/20 pt-2">{headerAction}</div>
          )}
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="p-5 flex-1 bg-white dark:bg-slate-950 space-y-6">
        {/* وقت الانطلاق */}

        <div className="flex items-center gap-6">
          {/* الوقت */}
          <div>
            <p className="text-xs text-muted-foreground">
              {t("departureTime")}
            </p>
            <p className="font-semibold text-lg">
              {formatDate(trip.departureDate, "hh:mm a", locale)}
            </p>
          </div>

          {/* التاريخ */}
          <div>
            <p className="text-xs text-muted-foreground">
              {t("departureDate")}
            </p>
            <p className="font-semibold text-sm">
              {formatDate(trip.departureDate, "EEEE, dd MMM", locale)}
            </p>
          </div>
        </div>

        {/* المركبة والمقاعد */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
          <div className="flex items-center gap-3">
            {vehicleAction}
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                {t("vehicle")}
              </p>
              <p className="text-sm font-medium">
                {trip.vehicleCategory === "bus" ? t("bus") : t("car")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("type")}: {trip.vehicleType}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "px-3 py-1.5 rounded text-center min-w-[80px]",
              isFull
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700",
            )}
          >
            <p className="text-xs font-bold">{t("available")}</p>
            <p className="text-lg font-black font-mono leading-none mt-0.5">
              {trip.availableSeats}
              <span className="text-[10px] opacity-60">
                {" / "}
                {trip.vehicleCapacity || "?"}
              </span>
            </p>
          </div>
        </div>

        {/* تفاصيل إضافية */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{t("price")}</p>
            <p className="font-semibold">
              {trip.price} {trip.currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("deposit")}</p>
            <p className="font-semibold">{trip.depositPercentage}%</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t("carrier")}</p>
            <p className="font-semibold">{trip.carrierName}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t("duration")}</p>
            <p className="font-semibold">
              {trip.estimatedDurationHours
                ? `${trip.estimatedDurationHours} ${t("hours")}`
                : t("notSpecified")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t("stops")}</p>
            <p className="font-semibold">{trip.numberOfStops}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("bagsPerSeat")}</p>
            <p className="font-semibold">{trip.bagsPerSeat}</p>
          </div>
          {/* <div>
            <p className="text-xs text-muted-foreground">
              {t('meetingPoint')}
            </p>
            <p className="font-semibold">
              {trip.meetingPoint || t('notSpecified')}
            </p>
            {trip.meetingPointLink && (
              <a
                href={trip.meetingPointLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:underline font-medium"
              >
                <MapPin className="h-3 w-3" />
                عرض على الخريطة
              </a>
            )}
          </div> */}
          <div className="col-span-2">
            <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20 flex items-start gap-3">
              <div className="mt-0.5">
                <MapPin className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-muted-foreground">
                  {t("meetingPoint")}
                </p>

                <p className="font-semibold text-sm break-words">
                  {trip.meetingPoint || t("notSpecified")}
                </p>

                {trip.meetingPointLink && (
                  <a
                    href={trip.meetingPointLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-2 rounded-md 
               bg-primary/10 text-primary text-xs font-semibold
               hover:bg-primary hover:text-white transition-all duration-200"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    عرض على الخريطة
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {children && (
        <div className="p-4 bg-white dark:bg-slate-900 border-t flex flex-col gap-3">
          {children}
        </div>
      )}
    </Card>
  );
}
