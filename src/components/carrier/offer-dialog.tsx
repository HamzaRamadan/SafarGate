'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Trip, Offer } from '@/lib/data';
import { Loader2, Send, Sparkles, ListChecks, Clock, Save } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { SuggestOfferPriceOutput } from '@/ai/flows/suggest-offer-price-flow';
import { Badge } from '../ui/badge';
import { updateDoc } from 'firebase/firestore';
import { useCountryPricing } from '@/hooks/use-country-pricing';

const offerFormSchema = z.object({
  price: z.coerce.number().positive('يجب أن يكون السعر رقماً موجباً'),
  currency: z.string().min(1, "العملة مطلوبة").max(10, "رمز العملة طويل جداً"),
  vehicleType: z.string().min(3, 'نوع المركبة مطلوب'),
  depositPercentage: z.coerce.number().min(0, "العربون لا يمكن أن يكون سالباً"), // Free Market: No Max Limit
  notes: z.string().optional(),
  conditions: z.string().max(200, "الشروط يجب ألا تتجاوز 200 حرف").optional(),
  estimatedDurationHours: z.coerce.number().min(1, "يجب تحديد مدة ساعة واحدة على الأقل").max(48, "المدة طويلة جداً"),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

interface OfferDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  trip: Trip;
  suggestion: SuggestOfferPriceOutput | null;
  isSuggestingPrice: boolean;
  onSuggestPrice: () => void;
  onSendOffer: (offerData: Omit<Offer, 'id' | 'tripId' | 'carrierId' | 'status' | 'createdAt'>) => Promise<boolean>;
}

export function OfferDialog({ isOpen, onOpenChange, trip, suggestion, isSuggestingPrice, onSuggestPrice, onSendOffer }: OfferDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, userProfileRef } = useUserProfile();
  const { toast } = useToast();

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      price: undefined,
      vehicleType: '',
      depositPercentage: 10,
      notes: '',
      conditions: '',
      currency: 'د.أ',
      estimatedDurationHours: undefined,
    },
  });
  
  const [templates, setTemplates] = useState<{name: string, price: number, notes: string}[]>([]);
  const [templateName, setTemplateName] = useState('');

  const priceValue = form.watch('price');
  const notesValue = form.watch('notes');
  const conditionsValue = form.watch('conditions');
  const depositPercentageValue = form.watch('depositPercentage');

  // [SC-216] Injected: Carrier Sovereignty Currency Lock
  const countryCodeMap: { [key: string]: string } = {
      jordan: 'JO', lebanon: 'LB', ksa: 'SA', syria: 'SY', iraq: 'IQ',
      kuwait: 'KW', bahrain: 'BH', qatar: 'QA', uae: 'AE', oman: 'OM',
      yemen: 'YE', iran: 'IR', turkey: 'TR',
  };
  const carrierCountryCode = (profile?.jurisdiction?.origin && countryCodeMap[profile.jurisdiction.origin]) || 'JO';
  const { rule: pricingRule } = useCountryPricing(carrierCountryCode);

  useEffect(() => {
    if (isOpen && pricingRule) {
      form.setValue('currency', pricingRule.currency, { shouldValidate: true });
    }
  }, [isOpen, pricingRule, form, profile]);


  useEffect(() => {
    if (isOpen) {
        try {
            const localSaved = localStorage.getItem('carrier_offer_templates_v1');
            if (localSaved) {
                setTemplates(JSON.parse(localSaved));
            } else if (profile?.savedTemplates) {
                setTemplates(profile.savedTemplates);
                localStorage.setItem('carrier_offer_templates_v1', JSON.stringify(profile.savedTemplates));
            }
        } catch (e) {
            console.error("Template load error", e);
        }
    }
  }, [isOpen, profile]);

  const saveTemplate = async () => {
      if (!templateName || !priceValue) return;
      
      const newTemplate = { name: templateName, price: priceValue, notes: notesValue || '' };
      const updated = [...templates, newTemplate];
      
      setTemplates(updated);
      localStorage.setItem('carrier_offer_templates_v1', JSON.stringify(updated));
      setTemplateName('');
      
      if (userProfileRef) {
          updateDoc(userProfileRef, { savedTemplates: updated }).catch(e => {
              console.warn("Cloud backup failed (Network issue?)", e); 
          });
      }
      
      toast({ title: "تم حفظ القالب", description: "تم الحفظ محلياً ونسخ احتياطياً للسحابة." });
  };

  const loadTemplate = (t: {price: number, notes: string}) => {
      form.setValue('price', t.price, { shouldValidate: true });
      if (t.notes) form.setValue('notes', t.notes, { shouldValidate: true });
      toast({ title: "تم تطبيق القالب", description: "تم تعبئة البيانات بنجاح." });
  };
  
  const depositAmount = useMemo(() => {
    const price = priceValue || 0;
    const percentage = depositPercentageValue || 0;
    return (price * (percentage / 100)).toFixed(2);
  }, [priceValue, depositPercentageValue]);


  useEffect(() => {
    if (suggestion) {
        form.setValue('price', suggestion.suggestedPrice);
    }
  }, [suggestion, form]);

  useEffect(() => {
    if (isOpen) {
        form.setValue('price', trip.targetPrice || 0);
        form.setValue('vehicleType', profile?.vehicleType || '');
        
        const defaultConditions = [];
        if (profile?.bagsPerSeat) defaultConditions.push(`حقيبة ${profile.bagsPerSeat} لكل راكب.`);
        if (profile?.numberOfStops !== undefined) {
            if (profile.numberOfStops === 0) defaultConditions.push('الرحلة مباشرة بدون توقف.');
            else defaultConditions.push(`تتضمن الرحلة ${profile.numberOfStops} محطة توقف.`);
        }
        if (defaultConditions.length > 0) {
            form.setValue('conditions', defaultConditions.join('\n'));
        }

    }
  }, [profile, form, isOpen, trip]);

  const onSubmit = async (data: OfferFormValues) => {
    if (!profile) {
        toast({
            title: "خطأ في الملف الشخصي",
            description: "لا يمكن إرسال العرض بدون بيانات الناقل.",
            variant: "destructive",
        });
        return;
    }
    
    // [SC-133 FIX] The Financial Shield (Mirroring Add Trip Logic)
    if (data.depositPercentage > 0 && (!profile.paymentInformation || profile.paymentInformation.trim().length < 5)) {
        toast({
            variant: "destructive",
            title: "بيانات الدفع ناقصة",
            description: "لطلب عربون، يجب عليك أولاً تحديد تفاصيل استلام الدفع في صفحة الشروط الدائمة.",
        });
        return; 
    }

    setIsSubmitting(true);

    const fullOfferData = {
        ...data,
        vehicleCategory: (profile?.vehicleCapacity || 0) > 7 ? 'bus' : 'small',
        vehicleModelYear: profile?.vehicleYear ? parseInt(profile.vehicleYear, 10) : undefined,
        availableSeats: profile?.vehicleCapacity,
    };
    
    const success = await onSendOffer(fullOfferData as any);
    
    if(success) {
      onOpenChange(false);
      form.reset();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>تقديم عرض جديد</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل عرضك لرحلة {trip.origin} إلى {trip.destination}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="flex items-center justify-between gap-2 bg-muted/30 p-2 rounded-lg border border-dashed">
                <div className="flex gap-2 items-center overflow-x-auto" style={{WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {templates.length === 0 ? (
                        <span className="text-xs text-muted-foreground px-2">لا توجد قوالب محفوظة</span>
                    ) : (
                        templates.map((t, idx) => (
                            <Badge 
                                key={idx} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
                                onClick={() => loadTemplate(t)}
                            >
                                {t.name}
                            </Badge>
                        ))
                    )}
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Input 
                        placeholder="اسم القالب..." 
                        className="h-7 w-24 text-xs" 
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={saveTemplate} disabled={!templateName || !priceValue}>
                        <Save className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>السعر الإجمالي</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>العملة</FormLabel>
                        <FormControl>
                           <Input 
                            {...field} 
                            disabled 
                            className="bg-muted/50 text-muted-foreground font-mono cursor-not-allowed" 
                          />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             
             <Button type="button" variant="outline" className="w-full" onClick={onSuggestPrice} disabled={isSuggestingPrice}>
                {isSuggestingPrice ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Sparkles className="ml-2 h-4 w-4 text-yellow-500" />}
                {isSuggestingPrice ? 'جاري التفكير...' : 'اقترح لي سعراً مناسباً (AI)'}
             </Button>
            {suggestion && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
                    <p><strong>تعليل الاقتراح:</strong> {suggestion.justification}</p>
                </div>
            )}
            
             <FormField
                control={form.control}
                name="depositPercentage"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center mb-2">
                            <FormLabel>نسبة العربون</FormLabel>
                            <span className="text-sm font-bold text-primary">قيمة العربون: {depositAmount} {form.watch('currency')}</span>
                        </div>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر نسبة العربون" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {[0, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(p => <SelectItem key={p} value={String(p)}>{p}%</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المركبة</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., GMC Yukon 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedDurationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      مدة الرحلة (ساعات)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="مثلاً: 4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1'>
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    شروط العرض (اختياري)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="شروط خاصة بهذا العرض فقط (مثل: التوقف في مكان محدد)"
                      className="resize-none"
                      {...field}
                      maxLength={200}
                    />
                  </FormControl>
                   <div className="text-xs text-muted-foreground text-left">
                        {conditionsValue?.length || 0}/200
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="اذكر أي تفاصيل إضافية هنا (مثل: التوقف للاستراحة، وجود واي فاي...)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الإرسال...
                    </>
                ) : (
                    <>
                        <Send className="ml-2 h-4 w-4" />
                        إرسال العرض
                    </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
