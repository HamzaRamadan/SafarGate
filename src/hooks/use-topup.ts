'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { PaymentMethod } from '@/lib/data';

export function useTopup() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = async (amount: number, method: PaymentMethod, proofUrl: string, carrierName: string) => {
    if (!firestore || !user) return;

    setIsSubmitting(true);
    try {
      // 1. Create the request document in the Sovereign Treasury Collection
      await addDoc(collection(firestore, 'topup_requests'), {
        carrierId: user.uid,
        carrierName: carrierName,
        amount: amount,
        currency: 'JOD', // Default currency standard
        method: method,
        proofImageUrl: proofUrl,
        status: 'PENDING',
        createdAt: serverTimestamp(),
      });

      toast({
        title: "تم إرسال الطلب بنجاح 🚀",
        description: "سيتم مراجعة الحوالة وتفعيل الرصيد خلال وقت قصير.",
        className: "bg-green-50 text-green-800 border-green-200"
      });

      return true;

    } catch (error) {
      console.error("Topup Request Failed:", error);
      toast({
        variant: "destructive",
        title: "فشل الإرسال",
        description: "تأكد من الاتصال بالإنترنت وحاول مرة أخرى."
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitRequest,
    isSubmitting
  };
}
