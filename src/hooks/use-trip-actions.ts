// 'use client';

// import { useState } from 'react';
// import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
// import { useToast } from '@/hooks/use-toast';
// import { useUserProfile } from '@/hooks/use-user-profile';
// import { collection, query, where, serverTimestamp, doc, increment, updateDoc, runTransaction, getDocs } from 'firebase/firestore';
// import type { Trip } from '@/lib/data';
// import { type EditTripFormValues } from '@/components/carrier/edit-trip-dialog';


// export function useTripActions() {
//     const firestore = useFirestore();
//     const { toast } = useToast();
//     const { user, profile } = useUserProfile();
//     const [isProcessing, setIsProcessing] = useState<string | null>(null);

//     const completeTrip = async (trip: Trip) => {
//         if (!firestore || !user || trip.status === 'Completed') return;
//         setIsProcessing(`complete-${trip.id}`);
//         try {
//             await runTransaction(firestore, async (transaction) => {
//                 const tripRef = doc(firestore, 'trips', trip.id);
//                 const carrierRef = doc(firestore, 'users', user.uid);
//                 transaction.update(tripRef, { status: 'Completed', updatedAt: serverTimestamp() });
//                 if (profile?.currentActiveTripId === trip.id) {
//                     transaction.update(carrierRef, { currentActiveTripId: null });
//                 }
//             });
//             toast({ title: "تم إنهاء الرحلة بنجاح", description: "تم تحديث حالتك إلى 'متاح'." });
//         } catch (error) {
//             toast({ variant: "destructive", title: "فشل إنهاء الرحلة" });
//         } finally {
//             setIsProcessing(null);
//         }
//     };

//   // [SC-152] Smart Seat Guard: Prevents overbooking & negative capacity
//   const changeSeats = async (trip: Trip, change: number) => {
//     if (!firestore || !user || !profile) return;

//     // 1. Basic Safety: Prevent going below zero
//     if (change < 0 && (trip.availableSeats || 0) <= 0) {
//         toast({ 
//             variant: "destructive", 
//             title: "لا يمكن تقليل المقاعد", 
//             description: "عدد المقاعد المتاحة هو صفر بالفعل." 
//         });
//         return;
//     }

//     setIsProcessing(`seat-${trip.id}`);

//     try {
//       const tripRef = doc(firestore, 'trips', trip.id);
//       const newSeatCount = (trip.availableSeats || 0) + change;

//       // 2. The Smart Guard (Protocol 88: Query only on Increase)
//       if (change > 0) {
//           // Check actual bookings to ensure (Booked + NewAvailable <= Capacity)
//           const bookingsQuery = query(
//               collection(firestore, 'bookings'), 
//               where('tripId', '==', trip.id), 
//               where('status', '==', 'Confirmed')
//           );
          
//           const bookingsSnapshot = await getDocs(bookingsQuery);
//           const bookedSeats = bookingsSnapshot.docs.reduce((sum, doc) => sum + doc.data().seats, 0);
//           const totalCapacity = profile.vehicleCapacity || 99; // Fallback only if profile is incomplete

//           if ((bookedSeats + newSeatCount) > totalCapacity) {
//               toast({ 
//                   variant: "destructive", 
//                   title: "تم الوصول للسعة القصوى", 
//                   description: `السعة الإجمالية لمركبتك هي ${totalCapacity} مقعداً. (${bookedSeats} محجوز + ${newSeatCount} متاح سيصبح فائضاً).` 
//               });
//               setIsProcessing(null);
//               return; // 🛑 Block Execution
//           }
//       }

//       // 3. Safe Execution
//       await updateDoc(tripRef, { 
//           availableSeats: increment(change), 
//           updatedAt: serverTimestamp() 
//       });

//       toast({ 
//           title: "تم تحديث المقاعد", 
//           description: `المقاعد المتاحة الآن: ${newSeatCount}` 
//       });

//     } catch (error) {
//       console.error("Seat update error:", error);
//       toast({ variant: "destructive", title: "فشل تعديل المقاعد", description: "يرجى التحقق من الاتصال." });
//     } finally {
//       setIsProcessing(null);
//     }
//   };

//     const cancelTrip = async (trip: Trip): Promise<'transfer' | 'cancelled' | 'error'> => {
//         if (!firestore || !user || !profile) return 'error';
//         setIsProcessing(`cancel-${trip.id}`);
//         const bookingsQuery = query(collection(firestore, 'bookings'), where('tripId', '==', trip.id), where('carrierId', '==', user.uid), where('status', 'in', ['Confirmed', 'Pending-Payment']));

//         try {
//             const bookingsSnap = await getDocs(bookingsQuery);
//             if (!bookingsSnap.empty) {
//                 toast({ title: "توجيه آلي: لديك ركاب", description: "لا يمكنك إلغاء الرحلة، سيتم فتح نافذة نقل الركاب." });
//                 setIsProcessing(null);
//                 return 'transfer';
//             } else {
//                 await runTransaction(firestore, async (transaction) => {
//                     const tripRef = doc(firestore, 'trips', trip.id);
//                     const userRef = doc(firestore, 'users', user.uid);
//                     transaction.update(tripRef, { status: 'Cancelled', updatedAt: serverTimestamp() });
//                     if (profile.currentActiveTripId === trip.id) {
//                         transaction.update(userRef, { currentActiveTripId: null });
//                     }
//                 });
//                 toast({ title: "تم إلغاء الرحلة الفارغة بنجاح" });
//                 setIsProcessing(null);
//                 return 'cancelled';
//             }
//         } catch (error: any) {
//             if (error.code === 'permission-denied') {
//                 errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'list', path: `bookings` }));
//             }
//             toast({ variant: "destructive", title: "فشل الإلغاء" });
//             setIsProcessing(null);
//             return 'error';
//         }
//     };

//     const editTrip = async (trip: Trip, data: EditTripFormValues): Promise<boolean> => {
//         if (!firestore) return false;
//         setIsProcessing(`edit-${trip.id}`);
//         try {
//             const tripRef = doc(firestore, 'trips', trip.id);
//             await updateDoc(tripRef, {
//                 ...data,
//                 departureDate: data.departureDate.toISOString(), // Ensure date is string
//                 updatedAt: serverTimestamp(),
//             });
//             toast({
//                 title: "تم تحديث الرحلة",
//                 description: "تم حفظ التعديلات على رحلتك بنجاح.",
//             });
//             return true;
//         } catch (error: any) {
//              if (error.code === 'permission-denied') {
//                 errorEmitter.emit('permission-error', new FirestorePermissionError({
//                     operation: 'update',
//                     path: `trips/${trip.id}`,
//                     requestResourceData: data,
//                 }));
//             } else {
//                 toast({ variant: "destructive", title: "فشل تعديل الرحلة" });
//             }
//             return false;
//         } finally {
//             setIsProcessing(null);
//         }
//     };

//     return { isProcessing, completeTrip, changeSeats, cancelTrip, editTrip };
// }





'use client';

import { useState } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, query, where, serverTimestamp, doc, increment, updateDoc, runTransaction, getDocs, addDoc } from 'firebase/firestore';
import { writeNotification } from '@/lib/notification-writer';
import type { Trip } from '@/lib/data';
import { type EditTripFormValues } from '@/components/carrier/edit-trip-dialog';


export function useTripActions() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, profile } = useUserProfile();
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const completeTrip = async (trip: Trip) => {
        if (!firestore || !user || trip.status === 'Completed') return;
        setIsProcessing(`complete-${trip.id}`);
        try {
            await runTransaction(firestore, async (transaction) => {
                const tripRef = doc(firestore, 'trips', trip.id);
                const carrierRef = doc(firestore, 'users', user.uid);
                transaction.update(tripRef, { status: 'Completed', updatedAt: serverTimestamp() });
                if (profile?.currentActiveTripId === trip.id) {
                    transaction.update(carrierRef, { currentActiveTripId: null });
                }
            });
            toast({ title: "تم إنهاء الرحلة بنجاح", description: "تم تحديث حالتك إلى 'متاح'." });
        } catch (error) {
            toast({ variant: "destructive", title: "فشل إنهاء الرحلة" });
        } finally {
            setIsProcessing(null);
        }
    };

  // [SC-152] Smart Seat Guard: Prevents overbooking & negative capacity
  const changeSeats = async (trip: Trip, change: number) => {
    if (!firestore || !user || !profile) return;

    // 1. Basic Safety: Prevent going below zero
    if (change < 0 && (trip.availableSeats || 0) <= 0) {
        toast({ 
            variant: "destructive", 
            title: "لا يمكن تقليل المقاعد", 
            description: "عدد المقاعد المتاحة هو صفر بالفعل." 
        });
        return;
    }

    setIsProcessing(`seat-${trip.id}`);

    try {
      const tripRef = doc(firestore, 'trips', trip.id);
      const newSeatCount = (trip.availableSeats || 0) + change;

      // 2. The Smart Guard (Protocol 88: Query only on Increase)
      if (change > 0) {
          // Check actual bookings to ensure (Booked + NewAvailable <= Capacity)
          const bookingsQuery = query(
              collection(firestore, 'bookings'), 
              where('tripId', '==', trip.id), 
              where('status', '==', 'Confirmed')
          );
          
          const bookingsSnapshot = await getDocs(bookingsQuery);
          const bookedSeats = bookingsSnapshot.docs.reduce((sum, doc) => sum + doc.data().seats, 0);
          const totalCapacity = profile.vehicleCapacity || 99; // Fallback only if profile is incomplete

          if ((bookedSeats + newSeatCount) > totalCapacity) {
              toast({ 
                  variant: "destructive", 
                  title: "تم الوصول للسعة القصوى", 
                  description: `السعة الإجمالية لمركبتك هي ${totalCapacity} مقعداً. (${bookedSeats} محجوز + ${newSeatCount} متاح سيصبح فائضاً).` 
              });
              setIsProcessing(null);
              return; // 🛑 Block Execution
          }
      }

      // 3. Safe Execution
      await updateDoc(tripRef, { 
          availableSeats: increment(change), 
          updatedAt: serverTimestamp() 
      });

      toast({ 
          title: "تم تحديث المقاعد", 
          description: `المقاعد المتاحة الآن: ${newSeatCount}` 
      });

    } catch (error) {
      console.error("Seat update error:", error);
      toast({ variant: "destructive", title: "فشل تعديل المقاعد", description: "يرجى التحقق من الاتصال." });
    } finally {
      setIsProcessing(null);
    }
  };

    const cancelTrip = async (trip: Trip): Promise<'transfer' | 'cancelled' | 'error'> => {
        if (!firestore || !user || !profile) return 'error';
        setIsProcessing(`cancel-${trip.id}`);
        const bookingsQuery = query(collection(firestore, 'bookings'), where('tripId', '==', trip.id), where('carrierId', '==', user.uid), where('status', 'in', ['Confirmed', 'Pending-Payment']));

        try {
            const bookingsSnap = await getDocs(bookingsQuery);
            if (!bookingsSnap.empty) {
                toast({ title: "توجيه آلي: لديك ركاب", description: "لا يمكنك إلغاء الرحلة، سيتم فتح نافذة نقل الركاب." });
                setIsProcessing(null);
                return 'transfer';
            } else {
                await runTransaction(firestore, async (transaction) => {
                    const tripRef = doc(firestore, 'trips', trip.id);
                    const userRef = doc(firestore, 'users', user.uid);
                    transaction.update(tripRef, { status: 'Cancelled', updatedAt: serverTimestamp() });
                    if (profile.currentActiveTripId === trip.id) {
                        transaction.update(userRef, { currentActiveTripId: null });
                    }
                });
                toast({ title: "تم إلغاء الرحلة الفارغة بنجاح" });
                setIsProcessing(null);
                return 'cancelled';
            }
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'list', path: `bookings` }));
            }
            toast({ variant: "destructive", title: "فشل الإلغاء" });
            setIsProcessing(null);
            return 'error';
        }
    };

    const editTrip = async (trip: Trip, data: EditTripFormValues): Promise<boolean> => {
        if (!firestore) return false;
        setIsProcessing(`edit-${trip.id}`);
        try {
            const tripRef = doc(firestore, 'trips', trip.id);
            await updateDoc(tripRef, {
                ...data,
                departureDate: data.departureDate.toISOString(), // Ensure date is string
                updatedAt: serverTimestamp(),
            });
            toast({
                title: "تم تحديث الرحلة",
                description: "تم حفظ التعديلات على رحلتك بنجاح.",
            });

            // إشعار للمسافرين المؤكدين
            try {
                const bookingsSnap = await getDocs(
                    query(collection(firestore, 'bookings'), 
                        where('tripId', '==', trip.id),
                        where('status', 'in', ['Confirmed', 'Pending-Payment'])
                    )
                );
                const changes = [];
                if (data.price !== trip.price) changes.push(`السعر: ${data.price} ${trip.currency}`);
                if (data.departureDate?.toISOString() !== trip.departureDate) changes.push('وقت المغادرة');
                if (changes.length > 0) {
                    for (const bookingDoc of bookingsSnap.docs) {
                        await writeNotification({
                            firestore,
                            userId: bookingDoc.data().userId,
                            type: 'trip_update',
                            title: '✏️ تم تعديل الرحلة',
                            message: `قام الناقل بتعديل: ${changes.join(' و')}.`,
                            link: '/history',
                        });
                    }
                }
            } catch(e) { /* fail silently */ }

            return true;
        } catch (error: any) {
             if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    operation: 'update',
                    path: `trips/${trip.id}`,
                    requestResourceData: data,
                }));
            } else {
                toast({ variant: "destructive", title: "فشل تعديل الرحلة" });
            }
            return false;
        } finally {
            setIsProcessing(null);
        }
    };

    return { isProcessing, completeTrip, changeSeats, cancelTrip, editTrip };
}