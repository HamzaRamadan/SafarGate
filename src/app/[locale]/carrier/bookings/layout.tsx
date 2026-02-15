'use client';

import { type ReactNode } from "react";
import { useTranslations } from 'next-intl';

export default function CarrierBookingsLayout({ children }: { children: ReactNode }) {
      const t = useTranslations('bookingRequests'); 

    return (
        <div className="space-y-4 w-full">
            <header>
            <h1 className="text-xl md:text-2xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground text-sm md:text-base">{t('description')}</p>
    
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}
