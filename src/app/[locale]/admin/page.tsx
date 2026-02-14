'use client';
import { AdminDashboardStats } from '@/components/admin/admin-dashboard-stats';
import { RecentUsers } from '@/components/admin/recent-users';
import { RecentTrips } from '@/components/admin/recent-trips';
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { isLoading: isAdminLoading } = useAdmin();

  if (isAdminLoading) {
    return (
        <div className="space-y-6">
            <header>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </header>
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <Skeleton className="h-96 w-full" />
                </div>
                <div className="lg:col-span-3">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">لوحة تحكم المدير الأعلى</h1>
        <p className="text-muted-foreground">نظرة شاملة على عمليات النظام.</p>
      </header>
      <AdminDashboardStats />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <RecentTrips />
        </div>
        <div className="lg:col-span-3">
            <RecentUsers />
        </div>
      </div>
    </div>
  );
}
