"use client";

import { ReactNode, useState } from "react";
import { Link } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/routing";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAuth, useFunctions } from "@/firebase";
import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import {
  LayoutGrid,
  LogOut,
  User,
  Menu,
  MessageSquare,
  Bell,
  Trash2,
  Facebook,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUnreadChats } from "@/hooks/use-unread-chats";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, profile } = useUserProfile();
  const auth = useAuth();
  const functions = useFunctions();
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useUnreadChats();
  const { toast } = useToast();
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations('nav');
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');

  const navItems = [
    { href: "/dashboard", label: t('dashboard'), icon: LayoutGrid },
    { href: "/chats", label: t('chats'), icon: MessageSquare },
  ];

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!functions) return;
    if (
      !confirm(
        locale === 'ar' 
          ? "⚠️ تحذير نهائي: هل أنت متأكد من حذف حسابك؟\n\nسيتم مسح بياناتك الشخصية ولن تتمكن من استرجاعها. سجلات رحلاتك ستبقى للأغراض الأمنية فقط."
          : "⚠️ Final Warning: Are you sure you want to delete your account?\n\nYour personal data will be deleted and cannot be recovered. Your trip records will remain for security purposes only."
      )
    )
      return;

    const deleteFn = httpsCallable(functions, "deleteTravelerAccount");

    try {
      toast({
        title: locale === 'ar' ? "جاري الحذف..." : "Deleting...",
        description: locale === 'ar' ? "يتم الآن إزالة بياناتك من النظام." : "Removing your data from the system.",
      });
      await deleteFn();
      toast({ title: locale === 'ar' ? "تم حذف الحساب بنجاح" : "Account deleted successfully" });
      if (auth) {
        await signOut(auth);
      }
      window.location.href = "/";
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: tCommon('error'),
        description: error.message || tCommon('error'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Section */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Mobile Menu (Sheet) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{locale === 'ar' ? 'القائمة' : 'Menu'}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={locale === 'ar' ? 'right' : 'left'}>
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary ${
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <Button
                  variant="ghost"
                  className="justify-start gap-3 text-destructive mt-4 hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  {t('logout')}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Sheet open={isSocialOpen} onOpenChange={setIsSocialOpen}>
              <SheetTrigger asChild>
                <div className="cursor-pointer mt-5">
                  <Image
                    src="/logo.png"
                    alt={locale === 'ar' ? 'سفريات' : 'Safar Gate'}
                    width={150}
                    height={40}
                    priority
                  />
                </div>
              </SheetTrigger>

              <SheetContent
                side="top"
                className="max-w-sm mx-auto mt-12 p-6 rounded-2xl shadow-lg bg-background/95 backdrop-blur-md border border-muted-foreground/10"
              >
                <h3 className="text-lg font-semibold mb-4 text-center">
                  {locale === 'ar' ? 'تابعنا على السوشيال ميديا' : 'Follow us on social media'}
                </h3>
                <div className="flex flex-col gap-4">
                  <a
                    href="https://www.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-black hover:text-white transition-colors"
                  >
                    <Facebook />
                    <span className="font-medium">{locale === 'ar' ? 'فيسبوك' : 'Facebook'}</span>
                  </a>

                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-black hover:text-white transition-colors"
                  >
                    <Instagram />
                    <span className="font-medium">{locale === 'ar' ? 'إنستاجرام' : 'Instagram'}</span>
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-primary ${
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div 
                className="flex items-center gap-3" 
                style={{ 
                  marginRight: locale === 'ar' ? '64px' : '0',
                  marginLeft: locale === 'en' ? '64px' : '0'
                }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="relative ml-1"
                >
                  <Link href="/chats">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full p-0 text-[10px] animate-in zoom-in"
                      >
                        {unreadCount > 9 ? "+9" : unreadCount}
                      </Badge>
                    )}
                    <span className="sr-only">{t('chats')}</span>
                  </Link>
                </Button>

                <span className="text-sm font-medium hidden sm:inline-block">
                  {profile?.firstName || (locale === 'ar' ? 'المسافر' : 'Traveler')}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9 border-2 border-primary/10">
                        <AvatarImage
                          src={user.photoURL || ""}
                          alt={profile?.firstName || "User"}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.firstName} {profile?.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {profile?.role !== "traveler" && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>{t('profile')}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {profile?.role !== "traveler" && <DropdownMenuSeparator />}

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('logout')}</span>
                    </DropdownMenuItem>

                    {profile?.role === "traveler" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleDeleteAccount}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{locale === 'ar' ? 'حذف حسابي نهائياً' : 'Delete My Account'}</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">{t('login')}</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container py-6 px-4 md:px-6">{children}</main>
    </div>
  );
}
