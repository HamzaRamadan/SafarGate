'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Save, ListChecks, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CITIES } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function CarrierConditionsPage() {
  const { profile, isLoading, userProfileRef } = useUserProfile();
  const { toast } = useToast();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    paymentInformation: '',
    bagsPerSeat: '1',
    numberOfStops: '0',
    vehicleType: '',
    vehicleYear: '',
    plateNumber: '',
    vehicleCapacity: '',
    jurisdictionOrigin: '',
    jurisdictionDest: '',
    officeName: '',
    officePhone: '',
    sidePanelNumber: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        paymentInformation: profile.paymentInformation || '',
        bagsPerSeat: profile.bagsPerSeat?.toString() || '1',
        numberOfStops: profile.numberOfStops?.toString() || '0',
        vehicleType: profile.vehicleType || '',
        vehicleYear: profile.vehicleYear || '',
        plateNumber: profile.plateNumber || '',
        vehicleCapacity: profile.vehicleCapacity?.toString() || '',
        jurisdictionOrigin: profile.jurisdiction?.origin || '',
        jurisdictionDest: profile.jurisdiction?.destination || '',
        officeName: profile.officeName || '',
        officePhone: profile.officePhone || '',
        sidePanelNumber: profile.sidePanelNumber || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!userProfileRef) {
      toast({ title: "خطأ", description: "الجلسة غير صالحة.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const capacity = Number(formData.vehicleCapacity);
      const isBus = capacity > 7;

      const payload = {
        paymentInformation: formData.paymentInformation,
        bagsPerSeat: Number(formData.bagsPerSeat),
        numberOfStops: Number(formData.numberOfStops),
        vehicleType: formData.vehicleType,
        vehicleYear: formData.vehicleYear,
        plateNumber: formData.plateNumber,
        vehicleCapacity: capacity,
        vehicleCategory: isBus ? 'bus' : 'small',
        jurisdiction: {
          origin: formData.jurisdictionOrigin,
          destination: formData.jurisdictionDest
        },
        officeName: formData.officeName,
        officePhone: formData.officePhone,
        sidePanelNumber: formData.sidePanelNumber,
        updatedAt: serverTimestamp(),
        isPartial: false, // Assume completing this form makes the profile complete
      };
      await updateDoc(userProfileRef, payload);
      toast({ title: "تم الحفظ", description: "تم تحديث إعداداتك المهنية والتشغيلية بنجاح." });
      router.push('/carrier');
    } catch (err) {
        console.error(err);
      toast({ title: "خطأ في الحفظ", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            الإعدادات المهنية والتشغيلية
          </CardTitle>
          <CardDescription>
            هذا هو مركز التحكم الموحد لبيانات مركبتك، مسارك الدولي، وشروطك التشغيلية.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            <Card className="bg-muted/30 p-4 space-y-4">
                <h4 className="font-semibold text-sm">فرع المركبة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2"><Label>نوع المركبة <span className="text-red-500">*</span></Label><Input placeholder="مثال: Hyundai H1" value={formData.vehicleType} onChange={(e) => setFormData({...formData, vehicleType: e.target.value})} /></div>
                   <div className="space-y-2"><Label>سنة الصنع <span className="text-red-500">*</span></Label><Input type="number" placeholder="2020" value={formData.vehicleYear} onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})} /></div>
                   <div className="space-y-2"><Label>رقم اللوحة <span className="text-red-500">*</span></Label><Input placeholder="50-XXXXX" value={formData.plateNumber} onChange={(e) => setFormData({...formData, plateNumber: e.target.value})} /></div>
                   <div className="space-y-2"><Label>سعة الركاب <span className="text-red-500">*</span></Label><Input type="number" placeholder="عدد المقاعد" value={formData.vehicleCapacity} onChange={(e) => setFormData({...formData, vehicleCapacity: e.target.value})} /></div>
                </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  اللوحة التشغيلية والمكتب
                </CardTitle>
                <CardDescription>بيانات المكتب التابع له ورقم اللوحة الجانبية للمركبة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المكتب / الشركة</Label>
                    <Input 
                      placeholder="مثال: مكتب النور للنقل" 
                      value={formData.officeName} 
                      onChange={(e) => setFormData({...formData, officeName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم هاتف المكتب</Label>
                    <Input 
                      placeholder="07xxxxxxxx" 
                      type="tel"
                      value={formData.officePhone} 
                      onChange={(e) => setFormData({...formData, officePhone: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>رقم اللوحة الجانبية (Side Panel)</Label>
                    <Input 
                      placeholder="أدخل رقم اللوحة الجانبية المعتمد" 
                      value={formData.sidePanelNumber} 
                      onChange={(e) => setFormData({...formData, sidePanelNumber: e.target.value})} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 p-4 space-y-4">
                <h4 className="font-semibold text-sm">فرع المسار (النطاق الدولي)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>دولة الانطلاق (من) <span className="text-red-500">*</span></Label>
                        <Select value={formData.jurisdictionOrigin} onValueChange={(val) => setFormData({...formData, jurisdictionOrigin: val})}>
                            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(CITIES).map(([key, { name }]) => (
                                    <SelectItem key={key} value={key}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>دولة الاختصاص (إلى) <span className="text-red-500">*</span></Label>
                        <Select value={formData.jurisdictionDest} onValueChange={(val) => setFormData({...formData, jurisdictionDest: val})}>
                            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(CITIES).filter(([key]) => key !== formData.jurisdictionOrigin).map(([key, { name }]) => (
                                    <SelectItem key={key} value={key}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            <Card className="bg-muted/30 p-4 space-y-4">
                 <h4 className="font-semibold text-sm">الشروط التشغيلية الدائمة</h4>
                 <div className="space-y-2">
                    <Label>بيانات استلام الدفع (محفظة / بنك)</Label>
                    <Textarea 
                        placeholder="مثال: زين كاش 079XXXXXXX أو رقم الآيبان. ستظهر هذه المعلومات للمسافر فقط بعد تأكيد الحجز." 
                        value={formData.paymentInformation} 
                        onChange={(e) => setFormData({...formData, paymentInformation: e.target.value})} 
                        rows={3}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>عدد الحقائب المسموح (لكل راكب)</Label>
                        <Select value={formData.bagsPerSeat} onValueChange={(val) => setFormData({...formData, bagsPerSeat: val})}>
                            <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">بدون حقائب</SelectItem>
                                <SelectItem value="1">حقيبة واحدة</SelectItem>
                                <SelectItem value="2">حقيبتان</SelectItem>
                                <SelectItem value="3">3 حقائب</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>عدد التوقفات (الاستراحة)</Label>
                        <Select value={formData.numberOfStops} onValueChange={(val) => setFormData({...formData, numberOfStops: val})}>
                            <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">مباشر (بدون توقف)</SelectItem>
                                <SelectItem value="1">توقف واحد</SelectItem>
                                <SelectItem value="2">توقفان</SelectItem>
                                <SelectItem value="3">3 توقفات</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

             <Button className="w-full mt-6" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 h-4 w-4" />}
                حفظ الإعدادات المهنية والتشغيلية
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
