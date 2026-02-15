'use server';
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging(); // [SC-119] Activate Voice Module

// ---------------------------------------------------------------------
// 1. New Offer Notification (VOICE RESTORED - SC-119)
// ---------------------------------------------------------------------
export const onNewOffer = functions.firestore
  .document("trips/{tripId}/offers/{offerId}")
  .onDocumentCreated(async (event) => {
    const offer = event.data; // بدل snap.data()
    const tripId = event.params.tripId;

    console.log("New offer created for trip:", tripId, offer);

    try {
      const tripSnap = await db.collection('trips').doc(tripId).get();
      const trip = tripSnap.data();

      if (!trip || !trip.userId) return;

      const travelerSnap = await db.collection('users').doc(trip.userId).get();
      const traveler = travelerSnap.data();
      const tokens = traveler?.fcmTokens || [];

      const carrierSnap = await db.collection('users').doc(offer.carrierId).get();
      const carrier = carrierSnap.data();
      const carrierName = carrier?.firstName || 'ناقل';

      // A. Create Internal Notification
      await db.collection('users').doc(trip.userId).collection('notifications').add({
        type: 'new_offer',
        title: 'عرض سعر جديد! 🏷️',
        message: `لقد تلقيت عرضاً بقيمة ${offer.price} ${offer.currency} لرحلتك.`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        link: '/history',
        userId: trip.userId,
        relatedId: offerId,
      });

      // B. Send Push Notification if tokens exist
      if (tokens.length > 0) {
        const message = {
          notification: {
            title: 'عرض سعر جديد لرحلتك! 🏷️',
            body: `الكابتن ${carrierName} قدم عرضاً بقيمة ${offer.price} ${offer.currency}.`,
          },
          data: {
            link: '/history',
            tripId: tripId,
          },
          tokens: tokens,
        };
        await admin.messaging().sendMulticast(message);
      }
    } catch (error) {
      console.error('Error in onNewOffer:', error);
    }
  });


// ---------------------------------------------------------------------
// 2. Trip Completion (Trigger Rating Cycle)
// ---------------------------------------------------------------------
export const onTripCompleted = functions.firestore
  .document('trips/{tripId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const tripId = context.params.tripId;

    if (before.status === 'Completed' || after.status !== 'Completed') {
      return null;
    }

    try {
      const bookingsSnap = await db.collection('bookings')
        .where('tripId', '==', tripId)
        .where('status', 'in', ['Confirmed', 'Pending-Payment'])
        .get();

      if (bookingsSnap.empty) return null;

      const batch = db.batch();

      const notificationsPromises = bookingsSnap.docs.map(async (doc) => {
        const booking = doc.data();
        const notifRef = db.collection('users').doc(booking.userId).collection('notifications').doc();
        
        batch.set(notifRef, {
          type: 'rating_request',
          title: 'حمد لله على السلامة! 🛬',
          message: 'نرجو أن تكون رحلتك مريحة. كيف كانت تجربتك مع الناقل؟',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          link: '/history',
          userId: booking.userId,
          relatedId: tripId
        });
        
        // [SC-119] FCM Injection
        const userSnap = await db.collection('users').doc(booking.userId).get();
        const tokens = userSnap.data()?.fcmTokens || [];
        
        if (tokens.length > 0) {
            return messaging.sendMulticast({
                tokens: tokens,
                notification: {
                    title: 'حمد لله على السلامة! 🛬',
                    body: 'الرحلة انتهت. رأيك يهمنا، قيم الكابتن الآن.',
                },
                data: { link: `/history` }
            });
        }
        return Promise.resolve();

      });
      
      await Promise.all(notificationsPromises);
      await batch.commit();

    } catch (error) {
      console.error('Error in onTripCompleted:', error);
    }
    return null;
  });

// ---------------------------------------------------------------------
// 3. Chat Notifications (VOICE RESTORED - SC-119)
// ---------------------------------------------------------------------
export const sendChatMessageNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;

    if (message.type === 'system') return null;

    try {
      const chatSnap = await db.collection('chats').doc(chatId).get();
      const chat = chatSnap.data();

      if (!chat || !chat.participants) return null;

      const recipientUids = chat.participants.filter((uid: string) => uid !== message.senderId);
      if (recipientUids.length === 0) return null;

      // Protocol 88: Bulk fetch user data for all recipients
      const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', recipientUids).get();

      const allTokens: string[] = [];
      const batch = db.batch();

      usersSnap.forEach(doc => {
          const userData = doc.data();
          // Collect tokens for push notification
          if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
              allTokens.push(...userData.fcmTokens);
          }

          // Create internal notification
          const notifRef = db.collection('users').doc(doc.id).collection('notifications').doc();
          batch.set(notifRef, {
            type: 'group_chat_message',
            title: `رسالة من ${message.senderName || 'مستخدم'}`,
            message: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            link: '/chats',
            userId: doc.id,
            relatedId: chatId
          });
      });

      // Commit internal notifications
      await batch.commit();

      // Send push notifications if any tokens were found
      if (allTokens.length > 0) {
        const pushMessage = {
          notification: {
            title: `💬 ${message.senderName || 'رسالة جديدة'}`,
            body: message.content.substring(0, 100),
          },
          data: {
            chatId: chatId,
            link: '/chats'
          },
          tokens: allTokens,
        };
        await admin.messaging().sendMulticast(pushMessage);
         console.log(`[FCM] Chat notification sent to ${allTokens.length} devices.`);
      }
    } catch (error) {
      console.error('Error in sendChatMessageNotification:', error);
    }
    return null;
  });

// ---------------------------------------------------------------------
// 4. The Verdict Engine (Weighted Logic - NEW)
// ---------------------------------------------------------------------
export const onRatingCreated = functions.firestore
  .document('ratings/{ratingId}')
  .onCreate(async (snap, context) => {
    const rating = snap.data();
    const carrierId = rating.carrierId;
    const bookingId = rating.bookingId;
    const details = rating.details || {};

    if (!carrierId) return null;

    try {
      const db = admin.firestore();
      const carrierRef = db.collection('users').doc(carrierId);

      // --- 🟢 THE LOGIC INJECTION (Server Side) 🟢 ---
      let calculatedScore = 0;
      
      // Weight 1: Price Integrity (Max 2.5)
      if (details.priceAdherence === true) calculatedScore += 2.5;
      
      // Weight 2: Vehicle Match (Max 1.5)
      if (details.vehicleMatch === true) calculatedScore += 1.5;
      
      // Weight 3: Service Quality (Max 1.0)
      const starScore = (details.serviceStars || 0) / 5;
      calculatedScore += starScore;

      const finalRatingValue = parseFloat(calculatedScore.toFixed(2));
      // ------------------------------------------------

      await db.runTransaction(async (t) => {
        const carrierDoc = await t.get(carrierRef);
        if (!carrierDoc.exists) return;

        const carrierData = carrierDoc.data();
        const currentStats = carrierData?.ratingStats || { average: 0, count: 0 };

        // Aggregate using the CALCULATED score
        const newCount = currentStats.count + 1;
        const oldTotal = currentStats.average * currentStats.count;
        const newAverage = (oldTotal + finalRatingValue) / newCount;

        // Determine Tier
        let newTier = 'BRONZE';
        if (newAverage >= 4.8 && newCount > 50) newTier = 'PLATINUM';
        else if (newAverage >= 4.5 && newCount > 20) newTier = 'GOLD';
        else if (newAverage >= 4.0 && newCount > 10) newTier = 'SILVER';

        // Update Carrier Profile
        t.update(carrierRef, {
          ratingStats: {
            average: parseFloat(newAverage.toFixed(2)),
            count: newCount,
            tier: newTier
          }
        });

        // Update the Rating Doc itself
        t.update(snap.ref, { 
            finalCalculatedScore: finalRatingValue,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Close the Booking Loop
        if (bookingId) {
            const bookingRef = db.collection('bookings').doc(bookingId);
            t.update(bookingRef, { status: 'Rated' });
        }
      });

      console.log(`Reputation updated for carrier ${carrierId}: Score ${finalRatingValue} (Tier ${newTier})`);

    } catch (error) {
      console.error('Error in onRatingCreated:', error);
    }
    return null
  });

// [SC-018] Logic Injection: Booking Lifecycle Nervous System
export const onBookingStatusChange = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const bookingId = context.params.bookingId;

    // Trigger only on status change
    if (newData.status === oldData.status) return null;

    const db = admin.firestore();
    const messaging = admin.messaging();
    
    // 1. New Booking Request -> Notify Carrier (Corrected Logic)
    if (newData.status === 'Pending-Carrier-Confirmation' && oldData.status !== 'Pending-Carrier-Confirmation') {
        const carrierId = newData.carrierId;
        
        if (carrierId) {
            const carrierSnap = await db.collection('users').doc(carrierId).get();
            const tokens = carrierSnap.data()?.fcmTokens || [];
            
            if (tokens.length > 0) {
                await messaging.sendMulticast({
                    tokens: tokens,
                    notification: {
                        title: 'طلب حجز جديد! 🎟️',
                        body: `لديك طلب حجز جديد بـ ${newData.seats} مقاعد. تفقد صندوق المهام.`
                    },
                    data: {
                        type: 'BOOKING_REQUEST',
                        bookingId: bookingId,
                        url: '/carrier/bookings'
                    }
                });
            }
        }
    }

    // 2. Carrier Accepted -> Notify Traveler to Pay
    if (newData.status === 'Pending-Payment' && oldData.status === 'Pending-Carrier-Confirmation') {
        const userSnap = await db.collection('users').doc(newData.userId).get();
        const tokens = userSnap.data()?.fcmTokens || [];

        if (tokens.length > 0) {
             await messaging.sendMulticast({
                tokens: tokens,
                notification: {
                    title: 'تمت الموافقة على حجزك! ✅',
                    body: 'وافق الناقل على طلبك. يرجى إتمام دفع العربون لتثبيت المقعد.'
                },
                data: {
                    type: 'BOOKING_APPROVED',
                    bookingId: bookingId,
                    url: '/history'
                }
            });
        }
    }
    
    return null;
  });

// ---------------------------------------------------------------------
// 6. Sovereign Admin Creator [SC-179]
// ---------------------------------------------------------------------
export const createSovereignAdmin = onCall(async (request) => {
  if (request.auth?.token.role !== 'owner') {
    throw new HttpsError('permission-denied', 'Access Restricted to Supreme Commander.');
  }

  const { email, password, firstName, lastName, permissions } = request.data;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      firstName,
      lastName,
      email,
      role: 'admin',
      permissions: permissions || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});


// (+) [SC-182] THE FINANCIAL BRAIN (Auto-Freeze Logic)
// This function runs once daily to freeze accounts with expired subscriptions.
export const runFinancialAudit = onCall(async (request) => {
    // Security: Manual trigger by Owner or Admin only for now.
    if (request.auth?.token.role !== 'owner' && request.auth?.token.role !== 'admin') {
         throw new HttpsError('permission-denied', 'Financial Audit is Restricted.');
    }

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const batch = db.batch();
    let operationCount = 0;

    try {
        // Find users who are NOT financially frozen but their subscription expiry is in the past.
        const expiredUsersSnapshot = await db.collection('users')
            .where('isFinancialFrozen', '==', false)
            .where('subscriptionExpiresAt', '<', now)
            .limit(400) // Protocol 88: Process in batches to protect resources
            .get();

        if (expiredUsersSnapshot.empty) {
            return { success: true, message: "No expired accounts found." };
        }

        expiredUsersSnapshot.docs.forEach((doc) => {
            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, {
                isFinancialFrozen: true,
                subscriptionStatus: 'expired',
                lastAuditDate: now
            });
            operationCount++;
        });

        await batch.commit();
        console.log(`[Financial Brain] Froze ${operationCount} expired accounts.`);
        return { success: true, count: operationCount };

    } catch (error: any) {
        console.error("Financial Audit Failed:", error);
        throw new HttpsError('internal', error.message);
    }
});
// [SC-188] THE TRUST ENGINE (Accept Booking with Overdraft Logic)
export const acceptBookingSafe = onCall(async (request) => {
    if (request.auth?.token.role !== 'carrier') {
         throw new HttpsError('permission-denied', 'Carrier access only.');
    }

    const { bookingId } = request.data;
    const carrierId = request.auth.uid;
    const db = admin.firestore();
    const carrierRef = db.collection('users').doc(carrierId);
    const bookingRef = db.collection('bookings').doc(bookingId);

    try {
        await db.runTransaction(async (t) => {
            const carrierDoc = await t.get(carrierRef);
            const bookingDoc = await t.get(bookingRef);

            if (!bookingDoc.exists) throw new HttpsError('not-found', 'Booking not found.');
            if (bookingDoc.data()?.status !== 'Pending-Carrier-Confirmation') {
                throw new HttpsError('failed-precondition', 'Booking is not pending.');
            }

            const userData = carrierDoc.data();
            
            // 1. فحص الاشتراك (نسخ منطق 90 يوم للسيرفر لضمان SSOT)
            const createdAt = userData?.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData?.createdAt);
            const daysElapsed = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const isFreePeriod = daysElapsed < 90;

            // 2. منطق الطوارئ
            if (!isFreePeriod) {
                // انتهت الفترة المجانية، نفحص رصيد الطوارئ
                if (userData?.hasUsedEmergencyCredit) {
                    // استنفذ الفرصة
                    throw new HttpsError('resource-exhausted', 'SUBSCRIPTION_EXPIRED');
                } else {
                    // لم يستخدمها بعد -> امنحه السلفة
                    t.update(carrierRef, { hasUsedEmergencyCredit: true });
                    // يمكن إضافة منطق تسجيل دين مالي هنا لاحقاً
                }
            }

            // 3. قبول الرحلة
            t.update(bookingRef, { status: 'Pending-Payment', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        });

        return { success: true, message: "Booking accepted successfully." };

    } catch (error: any) {
        console.error("Accept Booking Failed:", error);
        throw new HttpsError(error.code || 'internal', error.message); 
    }
});

// [SC-194] SOVEREIGN EXIT PROTOCOL (Anonymization Engine)
export const deleteTravelerAccount = onCall(async (request) => {
    // 1. Security Barrier
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in to delete account.');
    }
    
    const uid = request.auth.uid;
    const db = admin.firestore();
    
    try {
        // 2. Verify Role (Protect Carriers/Admins from accidental suicide)
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.data()?.role !== 'traveler') {
             throw new HttpsError('permission-denied', 'Only travelers can self-destruct via this channel.');
        }

        // 3. The Anonymization Process (Soft Delete in DB)
        // We wipe PII but keep the doc ID so historical bookings don't break null-checks.
        await db.collection('users').doc(uid).update({
            firstName: 'Deleted User',
            lastName: 'Anonymized',
            email: `deleted_${uid}@safargate.void`,
            phoneNumber: admin.firestore.FieldValue.delete(),
            photoURL: null,
            fcmTokens: [],
            isDeactivated: true,
            deletedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 4. The Execution (Hard Delete in Auth)
        // This prevents the user from ever logging in again.
        await admin.auth().deleteUser(uid);

        return { success: true, message: "Identity neutralized. Archive preserved." };

    } catch (error: any) {
        console.error("Self-Destruct Failed:", error);
        throw new HttpsError('internal', error.message);
    }
});
