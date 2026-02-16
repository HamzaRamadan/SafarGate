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
import { Logo } from "@/components/logo";

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

  // ✅ لو المستخدم راجع (returning user)، نرجعه لصفحة الـ phone
  // عشان تظهرله شاشة الترحيب هناك
  useEffect(() => {
    if (returningUser) {
      router.replace(`/login?role=${formData.role}`);
    }
  }, [returningUser, router, formData.role]);

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
           <div  className="flex justify-center">
                                        <div className="cursor-pointer hover:scale-110 transition-transform duration-300">
                                          <Logo />
                                        </div>
                                    </div>
          
          <h2 className="text-3xl font-bold tracking-tight">
            {t('common.appName')}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t('auth.signup')}
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
                disabled={loading}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({
                    ...prev,
                    agreed: Boolean(checked),
                  }));
                }}
              />

              <span className="text-sm">
                {locale === "ar" ? (
                  <>
                    أوافق على{" "}
                    <button
                      type="button"
                      disabled={redirectingToTerms}
                      onClick={() => {
                        setRedirectingToTerms(true);
                        router.push("/terms?from=login-client");
                      }}
                      className="inline-flex items-center text-primary underline hover:opacity-80"
                    >
                      الشروط والأحكام
                      {redirectingToTerms && (
                        <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    I agree to the{" "}
                    <button
                      type="button"
                      disabled={redirectingToTerms}
                      onClick={() => {
                        setRedirectingToTerms(true);
                        router.push("/terms?from=login-client");
                      }}
                      className="inline-flex items-center text-primary underline hover:opacity-80"
                    >
                      Terms and Conditions
                      {redirectingToTerms && (
                        <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                      )}
                    </button>
                  </>
                )}
              </span>
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
        </div>
      </div>
    </div>
  );
}