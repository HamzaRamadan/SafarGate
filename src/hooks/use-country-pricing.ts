'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PricingRule } from '@/lib/data';

export function useCountryPricing(countryCode: string = 'JO') {
  const firestore = useFirestore();
  const [rule, setRule] = useState<PricingRule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !countryCode) return;

    const fetchPricing = async () => {
      setLoading(true);
      try {
        // Protocol 88: Single Read Operation
        const docRef = doc(firestore, 'pricing_rules', countryCode.toUpperCase());
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
          setRule({ id: snapshot.id, ...snapshot.data() } as PricingRule);
        } else {
          // Fallback to Jordan default if not found
          setRule({
             id: 'JO', countryName: 'Default', currency: 'JOD',
             travelerBookingFee: 0.5, travelerDiscount: 0.5,
             carrierSeatPrice: 0.1, carrierMonthlySub: 50, isActive: true
          });
        }
      } catch (error) {
        console.error("Pricing Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [firestore, countryCode]);

  return { rule, loading };
}
