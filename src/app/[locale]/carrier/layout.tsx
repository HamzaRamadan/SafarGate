"use client";

import { useState, useMemo, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/routing";
import { useUser, useAuth, useFirestore, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  Map,
  List,
  MessageSquare,
  LogOut,
  Menu,
  Bell,
  User,
  Archive,
  ListChecks,
  PlusCircle,
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
import { collection, query, where, doc, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { CarrierMobileMenu } from "@/components/carrier/carrier-mobile-menu";
import { CarrierBottomNav } from "@/components/carrier/carrier-bottom-nav";
import { NotificationBell } from "@/components/notification-bell";
import { AddTripDialog } from "./add-trip-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUnreadChats } from "@/hooks/use-unread-chats";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/language-switcher";

interface CarrierLayoutProps {
  children: React.ReactNode;
}

export default function CarrierLayout({ children }: CarrierLayoutProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const { toast } = useToast();
  const t = useTranslations("carrierLayout");
  const tNav = useTranslations("nav");
  const locale = useLocale();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  useEffect(() => {
    if (user?.uid && firestore) {
      const unsub = onSnapshot(
        doc(firestore, "users", user.uid),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setProfile(docSnapshot.data());
          }
        },
      );
      return () => unsub();
    }
  }, [user, firestore]);

  const unreadChatsCount = useUnreadChats();

  const pendingBookingsQuery = useMemo(() => {
    if (!user?.uid || !firestore) return null;
    return query(
      collection(firestore, "bookings"),
      where("carrierId", "==", user.uid),
      where("status", "==", "Pending-Carrier-Confirmation"),
    );
  }, [user, firestore]);
  const { data: pendingBookings } = useCollection(pendingBookingsQuery);
  const pendingBookingsCount = pendingBookings?.length || 0;

  const handleAddTripClick = () => {
    if (profile?.currentActiveTripId) {
      toast({
        variant: "destructive",
        title: t("activeTrip"),
        description: t("activeTripDesc"),
      });
    } else {
      setIsAddTripOpen(true);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push("/login");
  };

  const navLinks = [
    {
      href: "/carrier",
      label: t("command"),
      icon: LayoutDashboard,
      exact: true,
      count: 0,
      mobile: true,
    },
    {
      href: "/carrier/opportunities",
      label: t("market"),
      icon: Map,
      exact: false,
      count: 0,
      mobile: true,
    },
    {
      href: "/carrier/bookings",
      label: t("requests"),
      icon: List,
      exact: false,
      count: pendingBookingsCount,
      mobile: true,
    },
    {
      href: "/chats",
      label: t("messages"),
      icon: MessageSquare,
      exact: false,
      count: unreadChatsCount,
      mobile: true,
    },
    {
      href: "/carrier/trips",
      label: t("myTrips"),
      icon: List,
      exact: false,
      count: 0,
    },
    {
      href: "/carrier/archive",
      label: t("archive"),
      icon: Archive,
      exact: true,
      count: 0,
    },
    {
      href: "/carrier/conditions",
      label: t("ProfessionalConditions"),
      icon: ListChecks,
      exact: true,
      count: 0,
    },
    {
      href: "/carrier/Permanent",
      label: t("permanentConditions"),
      icon: ListChecks,
      exact: true,
      count: 0,
    },
  ];

  if (isUserLoading) return null;

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            {/* Mobile Menu */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("menu")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side={locale === "ar" ? "right" : "left"}
                className="p-0"
              >
                <CarrierMobileMenu
                  onLinkClick={() => setIsSidebarOpen(false)}
                  navLinks={navLinks}
                />
              </SheetContent>
            </Sheet>

            {/* Logo + Social Sheet */}
            <div className="flex items-center gap-2">
              <Sheet open={isSocialOpen} onOpenChange={setIsSocialOpen}>
                <SheetTrigger asChild>
                  <div className="cursor-pointer mt-5">
                    <Image
                      src="/logo.png"
                      alt={locale === "ar" ? "سفريات" : "Safar Gate"}
                      width={150}
                      height={40}
                      priority
                      className="w-[110px] md:w-[150px] h-auto"
                    />
                  </div>
                </SheetTrigger>

                <SheetContent
                  side="top"
                  className="max-w-sm mx-auto mt-12 p-6 rounded-2xl shadow-lg bg-background/95 backdrop-blur-md border border-muted-foreground/10"
                >
                  <h3 className="text-lg font-semibold mb-4 text-center">
                    {t("followSocial")}
                  </h3>
                  <div className="flex flex-col gap-4">
                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-black hover:text-white transition-colors"
                    >
                      <Facebook />
                      <span className="font-medium">{t("facebook")}</span>
                    </a>
                    <a
                      href="https://www.instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-black hover:text-white transition-colors"
                    >
                      <Instagram />
                      <span className="font-medium">{t("instagram")}</span>
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks
                .filter((l) => !l.mobile)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors hover:text-primary ${pathname === item.href ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Avatar on Mobile */}
              <div className="flex sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9 border-2 border-primary/10">
                        <AvatarImage
                          src={user?.photoURL || ""}
                          alt={profile?.firstName || "Carrier"}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary">
                          {profile?.firstName?.[0] || "C"}
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
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href="/carrier/profile"
                        className="flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{t("carrierProfile")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Bell + Avatar on Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9 border-2 border-primary/10">
                        <AvatarImage
                          src={user?.photoURL || ""}
                          alt={profile?.firstName || "Carrier"}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary">
                          {profile?.firstName?.[0] || "C"}
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
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href="/carrier/profile"
                        className="flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{t("carrierProfile")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Language Switcher */}
              <div className="ml-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 container py-6 px-4 md:px-6 mb-20">
          {children}
        </main>

        <CarrierBottomNav
          onAddTripClick={handleAddTripClick}
          navLinks={navLinks}
        />
      </div>

      <AddTripDialog isOpen={isAddTripOpen} onOpenChange={setIsAddTripOpen} />
    </>
  );
}