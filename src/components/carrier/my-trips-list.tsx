'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2, CheckCircle2, Users, Play, Pause, Route, Plus, Minus } from 'lucide-react';
import type { Trip } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { TransferRequestDialog } from './transfer-request-dialog';
import { TripManifestDialog } from './trip-manifest-dialog';
import { useTripActions } from '@/hooks/use-trip-actions';
import { TripCardBase } from '@/components/trip/trip-card-base';
import Image from 'next/image';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const triggerHaptic = (type: 'success' | 'limit') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(type === 'limit' ? [50, 50, 50] : 15);
  }
};

interface MyTripsListProps {
  trips: Trip[];
  isLoading: boolean;
  onEdit: (trip: Trip) => void;
}

export function MyTripsList({ trips, isLoading, onEdit }: MyTripsListProps) {
  const t = useTranslations('myTripsList');
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);
  const [tripToTransfer, setTripToTransfer] = useState<Trip | null>(null);
  const [manifestTripId, setManifestTripId] = useState<string | null>(null);

  const { isProcessing, completeTrip, cancelTrip, changeSeats } = useTripActions();
  const { profile: userProfile } = useUserProfile();

  const handleConfirmCancel = async () => {
    if (!tripToCancel) return;
    const result = await cancelTrip(tripToCancel);
    if (result === 'transfer') {
      setTripToTransfer(tripToCancel);
    }
    setTripToCancel(null);
  };

  const handleToggleStatus = (trip: Trip) => {
    // مستقبلاً: منطق تشغيل / إيقاف الرحلة
  };

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">{t('loading')}</div>;

  if (!trips?.length) return (
    <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-card col-span-full">
      <Route className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="font-bold">{t('emptyTitle')}</p>
      <p className="text-sm mt-1">{t('emptyDesc')}</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map((trip) => {
          const isThisTripProcessing = isProcessing?.endsWith(trip.id);
          const statusButton = trip.status === 'Planned'
            ? { label: t('startTrip'), icon: Play, action: () => handleToggleStatus(trip), className: "bg-blue-600 hover:bg-blue-700" }
            : trip.status === 'In-Transit'
            ? { label: t('pauseTrip'), icon: Pause, action: () => handleToggleStatus(trip), className: "bg-yellow-500 hover:bg-yellow-600" }
            : null;

          const capacity = userProfile?.vehicleCapacity || 0;
          const available = trip.availableSeats || 0;
          const booked = Math.max(0, capacity - available);
          const fillPercentage = capacity > 0 ? Math.min(100, (booked / capacity) * 100) : 0;
          const isFull = available <= 0;

          return (
            <TripCardBase
              key={trip.id}
              trip={trip}
              headerAction={statusButton && (
                <Button size="sm" className={`gap-1 h-8 ${statusButton.className}`} onClick={statusButton.action}>
                  <statusButton.icon className="h-4 w-4" />
                  <span className="text-xs">{statusButton.label}</span>
                </Button>
              )}
              vehicleAction={
                <div className="w-12 h-12 rounded-md bg-muted overflow-hidden relative">
                  {trip.vehicleImageUrls?.[0] && (
                    <Image src={trip.vehicleImageUrls[0]} alt="Vehicle" fill className="object-cover" />
                  )}
                </div>
              }
            >
              {/* شريط السعة */}
              <div className="w-full space-y-1 mb-1 mt-1">
                <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-mono">
                  <span>{t('occupied')}: {booked}</span>
                  <span>{t('capacity')}: {capacity}</span>
                </div>
                <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/50">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                      isFull ? "bg-red-500" : fillPercentage > 80 ? "bg-orange-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>

              {/* التحكم في المقاعد */}
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-dashed border-muted-foreground/20">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {t('seats')}:
                </span>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 transition-colors"
                    disabled={isFull || isThisTripProcessing}
                    onClick={() => {
                      if (isFull) { triggerHaptic('limit'); return; }
                      triggerHaptic('success');
                      changeSeats(trip, -1);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <span className={cn("text-2xl font-mono font-black min-w-[30px] text-center", isFull ? "text-red-600" : "text-primary")}>
                    {available}
                  </span>

                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 rounded-full hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    disabled={available >= capacity || isThisTripProcessing}
                    onClick={() => {
                      if (available >= capacity) { triggerHaptic('limit'); return; }
                      triggerHaptic('success');
                      changeSeats(trip, 1);
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* أزرار حالة الرحلة */}
              {trip.status === 'In-Transit' ? (
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-1 shadow-sm mt-2"
                  onClick={() => completeTrip(trip)}
                  disabled={isThisTripProcessing}
                >
                  {isThisTripProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{t('completeTrip')}</span>
                </Button>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => setManifestTripId(trip.id)} disabled={isThisTripProcessing}>
                    <Users className="h-4 w-4" />
                    <span>{t('manifest')}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(trip)} className="text-blue-600 h-9 w-9" disabled={isThisTripProcessing}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setTripToCancel(trip)} className="text-destructive hover:bg-destructive/10 h-9 w-9" title={t('cancelTrip')} disabled={isThisTripProcessing}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )}
            </TripCardBase>
          );
        })}
      </div>

      {/* Dialogs */}
      <AlertDialog open={!!tripToCancel} onOpenChange={(open) => !open && setTripToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmCancelTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmCancelDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isProcessing}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} disabled={!!isProcessing} className="bg-destructive">{t('continue')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {tripToTransfer && (
        <TransferRequestDialog
          isOpen={!!tripToTransfer}
          onOpenChange={(open) => !open && setTripToTransfer(null)}
          trip={tripToTransfer}
        />
      )}

      <TripManifestDialog
        tripId={manifestTripId}
        open={!!manifestTripId}
        onOpenChange={(open) => !open && setManifestTripId(null)}
      />
    </>
  );
}
