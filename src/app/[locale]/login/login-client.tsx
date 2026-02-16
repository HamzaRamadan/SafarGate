// "use client";

// import { useEffect, useState } from "react";
// import { useSearchParams } from "next/navigation";
// import { useRouter } from "@/i18n/routing";
// import { useTranslations, useLocale } from "next-intl";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Loader2 } from "lucide-react";

// import InstallPrompt from "@/components/install-prompt";
// import { useLogin } from "@/hooks/use-login";

// export default function LoginPhone() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const t = useTranslations();
//   const locale = useLocale();

//   const [roleFromUrl, setRoleFromUrl] = useState<string | null>(null);
//   const [submitting, setSubmitting] = useState(false);

//   const { loading, formData, setFormData, handleCheckPhone } = useLogin();

//   // ✅ جلب الـ role من الـ URL
//   useEffect(() => {
//     const role = searchParams.get("role");

//     if (role === "carrier" || role === "traveler") {
//       setRoleFromUrl(role);
//       setFormData((prev) => ({ ...prev, role }));
//     } else {
//       router.replace("/");
//     }
//   }, [searchParams, setFormData, router]);

//   // ⚠️ لحد ما نعرف الـ role
//   if (!roleFromUrl) return null;

//   const handleNext = async () => {
//     setSubmitting(true);

//     const ok = await handleCheckPhone();

//     if (ok) {
//       router.push(`/login-client?role=${formData.role}`);
//     } else {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div
//       className="flex min-h-screen flex-col items-center justify-center p-4 bg-background"
//       dir={locale === 'ar' ? 'rtl' : 'ltr'}
//     >
//       <div className="w-full max-w-md space-y-8">
//         {/* Header */}
//         <div className="text-center">
//           <h2 className="text-3xl font-bold tracking-tight">
//             {t('common.appName')}
//           </h2>
//           <p className="text-muted-foreground mt-2">
//             {t('auth.login')}
//           </p>
//         </div>

//         <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
//           <InstallPrompt />

//           {/* STEP 1 — PHONE */}
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label>{t('auth.phone')}</Label>
//               <Input
//                 type="tel"
//                 placeholder="079xxxxxxx"
//                 value={formData.phone}
//                 onChange={(e) =>
//                   setFormData({ ...formData, phone: e.target.value })
//                 }
//                 className="text-left ltr"
//                 disabled={loading}
//               />
//             </div>

//             <div className="flex gap-2">
//               {/* زر التالي */}
//               <Button
//                 className="w-2/3"
//                 onClick={handleNext}
//                 disabled={submitting || formData.phone.length < 9}
//               >
//                 {submitting ? <Loader2 className="animate-spin" /> : t('common.next')}
//               </Button>

//               {/* زر العودة */}
//               <Button
//                 variant="outline"
//                 className="w-1/3"
//                 onClick={() => router.push("/")}
//                 disabled={loading}
//               >
//                 {t('common.back')}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";

import InstallPrompt from "@/components/install-prompt";
import { useLogin } from "@/hooks/use-login";

export default function LoginPhone() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale();

  const [roleFromUrl, setRoleFromUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { 
    loading, 
    formData, 
    setFormData, 
    handleCheckPhone,
    returningUser,
    handleReturningUserLogin,
    resetToPhoneStep,
  } = useLogin();

  // ✅ جلب الـ role من الـ URL
  useEffect(() => {
    const role = searchParams.get("role");

    if (role === "carrier" || role === "traveler") {
      setRoleFromUrl(role);
      setFormData((prev) => ({ ...prev, role }));
    } else {
      router.replace("/");
    }
  }, [searchParams, setFormData, router]);

  // ⚠️ لحد ما نعرف الـ role
  if (!roleFromUrl) return null;

  const handleNext = async () => {
    setSubmitting(true);

    const result = await handleCheckPhone();
    console.log('🔍 Result from handleCheckPhone:', result);
    console.log('🔍 returningUser state:', returningUser);

    if (result.success) {
      console.log('✅ Success! isReturningUser:', result.isReturningUser);
      // ✅ لو مستخدم جديد، روح لصفحة الاسم والشروط
      if (!result.isReturningUser) {
        console.log('➡️ Navigating to login-client (new user)');
        router.push(`/login-client?role=${formData.role}`);
      } else {
        console.log('👤 Returning user - staying on this page');
      }
      // ✅ لو مستخدم قديم، الـ returningUser هيتحط والكومبوننت هيعرضله شاشة الترحيب تلقائياً
    }
    
    setSubmitting(false);
  };

  // ✅ لو المستخدم راجع (returning user)، نعرضله شاشة الترحيب
  if (returningUser) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-4 bg-background"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {t('common.appName')}
            </h2>
            <p className="text-muted-foreground mt-2">
              {t('auth.login')}
            </p>
          </div>

          <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>

              <h3 className="text-xl font-bold">
                {locale === 'ar' 
                  ? `مرحباً بعودتك، ${returningUser.firstName}`
                  : `Welcome back, ${returningUser.firstName}`
                }
              </h3>
              <p className="text-muted-foreground text-sm">
                {locale === 'ar'
                  ? `تم التعرف على حسابك كـ "${returningUser.role === "carrier" ? "ناقل" : "مسافر"}"`
                  : `You are logged in as "${returningUser.role === "carrier" ? "Carrier" : "Traveler"}"`
                }
              </p>

              <Button
                className="w-full"
                onClick={handleReturningUserLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  locale === 'ar' ? 'دخول إلى حسابي' : 'Login to my account'
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={resetToPhoneStep}
                disabled={loading}
              >
                {locale === 'ar' ? 'استخدام رقم آخر' : 'Use another number'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ الشاشة العادية لإدخال رقم الهاتف
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4 bg-background"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('common.appName')}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t('auth.login')}
          </p>
        </div>

        <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
          <InstallPrompt />

          {/* STEP 1 — PHONE */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('auth.phone')}</Label>
              <Input
                type="tel"
                placeholder="079xxxxxxx"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="text-left ltr"
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              {/* زر التالي */}
              <Button
                className="w-2/3"
                onClick={handleNext}
                disabled={submitting || formData.phone.length < 9}
              >
                {submitting ? <Loader2 className="animate-spin" /> : t('common.next')}
              </Button>

              {/* زر العودة */}
              <Button
                variant="outline"
                className="w-1/3"
                onClick={() => router.push("/")}
                disabled={loading}
              >
                {t('common.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}