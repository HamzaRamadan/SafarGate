'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, ThumbsUp, ThumbsDown, Car, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import type { Trip } from '@/lib/data';

interface RateTripDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip | null;
  onConfirm: () => void;
}

export function RateTripDialog({ isOpen, onOpenChange, trip, onConfirm }: RateTripDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  
  // Specific Criteria (Simple Yes/No for objectivity)
  const [priceAdherence, setPriceAdherence] = useState<boolean | null>(null); // Did carrier stick to price?
  const [vehicleMatch, setVehicleMatch] = useState<boolean | null>(null);     // Was the car as advertised?

  if (!trip) return null;

  const handleSubmit = async () => {
    if (!firestore || !user || !trip.carrierId) return;

    if (stars === 0) {
        toast({ variant: "destructive", title: "التقييم مطلوب", description: "يرجى اختيار عدد النجوم." });
        return;
    }
    if (priceAdherence === null || vehicleMatch === null) {
        toast({ variant: "destructive", title: "معلومات ناقصة", description: "يرجى الإجابة على أسئلة الالتزام." });
        return;
    }

    setIsSubmitting(true);
    try {
      // 1. Prepare the Payload (Direct Write to Firestore)
      const ratingRef = doc(collection(firestore, 'ratings'));
      
      const ratingData = {
        id: ratingRef.id,
        tripId: trip.id,
        carrierId: trip.carrierId,
        userId: user.uid,
        // Raw Data for Cloud Function to process
        details: {
            serviceStars: stars,
            priceAdherence: priceAdherence,
            vehicleMatch: vehicleMatch,
            comment: comment.trim()
        },
        // Placeholder ratingValue (will be calculated by Cloud Function)
        ratingValue: 0, 
        createdAt: serverTimestamp(),
      };

      // 2. Execute Write Operation (Protocol 88: Single Request)
      await setDoc(ratingRef, ratingData);

      toast({
        title: "تم استلام التقييم بنجاح",
        description: "شكراً لك! رأيك يساهم في رفع جودة الخدمة.",
      });

      // 3. Close & Reset
      onConfirm(); 
      onOpenChange(false);
      setStars(0);
      setComment('');
      setPriceAdherence(null);
      setVehicleMatch(null);

    } catch (error) {
      console.error("Rating submission error:", error);
      toast({ variant: "destructive", title: "فشل الإرسال", description: "حدث خطأ أثناء حفظ التقييم." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">كيف كانت رحلتك؟</DialogTitle>
          <DialogDescription className="text-center">
            تقييمك للكابتن {trip.carrierName} يساعدنا في ضمان الجودة.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          {/* 1. Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStars(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                    className={cn(
                        "h-8 w-8 transition-colors", 
                        star <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )} 
                />
              </button>
            ))}
          </div>

          {/* 2. Objective Criteria */}
          <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-dashed">
             {/* Price Adherence */}
             <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4"/> هل التزم بالسعر؟</span>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant={priceAdherence === true ? "default" : "outline"} 
                        className={cn("h-7 px-2", priceAdherence === true && "bg-green-600 hover:bg-green-700")}
                        onClick={() => setPriceAdherence(true)}
                    >
                        <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button 
                        size="sm" 
                        variant={priceAdherence === false ? "destructive" : "outline"} 
                        className="h-7 px-2"
                        onClick={() => setPriceAdherence(false)}
                    >
                        <ThumbsDown className="h-3 w-3" />
                    </Button>
                </div>
             </div>

             {/* Vehicle Match */}
             <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2"><Car className="h-4 w-4"/> هل المركبة مطابقة؟</span>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant={vehicleMatch === true ? "default" : "outline"} 
                        className={cn("h-7 px-2", vehicleMatch === true && "bg-green-600 hover:bg-green-700")}
                        onClick={() => setVehicleMatch(true)}
                    >
                        <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button 
                        size="sm" 
                        variant={vehicleMatch === false ? "destructive" : "outline"} 
                        className="h-7 px-2"
                        onClick={() => setVehicleMatch(false)}
                    >
                        <ThumbsDown className="h-3 w-3" />
                    </Button>
                </div>
             </div>
          </div>

          {/* 3. Comment */}
          <Textarea
            placeholder="اكتب ملاحظاتك هنا (اختياري)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
            maxLength={200}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            تخطي
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || stars === 0}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "إرسال التقييم"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
