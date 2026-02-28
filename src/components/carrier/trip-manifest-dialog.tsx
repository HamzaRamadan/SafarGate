// 'use client';

// import { useMemo } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription
// } from '@/components/ui/dialog';
// import { useCollection, useFirestore, useUser } from '@/firebase';
// import { collection, query, where } from 'firebase/firestore';
// import { Loader2, User, Users } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import type { Booking } from '@/lib/data';
// import { ScrollArea } from '../ui/scroll-area';

// interface TripManifestDialogProps {
//   tripId: string | null;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export function TripManifestDialog({ tripId, open, onOpenChange }: TripManifestDialogProps) {
//   const firestore = useFirestore();
//   const { user } = useUser();

//   const bookingsQuery = useMemo(() => {
//     if (!open || !tripId || !firestore || !user) return null;
//     return query(
//         collection(firestore, 'bookings'),
//         where('tripId', '==', tripId),
//         where('carrierId', '==', user.uid),
//         where('status', 'in', ['Confirmed', 'Completed'])
//       );
//   }, [open, tripId, firestore, user]);

//   const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

//   const allPassengers = useMemo(() => {
//     if (!bookings) return [];
//     return bookings.flatMap(b => 
//         (b.passengersDetails || []).map(p => ({ ...p, bookingId: b.id }))
//     ).sort((a,b) => a.name.localeCompare(b.name));
//   }, [bookings]);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
//         <DialogHeader>
//           <DialogTitle className='flex items-center gap-2'><Users className='h-5 w-5 text-primary' /> كشف الركاب (Manifest)</DialogTitle>
//           <DialogDescription>قائمة الركاب المؤكدين على هذه الرحلة.</DialogDescription>
//         </DialogHeader>

//         <div className='flex-1 min-h-0'>
//             <ScrollArea className="h-full">
//                 {isLoading ? (
//                 <div className="flex justify-center p-8">
//                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                 </div>
//                 ) : !allPassengers || allPassengers.length === 0 ? (
//                 <div className="text-center p-8 text-muted-foreground">
//                     لا يوجد ركاب مؤكدين لهذه الرحلة حتى الآن.
//                 </div>
//                 ) : (
//                 <div className="space-y-3 p-1">
//                     {allPassengers.map((passenger, index) => (
//                     <div key={`${passenger.bookingId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-card">
//                         <div className="flex items-center gap-3">
//                         <div className="bg-primary/10 p-2 rounded-full">
//                             <User className="h-4 w-4 text-primary" />
//                         </div>
//                         <div>
//                             <p className="font-semibold text-sm">{passenger.name}</p>
//                             <div className="flex items-center gap-2 mt-1">
//                             <Badge variant="outline" className="text-xs font-normal">
//                                 {passenger.nationality}
//                             </Badge>
//                             </div>
//                         </div>
//                         </div>
//                     </div>
//                     ))}
//                 </div>
//                 )}
//             </ScrollArea>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }



'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, User, Users, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Booking, Trip } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { ChatDialog } from '@/components/chat/chat-dialog';

interface TripManifestDialogProps {
  tripId: string | null;
  trip?: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActiveChat {
  bookingId: string;
  passengerUserId: string;
  passengerName: string;
}

export function TripManifestDialog({ tripId, trip, open, onOpenChange }: TripManifestDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);

  const bookingsQuery = useMemo(() => {
    if (!open || !tripId || !firestore || !user) return null;
    return query(
        collection(firestore, 'bookings'),
        where('tripId', '==', tripId),
        where('carrierId', '==', user.uid),
        where('status', 'in', ['Confirmed', 'Completed'])
      );
  }, [open, tripId, firestore, user]);

  const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

  const allPassengers = useMemo(() => {
    if (!bookings) return [];
    // جيب أول راكب من كل booking (صاحب الحجز) مع بياناته
    return bookings.map(b => ({
      name: b.passengersDetails?.[0]?.name || 'راكب',
      nationality: b.passengersDetails?.[0]?.nationality || '',
      bookingId: b.id,
      passengerUserId: b.userId,
      seatsCount: b.passengersDetails?.length || 1,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5 text-primary' /> كشف الركاب (Manifest)
            </DialogTitle>
            <DialogDescription>قائمة الركاب المؤكدين على هذه الرحلة.</DialogDescription>
          </DialogHeader>

          <div className='flex-1 min-h-0'>
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !allPassengers || allPassengers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  لا يوجد ركاب مؤكدين لهذه الرحلة حتى الآن.
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {allPassengers.map((passenger, index) => (
                    <div key={`${passenger.bookingId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{passenger.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-normal">
                              {passenger.nationality}
                            </Badge>
                            {passenger.seatsCount > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                {passenger.seatsCount} مقاعد
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* زرار الشات */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => setActiveChat({
                          bookingId: passenger.bookingId,
                          passengerUserId: passenger.passengerUserId,
                          passengerName: passenger.name,
                        })}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">محادثة</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة الشات */}
      {activeChat && (
        <ChatDialog
          isOpen={!!activeChat}
          onOpenChange={(isOpen) => { if (!isOpen) setActiveChat(null); }}
          trip={trip ?? null}
          bookingId={activeChat.bookingId}
          otherPartyName={activeChat.passengerName}
          otherPartyId={activeChat.passengerUserId}
        />
      )}
    </>
  );
}