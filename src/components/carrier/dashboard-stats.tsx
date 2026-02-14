'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, PackageSearch } from 'lucide-react';

const stats = [
  {
    title: 'طلبات تنتظر العروض',
    value: '7',
    description: 'طلبات جديدة في السوق',
    icon: PackageSearch,
  },
  {
    title: 'حجوزاتي المؤكدة',
    value: '4',
    description: 'الرحلات القادمة المخطط لها',
    icon: Briefcase,
  },
  {
    title: 'عدد الركاب',
    value: '12',
    description: 'إجمالي الركاب في رحلاتك',
    icon: Users,
  },
];

export function DashboardStats() {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue='item-1'>
      <AccordionItem value="item-1" className="border border-primary rounded-lg bg-card">
        <AccordionTrigger className="text-xl font-bold hover:no-underline px-4 py-3">
          نظرة سريعة
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-2 px-4 md:grid-cols-1 lg:grid-cols-3">
            {stats.map((stat) => (
              <Card
                key={stat.title}
                className="transition-colors hover:bg-card/80"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
