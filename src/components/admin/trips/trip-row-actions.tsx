'use client';

import { MoreHorizontal, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface TripRowActionsProps {
  tripId: string;
  onView: () => void;
}

export function TripRowActions({ tripId, onView }: TripRowActionsProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">فتح القائمة</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(tripId)}>
          <FileText className="mr-2 h-4 w-4" /> نسخ المعرف (ID)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" /> التفاصيل والتدقيق
        </DropdownMenuItem>
        
        {/* [SC-206] Force Cancel button has been removed to comply with Broker Policy. */}

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
