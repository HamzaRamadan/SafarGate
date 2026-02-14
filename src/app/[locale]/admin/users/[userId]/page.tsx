'use client';

import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { useFirestore, useFunctions } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ShieldAlert, Calendar, User, Activity, FileText } from 'lucide-react';
import { UserRowActions } from '@/components/admin/users/user-row-actions';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/data';

export default function UserDetailPage() {
  const { userId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const functions = useFunctions();
  const { toast } = useToast();

  const [userSnapshot, loadingUser] = useDocument(
    firestore ? doc(firestore, 'users', userId as string) : null
  );

  const [logsSnapshot, loadingLogs] = useCollection(
    firestore 
      ? query(
          collection(firestore, 'admin_logs'), 
          where('targetUserId', '==', userId), 
          orderBy('timestamp', 'desc')
        ) 
      : null
  );

  const userData = userSnapshot?.data() as UserProfile;

  if (loadingUser) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!userData) return <div className="p-8 text-center text-red-500">مستخدم غير موجود</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowRight className="w-4 h-4 ml-2" /> عودة للقائمة
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">ملف المستخدم السيادي</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-blue-600 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>الهوية</span>
                <Badge variant="outline">{userData.role}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center py-4">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-3 border-2 border-dashed border-slate-300">
                  {userData.photoURL ? <img src={userData.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : "👤"}
                </div>
                <h3 className="text-xl font-bold">{userData.firstName} {userData.lastName}</h3>
                <p className="text-slate-500 font-mono text-sm">{userId}</p>
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">الهاتف:</span>
                  <span className="font-mono" dir="ltr">{userData.phoneNumber || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">البريد:</span>
                  <span className="font-mono text-xs">{userData.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">الدولة:</span>
                  <span>{userData.operatingCountry || 'غير محدد'}</span>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-center">
                 <UserRowActions 
                    userId={userId as string}
                    isFinancialFrozen={!!userData.isFinancialFrozen} 
                    isSecurityFrozen={!!userData.isDeactivated}
                    onAction={async (action, id) => {
                        if (!functions) return;
                        const freezeType = action === 'finance_freeze' ? 'financial' : 'security';
                        if(!confirm('تأكيد الإجراء السيادي؟')) return;
                        const toggleFn = httpsCallable(functions, 'toggleUserFreezeStatus');
                        await toggleFn({ targetUserId: id, freezeType, reason: "From Detail Page" });
                        toast({ title: "تم تنفيذ الإجراء" });
                    }}
                 />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">المؤشرات المالية</CardTitle></CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">الاشتراك:</span>
                    <Badge variant={userData.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                        {userData.subscriptionStatus || 'Inactive'}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">الرصيد:</span>
                    <span className="font-bold text-green-700">{userData.walletBalance || 0} د.أ</span>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full shadow-md">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <div>
                    <CardTitle>سجل الرقابة والعدالة (Audit Log)</CardTitle>
                    <CardDescription>تتبع جميع الإجراءات السيادية التي تمت على هذا الحساب</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
                {loadingLogs ? <Skeleton className="h-40 w-full" /> : 
                 logsSnapshot?.empty ? (
                    <div className="text-center py-12 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>لا توجد سجلات رقابة لهذا المستخدم حتى الآن.</p>
                    </div>
                 ) : (
                    <div className="relative border-r border-slate-200 mr-3 space-y-8">
                        {logsSnapshot?.docs.map((logDoc) => {
                            const log = logDoc.data();
                            const isFreeze = log.action === 'FREEZE';
                            return (
                                <div key={logDoc.id} className="relative mr-6">
                                    <span className={`absolute -right-[31px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${isFreeze ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    <div className="flex flex-col gap-1 rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
                                        <div className="flex justify-between items-start">
                                            <Badge variant={isFreeze ? "destructive" : "outline"} className={!isFreeze ? "text-green-700 border-green-200 bg-green-50" : ""}>
                                                {log.action} ({log.freezeType})
                                            </Badge>
                                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {log.timestamp?.toDate().toLocaleString('ar-JO')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium mt-2 text-slate-800">
                                            {log.reason}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Admin ID: {log.adminId}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
