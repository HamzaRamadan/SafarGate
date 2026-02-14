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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { collection, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, 
  Send, 
  Clock, 
  PlaneTakeoff, 
  PlaneLanding, 
  Settings, 
  ListChecks, 
  MapPin, 
  Wallet, 
  Info, 
  Link as LinkIcon, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Textarea } from '@/components/ui/textarea';
import { CITIES, getCityName } from '@/lib/constants';
import { combineDateAndTime } from '@/lib/formatters';
import { useCountryPricing } from '@/hooks/use-country-pricing';

// --- Zod Schema Definitions ---
const addTripSchema = z.object({
  origin: z.string().min(1, 'مدينة الانطلاق مطلوبة'),
  destination: z.string().min(1, 'مدينة الوصول مطلوبة'),
  departureDate: z.date({ required_error: 'تاريخ المغادرة مطلوب' }),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "الرجاء إدخال وقت صالح (صيغة 24 ساعة HH:MM)",
  }),
  meetingPoint: z.string().min(3, 'نقطة التجمع مطلوبة'),
  meetingPointLink: z.string().url('الرجاء إدخال رابط خرائط جوجل صالح').optional().or(z.literal('')),
  price: z.coerce.number().positive('السعر يجب أن يكون رقماً موجباً'),
  currency: z.string().min(1, "العملة مطلوبة").max(10, "رمز العملة طويل جداً"),
  availableSeats: z.coerce.number().int().min(1, 'يجب توفر مقعد واحد على الأقل'),
  depositPercentage: z.coerce.number().min(0, "النسبة لا يمكن أن تكون سالبة"), // Free Market: No Max Limit
  estimatedDurationHours: z.coerce.number().positive('مدة الرحلة التقريبية بالساعات إلزامية لتفعيل نظام التقييم.'),
  conditions: z.string().max(200, 'الشروط يجب ألا تتجاوز 200 حرف').optional(),
});

type AddTripFormValues = z.infer<typeof addTripSchema>;

interface AddTripDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddTripDialog({ isOpen, onOpenChange }: AddTripDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');

  const form = useForm<AddTripFormValues>({
    resolver: zodResolver(addTripSchema),
    defaultValues: {
      origin: '',
      destination: '',
      departureTime: '',
      meetingPoint: '',
      meetingPointLink: '',
      price: undefined,
      availableSeats: 4,
      depositPercentage: 10,
      estimatedDurationHours: undefined,
      conditions: '',
      currency: 'د.أ',
    }
  });

  // [SC-216] Injected: Carrier Sovereignty Currency Lock
  const countryCodeMap: { [key: string]: string } = {
      jordan: 'JO', lebanon: 'LB', ksa: 'SA', syria: 'SY', iraq: 'IQ',
      kuwait: 'KW', bahrain: 'BH', qatar: 'QA', uae: 'AE', oman: 'OM',
      yemen: 'YE', iran: 'IR', turkey: 'TR',
  };
  // The currency is now tied to the CARRIER's home country (from their profile jurisdiction), not the trip's origin.
  const carrierCountryCode = (profile?.jurisdiction?.origin && countryCodeMap[profile.jurisdiction.origin]) || 'JO';
  const { rule: pricingRule } = useCountryPricing(carrierCountryCode);

  useEffect(() => {
    // This effect runs when the dialog opens (profile becomes available) or if the pricing rule loads.
    // It sets the currency based on the carrier's permanent jurisdiction.
    if (isOpen && pricingRule) {
      form.setValue('currency', pricingRule.currency, { shouldValidate: true });
    }
  }, [isOpen, pricingRule, form, profile]);

  // [SC-133 FIX] Reactive Injection Engine
  useEffect(() => {
    if (isOpen && profile) {
      const defaultValues: Partial<AddTripFormValues> = {};
      
      if (profile.jurisdiction?.origin) setOriginCountry(profile.jurisdiction.origin);
      if (profile.jurisdiction?.destination) setDestinationCountry(profile.jurisdiction.destination);
      
      defaultValues.availableSeats = profile.vehicleCapacity || 4;
      
      let autoConditions = "";
      if (profile.bagsPerSeat !== undefined) {
          autoConditions += `- عدد الحقائب المسموح: ${profile.bagsPerSeat}\n`;
      }
      if (profile.numberOfStops !== undefined) {
          if (profile.numberOfStops === 0) autoConditions += "- الرحلة مباشرة بدون توقف.\n";
          else autoConditions += `- عدد التوقفات: ${profile.numberOfStops}\n`;
      }
      if (profile.paymentInformation) {
          autoConditions += `${profile.paymentInformation}\n`;
      }
      defaultValues.conditions = autoConditions;

      form.reset({
        origin: '',
        destination: '',
        price: undefined,
        estimatedDurationHours: undefined,
        departureTime: '',
        meetingPoint: '',
        meetingPointLink: '',
        depositPercentage: 10,
        currency: 'د.أ',
        ...defaultValues,
      });
    }
  }, [isOpen, profile, form]);

  const conditionsValue = form.watch('conditions');
  const priceValue = form.watch('price');
  const depositPercentageValue = form.watch('depositPercentage');

  const depositAmount = useMemo(() => {
    const price = priceValue || 0;
    const percentage = depositPercentageValue || 0;
    return (price * (percentage / 100)).toFixed(2);
  }, [priceValue, depositPercentageValue]);

  const onSubmit = async (data: AddTripFormValues) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب أن تكون مسجلاً لإنشاء رحلة.' });
      return;
    }
    
    // [SC-133 FIX] The Financial Shield
    if (data.depositPercentage > 0 && (!profile.paymentInformation || profile.paymentInformation.trim().length < 5)) {
        toast({
            variant: "destructive",
            title: "بيانات الدفع ناقصة",
            description: "لطلب عربون، يجب عليك أولاً تحديد تفاصيل استلام الدفع (بنك/محفظة) في صفحة 'الشروط الدائمة'.",
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const tripsCollection = collection(firestore, 'trips');
      
      const combinedDepartureDateTime = combineDateAndTime(data.departureDate, data.departureTime);

      const tripData = {
        ...data,
        departureDate: combinedDepartureDateTime.toISOString(),
        userId: user.uid,
        carrierId: user.uid,
        carrierName: profile.firstName,
        vehicleType: profile.vehicleType || 'غير محدد',
        vehicleImageUrls: profile.vehicleImageUrls || [],
        vehiclePlateNumber: profile?.plateNumber || '',
        vehicleCapacity: profile?.vehicleCapacity || 0,
        vehicleCategory: profile.vehicleCapacity && profile.vehicleCapacity > 7 ? 'bus' : 'small',
        status: 'Planned' as const,
        bagsPerSeat: profile.bagsPerSeat,
        numberOfStops: profile.numberOfStops,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      delete (tripData as any).departureTime;

      await addDocumentNonBlocking(tripsCollection, tripData);

      toast({ title: 'تمت إضافة الرحلة بنجاح!', description: 'رحلتك الآن متاحة للمسافرين للحجز.' });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to add trip:', error);
      toast({ variant: 'destructive', title: 'فشل إضافة الرحلة', description: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>تأسيس رحلة مجدولة جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل رحلتك لجعلها متاحة للحجز من قبل المسافرين.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className='p-2 bg-blue-950/50 border border-blue-800 rounded-lg text-blue-300 text-xs flex items-center gap-2'>
              <Info className='h-4 w-4'/>
              <span>يتم تعبئة بعض الحقول تلقائياً من "الشروط الدائمة" الخاصة بك.</span>
            </div>
            
            <Card className="bg-muted/30 border-accent/20">
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className='space-y-2'>
                      <Label className='flex items-center gap-2 font-bold text-accent'><PlaneTakeoff className='h-4 w-4' /> من</Label>
                        <Select onValueChange={setOriginCountry} value={originCountry}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="اختر دولة الانطلاق" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(CITIES).map(([key, {name}]) => (
                              <SelectItem key={key} value={key}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <FormField control={form.control} name="origin" render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value} disabled={!originCountry}>
                                      <SelectTrigger className="bg-background"><SelectValue placeholder="اختر مدينة الانطلاق" /></SelectTrigger>
                                      <SelectContent>
                                      {originCountry && CITIES[originCountry as keyof typeof CITIES]?.cities.map(cityKey => (
                                          <SelectItem key={cityKey} value={cityKey}>{getCityName(cityKey)}</SelectItem>
                                      ))}
                                      </SelectContent>
                                  </Select>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                        )}/>
                  </div>
                   <div className='space-y-2'>
                      <Label className='flex items-center gap-2 font-bold text-accent'><PlaneLanding className='h-4 w-4' /> إلى</Label>
                      <Select onValueChange={setDestinationCountry} value={destinationCountry}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="اختر دولة الوصول" /></SelectTrigger>
                          <SelectContent>
                          {Object.entries(CITIES).filter(([key]) => key !== originCountry).map(([key, {name}]) => (
                              <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                       <FormField control={form.control} name="destination" render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value} disabled={!destinationCountry}>
                                      <SelectTrigger className="bg-background"><SelectValue placeholder="اختر مدينة الوصول" /></SelectTrigger>
                                      <SelectContent>
                                      {destinationCountry && CITIES[destinationCountry as keyof typeof CITIES]?.cities.map(cityKey => (
                                          <SelectItem key={cityKey} value={cityKey}>{getCityName(cityKey)}</SelectItem>
                                      ))}
                                      </SelectContent>
                                  </Select>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}/>
                  </div>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full" defaultValue='details'>
              <AccordionItem value="details" className="border rounded-lg bg-muted/30">
                <AccordionTrigger className="p-4 font-semibold text-sm hover:no-underline">
                    <div className='flex items-center gap-2'>
                        <Settings className='h-4 w-4'/>
                        التفاصيل التشغيلية
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="departureDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>تاريخ المغادرة</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input 
                                        type="date" 
                                        className="bg-card block w-full pl-10 text-left" 
                                        {...field}
                                        value={field.value ? format(field.value, "yyyy-MM-dd") : ''}
                                        onChange={(e) => {
                                            const dateVal = e.target.value ? new Date(e.target.value) : undefined;
                                            field.onChange(dateVal);
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                     
                     <FormField control={form.control} name="departureTime" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>وقت المغادرة</FormLabel>
                            <FormControl>
                                <Input type="time" className="bg-card" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                     )}/>
                  </div>
                  
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField control={form.control} name="meetingPoint" render={({ field }) => (<FormItem><FormLabel className='flex items-center gap-1'><MapPin className="h-4 w-4"/>نقطة التجمع</FormLabel><FormControl><Input className="bg-card" placeholder="مثال: العبدلي - بجانب جت" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="meetingPointLink" render={({ field }) => (<FormItem><FormLabel className='flex items-center gap-1'><LinkIcon className="h-4 w-4"/>رابط الموقع (اختياري)</FormLabel><FormControl><Input className="bg-card" dir="ltr" placeholder="https://maps.app.goo.gl/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                   </div>
                  
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="availableSeats" render={({ field }) => (
                          <FormItem>
                              <FormLabel>عدد المقاعد المتاحة</FormLabel>
                              <FormControl><Input className="bg-card" type="number" placeholder="e.g., 4" {...field} value={field.value ?? ''} /></FormControl>
                              <FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="estimatedDurationHours" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary"/>مدة الرحلة التقريبية (ساعة)</FormLabel>
                                <FormControl><Input className="bg-card" type="number" placeholder="e.g., 8" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                   </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="financials" className="border rounded-lg bg-muted/30">
                 <AccordionTrigger className="p-4 font-semibold text-sm hover:no-underline">
                    <div className='flex items-center gap-2'>
                        <Wallet className='h-4 w-4'/>
                        التفاصيل المالية
                    </div>
                </AccordionTrigger>
                 <AccordionContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem>
                                <FormLabel>سعر المقعد</FormLabel>
                                <FormControl><Input className="bg-card" type="number" placeholder="e.g., 50" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="currency" render={({ field }) => (
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
                        )}/>
                        <FormField control={form.control} name="depositPercentage" render={({ field }) => (
                            <FormItem>
                                <FormLabel>نسبة العربون</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="اختر نسبة" /></SelectTrigger></FormControl>
                                    <SelectContent>{[0, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(p => <SelectItem key={p} value={String(p)}>{p}%</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                    <div className="p-2 bg-background/50 border rounded-md text-center text-sm font-bold text-primary">
                        قيمة العربون للمقعد الواحد: {depositAmount} {form.watch('currency')}
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
             <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="conditions" className="border rounded-lg bg-muted/30">
                 <AccordionTrigger className="p-4 font-semibold text-sm hover:no-underline">
                    <div className='flex items-center gap-2'>
                        <ListChecks className='h-4 w-4'/>
                        الشروط والأحكام (اختياري)
                    </div>
                </AccordionTrigger>
                 <AccordionContent className="p-4 pt-0">
                     <FormField control={form.control} name="conditions" render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    placeholder="مثال: ممنوع التدخين، حقيبة واحدة فقط لكل راكب..."
                                    className="resize-none bg-card"
                                    {...field}
                                    maxLength={200}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <div className="text-xs text-muted-foreground text-left pt-1">
                                {conditionsValue?.length || 0}/200
                            </div>
                            <FormMessage />
                        </FormItem>
                     )}/>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>إلغاء</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الحفظ...</> : <><Send className="ml-2 h-4 w-4" /> نشر الرحلة</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
