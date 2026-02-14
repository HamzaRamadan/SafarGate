'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة.'),
    newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين.",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function AdminSettingsPage() {
    const auth = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: PasswordFormValues) => {
        setIsLoading(true);
        const user = auth?.currentUser;

        if (!user || !user.email) {
            toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على المستخدم الحالي." });
            setIsLoading(false);
            return;
        }

        try {
            // 1. Re-authenticate for security
            const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            // 2. Update password
            await updatePassword(user, data.newPassword);
            
            toast({ title: "تم تحديث كلمة المرور بنجاح!", description: "تم تغيير كلمة المرور الخاصة بك." });
            form.reset();

        } catch (error: any) {
            let description = "حدث خطأ غير متوقع.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = "كلمة المرور الحالية غير صحيحة.";
            } else if (error.code === 'auth/weak-password') {
                description = "كلمة المرور الجديدة ضعيفة جداً.";
            }
            toast({ variant: "destructive", title: "فشل تحديث كلمة المرور", description });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold">إعدادات الأمان</h1>
                <p className="text-muted-foreground">إدارة مفاتيح القلعة الخاصة بك.</p>
            </header>
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary"/>
                        تغيير كلمة المرور
                    </CardTitle>
                    <CardDescription>
                        ننصح بتغيير كلمة المرور بشكل دوري لزيادة الأمان.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>كلمة المرور الحالية</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <><Loader2 className="ml-2 h-4 w-4 animate-spin"/> تحديث...</>
                                    ) : (
                                        <><ShieldCheck className="ml-2 h-4 w-4"/> تحديث كلمة المرور</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
