'use client';

import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Offer, Trip } from "./data";

/**
 * Creates a new offer for a trip request.
 * Encapsulates the logic for creating an offer document in Firestore.
 * @returns {Promise<boolean>} True if the offer was sent successfully, false otherwise.
 */
export const sendOffer = async (
    firestore: Firestore,
    user: User,
    trip: Trip,
    offerData: Omit<Offer, 'id' | 'tripId' | 'carrierId' | 'status' | 'createdAt'>
): Promise<boolean> => {
    try {
        const offersCollection = collection(firestore, 'trips', trip.id, 'offers');
        const offerPayload: Omit<Offer, 'id'> = {
            ...offerData,
            tripId: trip.id,
            carrierId: user.uid,
            status: 'Pending',
            createdAt: serverTimestamp() as any,
        };

        await addDoc(offersCollection, offerPayload);
        return true; // Return success
    } catch (error) {
        console.error("Error sending offer:", error);
        return false; // Return failure
    }
};
