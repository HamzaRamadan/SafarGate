'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useAuth } from '@/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { PricingRule } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit2, Globe, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PricingSettingsPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState<Partial<PricingRule>>({
    id: 'JO', countryName: 'الأردن', currency: 'JOD',
    travelerBookingFee: 0.5, travelerDiscount: 0.5,
    carrierSeatPrice: 0.1, carrierMonthlySub: 50, isActive: true
  });

  const fetchRules = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(firestore, 'pricing_rules'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PricingRule));
      setRules(data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firestore) {
      fetchRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]);

  // [SC-217] Enhanced Save Handler with Audit Logging
  const handleSave = async () => {
    if (!firestore || !formData.id || !auth) return;
    
    // 1. Capture the "Previous State" for history (The snapshot before change)
    const oldRule = rules.find(r => r.id === formData.id);
    const adminId = auth.currentUser?.uid || 'Unknown';
    const adminEmail = auth.currentUser?.email || 'Unknown Admin';

    try {
      const ruleRef = doc(firestore, 'pricing_rules', formData.id);
      
      // 2. Execute the Sovereign Change (The Update)
      await setDoc(ruleRef, {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. [SC-217] Write to the Black Box (admin_logs)
      // Only log if it's an update to an existing rule
      if (oldRule) {
          await addDoc(collection(firestore, 'admin_logs'), {
              action: 'PRICING_UPDATE',
              targetUserId: formData.id, // Storing Country Code as target ID
              adminId: adminId, // Storing Admin UID
              timestamp: serverTimestamp(),
              reason: `Updated Pricing for ${formData.countryName}`,
              snapshot: {
                  old: oldRule,
                  new: formData,
                  adminEmail: adminEmail,
              },
              freezeType: 'financial' // Tagging it as a financial operation
          });
      }
      
      toast({ title: 'تم تحديث السياسة وتوثيق القرار في السجل.' });
      setIsDialogOpen(false);
      fetchRules();
    } catch (e) {
      console.error(e);
      toast({ title: 'فشل الحفظ', variant: 'destructive' });
    }
  };


  const openEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingRule(null);
    setFormData({
        id: '', countryName: '', currency: '',
        travelerBookingFee: 0, travelerDiscount: 0,
        carrierSeatPrice: 0, carrierMonthlySub: 0, isActive: true
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-8 h-8 text-blue-600" />
                الشبكة المالية الدولية
            </h1>
            <p className="text-gray-500 mt-1">Geo-Financial Grid Control Center</p>
        </div>
        <Button onClick={openNew} className="bg-blue-900 hover:bg-blue-800">
            <Plus className="mr-2 h-4 w-4" /> إضافة دولة جديدة
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>دستور الأسعار (Pricing Rules)</CardTitle>
            <CardDescription>التحكم في رسوم المسافرين واشتراكات الناقلين لكل دولة</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">الدولة (ISO)</TableHead>
                        <TableHead className="text-right">العملة</TableHead>
                        <TableHead className="text-right">المسافر (الرسوم/الخصم)</TableHead>
                        <TableHead className="text-right">الناقل (نقاط/اشتراك)</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="text-center">تعديل</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                    ) : rules.map((rule) => (
                        <TableRow key={rule.id} className="hover:bg-gray-50">
                            <TableCell className="font-bold">{rule.countryName} <Badge variant="outline">{rule.id}</Badge></TableCell>
                            <TableCell>{rule.currency}</TableCell>
                            <TableCell>
                                <div className="flex flex-col text-xs">
                                    <span className="text-gray-900 font-medium">الرسوم: {rule.travelerBookingFee}</span>
                                    <span className="text-green-600">خصم: {rule.travelerDiscount}-</span>
                                    <span className="font-bold border-t w-fit mt-1">صافي: {(rule.travelerBookingFee - rule.travelerDiscount).toFixed(2)}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-xs gap-1">
                                    <Badge variant="secondary" className="w-fit">نقطة: {rule.carrierSeatPrice} {rule.currency}</Badge>
                                    <Badge variant="outline" className="w-fit">شهر: {rule.carrierMonthlySub} {rule.currency}</Badge>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant={rule.isActive ? 'default' : 'destructive'}>
                                    {rule.isActive ? 'نشط' : 'معطل'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                                    <Edit2 className="w-4 h-4 text-gray-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{editingRule ? `تعديل سياسة: ${editingRule.countryName}` : 'إضافة دولة جديدة'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>رمز الدولة (ISO)</Label>
                        <Input value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="JO" disabled={!!editingRule} />
                    </div>
                    <div className="space-y-2">
                        <Label>اسم الدولة</Label>
                        <Input value={formData.countryName} onChange={e => setFormData({...formData, countryName: e.target.value})} placeholder="الأردن" />
                    </div>
                    <div className="space-y-2">
                        <Label>العملة</Label>
                        <Input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} placeholder="JOD" />
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                        <Switch checked={formData.isActive} onCheckedChange={c => setFormData({...formData, isActive: c})} />
                        <Label>تفعيل الدولة</Label>
                    </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                    <h3 className="col-span-2 font-semibold text-gray-500 flex items-center gap-2"><Globe className="w-4 h-4" /> سياسة المسافر</h3>
                    <div className="space-y-2">
                        <Label>رسوم الحجز ({formData.currency})</Label>
                        <Input type="number" step="0.1" value={formData.travelerBookingFee} onChange={e => setFormData({...formData, travelerBookingFee: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <Label>قيمة الخصم "المجاني" ({formData.currency})</Label>
                        <Input type="number" step="0.1" className="text-green-600 font-bold" value={formData.travelerDiscount} onChange={e => setFormData({...formData, travelerDiscount: parseFloat(e.target.value)})} />
                        <p className="text-[10px] text-gray-400">اجعل الخصم مساوياً للرسوم لتكون مجانية</p>
                    </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                    <h3 className="col-span-2 font-semibold text-gray-500 flex items-center gap-2"><Coins className="w-4 h-4" /> سياسة الناقل</h3>
                    <div className="space-y-2">
                        <Label>سعر نقطة المقعد ({formData.currency})</Label>
                        <Input type="number" step="0.1" value={formData.carrierSeatPrice} onChange={e => setFormData({...formData, carrierSeatPrice: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <Label>الاشتراك الشهري ({formData.currency})</Label>
                        <Input type="number" step="1" value={formData.carrierMonthlySub} onChange={e => setFormData({...formData, carrierMonthlySub: parseFloat(e.target.value)})} />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave} className="w-full bg-blue-900">حفظ التغييرات السيادية</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
