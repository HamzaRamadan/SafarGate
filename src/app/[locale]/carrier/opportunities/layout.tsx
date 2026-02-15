'use client';
import { useTranslations } from 'next-intl';

import { type ReactNode } from 'react';
export default function CarrierOpportunitiesLayout({ children }: { children: ReactNode }) {
      const t = useTranslations('opportunities');

    return (
        <div className="space-y-4 w-full">
            <header>
                <h1 className="text-xl md:text-2xl font-bold">{t('generalMarketTitle')}</h1>
      <p className="text-muted-foreground text-sm md:text-base">
        {t('generalMarketDescription')}
      </p>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}