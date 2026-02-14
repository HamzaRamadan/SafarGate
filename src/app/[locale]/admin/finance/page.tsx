'use client';

import { useState } from 'react';
import { useCollection, useFunctions } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';
import type { TopupRequest } from '@/lib/data';

export default function AdminFinancePage() {
  const { data: requests, isLoading } = useCollection(
    query(
        collection(useFunctions() ? (useFunctions() as any).app.firestore() : null as any, 'topup_requests'), // Fallback handled by hook usually
        where('status', '==', 'PENDING'),
        orderBy('createdAt', 'desc')
    )
  );
  
  const functions = useFunctions();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingRejectId, setProcessingRejectId] = useState<string | null>(null);

  const handleApprove = async (request: TopupRequest) => {
    if (!functions) return;
    if (!confirm(`هل أنت متأكد من الموافقة على شحن ${request.amount} د.أ للناقل ${request.carrierName}؟`)) return;

    setProcessingId(request.id);
    const approveFn = httpsCallable(functions, 'approveTopup');

    try {
        await approveFn({ requestId: request.id });
        toast({ title: "تمت العملية بنجاح ✅", description: "تم تفعيل الاشتراك/الرصيد للناقل." });
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "فشل العملية", description: "حدث خطأ أثناء الاتصال بالسيرفر." });
    } finally {
        setProcessingId(null);
    }
  };

  const handleReject = async (request: any) => {
      if (!functions) return;
      
      const reason = prompt(`سبب رفض طلب الناقل ${request.carrierName}:`, "صورة الإيصال غير واضحة / المبلغ غير مطابق");
      
      if (reason === null) return;

      setProcessingRejectId(request.id);
      const rejectFn = httpsCallable(functions, 'rejectTopup');

      try {
          await rejectFn({ requestId: request.id, reason });
          toast({ 
              title: "تم رفض الطلب 🛑", 
              description: "تم تحديث الحالة وإغلاق الطلب.",
              variant: "destructive"
          });
      } catch (error: any) {
          console.error(error);
          toast({ variant: "destructive", title: "فشل الرفض", description: error.message });
      } finally {
          setProcessingRejectId(null);
      }
  };


  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">الخزينة المركزية</h1>
            <p className="text-slate-500 mt-1">مراجعة واعتماد طلبات الشحن المالي</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 ml-2" /> تحديث
            </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="bg-white border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
                ⏳ طلبات قيد الانتظار
                {requests && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{requests.length}</Badge>}
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    جاري تحميل البيانات...
                </div>
            ) : requests && requests.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="text-right">الناقل</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">الطريقة</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-center">الإثبات</TableHead>
                            <TableHead className="text-center">الإجراء</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((req: any) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.carrierName}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-base px-3 py-1 font-bold border-green-200 bg-green-50 text-green-700">
                                        {req.amount} {req.currency}
                                    </Badge>
                                </TableCell>
                                <TableCell>{req.method}</TableCell>
                                <TableCell className="text-slate-500 text-sm">
                                    {req.createdAt?.toDate ? formatDate(req.createdAt.toDate()) : 'الآن'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Eye className="w-4 h-4 ml-1" /> معاينة
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black border-0">
                                            <img 
                                                src={req.proofImageUrl} 
                                                alt="Receipt" 
                                                className="w-full h-auto max-h-[80vh] object-contain" 
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button 
                                            size="sm" 
                                            className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                                            onClick={() => handleApprove(req)}
                                            disabled={!!processingId}
                                        >
                                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 ml-2" /> موافقة
                                                </>
                                            )}
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="text-red-600 border-red-200 hover:bg-red-50 min-w-[100px]"
                                            onClick={() => handleReject(req)}
                                            disabled={!!processingRejectId || !!processingId}
                                        >
                                            {processingRejectId === req.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4 ml-2" /> رفض
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">لا توجد طلبات معلقة</h3>
                    <p className="text-slate-500">الخزينة مستقرة، وجميع الطلبات تمت معالجتها.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
