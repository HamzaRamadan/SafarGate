
'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, Search, Briefcase } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <div>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            <Card className="flex flex-col justify-between hover:bg-card/80 transition-colors w-full">
                <CardHeader>
                    <CardTitle>مركز الفرص (سوق الطلبات)</CardTitle>
                    <CardDescription>
                        استعرض كل طلبات المسافرين المتاحة وقدم أفضل عروضك لتأمين حجوزات جديدة.
                    </CardDescription>
                </CardHeader>
                <div className="p-4 pt-0">
                    <Button asChild className="w-full">
                        <Link href="/carrier/opportunities">
                            <Search className="ml-2 h-4 w-4" />
                            الذهاب إلى مركز الفرص
                        </Link>
                    </Button>
                </div>
            </Card>
            <Card className="flex flex-col justify-between hover:bg-card/80 transition-colors w-full">
                <CardHeader>
                    <CardTitle>طلبات الحجز الجديدة</CardTitle>
                    <CardDescription>
                       أدرْ طلبات الحجز الواردة على رحلاتك المجدولة من هنا.
                    </CardDescription>
                </CardHeader>
                 <div className="p-4 pt-0">
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/carrier/bookings">
                            <Briefcase className="ml-2 h-4 w-4" />
                            إدارة طلبات الحجز
                        </Link>
                    </Button>
                </div>
            </Card>
            <Card className="flex flex-col justify-between hover:bg-card/80 transition-colors w-full">
                <CardHeader>
                    <CardTitle>رحلاتي المجدولة</CardTitle>
                    <CardDescription>
                       تابع رحلاتك المنشورة، وعدّل تفاصيلها، وأدر الركاب المسجلين فيها.
                    </CardDescription>
                </CardHeader>
                 <div className="p-4 pt-0">
                    <Button asChild className="w-full" variant="secondary">
                        <Link href="/carrier/trips">
                            <Route className="ml-2 h-4 w-4" />
                            عرض رحلاتي المجدولة
                        </Link>
                    </Button>
                </div>
            </Card>
        </div>
    </div>
  );
}
