'use client';

import { useAdmin } from '@/hooks/use-admin';
import Link from 'next/link';
import {
  Bell,
  Home,
  Users,
  Ship,
  Package,
  LineChart,
  Settings,
  CircleUser,
  Menu,
  ShieldCheck,
  ArrowRightLeft,
  Loader2,
  FileCheck,
  LogOut,
  Coins,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/logo';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';


function AdminLoadingScreen() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <ShieldCheck className="h-16 w-16 animate-pulse text-primary" />
                <p className="font-bold text-lg text-muted-foreground">جاري التحقق من صلاحيات المدير...</p>
            </div>
        </div>
    );
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  // The layout uses the hook's state to conditionally render content.
  // This is safer than relying on useEffect for redirection during the initial render.
  const { isLoading: isAdminLoading, isAdmin } = useAdmin();
  const { profile, user } = useUserProfile();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  // While the admin status is being determined, show a loading screen.
  // Also, if the check is complete and the user is NOT an admin, continue showing the loading/access screen.
  // The hook's useEffect will handle the eventual redirection.
  if (isAdminLoading || !isAdmin) {
    return <AdminLoadingScreen />;
  }
  
  const handleSignOut = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'خدمة المصادقة غير متاحة.' });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: 'تم تسجيل الخروج بنجاح' });
      router.push('/admin/login');
    } catch (error) {
      toast({ variant: 'destructive', title: 'فشل تسجيل الخروج', description: 'حدث خطأ ما.' });
    }
  };


  const isDevUser = user?.email === 'dev@safar.com';

  // Only if loading is false AND the user is an admin, render the actual layout.
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]" dir="rtl">
      <aside className="hidden border-l bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-4 lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Logo />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Home className="h-4 w-4" />
                لوحة التحكم
              </Link>
              <Link
                href="/admin/trips"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Ship className="h-4 w-4" />
                إدارة الرحلات
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
              >
                <Users className="h-4 w-4" />
                إدارة المستخدمين
              </Link>
              <Link
                href="/admin/audit-logs"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <FileCheck className="h-4 w-4" />
                السجل القانوني
              </Link>
              <Link
                href="/admin/settings/pricing"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Coins className="h-4 w-4" />
                الإعدادات المالية
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <LineChart className="h-4 w-4" />
                الإحصائيات
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>تحتاج مساعدة؟</CardTitle>
                <CardDescription>
                  تواصل مع الدعم الفني لأي استفسار.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  تواصل مع الدعم
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-4 lg:px-6">
          
          {/* Right Section: Mobile nav and Logo */}
          <div className='flex items-center gap-4'>
            <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="flex flex-col">
                    <nav className="grid gap-2 text-lg font-medium">
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 text-lg font-semibold mb-4"
                      >
                        <Logo />
                      </Link>
                      <Link
                        href="/admin"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <Home className="h-5 w-5" />
                        لوحة التحكم
                      </Link>
                      <Link
                        href="/admin/users"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <Users className="h-5 w-5" />
                        إدارة المستخدمين
                      </Link>
                      <Link
                        href="/admin/audit-logs"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <FileCheck className="h-5 w-5" />
                        السجل القانوني
                      </Link>
                      <Link
                        href="/admin/settings/pricing"
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <Coins className="h-5 w-5" />
                        الإعدادات المالية
                      </Link>
                    </nav>
                  </SheetContent>
                </Sheet>
            </div>
             <div className="hidden md:flex">
              <Link href="/admin">
                <Logo />
              </Link>
            </div>
          </div>
          
          {/* Left Section: Controls */}
          <div className='flex items-center gap-4'>
            {isDevUser && (
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowRightLeft className="h-4 w-4"/>
                </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <CircleUser className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>مرحباً، {profile?.firstName || 'أيها المدير'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>الإعدادات</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                   <LogOut className="ml-2 h-4 w-4" />
                   تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
