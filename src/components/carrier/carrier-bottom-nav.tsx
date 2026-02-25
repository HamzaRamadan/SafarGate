'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavLink {
    href: string;
    label: string;
    icon: LucideIcon;
    exact?: boolean;
    count: number;
    mobile?: boolean;
}

interface CarrierBottomNavProps {
    onAddTripClick: () => void;
    navLinks: NavLink[];
}

export function CarrierBottomNav({ onAddTripClick, navLinks }: CarrierBottomNavProps) {
  const pathname = usePathname();
  const navItems = navLinks.filter(link => link.mobile);

  return (
    <div className="carrier-bottom-nav">
      <div className="relative h-full max-w-2xl mx-auto md:max-w-3xl">
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 filter drop-shadow-xl">
          <Button size="icon" id="new-trip-button" className="h-16 w-16 rounded-full bg-turquoise text-black border-4 border-background hover:bg-turquoise/90 transition-transform active:scale-95" onClick={onAddTripClick}>
            <PlusCircle className="h-8 w-8" />
          </Button>
        </div>

        <nav className="grid grid-cols-5 h-full items-center px-2">
          {navItems.slice(0, 2).map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center gap-1 w-full py-2 h-full">
                {item.count > 0 && <Badge variant="destructive" className="absolute top-1 right-2 bg-orange-500 text-white px-1.5 py-0.5 text-[10px] rounded-full flex items-center justify-center w-4 h-4">{item.count}</Badge>}
                <Icon className={cn('h-6 w-6 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-[10px] font-bold transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="flex justify-center items-center h-full"></div>

          {navItems.slice(2).map((item) => {
             const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center gap-1 w-full py-2 h-full">
                {item.count > 0 && <Badge variant="destructive" className="absolute top-1 right-2 bg-orange-500 text-white px-1.5 py-0.5 text-[10px] rounded-full flex items-center justify-center w-4 h-4">{item.count}</Badge>}
                <Icon className={cn('h-6 w-6 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-[10px] font-bold transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}