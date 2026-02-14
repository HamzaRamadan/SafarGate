'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldPlus, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApp, initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function AddAdminDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });

  const handleSave = async () => {
    // 1. التحقق المبدئي
    if (!formData.name || !formData.email || !formData.password) {
        toast({ title: "بيانات ناقصة", description: "يرجى تعبئة جميع الحقول.", variant: "destructive" });
        return;
    }
    if (formData.password.length < 6) {
        toast({ title: "كلمة المرور ضعيفة", description: "يجب أن تكون 6 أحرف على الأقل.", variant: "destructive" });
        return;
    }
    if (!firestore) {
        toast({ title: "خطأ في النظام", description: "خدمة قاعدة البيانات غير متاحة.", variant: "destructive" });
        return;
    };

    setIsLoading(true);

    let secondaryApp: any = null;
    try {
        // 2. خدعة التطبيق الثانوي: إنشاء نسخة مؤقتة من التطبيق
        const app = getApp();
        secondaryApp = initializeApp(app.options, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        // 3. إنشاء المستخدم في التطبيق الثانوي
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
        const uid = userCredential.user.uid;

        // 4. حفظ بيانات المشرف في قاعدة البيانات (مع تصحيح منطق الاسم)
        const [firstName, ...lastNameParts] = formData.name.trim().split(' ');
        await setDoc(doc(firestore, 'users', uid), {
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            email: formData.email,
            role: formData.role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeactivated: false
        });

        // 5. تنظيف التطبيق الثانوي
        await signOut(secondaryAuth);
        
        toast({ 
            title: "تمت العملية بنجاح", 
            description: `تم تعيين ${formData.name} بصلاحية ${formData.role}.`,
        });

        setOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'admin' });

    } catch (error: any) {
        console.error(error);
        let msg = "حدث خطأ أثناء الإنشاء.";
        if (error.code === 'auth/email-already-in-use') msg = "هذا البريد مسجل مسبقاً.";
        toast({ title: "فشل التجنيد", description: msg, variant: "destructive" });
    } finally {
        // حذف التطبيق الثانوي لتحرير الذاكرة
        if (secondaryApp) await deleteApp(secondaryApp);
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <ShieldPlus className="h-4 w-4" />
          إضافة موظف جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-primary" />
            تجنيد مشرف جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد لمنحه صلاحيات الدخول للقلعة.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">الاسم</Label>
            <Input
              id="name"
              placeholder="الاسم الكامل"
              className="col-span-3"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">البريد</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@safar.com"
              className="col-span-3"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">كلمة السر</Label>
            <Input
              id="password"
              type="text"
              placeholder="كلمة مرور قوية"
              className="col-span-3 font-mono"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">الصلاحية</Label>
            <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير (كامل)</SelectItem>
                <SelectItem value="owner">مالك (أعلى صلاحية)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {!isLoading && <Save className="ml-2 h-4 w-4" />}
            حفظ البيانات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
