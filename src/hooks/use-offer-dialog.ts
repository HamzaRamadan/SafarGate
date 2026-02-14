'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { sendOffer } from '@/lib/carrier-actions';
import { suggestOfferPrice, type SuggestOfferPriceInput, type SuggestOfferPriceOutput } from '@/ai/flows/suggest-offer-price-flow';
import type { Trip, Offer } from '@/lib/data';

export function useOfferDialog() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [priceSuggestion, setPriceSuggestion] = useState<SuggestOfferPriceOutput | null>(null);
    const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);

    const openOfferDialog = (trip: Trip) => {
        setSelectedTrip(trip);
        setPriceSuggestion(null);
        setIsDialogOpen(true);
    };

    const handleSuggestPrice = async () => {
        if (!selectedTrip) return;
        setIsSuggestingPrice(true);
        setPriceSuggestion(null);
        try {
            const input: SuggestOfferPriceInput = {
                origin: selectedTrip.origin,
                destination: selectedTrip.destination,
                passengers: selectedTrip.passengers || 1,
                departureDate: selectedTrip.departureDate,
            };
            const suggestion = await suggestOfferPrice(input);
            setPriceSuggestion(suggestion);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "فشل اقتراح السعر",
                description: "حدث خطأ أثناء التواصل مع الذكاء الاصطناعي."
            });
        } finally {
            setIsSuggestingPrice(false);
        }
    };

    const handleSendOffer = async (offerData: Omit<Offer, 'id' | 'tripId' | 'carrierId' | 'status' | 'createdAt'>): Promise<boolean> => {
        if (!firestore || !user || !selectedTrip) return false;
        
        const success = await sendOffer(firestore, user, selectedTrip, offerData);
        
        if (success) {
            toast({ title: 'تم إرسال العرض بنجاح!', description: 'سيتم إعلام المسافر بعرضك.' });
            setIsDialogOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'فشل إرسال العرض', description: 'حدث خطأ ما.' });
        }
        return success;
    };

    return {
        selectedTrip,
        isDialogOpen,
        priceSuggestion,
        isSuggestingPrice,
        openOfferDialog,
        setIsDialogOpen,
        handleSuggestPrice,
        handleSendOffer,
    };
}
