// // 'use client';

// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogDescription,
// //   DialogFooter,
// // } from '@/components/ui/dialog';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { Label } from '@/components/ui/label';
// // import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// // import { ScrollArea } from '@/components/ui/scroll-area';
// // import { useState, useEffect } from 'react';
// // import type { Trip, PassengerDetails } from '@/lib/data';
// // import { Send, Loader2 } from 'lucide-react';
// // import { useToast } from '@/hooks/use-toast';
// // import { Checkbox } from '@/components/ui/checkbox';
// // import { FormControl, FormItem } from '@/components/ui/form';

// // export type { PassengerDetails };

// // interface BookingDialogProps {
// //   isOpen: boolean;
// //   onOpenChange: (isOpen: boolean) => void;
// //   trip: Trip;
// //   seatCount: number;
// //   onConfirm: (passengers: PassengerDetails[]) => Promise<void>;
// //   isProcessing?: boolean;
// // }

// // export function BookingDialog({ 
// //   isOpen, 
// //   onOpenChange, 
// //   trip, 
// //   seatCount, 
// //   onConfirm, 
// // }: BookingDialogProps) {
// //     const { toast } = useToast();
// //     const [passengers, setPassengers] = useState<PassengerDetails[]>([]);
// //     const [isSubmitting, setIsSubmitting] = useState(false);
// //     const [isAgreed, setIsAgreed] = useState(false);

// //     useEffect(() => {
// //         if (isOpen) {
// //             setPassengers(Array.from({ length: seatCount }, () => ({ name: '', nationality: '', documentNumber: '', type: 'adult' })));
// //             setIsAgreed(false);
// //         }
// //     }, [isOpen, seatCount]);

// //     const handlePassengerChange = (index: number, field: keyof PassengerDetails, value: string) => {
// //         setPassengers(prev => {
// //             const newPassengers = [...prev];
// //             newPassengers[index] = { ...newPassengers[index], [field]: value as any }; 
// //             return newPassengers;
// //         });
// //     };

// //     const handleSubmit = async () => {
// //         const allNamesFilled = passengers.every(p => p.name.trim() !== '' && p.nationality.trim() !== '' && p.documentNumber.trim() !== '');
// //         if (!allNamesFilled) {
// //             toast({
// //                 variant: 'destructive',
// //                 title: 'بيانات غير مكتملة',
// //                 description: 'الرجاء إدخال كافة البيانات المطلوبة لكل راكب (الاسم، الجنسية، رقم الوثيقة).',
// //             });
// //             return;
// //         }
// //         setIsSubmitting(true);
// //         try {
// //             await onConfirm(passengers);
// //         } catch (error) {
// //             setIsSubmitting(false);
// //         }
// //     };
    
// //     return (
// //         <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
// //             <DialogContent className="sm:max-w-[480px]">
// //                 <DialogHeader>
// //                 <DialogTitle>تأكيد الحجز: تفاصيل الركاب</DialogTitle>
// //                 <DialogDescription>
// //                     أنت على وشك حجز {seatCount} مقعد(مقاعد) لرحلة {trip.origin} - {trip.destination}.
// //                 </DialogDescription>
// //                 </DialogHeader>
                
// //                 <ScrollArea className="max-h-[60vh] p-1 pr-4">
// //                     <div className="space-y-6">
// //                         {passengers.map((passenger, index) => (
// //                         <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
// //                             <Label className="font-bold text-primary">الراكب {index + 1}</Label>
                            
// //                             <div className="grid gap-2">
// //                                 <Label htmlFor={`name-${index}`}>الاسم الكامل (كما في الوثيقة)</Label>
// //                                 <Input
// //                                     id={`name-${index}`}
// //                                     placeholder="أدخل الاسم الكامل"
// //                                     value={passenger.name}
// //                                     onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
// //                                     disabled={isSubmitting}
// //                                     className="bg-background"
// //                                 />
// //                             </div>

// //                             <div className="grid grid-cols-2 gap-4">
// //                                 <div className="grid gap-2">
// //                                     <Label htmlFor={`nationality-${index}`}>الجنسية</Label>
// //                                     <Input
// //                                         id={`nationality-${index}`}
// //                                         placeholder="مثال: أردني"
// //                                         value={passenger.nationality}
// //                                         onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
// //                                         disabled={isSubmitting}
// //                                         className="bg-background"
// //                                     />
// //                                 </div>
// //                                  <div className="grid gap-2">
// //                                     <Label htmlFor={`document-${index}`}>رقم جواز السفر/الهوية</Label>
// //                                     <Input
// //                                         id={`document-${index}`}
// //                                         placeholder="أدخل رقم الوثيقة"
// //                                         value={passenger.documentNumber}
// //                                         onChange={(e) => handlePassengerChange(index, 'documentNumber', e.target.value)}
// //                                         disabled={isSubmitting}
// //                                         className="bg-background"
// //                                     />
// //                                 </div>
// //                             </div>
// //                             <div className="grid gap-2">
// //                                 <Label>نوع الراكب</Label>
// //                                 <RadioGroup
// //                                     onValueChange={(value) => handlePassengerChange(index, 'type', value)}
// //                                     defaultValue={passenger.type}
// //                                     className="flex gap-4 pt-1"
// //                                     disabled={isSubmitting}
// //                                 >
// //                                     <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
// //                                         <FormControl><RadioGroupItem value="adult" id={`adult-${index}`} /></FormControl>
// //                                         <Label htmlFor={`adult-${index}`} className="font-normal cursor-pointer">بالغ</Label>
// //                                     </FormItem>
// //                                     <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
// //                                         <FormControl><RadioGroupItem value="minor" id={`minor-${index}`} /></FormControl>
// //                                         <Label htmlFor={`minor-${index}`} className="font-normal cursor-pointer">قاصر</Label>
// //                                     </FormItem>
// //                                     <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
// //                                         <FormControl><RadioGroupItem value="infant" id={`infant-${index}`} /></FormControl>
// //                                         <Label htmlFor={`infant-${index}`} className="font-normal cursor-pointer">رضيع</Label>
// //                                     </FormItem>
// //                                 </RadioGroup>
// //                             </div>
// //                         </div>
// //                         ))}
// //                     </div>
// //                 </ScrollArea>
                 
// //                 {/* [INJECT] Conditions & Agreement Block */}
// //                 <div className="my-4 p-3 bg-muted/40 rounded-md border border-dashed">
// //                    <p className="text-xs font-semibold mb-1">شروط الناقل والرحلة:</p>
// //                    <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-20 overflow-y-auto">
// //                       {trip.conditions || "لا توجد شروط إضافية معلنة من الناقل."}
// //                    </p>
// //                 </div>
// //                 <div className="flex items-center gap-2 mb-4">
// //                    <Checkbox 
// //                      id="agreement" 
// //                      checked={isAgreed}
// //                      onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
// //                      disabled={isSubmitting}
// //                    />
// //                    <label htmlFor="agreement" className="text-sm cursor-pointer select-none">
// //                       أقر بأنني قرأت ووافقت على شروط الرحلة أعلاه.
// //                    </label>
// //                 </div>
                
// //                 <DialogFooter className="gap-2 sm:gap-0">
// //                     <Button 
// //                         type="button" 
// //                         variant="secondary" 
// //                         onClick={() => onOpenChange(false)} 
// //                         disabled={isSubmitting}
// //                     >
// //                         إلغاء
// //                     </Button>
// //                     <Button 
// //                         type="submit" 
// //                         onClick={handleSubmit} 
// //                         disabled={isSubmitting || !isAgreed}
// //                         className="w-full sm:w-auto"
// //                     >
// //                         {isSubmitting ? (
// //                             <>
// //                                 <Loader2 className="ml-2 h-4 w-4 animate-spin" />
// //                                 جاري الإرسال...
// //                             </>
// //                         ) : (
// //                             <>
// //                                 <Send className="ml-2 h-4 w-4" />
// //                                 إرسال الطلب للناقل
// //                             </>
// //                         )}
// //                     </Button>
// //                 </DialogFooter>
// //             </DialogContent>
// //         </Dialog>
// //     );
// // }



// 'use client';

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { useState, useEffect } from 'react';
// import type { Trip, PassengerDetails } from '@/lib/data';
// import { Send, Loader2, ArrowRight } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
// import { Checkbox } from '@/components/ui/checkbox';
// import { FormControl, FormItem } from '@/components/ui/form';
// import { useTranslations } from 'next-intl';

// export type { PassengerDetails };

// interface BookingDialogProps {
//   isOpen: boolean;
//   onOpenChange: (isOpen: boolean) => void;
//   trip: Trip;
//   seatCount: number;
//   /**
//    * يُستدعى عند الضغط على زرار "تأكيد الحجز" الأزرق بعد ملء البيانات.
//    * في الـ Dashboard: يغلق الـ dialog ويفتح EmailConfirmDialog.
//    * في صفحة confirm-booking: يرسل الطلب للناقل مباشرةً.
//    */
//   onSubmit: (passengers: PassengerDetails[]) => Promise<void> | void;
//   /** نص الزرار الأزرق — افتراضي "تأكيد الحجز" */
//   submitLabel?: string;
//   /** بيانات مملوءة مسبقاً (من الـ token في confirm-booking) */
//   prefillPassengers?: PassengerDetails[];
//   isProcessing?: boolean;
// }

// export function BookingDialog({ 
//   isOpen, 
//   onOpenChange, 
//   trip, 
//   seatCount, 
//   onSubmit,
//   submitLabel,
//   prefillPassengers,
//   isProcessing = false,
// }: BookingDialogProps) {

//     const t = useTranslations('bookingDialog');
//     const { toast } = useToast();

//     const [passengers, setPassengers] = useState<PassengerDetails[]>([]);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [isAgreed, setIsAgreed] = useState(false);

//     const isLoading = isProcessing || isSubmitting;

//     useEffect(() => {
//         if (isOpen) {
//             if (prefillPassengers && prefillPassengers.length > 0) {
//                 // صفحة confirm-booking: ملء البيانات من الـ token
//                 setPassengers(prefillPassengers);
//                 setIsAgreed(true); // سبق وافق عليها
//             } else {
//                 setPassengers(
//                   Array.from({ length: seatCount }, () => ({
//                     name: '',
//                     nationality: '',
//                     documentNumber: '',
//                     type: 'adult'
//                   }))
//                 );
//                 setIsAgreed(false);
//             }
//         }
//     }, [isOpen, seatCount, prefillPassengers]);

//     const handlePassengerChange = (index: number, field: keyof PassengerDetails, value: string) => {
//         if (prefillPassengers) return; // في confirm-booking البيانات readonly
//         setPassengers(prev => {
//             const newPassengers = [...prev];
//             newPassengers[index] = { ...newPassengers[index], [field]: value as any }; 
//             return newPassengers;
//         });
//     };

//     const handleConfirm = async () => {
//         const allFilled = passengers.every(
//           p => p.name.trim() !== '' && p.nationality.trim() !== '' && p.documentNumber.trim() !== ''
//         );

//         if (!allFilled) {
//             toast({
//                 variant: 'destructive',
//                 title: t('errors.incompleteTitle'),
//                 description: t('errors.incompleteDescription'),
//             });
//             return;
//         }

//         setIsSubmitting(true);
//         try {
//             await onSubmit(passengers);
//         } catch (error) {
//             console.error(error);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const isReadonly = !!prefillPassengers;
//     const buttonLabel = submitLabel ?? 'تأكيد الحجز';

//     return (
//         <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
//             <DialogContent className="sm:max-w-[480px]">

//                 <DialogHeader>
//                     <DialogTitle>{t('title')}</DialogTitle>
//                     <DialogDescription>
//                       {t('description', { seats: seatCount, origin: trip.origin, destination: trip.destination })}
//                     </DialogDescription>
//                 </DialogHeader>
                
//                 <ScrollArea className="max-h-[60vh] p-1 pr-4">
//                     <div className="space-y-6">
//                         {passengers.map((passenger, index) => (
//                         <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
//                             <Label className="font-bold text-primary">{t('passenger')} {index + 1}</Label>
                            
//                             <div className="grid gap-2">
//                                 <Label htmlFor={`name-${index}`}>{t('fullName')}</Label>
//                                 <Input
//                                     id={`name-${index}`}
//                                     placeholder={t('fullNamePlaceholder')}
//                                     value={passenger.name}
//                                     onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
//                                     disabled={isLoading || isReadonly}
//                                     className="bg-background"
//                                 />
//                             </div>

//                             <div className="grid grid-cols-2 gap-4">
//                                 <div className="grid gap-2">
//                                     <Label htmlFor={`nationality-${index}`}>{t('nationality')}</Label>
//                                     <Input
//                                         id={`nationality-${index}`}
//                                         placeholder={t('nationalityPlaceholder')}
//                                         value={passenger.nationality}
//                                         onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
//                                         disabled={isLoading || isReadonly}
//                                         className="bg-background"
//                                     />
//                                 </div>
//                                 <div className="grid gap-2">
//                                     <Label htmlFor={`document-${index}`}>{t('documentNumber')}</Label>
//                                     <Input
//                                         id={`document-${index}`}
//                                         placeholder={t('documentPlaceholder')}
//                                         value={passenger.documentNumber}
//                                         onChange={(e) => handlePassengerChange(index, 'documentNumber', e.target.value)}
//                                         disabled={isLoading || isReadonly}
//                                         className="bg-background"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="grid gap-2">
//                                 <Label>{t('passengerType')}</Label>
//                                 <RadioGroup
//                                     onValueChange={(value) => handlePassengerChange(index, 'type', value)}
//                                     value={passenger.type}
//                                     className="flex gap-4 pt-1"
//                                     disabled={isLoading || isReadonly}
//                                 >
//                                     <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
//                                         <FormControl><RadioGroupItem value="adult" /></FormControl>
//                                         <Label className="font-normal cursor-pointer">{t('types.adult')}</Label>
//                                     </FormItem>
//                                     <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
//                                         <FormControl><RadioGroupItem value="minor" /></FormControl>
//                                         <Label className="font-normal cursor-pointer">{t('types.minor')}</Label>
//                                     </FormItem>
//                                     <FormItem className="flex items-center space-x-2 rtl:space-x-reverse">
//                                         <FormControl><RadioGroupItem value="infant" /></FormControl>
//                                         <Label className="font-normal cursor-pointer">{t('types.infant')}</Label>
//                                     </FormItem>
//                                 </RadioGroup>
//                             </div>
//                         </div>
//                         ))}
//                     </div>
//                 </ScrollArea>

//                 <div className="my-4 p-3 bg-muted/40 rounded-md border border-dashed">
//                    <p className="text-xs font-semibold mb-1">{t('conditionsTitle')}</p>
//                    <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-20 overflow-y-auto">
//                       {trip.conditions || t('noConditions')}
//                    </p>
//                 </div>

//                 {!isReadonly && (
//                   <div className="flex items-center gap-2 mb-4">
//                      <Checkbox 
//                        id="agreement" 
//                        checked={isAgreed}
//                        onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
//                        disabled={isLoading}
//                      />
//                      <label htmlFor="agreement" className="text-sm cursor-pointer select-none">
//                         {t('agreement')}
//                      </label>
//                   </div>
//                 )}
                
//                 <DialogFooter className="gap-2 sm:gap-0">
//                     <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
//                         {t('cancel')}
//                     </Button>

//                     {/* ✅ الزرار الأزرق */}
//                     <Button
//                         type="button"
//                         onClick={handleConfirm}
//                         disabled={isLoading || (!isReadonly && !isAgreed)}
//                         className="w-full sm:w-auto"
//                     >
//                         {isLoading ? (
//                             <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري المعالجة...</>
//                         ) : isReadonly ? (
//                             <><Send className="ml-2 h-4 w-4" /> {buttonLabel}</>
//                         ) : (
//                             <><ArrowRight className="ml-2 h-4 w-4" /> {buttonLabel}</>
//                         )}
//                     </Button>
//                 </DialogFooter>

//             </DialogContent>
//         </Dialog>
//     );
// }





'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import type { Trip, PassengerDetails } from '@/lib/data';
import { Send, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';

export type { PassengerDetails };

interface BookingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  trip: Trip;
  seatCount: number;
  onSubmit: (passengers: PassengerDetails[]) => Promise<void> | void;
  submitLabel?: string;
  prefillPassengers?: PassengerDetails[];
  isProcessing?: boolean;
}

export function BookingDialog({ 
  isOpen, 
  onOpenChange, 
  trip, 
  seatCount, 
  onSubmit,
  submitLabel,
  prefillPassengers,
  isProcessing = false,
}: BookingDialogProps) {

    const t = useTranslations('bookingDialog');
    const { toast } = useToast();

    const [passengers, setPassengers] = useState<PassengerDetails[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);

    const isLoading = isProcessing || isSubmitting;

    useEffect(() => {
        if (isOpen) {
            if (prefillPassengers && prefillPassengers.length > 0) {
                setPassengers(prefillPassengers);
                setIsAgreed(true);
            } else {
                setPassengers(
                  Array.from({ length: seatCount }, () => ({
                    name: '',
                    nationality: '',
                    documentNumber: '',
                    type: 'adult'
                  }))
                );
                setIsAgreed(false);
            }
        }
    }, [isOpen, seatCount, prefillPassengers]);

    const handlePassengerChange = (index: number, field: keyof PassengerDetails, value: string) => {
        if (prefillPassengers) return;
        setPassengers(prev => {
            const newPassengers = [...prev];
            newPassengers[index] = { ...newPassengers[index], [field]: value as any }; 
            return newPassengers;
        });
    };

    const handleConfirm = async () => {
        const allFilled = passengers.every(
          p => p.name.trim() !== '' && p.nationality.trim() !== '' && p.documentNumber.trim() !== ''
        );

        if (!allFilled) {
            toast({
                variant: 'destructive',
                title: t('errors.incompleteTitle'),
                description: t('errors.incompleteDescription'),
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(passengers);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isReadonly = !!prefillPassengers;
    const buttonLabel = submitLabel ?? 'تأكيد الحجز';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onOpenChange(open)}>
            <DialogContent className="sm:max-w-[480px]">

                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                      {t('description', { seats: seatCount, origin: trip.origin, destination: trip.destination })}
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[60vh] p-1 pr-4">
                    <div className="space-y-6">
                        {passengers.map((passenger, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                            <Label className="font-bold text-primary">{t('passenger')} {index + 1}</Label>
                            
                            <div className="grid gap-2">
                                <Label htmlFor={`name-${index}`}>{t('fullName')}</Label>
                                <Input
                                    id={`name-${index}`}
                                    placeholder={t('fullNamePlaceholder')}
                                    value={passenger.name}
                                    onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                                    disabled={isLoading || isReadonly}
                                    className="bg-background"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor={`nationality-${index}`}>{t('nationality')}</Label>
                                    <Input
                                        id={`nationality-${index}`}
                                        placeholder={t('nationalityPlaceholder')}
                                        value={passenger.nationality}
                                        onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                                        disabled={isLoading || isReadonly}
                                        className="bg-background"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`document-${index}`}>{t('documentNumber')}</Label>
                                    <Input
                                        id={`document-${index}`}
                                        placeholder={t('documentPlaceholder')}
                                        value={passenger.documentNumber}
                                        onChange={(e) => handlePassengerChange(index, 'documentNumber', e.target.value)}
                                        disabled={isLoading || isReadonly}
                                        className="bg-background"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>{t('passengerType')}</Label>
                                <RadioGroup
                                    onValueChange={(value) => handlePassengerChange(index, 'type', value)}
                                    value={passenger.type}
                                    className="flex gap-4 pt-1"
                                    disabled={isLoading || isReadonly}
                                >
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <RadioGroupItem value="adult" id={`adult-${index}`} />
                                        <Label htmlFor={`adult-${index}`} className="font-normal cursor-pointer">{t('types.adult')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <RadioGroupItem value="minor" id={`minor-${index}`} />
                                        <Label htmlFor={`minor-${index}`} className="font-normal cursor-pointer">{t('types.minor')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <RadioGroupItem value="infant" id={`infant-${index}`} />
                                        <Label htmlFor={`infant-${index}`} className="font-normal cursor-pointer">{t('types.infant')}</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="my-4 p-3 bg-muted/40 rounded-md border border-dashed">
                   <p className="text-xs font-semibold mb-1">{t('conditionsTitle')}</p>
                   <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {trip.conditions || t('noConditions')}
                   </p>
                </div>

                {!isReadonly && (
                  <div className="flex items-center gap-2 mb-4">
                     <Checkbox 
                       id="agreement" 
                       checked={isAgreed}
                       onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
                       disabled={isLoading}
                     />
                     <label htmlFor="agreement" className="text-sm cursor-pointer select-none">
                        {t('agreement')}
                     </label>
                  </div>
                )}
                
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        {t('cancel')}
                    </Button>

                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading || (!isReadonly && !isAgreed)}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? (
                            <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري المعالجة...</>
                        ) : isReadonly ? (
                            <><Send className="ml-2 h-4 w-4" /> {buttonLabel}</>
                        ) : (
                            <><ArrowRight className="ml-2 h-4 w-4" /> {buttonLabel}</>
                        )}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}