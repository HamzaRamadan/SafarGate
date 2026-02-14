'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Send, Car, Share2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '../ui/scroll-area';

const requestSchema = z.object({
  preferredVehicle: z.enum(['any', 'small', 'bus']).default('any'),
  isShared: z.boolean().default(true),
  targetPrice: z.coerce.number().optional(),
  notes: z.string().max(200, 'الملاحظات يجب ألا تتجاوز 200 حرف').optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  searchParams: {
    origin: string;
    destination: string;
    departureDate?: Date;
    passengers: number;
    requestType: 'General' | 'Direct';
    targetCarrierId?: string;
  };
  onSuccess: () => void;
}

export function RequestDialog({ isOpen, onOpenChange, searchParams, onSuccess }: RequestDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      preferredVehicle: 'any',
      isShared: true,
      targetPrice: undefined,
      notes: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
      if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
        toast({
          variant: "destructive",
          title: "بيانات غير مكتملة",
          description: "يجب تحديد الأصل والوجهة والتاريخ أولاً.",
        });
        setTimeout(() => onOpenChange(false), 0);
      } else {
         form.reset({
            preferredVehicle: 'any',
            isShared: true,
            targetPrice: undefined,
            notes: '',
        });
      }
    }
  }, [isOpen, searchParams, onOpenChange, toast, form]);


  const onSubmit = async (data: RequestFormValues) => {
    if (!firestore || !user || !searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن إرسال الطلب. البيانات الأساسية مفقودة.' });
        return;
    }
    setIsSubmitting(true);
    try {
        const tripsCollection = collection(firestore, 'trips');
        
        const tripRequestData = {
            ...data,
            origin: searchParams.origin,
            destination: searchParams.destination,
            passengers: searchParams.passengers,
            passengersDetails: [], 
            departureDate: searchParams.departureDate.toISOString(),
            status: 'Awaiting-Offers' as const,
            userId: user.uid,
            requestType: searchParams.requestType,
            targetCarrierId: searchParams.targetCarrierId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await addDocumentNonBlocking(tripsCollection, tripRequestData);
        
        onOpenChange(false);
        onSuccess();

    } catch (error) {
        console.error('Failed to create trip request:', error);
        toast({ variant: 'destructive', title: 'فشل إرسال الطلب', description: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إرسال طلب رحلة</DialogTitle>
          <DialogDescription>
            أكمل التفاصيل التالية لإرسال طلبك إلى {searchParams.requestType === 'General' ? 'السوق العام' : 'الناقل المحدد'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="p-3 border rounded-lg bg-muted/50 space-y-2 text-sm">
                <p className="flex justify-between"><strong>من:</strong> {searchParams.origin}</p>
                <p className="flex justify-between"><strong>إلى:</strong> {searchParams.destination}</p>
                <p className="flex justify-between"><strong>التاريخ:</strong> {searchParams.departureDate ? new Date(searchParams.departureDate).toLocaleDateString('ar-SA') : 'N/A'}</p>
                <p className="flex justify-between"><strong>عدد الركاب:</strong> {searchParams.passengers}</p>
            </div>
            
            <ScrollArea className="max-h-[35vh] pr-3">
              <div className="space-y-4">
                <FormField control={form.control} name="preferredVehicle" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1"><Car className="h-4 w-4"/> المركبة المفضلة</FormLabel>
                         <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-2 pt-1">
                            <Label className="border rounded-md p-2 text-center cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                <FormControl><RadioGroupItem value="any" className="sr-only" /></FormControl><span>أي نوع</span>
                            </Label>
                             <Label className="border rounded-md p-2 text-center cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                <FormControl><RadioGroupItem value="small" className="sr-only" /></FormControl><span>صغيرة</span>
                            </Label>
                             <Label className="border rounded-md p-2 text-center cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                <FormControl><RadioGroupItem value="bus" className="sr-only" /></FormControl><span>حافلة</span>
                            </Label>
                        </RadioGroup>
                        <FormMessage />
                    </FormItem>
                )}/>

                 <FormField control={form.control} name="isShared" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-1"><Share2 className="h-4 w-4"/> رحلة مشتركة</FormLabel>
                            <DialogDescription className="text-xs">هل تقبل مشاركة الرحلة مع ركاب آخرين؟</DialogDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                 )}/>

                <FormField
                  control={form.control}
                  name="targetPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر المستهدف (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="كم تتوقع أن تدفع؟" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                        <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                        <FormControl><Textarea placeholder="مثل: وجود أمتعة كثيرة، أفضل الانطلاق باكراً..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>إلغاء</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الإرسال...</> : <><Send className="ml-2 h-4 w-4" /> إرسال الطلب</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
