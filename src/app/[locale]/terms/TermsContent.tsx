'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    setFrom(searchParams.get('from'));
  }, [searchParams]);

  const handleAgree = () => {
    localStorage.setItem('termsAgreed', 'true');
    router.back();
  };

  return (
    <div className="min-h-screen p-6 bg-background" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">الشروط والأحكام</h1>

      <p className="mb-8 text-muted-foreground">
        هنا تكتب الشروط بتاعتك بالكامل. يمكن أن تكون طويلة وتشمل كل التفاصيل المطلوبة.
      </p>

      <Button className="w-full" onClick={handleAgree}>
        أوافق على الشروط
      </Button>
    </div>
  );
}
