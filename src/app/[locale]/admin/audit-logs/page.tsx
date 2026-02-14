'use client';
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { FileText, ShieldCheck, UserCog, Activity, ArrowLeft } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/formatters';
import { useAdmin } from '@/hooks/use-admin';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

// Define the structure of an admin log entry
interface AdminLog {
    id: string;
    action: 'FREEZE' | 'UNFREEZE';
    freezeType: 'financial' | 'security';
    reason: string;
    targetUserId: string;
    adminId: string;
    timestamp: any; // Firestore Timestamp
    snapshot?: {
      userEmail?: string;
    }
}

export default function AuditLogsPage() {
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const router = useRouter();

  const logsQuery = useMemo(() => {
    if (!firestore || !isAdmin) return null;
    
    return query(
      collection(firestore, 'admin_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [firestore, isAdmin]);

  const { data: logs, isLoading: isLoadingLogs } = useCollection<AdminLog>(logsQuery);
  const isLoading = isAdminLoading || isLoadingLogs;
  
  const safeFormatTimestamp = (timestamp: any) => {
    if (!timestamp?.toDate) return 'غير متوفر';
    return formatDate(timestamp.toDate(), 'd MMMM yyyy, h:mm:ss a');
  };

  const getActionBadge = (log: AdminLog) => {
    const isFreeze = log.action === 'FREEZE';
    const variant = isFreeze ? 'destructive' : 'default';
    const text = isFreeze ? `تجميد ${log.freezeType === 'financial' ? 'مالي' : 'أمني'}` : `فك ${log.freezeType === 'financial' ? 'مالي' : 'أمني'}`;
    const className = !isFreeze ? "bg-green-100 text-green-800 border-green-200" : "";
    return <Badge variant={variant} className={className}>{text}</Badge>;
  }

  const renderTableBody = () => {
    if (isLoading) {
        return [...Array(8)].map((_, i) => (
            <TableRow key={i}>
                <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
            </TableRow>
        ));
    }
    
    if (!logs || logs.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="text-center h-48">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <FileText className="h-10 w-10 opacity-30" />
                        <span>لا توجد أي إجراءات سيادية مسجلة حتى الآن.</span>
                    </div>
                </TableCell>
            </TableRow>
        );
    }
    
    return logs.map(log => (
        <TableRow 
            key={log.id} 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/admin/users/${log.targetUserId}`)}
        >
            <TableCell>{getActionBadge(log)}</TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-semibold">{log.snapshot?.userEmail || 'User'}</span>
                    <span className="font-mono text-xs text-muted-foreground">{log.targetUserId}</span>
                </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{log.reason}</TableCell>
            <TableCell className="font-mono text-xs">{log.adminId}</TableCell>
            <TableCell className="font-semibold text-xs">{safeFormatTimestamp(log.timestamp)}</TableCell>
        </TableRow>
    ));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary"/>
            سجل القيادة والتحكم
        </CardTitle>
        <CardDescription>
            عرض مباشر لآخر 50 إجراء سيادي تم اتخاذه في النظام. اضغط على أي سجل للتحقيق.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>الإجراء</TableHead>
              <TableHead>المستخدم المستهدف</TableHead>
              <TableHead>السبب</TableHead>
              <TableHead>المنفذ (Admin ID)</TableHead>
              <TableHead>التوقيت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableBody()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
