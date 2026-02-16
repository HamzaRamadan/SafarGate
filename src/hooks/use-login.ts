// 'use client';

// import { useState } from 'react';
// import { useRouter } from '@/i18n/routing'; // ⚠️ مهم: استخدم router من i18n
// import { checkUserExistence, registerNewUser } from '@/lib/simple-auth';
// import { useToast } from '@/hooks/use-toast';
// import { useAuth, useFirestore } from '@/firebase';
// import type { UserProfile } from '@/lib/data';
// import { signInAnonymously } from 'firebase/auth';

// export function useLogin() {
//   const router = useRouter();
//   const { toast } = useToast();
//   const auth = useAuth();
//   const db = useFirestore();

//   const [step, setStep] = useState<'phone' | 'name' | 'authenticate'>('phone');
//   const [loading, setLoading] = useState(false);
//   const [returningUser, setReturningUser] = useState<Partial<UserProfile> | null>(null);
  
//   const [formData, setFormData] = useState({
//     phone: '',
//     firstName: '',
//     role: 'carrier' as 'carrier' | 'traveler',
//     agreed: false,
//   });

//   // ✅ الحل: إرجاع true أو false
//  const handleCheckPhone = async () => {
//   if (!formData.phone || formData.phone.length < 9 || !db) {
//     toast({ 
//       variant: "destructive", 
//       title: "خطأ", 
//       description: "الرجاء إدخال رقم هاتف صحيح" 
//     });
//     return false;
//   }

//   setLoading(true);
  
//   try {
//     const checkResult = await checkUserExistence(db, formData.phone);
//     setLoading(false);

//     if (checkResult.exists && checkResult.data) { // ✅ أضف && checkResult.data
//       setReturningUser(checkResult.data as UserProfile);
//       setStep('authenticate');
//       toast({ 
//         title: "أهلاً بعودتك", 
//         description: `مرحباً ${checkResult.data.firstName}` 
//       });
//       return true; // ✅ مستخدم موجود
//     } else {
//       setStep('name');
//       return true; // ✅ مستخدم جديد
//     }
//   } catch (error) {
//     console.error('خطأ في التحقق من المستخدم:', error);
//     setLoading(false);
//     toast({ 
//       variant: "destructive", 
//       title: "خطأ", 
//       description: "حدث خطأ أثناء التحقق من الرقم" 
//     });
//     return false; // ❌ فشل
//   }
// };

//   const handleRegister = async () => {
//     if (!formData.agreed) {
//       toast({ variant: "destructive", title: "يجب الموافقة على الشروط" });
//       return;
//     }
//     if (!db || !auth) {
//       toast({ variant: "destructive", title: "خطأ في الاتصال" });
//       return;
//     }
    
//     setLoading(true);

//     try {
//       const result = await registerNewUser(
//         db, 
//         auth, 
//         formData.phone, 
//         formData.firstName, 
//         formData.role
//       );

//       if (result.success) {
//         toast({ title: "تم التسجيل", description: "جاري الدخول..." });
//         router.push(formData.role === 'carrier' ? '/carrier' : '/dashboard');
//       } else {
//         toast({ variant: "destructive", title: "فشل التسجيل" });
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error('خطأ في التسجيل:', error);
//       toast({ variant: "destructive", title: "فشل التسجيل" });
//       setLoading(false);
//     }
//   };

//   const handleReturningUserLogin = async () => {
//     if (!returningUser?.role || !auth) return;
//     setLoading(true);
    
//     try {
//       if (!auth.currentUser) {
//         await signInAnonymously(auth);
//       }
//       toast({ 
//         title: "تم تسجيل الدخول", 
//         description: `أهلاً بعودتك ${returningUser.firstName}`
//       });
//       router.push(returningUser.role === 'carrier' ? '/carrier' : '/dashboard');
//     } catch (error) {
//       console.error('خطأ في تسجيل الدخول:', error);
//       toast({ variant: "destructive", title: "فشل الدخول" });
//       setLoading(false);
//     }
//   };

//   const resetToPhoneStep = () => {
//     setStep('phone');
//     setReturningUser(null);
//     setFormData({
//       phone: '',
//       firstName: '',
//       role: formData.role,
//       agreed: false,
//     });
//   };

//   return {
//     step,
//     loading,
//     returningUser,
//     formData,
//     setFormData,
//     handleCheckPhone,
//     handleRegister,
//     handleReturningUserLogin,
//     resetToPhoneStep,
//   };
// }



'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing'; // ⚠️ مهم: استخدم router من i18n
import { checkUserExistence, registerNewUser } from '@/lib/simple-auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { signInAnonymously } from 'firebase/auth';

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

  // ✅ الحل: إرجاع object فيه النتيجة
 const handleCheckPhone = async () => {
  if (!formData.phone || formData.phone.length < 9 || !db) {
    toast({ 
      variant: "destructive", 
      title: "خطأ", 
      description: "الرجاء إدخال رقم هاتف صحيح" 
    });
    return { success: false, isReturningUser: false };
  }

  setLoading(true);
  
  try {
    const checkResult = await checkUserExistence(db, formData.phone);
    setLoading(false);

    if (checkResult.exists && checkResult.data) {
      setReturningUser(checkResult.data as UserProfile);
      setStep('authenticate');
      toast({ 
        title: "أهلاً بعودتك", 
        description: `مرحباً ${checkResult.data.firstName}` 
      });
      return { success: true, isReturningUser: true }; // ✅ مستخدم موجود
    } else {
      setStep('name');
      return { success: true, isReturningUser: false }; // ✅ مستخدم جديد
    }
  } catch (error) {
    console.error('خطأ في التحقق من المستخدم:', error);
    setLoading(false);
    toast({ 
      variant: "destructive", 
      title: "خطأ", 
      description: "حدث خطأ أثناء التحقق من الرقم" 
    });
    return { success: false, isReturningUser: false }; // ❌ فشل
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
      const result = await registerNewUser(
        db, 
        auth, 
        formData.phone, 
        formData.firstName, 
        formData.role
      );

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
    if (!returningUser?.role || !auth) return;
    setLoading(true);
    
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      toast({ 
        title: "تم تسجيل الدخول", 
        description: `أهلاً بعودتك ${returningUser.firstName}`
      });
      router.push(returningUser.role === 'carrier' ? '/carrier' : '/dashboard');
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