import { Suspense } from 'react';
import ConfirmBookingClient from './confirm-booking-client';
import { Loader2 } from 'lucide-react';

export default function ConfirmBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
        </div>
      </div>
    }>
      <ConfirmBookingClient />
    </Suspense>
  );
}