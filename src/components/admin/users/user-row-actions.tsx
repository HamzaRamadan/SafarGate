'use client';

import { MoreHorizontal, ShieldAlert, DollarSign, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface UserRowActionsProps {
  userId: string;
  isFinancialFrozen: boolean;
  isSecurityFrozen: boolean;
  onAction: (action: 'view' | 'finance_freeze' | 'security_freeze', id: string) => void;
}

export const UserRowActions = ({ userId, isFinancialFrozen, isSecurityFrozen, onAction }: UserRowActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAction('view', userId)}>
          <Eye className="mr-2 h-4 w-4" />
          التفاصيل والتدقيق
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onAction('finance_freeze', userId)}
          className="text-red-600 focus:text-red-600"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          {isFinancialFrozen ? 'فك التجميد المالي' : 'تجميد مالي (اشتراك)'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onAction('security_freeze', userId)}
           className="text-orange-600 focus:text-orange-600"
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          {isSecurityFrozen ? 'فك التجميد الأمني' : 'تجميد أمني'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
