'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ShieldCheck } from 'lucide-react';

interface CompleteProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProfileComplete: () => void;
}

const completeProfileSchema = z.object({
  vehicleType: z.string().min(3, { message: 'نوع المركبة مطلوب (مثال: GMC Yukon).' }),
  vehicleYear: z.string().length(4, { message: 'سنة الصنع يجب أن تكون 4 أرقام.' }),
  plateNumber: z.string().min(3, { message: 'رقم اللوحة مطلوب.' }),
  vehicleCapacity: z.coerce.number().int().min(1, { message: 'سعة الركاب مطلوبة.' }),
});

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export function CompleteProfileDialog({ isOpen, onOpenChange, onProfileComplete }: CompleteProfileDialogProps) {
  const { toast } = useToast();
  // SC-036: Corrected hook usage to match the new implementation
  const { profile } = useUserProfile(); 
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      vehicleType: '',
      vehicleYear: '',
      plateNumber: '',
      vehicleCapacity: undefined,
    },
  });

  useEffect(() => {
    if (profile && isOpen) {
      form.reset({
        vehicleType: profile.vehicleType || '',
        vehicleYear: profile.vehicleYear || '',
        plateNumber: profile.plateNumber || '',
        vehicleCapacity: profile.vehicleCapacity,
      });
    }
  }, [profile, isOpen, form]);

  const onSubmit = async (data: CompleteProfileFormValues) => {
    if (!userProfileRef) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على ملف المستخدم.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateDoc(userProfileRef, {
        ...data,
        isPartial: false,
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: 'تم استكمال الملف بنجاح!',
        description: 'أصبح بإمكانك الآن استقبال الطلبات وإنشاء الرحلات.',
      });

      onProfileComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Failed to complete profile:', error);
      toast({ variant: 'destructive', title: 'فشل التحديث', description: 'حدث خطأ ما.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            استكمال بيانات الناقل
          </DialogTitle>
          <DialogDescription>
            لاستخدام ميزات الناقل، يرجى إكمال بيانات مركبتك الأساسية. هذه البيانات مطلوبة لمرة واحدة فقط.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع المركبة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: GMC Yukon 2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="vehicleYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سنة الصنع</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم اللوحة</FormLabel>
                    <FormControl>
                      <Input placeholder="50-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="vehicleCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سعة الركاب القصوى</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="عدد المقاعد" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-6">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                  'حفظ وبدء العمل'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
