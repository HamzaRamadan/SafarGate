"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Ship, Loader2 } from "lucide-react";
import { useLogin } from "@/hooks/use-login";

export default function LoginStep2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale();

  const [role, setRole] = useState<string | null>(null);
  const [redirectingToTerms, setRedirectingToTerms] = useState(false);

  const {
    formData,
    setFormData,
    loading,
    handleRegister,
    returningUser,
    handleReturningUserLogin,
    resetToPhoneStep,
  } = useLogin();

  // جلب الـ role من URL
  useEffect(() => {
    const roleFromUrl = searchParams.get("role");
    if (roleFromUrl === "carrier" || roleFromUrl === "traveler") {
      setRole(roleFromUrl);
      setFormData((prev) => ({ ...prev, role: roleFromUrl }));
    } else {
      router.replace("/");
    }
  }, [searchParams, setFormData, router]);

  // استعادة موافقة الشروط لو موجودة
  useEffect(() => {
    const agreed = localStorage.getItem("termsAgreed");
    if (agreed === "true") {
      setFormData((prev) => ({
        ...prev,
        agreed: true,
      }));
      localStorage.removeItem("termsAgreed");
    }
  }, [setFormData]);

  // استعادة الاسم المؤقت لو رجع من صفحة الشروط
  useEffect(() => {
    const savedName = localStorage.getItem("tempFirstName");
    if (savedName) {
      setFormData((prev) => ({ ...prev, firstName: savedName }));
    }
  }, [setFormData]);

  // Wrapper لمسح الاسم بعد تسجيل ناجح
  const handleRegisterWrapper = async () => {
    await handleRegister();
    localStorage.removeItem("tempFirstName");
  };

  if (!role) return null;

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
          <div className="space-y-4">
            {/* الاسم الرباعي */}
            <div className="space-y-2">
              <Label>{t('auth.name')}</Label>
              <Input
                placeholder={t('auth.name')}
                value={formData.firstName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, firstName: value });
                  localStorage.setItem("tempFirstName", value); // حفظ مؤقت
                }}
                disabled={loading}
              />
            </div>

            {/* عرض الدور */}
            <div className="border rounded-lg p-4 text-center flex flex-col items-center gap-2 bg-primary/10 border-primary">
              {formData.role === "carrier" ? (
                <>
                  <Ship className="h-8 w-8 text-primary" />
                  <span className="font-bold">{t('carrier.title')}</span>
                </>
              ) : (
                <>
                  <User className="h-8 w-8 text-primary" />
                  <span className="font-bold">{t('traveler.title')}</span>
                </>
              )}
            </div>

            {/* موافقة الشروط */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={formData.agreed}
                disabled={loading || redirectingToTerms}
                onCheckedChange={() => {
                  setRedirectingToTerms(true);
                  router.push("/terms?from=login-client");
                }}
              />

              <Label htmlFor="terms" className="cursor-pointer">
                {locale === 'ar' ? 'أوافق على الشروط والأحكام' : 'I agree to the Terms and Conditions'}
              </Label>
            </div>

            {/* زر التسجيل */}
            <Button
              className="w-full"
              onClick={handleRegisterWrapper}
              disabled={loading || !formData.firstName || !formData.agreed}
            >
              {loading ? <Loader2 className="animate-spin" /> : t('auth.signup')}
            </Button>

            {/* زر العودة */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/login?role=${formData.role}`)}
              disabled={loading}
            >
              {t('common.back')}
            </Button>
          </div>

          {/* STEP 3: المستخدم العائد */}
          {returningUser && (
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
          )}
        </div>
      </div>
    </div>
  );
}
