import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Initialize Admin SDK Once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

// =====================================================================
// 1. NOTIFICATION SYSTEMS (Voice & Nervous System)
// =====================================================================

// New Offer Notification
export const onNewOffer = functions.firestore
  .document('trips/{tripId}/offers/{offerId}')
  .onCreate(async (snap, context) => {
    const offer = snap.data();
    const tripId = context.params.tripId;
    const offerId = context.params.offerId;

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

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: 'عرض سعر جديد لرحلتك! 🏷️',
            body: `الكابتن ${carrierName} قدم عرضاً بقيمة ${offer.price} ${offer.currency}.`,
          },
          data: {
            link: '/history',
            tripId: tripId,
            url: '/history'
          },
          tokens: tokens,
        };
        await admin.messaging().sendMulticast(message);
      }
    } catch (error) {
      console.error('Error in onNewOffer:', error);
    }
  });

// Trip Completion (Trigger Rating Cycle)
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

// Chat Notifications
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

      const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', recipientUids).get();

      const allTokens: string[] = [];
      const batch = db.batch();

      usersSnap.forEach(doc => {
          const userData = doc.data();
          if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
              allTokens.push(...userData.fcmTokens);
          }

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

      await batch.commit();

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
      }
    } catch (error) {
      console.error('Error in sendChatMessageNotification:', error);
    }
    return null;
  });

// =====================================================================
// 2. CORE LOGIC ENGINES
// =====================================================================

// The Verdict Engine (Weighted Rating)
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

      let calculatedScore = 0;
      if (details.priceAdherence === true) calculatedScore += 2.5;
      if (details.vehicleMatch === true) calculatedScore += 1.5;
      const starScore = (details.serviceStars || 0) / 5;
      calculatedScore += starScore;

      const finalRatingValue = parseFloat(calculatedScore.toFixed(2));

      await db.runTransaction(async (t) => {
        const carrierDoc = await t.get(carrierRef);
        if (!carrierDoc.exists) return;

        const carrierData = carrierDoc.data();
        const currentStats = carrierData?.ratingStats || { average: 0, count: 0 };

        const newCount = currentStats.count + 1;
        const oldTotal = currentStats.average * currentStats.count;
        const newAverage = (oldTotal + finalRatingValue) / newCount;

        let newTier = 'BRONZE';
        if (newAverage >= 4.8 && newCount > 50) newTier = 'PLATINUM';
        else if (newAverage >= 4.5 && newCount > 20) newTier = 'GOLD';
        else if (newAverage >= 4.0 && newCount > 10) newTier = 'SILVER';

        t.update(carrierRef, {
          ratingStats: {
            average: parseFloat(newAverage.toFixed(2)),
            count: newCount,
            tier: newTier
          }
        });

        t.update(snap.ref, { 
            finalCalculatedScore: finalRatingValue,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (bookingId) {
            const bookingRef = db.collection('bookings').doc(bookingId);
            t.update(bookingRef, { status: 'Rated' });
        }
      });
    } catch (error) {
      console.error('Error in onRatingCreated:', error);
    }
    return null
  });

// Booking Lifecycle & Auto-Group [SC-172]
export const onBookingStatusChange = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const bookingId = context.params.bookingId;

    if (newData.status === oldData.status) return null;

    // [SC-172] Auto-Group Creation
    if (newData.status === 'Confirmed' && oldData.status !== 'Confirmed') {
        const tripId = newData.tripId;
        const travelerId = newData.userId;
        const carrierId = newData.carrierId;
        const groupChatRef = db.collection('chats').doc(tripId);

        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(groupChatRef);
                if (!doc.exists) {
                    t.set(groupChatRef, {
                        id: tripId,
                        tripId: tripId,
                        isGroupChat: true,
                        type: 'trip_group',
                        participants: [carrierId, travelerId],
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        lastMessage: 'تم فتح باب الدردشة الجماعية للرحلة',
                        lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                        isClosed: false,
                        unreadCounts: { [carrierId]: 1, [travelerId]: 1 }
                    });
                } else {
                    t.update(groupChatRef, {
                        participants: admin.firestore.FieldValue.arrayUnion(travelerId),
                        [`unreadCounts.${travelerId}`]: admin.firestore.FieldValue.increment(1)
                    });
                }
            });
            await groupChatRef.collection('messages').add({
                content: '👋 انضم مسافر جديد إلى الرحلة',
                senderId: 'system',
                type: 'system',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('[SC-172] Failed to auto-join group chat:', error);
        }
    }

    // Notify Carrier
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

    // Notify Traveler
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

// =====================================================================
// 3. SOVEREIGN ADMIN & FINANCIAL TOOLS [SC-179, SC-182, SC-183, SC-192]
// =====================================================================

// [SC-179] Sovereign Admin Creator
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

// [SC-182 & SC-199] THE FINANCIAL BRAIN (Upgraded with Sovereign Veto)
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
        const expiredUsersSnapshot = await db.collection('users')
            .where('isFinancialFrozen', '==', false)
            .where('subscriptionExpiresAt', '<', now)
            .limit(400) // Protocol 88: Process in batches
            .get();

        if (expiredUsersSnapshot.empty) {
            return { success: true, message: "No expired accounts found." };
        }

        expiredUsersSnapshot.docs.forEach((doc) => {
            const userData = doc.data();
            
            // [SC-199] SOVEREIGN VETO LOGIC
            // إذا كان هناك إجراء سيادي (يدوي) خلال 48 ساعة، يتم تجاوز التجميد الآلي
            if (userData.lastAdminAction) {
                const lastActionTime = userData.lastAdminAction.toDate().getTime();
                const currentTime = Date.now(); 
                const hoursSinceLastAction = (currentTime - lastActionTime) / (1000 * 60 * 60);

                if (hoursSinceLastAction < 48) {
                    console.log(`[Sovereign Veto] Skipping freeze for user ${doc.id} due to recent admin action.`);
                    return; // 🛑 توقف وانتقل للمستخدم التالي (Veto applied)
                }
            }
            // [End of SC-199 Injection]

            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, {
                isFinancialFrozen: true,
                subscriptionStatus: 'expired',
                lastAuditDate: now
            });
            operationCount++;
        });

        if (operationCount > 0) {
            await batch.commit();
            console.log(`[Financial Brain] Froze ${operationCount} expired accounts.`);
        }

        return { success: true, count: operationCount };

    } catch (error: any) {
        console.error("Financial Audit Failed:", error);
        throw new HttpsError('internal', error.message);
    }
});


// [SC-192] THE TREASURY BRAIN (Approve Top-up & Activate Subscription)
export const approveTopup = onCall(async (request) => {
    // 1. Security Check: Only Admin/Owner
    if (request.auth?.token.role !== 'owner' && request.auth?.token.role !== 'admin') {
         throw new HttpsError('permission-denied', 'Financial Authority Restricted.');
    }

    const { requestId } = request.data;
    const db = admin.firestore();
    const requestRef = db.collection('topup_requests').doc(requestId);

    try {
        await db.runTransaction(async (t) => {
            const requestDoc = await t.get(requestRef);
            if (!requestDoc.exists) throw new HttpsError('not-found', 'Request not found.');
            
            const requestData = requestDoc.data();
            if (requestData?.status !== 'PENDING') {
                throw new HttpsError('failed-precondition', 'Request already processed.');
            }

            const carrierRef = db.collection('users').doc(requestData.carrierId);
            const carrierDoc = await t.get(carrierRef);
            if (!carrierDoc.exists) throw new HttpsError('not-found', 'Carrier not found.');

            // 2. Determine Action based on Amount (Logic mapping)
            // 50 JOD = Subscription Renewal | Others = Wallet Balance
            const isSubscription = requestData.amount >= 50; 
            
            // 3. Update Carrier Profile
            const now = admin.firestore.Timestamp.now();
            let updateData: any = {
                isFinancialFrozen: false, // Unfreeze immediately
                subscriptionStatus: 'active'
            };

            if (isSubscription) {
                // Extend Subscription by 30 Days from NOW
                const nextMonth = new Date();
                nextMonth.setDate(nextMonth.getDate() + 30);
                updateData.subscriptionExpiresAt = admin.firestore.Timestamp.fromDate(nextMonth);
            } else {
                // Add to Balance (Points System)
                const currentBalance = carrierDoc.data()?.walletBalance || 0;
                updateData.walletBalance = currentBalance + requestData.amount;
            }

            t.update(carrierRef, updateData);

            // 4. Update Request Status
            t.update(requestRef, {
                status: 'APPROVED',
                processedAt: now,
                processedBy: request.auth?.uid
            });

            // 5. Create Ledger Entry
            const transactionRef = carrierRef.collection('wallet_transactions').doc();
            t.set(transactionRef, {
                id: transactionRef.id,
                userId: requestData.carrierId,
                amount: requestData.amount,
                currency: requestData.currency,
                type: 'DEPOSIT',
                description: `Top-up Approved via ${requestData.method}`,
                createdAt: now,
                relatedRequestId: requestId
            });
        });

        return { success: true, message: "Top-up approved and processed." };

    } catch (error: any) {
        console.error("Approval Failed:", error);
        throw new HttpsError(error.code || 'internal', error.message); 
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
            t.update(bookingRef, { status: 'Confirmed', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
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


// [SC-198] SOVEREIGN JUSTICE ENGINE (Manual Freeze/Unfreeze with Audit)
export const toggleUserFreezeStatus = onCall(async (request) => {
    // 1. Security Check: Admin/Owner Only
    if (request.auth?.token.role !== 'owner' && request.auth?.token.role !== 'admin') {
         throw new HttpsError('permission-denied', 'Sovereign Authority Restricted.');
    }

    const { targetUserId, freezeType, reason } = request.data;
    
    if (!targetUserId || !freezeType) {
        throw new HttpsError('invalid-argument', 'User ID and Freeze Type are required.');
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(targetUserId);
    const logRef = db.collection('admin_logs').doc(); // Auto-generate ID for Audit Trail

    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new HttpsError('not-found', 'Target user not found.');

            const userData = userDoc.data();
            let newStatus;
            let fieldToUpdate;

            // Determine Freeze Logic based on Type
            if (freezeType === 'financial') {
                fieldToUpdate = 'isFinancialFrozen';
                newStatus = !(userData?.isFinancialFrozen || false); // Toggle
            } else if (freezeType === 'security') {
                fieldToUpdate = 'isDeactivated';
                newStatus = !(userData?.isDeactivated || false); // Toggle
            } else {
                throw new HttpsError('invalid-argument', 'Invalid freeze type.');
            }

            // 2. Update User Status (The Execution)
            t.update(userRef, { 
                [fieldToUpdate]: newStatus,
                lastAdminAction: admin.firestore.FieldValue.serverTimestamp() // Marker for Automation to respect
            });

            // 3. Create Immutable Audit Log (The Evidence)
            t.set(logRef, {
                adminId: request.auth?.uid,
                targetUserId: targetUserId,
                action: newStatus ? 'FREEZE' : 'UNFREEZE',
                freezeType: freezeType,
                reason: reason || 'Direct command from control panel.',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                snapshot: {
                    userEmail: userData?.email || 'N/A',
                    userRole: userData?.role || 'N/A'
                }
            });
        });

        return { success: true, message: "Sovereign command executed and logged." };

    } catch (error: any) {
        console.error("Justice Engine Failed:", error);
        throw new HttpsError(error.code || 'internal', error.message); 
    }
});

// [SC-200, SC-218] THE TREASURY REJECTION ARM (Bridged Void)
export const rejectTopup = onCall(async (request) => {
    // 1. Security Check: Admin/Owner Only
    if (request.auth?.token.role !== 'owner' && request.auth?.token.role !== 'admin') {
         throw new HttpsError('permission-denied', 'Financial Authority Restricted.');
    }

    const { requestId, reason } = request.data;
    
    if (!requestId) {
        throw new HttpsError('invalid-argument', 'Request ID is required.');
    }

    const db = admin.firestore();
    const requestRef = db.collection('topup_requests').doc(requestId);
    let requestData: any; // To hold data outside transaction

    try {
        await db.runTransaction(async (t) => {
            const requestDoc = await t.get(requestRef);
            if (!requestDoc.exists) throw new HttpsError('not-found', 'Request not found.');
            
            requestData = requestDoc.data();
            if (requestData?.status !== 'PENDING') {
                throw new HttpsError('failed-precondition', 'Request is not pending.');
            }

            // 2. Reject and Close
            t.update(requestRef, {
                status: 'REJECTED',
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: request.auth?.uid,
                rejectionReason: reason || 'Rejected by admin.'
            });
        });

        // --- [SC-218] Notification Injection START ---
        if (requestData?.carrierId) {
            try {
                const userDoc = await db.collection('users').doc(requestData.carrierId).get();
                const tokens = userDoc.data()?.fcmTokens;

                if (tokens && Array.isArray(tokens) && tokens.length > 0) {
                     await admin.messaging().sendMulticast({
                        tokens,
                        notification: {
                            title: '❌ تم رفض طلب الشحن',
                            body: `عذراً، تم رفض طلب شحن الرصيد. السبب: ${reason || 'يرجى مراجعة الإدارة'}.`,
                        },
                        data: {
                            type: 'TOPUP_REJECTED',
                            requestId: requestId,
                            url: '/carrier'
                        }
                    });
                    console.log(`[SC-218] Rejection notification sent to user ${requestData.carrierId}`);
                }
            } catch (msgError) {
                console.error('[SC-218] Failed to send rejection notification:', msgError);
            }
        }
        // --- [SC-218] Notification Injection END ---

        return { success: true, message: "Request rejected and user notified." };

    } catch (error: any) {
        console.error("Rejection Failed:", error);
        throw new HttpsError(error.code || 'internal', error.message); 
    }
});
