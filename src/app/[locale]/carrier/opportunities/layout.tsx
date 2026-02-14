'use client';
import { type ReactNode } from 'react';
export default function CarrierOpportunitiesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="space-y-4 w-full">
            <header>
                <h1 className="text-xl md:text-2xl font-bold">سوق الطلبات العامة</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    استعرض كل الفرص المتاحة من السوق العام وقدم عروضك التنافسية.
                </p>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}