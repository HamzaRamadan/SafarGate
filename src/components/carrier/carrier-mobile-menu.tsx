'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Logo } from '../logo';
import { LayoutDashboard, Search, Route, Archive, User, ListChecks, Briefcase, type LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface NavLink {
    href: string;
    label: string;
    icon: LucideIcon;
    exact?: boolean;
    count: number;
    mobile?: boolean;
}

interface CarrierMobileMenuProps {
    onLinkClick: () => void;
    navLinks: NavLink[];
}

export function CarrierMobileMenu({ onLinkClick, navLinks }: CarrierMobileMenuProps) {
    const pathname = usePathname();
    const allLinks = [...navLinks, { href: '/carrier/profile', label: 'الملف الشخصي والإعدادات', icon: User, exact: true, count: 0, mobile: false }];

    return (
        <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b text-right">
                <Logo />
                <SheetTitle className="sr-only">Carrier Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex-grow p-4">
                <ul className="space-y-2">
                    {allLinks.map(link => {
                        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={onLinkClick}
                                    className={cn(
                                        "flex items-center justify-between gap-4 rounded-lg px-4 py-3 text-lg font-semibold transition-colors hover:bg-muted/50 hover:text-primary",
                                        isActive ? "bg-primary/10 text-primary" : "text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <link.icon className="h-5 w-5" />
                                        <span>{link.label}</span>
                                    </div>
                                    {link.count > 0 && <Badge variant="destructive" className="bg-orange-500 text-white">{link.count}</Badge>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
