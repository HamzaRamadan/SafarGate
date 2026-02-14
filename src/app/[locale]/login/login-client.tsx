"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import InstallPrompt from "@/components/install-prompt";
import { useLogin } from "@/hooks/use-login";

export default function LoginPhone() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale();

  const [roleFromUrl, setRoleFromUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loading, formData, setFormData, handleCheckPhone } = useLogin();

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

    const ok = await handleCheckPhone();

    if (ok) {
      router.push(`/login-client?role=${formData.role}`);
    } else {
      setSubmitting(false);
    }
  };

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
