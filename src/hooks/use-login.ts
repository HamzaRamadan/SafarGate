'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { checkUserExistence, registerNewUser } from '@/lib/simple-auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export function useLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const [step, setStep] = useState<'phone' | 'name' | 'authenticate'>('phone');
  const [loading, setLoading] = useState(false);
  const [returningUser, setReturningUser] = useState<Partial<UserProfile> | null>(null);
  
  const [formData, setFormData] = useState({
    phone: '',
    firstName: '',
    role: 'carrier' as 'carrier' | 'traveler',
    agreed: false,
  });

  const handleCheckPhone = async () => {
    if (!formData.phone || formData.phone.length < 9 || !db) {
      toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رقم هاتف صحيح" });
      return { success: false, isReturningUser: false };
    }

    setLoading(true);
    
    try {
      const checkResult = await checkUserExistence(db, formData.phone);
      setLoading(false);

      if (checkResult.exists && checkResult.data) {
        setReturningUser(checkResult.data as UserProfile);
        setStep('authenticate');
        toast({ title: "أهلاً بعودتك", description: `مرحباً ${checkResult.data.firstName}` });
        return { success: true, isReturningUser: true };
      } else {
        setStep('name');
        return { success: true, isReturningUser: false };
      }
    } catch (error) {
      console.error('خطأ في التحقق من المستخدم:', error);
      setLoading(false);
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء التحقق من الرقم" });
      return { success: false, isReturningUser: false };
    }
  };

  const handleRegister = async () => {
    if (!formData.agreed) {
      toast({ variant: "destructive", title: "يجب الموافقة على الشروط" });
      return;
    }
    if (!db || !auth) {
      toast({ variant: "destructive", title: "خطأ في الاتصال" });
      return;
    }
    
    setLoading(true);

    try {
      const result = await registerNewUser(db, auth, formData.phone, formData.firstName, formData.role);
      if (result.success) {
        toast({ title: "تم التسجيل", description: "جاري الدخول..." });
        router.push(formData.role === 'carrier' ? '/carrier' : '/dashboard');
      } else {
        toast({ variant: "destructive", title: "فشل التسجيل" });
        setLoading(false);
      }
    } catch (error) {
      console.error('خطأ في التسجيل:', error);
      toast({ variant: "destructive", title: "فشل التسجيل" });
      setLoading(false);
    }
  };

  const handleReturningUserLogin = async () => {
    if (!returningUser?.role || !auth || !db) return;
    setLoading(true);
    
    try {
      // ✅ عمل anonymous sign in للحصول على uid
      let uid = auth.currentUser?.uid;
      if (!auth.currentUser) {
        const result = await signInAnonymously(auth);
        uid = result.user.uid;
      }

      // ✅ لو عندنا id الـ document القديم، نحدثه بالـ uid الجديد
      // عشان useUserProfile يقدر يجيب البيانات بـ user.uid
      const docId = (returningUser as any).id;
      if (docId && uid && docId !== uid) {
        try {
          await updateDoc(doc(db, 'users', docId), {
            uid: uid,
          });
          // نعمل document جديد بالـ uid الجديد عشان onSnapshot يشتغل
          const { setDoc, getDoc } = await import('firebase/firestore');
          const oldDoc = await getDoc(doc(db, 'users', docId));
          if (oldDoc.exists()) {
            await setDoc(doc(db, 'users', uid), {
              ...oldDoc.data(),
              uid: uid,
            });
          }
        } catch (e) {
          console.error('Error updating uid:', e);
        }
      }

      toast({ title: "تم تسجيل الدخول", description: `أهلاً بعودتك ${returningUser.firstName}` });

      // ✅ لو ناقل روح مباشرة
      if (returningUser.role === 'carrier') {
        router.push('/carrier');
        return;
      }

      // ✅ لو مسافر تحقق من الحجوزات النشطة
      try {
        const checkUid = uid || docId;
        if (checkUid) {
          const bookingsSnap = await getDocs(query(
            collection(db, 'bookings'),
            where('userId', '==', checkUid),
            where('status', 'in', ['Pending-Payment', 'Pending-Carrier-Confirmation', 'Confirmed'])
          ));

          const requestsSnap = await getDocs(query(
            collection(db, 'trips'),
            where('userId', '==', checkUid),
            where('status', '==', 'Awaiting-Offers')
          ));

          if (!bookingsSnap.empty || !requestsSnap.empty) {
            router.push('/history');
            return;
          }
        }
      } catch (e) {
        console.error('Error checking active bookings:', e);
      }

      router.push('/dashboard');

    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      toast({ variant: "destructive", title: "فشل الدخول" });
      setLoading(false);
    }
  };

  const resetToPhoneStep = () => {
    setStep('phone');
    setReturningUser(null);
    setFormData({
      phone: '',
      firstName: '',
      role: formData.role,
      agreed: false,
    });
  };

  return {
    step,
    loading,
    returningUser,
    formData,
    setFormData,
    handleCheckPhone,
    handleRegister,
    handleReturningUserLogin,
    resetToPhoneStep,
  };
}