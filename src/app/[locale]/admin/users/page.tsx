'use client';

// [SC-201] Cleaned Imports
import { UserRowActions } from '@/components/admin/users/user-row-actions';
import type { UserProfile } from '@/lib/data';
import { AddAdminDialog } from '@/components/admin/add-admin-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Loader2, User, ShieldCheck, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useRouter } from 'next/navigation'; // [SC-208] Router lives here now

export default function AdminUsersPage() {
  const router = useRouter(); // [SC-208] Initialize Router
  // [SC-208] Updated destructuring to get the new specialized function
  const {
    users,
    loading,
    loadingMore,
    hasMore,
    fetchUsers,
    toggleUserFreeze, 
    setFilterCountry,
    setFilterClass,
    setFilterStatus
  } = useAdminUsers();

  // [SC-208] The Bridge between UI and Logic
  const handleActionBridge = (action: 'view' | 'finance_freeze' | 'security_freeze', id: string) => {
    if (action === 'view') {
        // UI Responsibility: Navigation
        router.push(`/admin/users/${id}`);
    } else {
        // Logic Responsibility: Data Mutation
        toggleUserFreeze(action, id);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner': return <Badge variant="destructive">مالك</Badge>;
      case 'admin': return <Badge variant="destructive" className="bg-red-700">مدير</Badge>;
      case 'carrier': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">ناقل</Badge>;
      case 'traveler': return <Badge variant="outline">مسافر</Badge>;
      default: return <Badge variant="outline">غير محدد</Badge>;
    }
  };
  
  const getFinancialStatusBadge = (user: UserProfile) => {
    if (user.isFinancialFrozen) return <Badge className="bg-orange-100 text-orange-800 gap-1"><DollarSign className="h-3 w-3"/>مجمد</Badge>;
    if (user.subscriptionStatus === 'active') return <Badge className="bg-green-100 text-green-800 gap-1"><ShieldCheck className="h-3 w-3"/>نشط</Badge>;
    return <Badge variant="destructive" className="gap-1">منتهي</Badge>;
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-col gap-6 pb-6 border-b">
        <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">مركز إدارة المستخدمين</CardTitle>
              <CardDescription>Sovereign Command Center • Financial Intelligence</CardDescription>
            </div>
            <AddAdminDialog />
        </div>

        {/* Layered Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border">
            <Select onValueChange={setFilterCountry} defaultValue="all">
                <SelectTrigger className="bg-white"><SelectValue placeholder="الدولة" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل الدول</SelectItem>
                    <SelectItem value="Jordan">الأردن 🇯🇴</SelectItem>
                    <SelectItem value="Saudi Arabia">السعودية 🇸🇦</SelectItem>
                </SelectContent>
            </Select>

            <Select onValueChange={setFilterClass} defaultValue="all">
                <SelectTrigger className="bg-white"><SelectValue placeholder="المركبة" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل الأسطول</SelectItem>
                    <SelectItem value="BUS">حافلات (BUS)</SelectItem>
                    <SelectItem value="SEDAN">سيارات (SEDAN)</SelectItem>
                    <SelectItem value="VAN">فان (VAN)</SelectItem>
                </SelectContent>
            </Select>

            <Select onValueChange={setFilterStatus} defaultValue="all">
                <SelectTrigger className="bg-white"><SelectValue placeholder="الوضع المالي" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="active">🟢 مشترك نشط</SelectItem>
                    <SelectItem value="frozen">🔴 مجمد مالياً</SelectItem>
                </SelectContent>
            </Select>
            
            <Button variant="default" onClick={() => fetchUsers(false)} className="md:col-span-1">
                تحديث النتائج 🔍
            </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[280px] py-4 text-right">المستخدم</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">الحالة المالية</TableHead>
                <TableHead className="text-right">النطاق</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && users.length === 0 ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell colSpan={5}><Skeleton className="h-12 w-full rounded-md" /></TableCell>
                    </TableRow>
                ))
              ) : users.map((user) => (
                <TableRow key={user.id} className="hover:bg-blue-50/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={user.photoURL || ""} alt={user.firstName} />
                          <AvatarFallback>{user.firstName?.charAt(0) || <User className="h-4 w-4"/>}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-gray-500 font-mono">{user.phoneNumber || user.email}</div>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {getRoleBadge(user.role)}
                      {user.vehicleClass && (
                        <Badge variant="outline" className="text-[10px] font-mono flex items-center gap-1 border-gray-300">
                          <Car className="h-3 w-3 text-gray-500"/>
                          {user.vehicleClass}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                   <TableCell>{getFinancialStatusBadge(user)}</TableCell>
                  <TableCell className="text-sm font-medium text-gray-600">
                    {user.operatingCountry ? `${user.operatingCountry} / ${user.baseCity}` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <UserRowActions 
                      userId={user.id}
                      isFinancialFrozen={!!user.isFinancialFrozen} 
                      isSecurityFrozen={!!user.isDeactivated}
                      onAction={handleActionBridge} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
       <CardFooter className="justify-center border-t py-6 bg-gray-50/30">
        <Button onClick={() => fetchUsers(true)} variant="outline" disabled={loadingMore || !hasMore} className="w-[200px]">
          {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : hasMore ? 'تحميل المزيد' : 'نهاية القائمة'}
        </Button>
      </CardFooter>
    </Card>
  );
}
