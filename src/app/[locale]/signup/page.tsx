'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';


export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified login page, specifying the role
    router.replace('/login?role=traveler');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-bold text-lg text-muted-foreground">جاري إعادة التوجيه إلى البوابة الموحدة...</p>
      </div>
    </div>
  );
}
