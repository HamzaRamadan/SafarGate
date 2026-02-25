// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import { useTranslations } from 'next-intl';
// import { useUserProfile } from '@/hooks/use-user-profile';
// import { updateDoc, serverTimestamp } from 'firebase/firestore';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Input } from '@/components/ui/input';
// import { Loader2, Save, ListChecks, Wallet } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
// import { useRouter } from 'next/navigation';
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { useCountryPricing } from '@/hooks/use-country-pricing';

// const pageSchema = z.object({
//   price: z.coerce.number().positive('السعر يجب أن يكون رقماً موجباً').optional(),
//   currency: z.string().default('د.أ'),
//   depositPercentage: z.coerce.number().min(0).default(10),
//   conditions: z.string().max(200).optional(),
// });

// type PageFormValues = z.infer<typeof pageSchema>;

// export default function CarrierPermanentPage() {
//   const t = useTranslations('carrierConditions');
//   const { profile, isLoading, userProfileRef } = useUserProfile();
//   const { toast } = useToast();
//   const router = useRouter();

//   const [formData, setFormData] = useState({
//     paymentInformation: '',
//     bagsPerSeat: '1',
//     numberOfStops: '0',
//     vehicleType: '',
//     vehicleYear: '',
//     plateNumber: '',
//     vehicleCapacity: '',
//     jurisdictionOrigin: '',
//     jurisdictionDest: '',
//     officeName: '',
//     officePhone: '',
//     sidePanelNumber: '',
//     vehicleCategory: '',
//   });

//   const [isSaving, setIsSaving] = useState(false);
//   const [vehicleImageFile, setVehicleImageFile] = useState<File | null>(null);
//   const [plateImageFile, setPlateImageFile] = useState<File | null>(null);
//   const [vehicleImagePreview, setVehicleImagePreview] = useState<string | null>(null);
//   const [plateImagePreview, setPlateImagePreview] = useState<string | null>(null);

//   const countryCodeMap: { [key: string]: string } = {
//     jordan: 'JO', lebanon: 'LB', ksa: 'SA', syria: 'SY', iraq: 'IQ',
//     kuwait: 'KW', bahrain: 'BH', qatar: 'QA', uae: 'AE', oman: 'OM',
//     yemen: 'YE', iran: 'IR', turkey: 'TR',
//   };
//   const carrierCountryCode = (profile?.jurisdiction?.origin && countryCodeMap[profile.jurisdiction.origin]) || 'JO';
//   const { rule: pricingRule } = useCountryPricing(carrierCountryCode);

//   const form = useForm<PageFormValues>({
//     resolver: zodResolver(pageSchema),
//     defaultValues: {
//       price: undefined,
//       currency: 'د.أ',
//       depositPercentage: 10,
//       conditions: '',
//     },
//   });

//   const conditionsValue = form.watch('conditions');
//   const priceValue = form.watch('price');
//   const depositPercentageValue = form.watch('depositPercentage');

//   const depositAmount = useMemo(() => {
//     const price = priceValue || 0;
//     const percentage = depositPercentageValue || 0;
//     return (price * (percentage / 100)).toFixed(2);
//   }, [priceValue, depositPercentageValue]);

//   // تحديث العملة تلقائياً من قواعد التسعير
//   useEffect(() => {
//     if (pricingRule) {
//       form.setValue('currency', pricingRule.currency, { shouldValidate: true });
//     }
//   }, [pricingRule, form]);

//   useEffect(() => {
//     if (profile) {
//       setFormData({
//         paymentInformation: profile.paymentInformation || '',
//         bagsPerSeat: profile.bagsPerSeat?.toString() || '1',
//         numberOfStops: profile.numberOfStops?.toString() || '0',
//         vehicleType: profile.vehicleType || '',
//         vehicleYear: profile.vehicleYear || '',
//         plateNumber: profile.plateNumber || '',
//         vehicleCapacity: profile.vehicleCapacity?.toString() || '',
//         jurisdictionOrigin: profile.jurisdiction?.origin || '',
//         jurisdictionDest: profile.jurisdiction?.destination || '',
//         officeName: profile.officeName || '',
//         officePhone: profile.officePhone || '',
//         sidePanelNumber: profile.sidePanelNumber || '',
//         vehicleCategory: profile.vehicleCategory || '',
//       });

//       // تعبئة حقول الفورم من البروفايل
//       form.reset({
//         price: profile.price ?? undefined,
//         currency: profile.currency || pricingRule?.currency || 'د.أ',
//         depositPercentage: profile.depositPercentage ?? 10,
//         conditions: profile.conditions || '',
//       });
//     }
//   }, [profile]);

//   const handleSave = async () => {
//     if (!userProfileRef) {
//       toast({ title: 'خطأ', description: 'الجلسة غير صالحة.', variant: 'destructive' });
//       return;
//     }

//     // تحقق من صحة حقول الفورم
//     const isFormValid = await form.trigger();
//     if (!isFormValid) {
//       toast({ title: 'خطأ', description: 'يرجى مراجعة البيانات المدخلة.', variant: 'destructive' });
//       return;
//     }

//     const formValues = form.getValues();

//     setIsSaving(true);
//     try {
//       const capacity = Number(formData.vehicleCapacity);
//       const isBus = capacity > 7;

//       const payload = {
//         paymentInformation: formData.paymentInformation,
//         bagsPerSeat: Number(formData.bagsPerSeat),
//         numberOfStops: Number(formData.numberOfStops),
//         vehicleType: formData.vehicleType,
//         vehicleYear: formData.vehicleYear,
//         plateNumber: formData.plateNumber,
//         vehicleCapacity: capacity,
//         vehicleCategory: isBus ? 'bus' : 'small',
//         jurisdiction: {
//           origin: formData.jurisdictionOrigin,
//           destination: formData.jurisdictionDest,
//         },
//         officeName: formData.officeName,
//         officePhone: formData.officePhone,
//         sidePanelNumber: formData.sidePanelNumber,
//         // ✅ حفظ السعر والعربون والعملة والشروط
//         price: formValues.price ?? null,
//         currency: formValues.currency,
//         depositPercentage: formValues.depositPercentage,
//         conditions: formValues.conditions || '',
//         updatedAt: serverTimestamp(),
//         isPartial: false,
//       };

//       await updateDoc(userProfileRef, payload);
//       toast({ title: t('saveButton'), description: 'تم الحفظ بنجاح' });
//       router.push('/carrier');
//     } catch (err) {
//       console.error(err);
//       toast({ title: 'Error', description: 'Failed to save. Try again.', variant: 'destructive' });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'vehicle' | 'plate') => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       if (type === 'vehicle') {
//         setVehicleImagePreview(reader.result as string);
//         setVehicleImageFile(file);
//       } else {
//         setPlateImagePreview(reader.result as string);
//         setPlateImageFile(file);
//       }
//     };
//     reader.readAsDataURL(file);
//   };

//   if (isLoading) {
//     return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
//   }

//   return (
//     <div className="container max-w-3xl mx-auto p-4 space-y-6" dir="rtl">
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <ListChecks className="h-6 w-6 text-primary" />
//             {t('titlePermanent')}
//           </CardTitle>
//           <CardDescription>{t('description')}</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">

//           {/* Permanent Operational Terms */}
//           <Card className="bg-muted/30 p-4 space-y-4">
//             <h4 className="font-semibold text-sm">{t('permanentConditions')}</h4>
//             <div className="space-y-2">
//               <Label>{t('paymentInfo')}</Label>
//               <Textarea placeholder={t('placeholders.paymentInfo')} value={formData.paymentInformation} onChange={e => setFormData({...formData, paymentInformation: e.target.value})} rows={3} />
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label>{t('bagsPerSeat')}</Label>
//                 <Select value={formData.bagsPerSeat} onValueChange={val => setFormData({...formData, bagsPerSeat: val})}>
//                   <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="0">0</SelectItem>
//                     <SelectItem value="1">1</SelectItem>
//                     <SelectItem value="2">2</SelectItem>
//                     <SelectItem value="3">3</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label>{t('numberOfStops')}</Label>
//                 <Select value={formData.numberOfStops} onValueChange={val => setFormData({...formData, numberOfStops: val})}>
//                   <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="0">0</SelectItem>
//                     <SelectItem value="1">1</SelectItem>
//                     <SelectItem value="2">2</SelectItem>
//                     <SelectItem value="3">3</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             <div className="space-y-2 md:col-span-2">
//               <Label>نوع وسيلة السفر</Label>
//               <Select
//                 value={formData.vehicleCategory}
//                 onValueChange={(val) => setFormData({ ...formData, vehicleCategory: val })}
//               >
//                 <SelectTrigger className="bg-background">
//                   <SelectValue placeholder="اختر النوع" />
//                 </SelectTrigger>
//                 <SelectContent side="bottom" avoidCollisions={false}>
//                   <SelectItem value="bus">🚌 حافلة</SelectItem>
//                   <SelectItem value="small">🚗 سيارة</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </Card>

//           {/* Financial Details */}
//           <Form {...form}>
//             <Accordion type="single" collapsible className="w-full">
//               <AccordionItem value="financials" className="border rounded-lg bg-muted/30">
//                 <AccordionTrigger className="p-4 font-semibold text-sm hover:no-underline">
//                   <div className="flex items-center gap-2">
//                     <Wallet className="h-4 w-4" />
//                     التفاصيل المالية
//                   </div>
//                 </AccordionTrigger>
//                 <AccordionContent className="p-4 pt-0 space-y-4">
//                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                     <FormField control={form.control} name="price" render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>سعر المقعد</FormLabel>
//                         <FormControl>
//                           <Input className="bg-card" type="number" placeholder="e.g., 50" {...field} value={field.value ?? ''} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )} />
//                     <FormField control={form.control} name="currency" render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>العملة</FormLabel>
//                         <FormControl>
//                           <Input {...field} disabled className="bg-muted/50 text-muted-foreground font-mono cursor-not-allowed" />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )} />
//                     <FormField control={form.control} name="depositPercentage" render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>نسبة العربون</FormLabel>
//                         <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
//                           <FormControl>
//                             <SelectTrigger><SelectValue placeholder="اختر نسبة" /></SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {[0, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(p => (
//                               <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )} />
//                   </div>
//                   <div className="p-2 bg-background/50 border rounded-md text-center text-sm font-bold text-primary">
//                     قيمة العربون للمقعد الواحد: {depositAmount} {form.watch('currency')}
//                   </div>
//                 </AccordionContent>
//               </AccordionItem>
//             </Accordion>

//             <Accordion type="single" collapsible className="w-full">
//               <AccordionItem value="conditions" className="border rounded-lg bg-muted/30">
//                 <AccordionTrigger className="p-4 font-semibold text-sm hover:no-underline">
//                   <div className="flex items-center gap-2">
//                     <ListChecks className="h-4 w-4" />
//                     الشروط والأحكام (اختياري)
//                   </div>
//                 </AccordionTrigger>
//                 <AccordionContent className="p-4 pt-0">
//                   <FormField control={form.control} name="conditions" render={({ field }) => (
//                     <FormItem>
//                       <FormControl>
//                         <Textarea
//                           placeholder="مثال: ممنوع التدخين، حقيبة واحدة فقط لكل راكب..."
//                           className="resize-none bg-card"
//                           {...field}
//                           maxLength={200}
//                           value={field.value ?? ''}
//                         />
//                       </FormControl>
//                       <div className="text-xs text-muted-foreground text-left pt-1">
//                         {conditionsValue?.length || 0}/200
//                       </div>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                 </AccordionContent>
//               </AccordionItem>
//             </Accordion>
//           </Form>

//           <Button className="w-full mt-6" onClick={handleSave} disabled={isSaving}>
//             {isSaving ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 h-4 w-4" />}
//             {t('saveButton')}
//           </Button>

//         </CardContent>
//       </Card>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useUserProfile } from '@/hooks/use-user-profile';
import { updateDoc, serverTimestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Save, ListChecks, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CITIES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
const pageSchema = z.object({
  price: z.coerce.number().positive('السعر يجب أن يكون رقماً موجباً').optional(),
  currency: z.string().default('د.أ'),
  depositPercentage: z.coerce.number().min(0).default(10),
  conditions: z.string().max(200).optional(),
});

type PageFormValues = z.infer<typeof pageSchema>;

export default function CarrierPermanentPage() {
  const t = useTranslations('carrierConditions');
  const { profile, isLoading, userProfileRef } = useUserProfile();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    paymentInformation: '',
    bagsPerSeat: '1',
    numberOfStops: '0',
    vehicleType: '',
    vehicleYear: '',
    plateNumber: '',
    vehicleCapacity: '',
    jurisdictionOrigin: '',
    jurisdictionDest: '',
    officeName: '',
    officePhone: '',
    sidePanelNumber: '',
    vehicleCategory: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [vehicleImageFile, setVehicleImageFile] = useState<File | null>(null);
  const [plateImageFile, setPlateImageFile] = useState<File | null>(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState<string | null>(null);
  const [plateImagePreview, setPlateImagePreview] = useState<string | null>(null);

  const CURRENCIES = [
    { value: 'د.أ', label: 'دينار أردني (د.أ)' },
    { value: 'ل.س', label: 'ليرة سورية (ل.س)' },
    { value: 'ل.ل', label: 'ليرة لبنانية (ل.ل)' },
    { value: 'د.ع', label: 'دينار عراقي (د.ع)' },
    { value: 'ر.س', label: 'ريال سعودي (ر.س)' },
    { value: 'د.إ', label: 'درهم إماراتي (د.إ)' },
    { value: 'د.ك', label: 'دينار كويتي (د.ك)' },
    { value: 'ر.ق', label: 'ريال قطري (ر.ق)' },
    { value: 'ر.ع', label: 'ريال عماني (ر.ع)' },
    { value: 'د.ب', label: 'دينار بحريني (د.ب)' },
    { value: 'ل.ت', label: 'ليرة تركية (ل.ت)' },
    { value: 'USD', label: 'دولار أمريكي (USD)' },
  ];

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      price: undefined,
      currency: 'د.أ',
      depositPercentage: 10,
      conditions: '',
    },
  });

  const conditionsValue = form.watch('conditions');
  const priceValue = form.watch('price');
  const depositPercentageValue = form.watch('depositPercentage');

  const depositAmount = useMemo(() => {
    const price = priceValue || 0;
    const percentage = depositPercentageValue || 0;
    return (price * (percentage / 100)).toFixed(2);
  }, [priceValue, depositPercentageValue]);

  useEffect(() => {
    if (profile) {
      setFormData({
        paymentInformation: profile.paymentInformation || '',
        bagsPerSeat: profile.bagsPerSeat?.toString() || '1',
        numberOfStops: profile.numberOfStops?.toString() || '0',
        vehicleType: profile.vehicleType || '',
        vehicleYear: profile.vehicleYear || '',
        plateNumber: profile.plateNumber || '',
        vehicleCapacity: profile.vehicleCapacity?.toString() || '',
        jurisdictionOrigin: profile.jurisdiction?.origin || '',
        jurisdictionDest: profile.jurisdiction?.destination || '',
        officeName: profile.officeName || '',
        officePhone: profile.officePhone || '',
        sidePanelNumber: profile.sidePanelNumber || '',
        vehicleCategory: profile.vehicleCategory || '',
      });

      // تعبئة حقول الفورم من البروفايل
      form.reset({
        price: profile.price ?? undefined,
        currency: profile.currency || 'د.أ',
        depositPercentage: profile.depositPercentage ?? 10,
        conditions: profile.conditions || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!userProfileRef) {
      toast({ title: 'خطأ', description: 'الجلسة غير صالحة.', variant: 'destructive' });
      return;
    }

    // تحقق من صحة حقول الفورم
    const isFormValid = await form.trigger();
    if (!isFormValid) {
      toast({ title: 'خطأ', description: 'يرجى مراجعة البيانات المدخلة.', variant: 'destructive' });
      return;
    }

    const formValues = form.getValues();

    setIsSaving(true);
    try {
      const capacity = Number(formData.vehicleCapacity);
      const isBus = capacity > 7;

      const payload = {
        paymentInformation: formData.paymentInformation,
        bagsPerSeat: Number(formData.bagsPerSeat),
        numberOfStops: Number(formData.numberOfStops),
        vehicleType: formData.vehicleType,
        vehicleYear: formData.vehicleYear,
        plateNumber: formData.plateNumber,
        vehicleCapacity: capacity,
        vehicleCategory: isBus ? 'bus' : 'small',
        jurisdiction: {
          origin: formData.jurisdictionOrigin,
          destination: formData.jurisdictionDest,
        },
        officeName: formData.officeName,
        officePhone: formData.officePhone,
        sidePanelNumber: formData.sidePanelNumber,
        // ✅ حفظ السعر والعربون والعملة والشروط
        price: formValues.price ?? null,
        currency: formValues.currency,
        depositPercentage: formValues.depositPercentage,
        conditions: formValues.conditions || '',
        updatedAt: serverTimestamp(),
        isPartial: false,
      };

      await updateDoc(userProfileRef, payload);
      toast({ title: t('saveButton'), description: 'تم الحفظ بنجاح' });
      router.push('/carrier');
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to save. Try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'vehicle' | 'plate') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'vehicle') {
        setVehicleImagePreview(reader.result as string);
        setVehicleImageFile(file);
      } else {
        setPlateImagePreview(reader.result as string);
        setPlateImageFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            {t('titlePermanent')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Permanent Operational Terms */}
          <Card className="bg-muted/30 p-4 space-y-4">
            <h4 className="font-semibold text-sm">{t('permanentConditions')}</h4>
            <div className="space-y-2">
              <Label>{t('paymentInfo')}</Label>
              <Textarea placeholder={t('placeholders.paymentInfo')} value={formData.paymentInformation} onChange={e => setFormData({...formData, paymentInformation: e.target.value})} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('bagsPerSeat')}</Label>
                <Select value={formData.bagsPerSeat} onValueChange={val => setFormData({...formData, bagsPerSeat: val})}>
                  <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('numberOfStops')}</Label>
                <Select value={formData.numberOfStops} onValueChange={val => setFormData({...formData, numberOfStops: val})}>
                  <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>نوع وسيلة السفر</Label>
              <Select
                value={formData.vehicleCategory}
                onValueChange={(val) => setFormData({ ...formData, vehicleCategory: val })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent side="bottom" avoidCollisions={false}>
                  <SelectItem value="bus">🚌 حافلة</SelectItem>
                  <SelectItem value="small">🚗 سيارة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Financial Details */}
          <Form {...form}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="financials" className="border rounded-lg bg-muted/30">
                <AccordionTrigger className="p-4 font-semibold text-sm hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    التفاصيل المالية
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>سعر المقعد</FormLabel>
                        <FormControl>
                          <Input className="bg-card" type="number" placeholder="e.g., 50" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="currency" render={({ field }) => (
                      <FormItem>
                        <FormLabel>العملة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-card"><SelectValue placeholder="اختر العملة" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="depositPercentage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>نسبة العربون</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="اختر نسبة" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[0, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(p => (
                              <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
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
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
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
                  )} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Form>

          <Button className="w-full mt-6" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 h-4 w-4" />}
            {t('saveButton')}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}