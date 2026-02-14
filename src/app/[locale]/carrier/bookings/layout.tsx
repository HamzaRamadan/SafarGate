'use client';

import { type ReactNode } from "react";

export default function CarrierBookingsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="space-y-4 w-full">
            <header>
                <h1 className="text-xl md:text-2xl font-bold">صندوق المهام</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    إدارة جميع الطلبات الجديدة في مكان واحد: طلبات الحجز، الطلبات المباشرة، وطلبات نقل الركاب.
                </p>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}
