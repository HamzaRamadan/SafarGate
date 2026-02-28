'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUserProfile } from '@/hooks/use-user-profile';
import { updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Save, ListChecks, Building2, CarFront } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CITIES } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function CarrierConditionsPage() {
  const t = useTranslations('carrierConditions');
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
    vehicleCategory: '',
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
        vehicleCategory: profile.vehicleCategory || '',
      });
    }
  }, [profile]);

  const getMaxCapacity = () => {
    if (formData.vehicleCategory === 'small') return 8;
    if (formData.vehicleCategory === 'bus') return 54;
    return 54;
  };

  const handleCapacityChange = (val: string) => {
    setFormData({ ...formData, vehicleCapacity: val });
  };

  const capacityError = () => {
    const cap = Number(formData.vehicleCapacity);
    if (!formData.vehicleCapacity || !formData.vehicleCategory) return null;
    if (formData.vehicleCategory === 'small' && cap > 8) return 'السيارة الصغيرة لا تتجاوز 8 مقاعد';
    if (formData.vehicleCategory === 'bus' && cap > 54) return 'الحافلة لا تتجاوز 54 مقعد';
    if (cap < 1) return 'يجب أن يكون عدد المقاعد 1 على الأقل';
    return null;
  };

  const handleSave = async () => {
    if (!userProfileRef) {
      toast({ title: "خطأ", description: "الجلسة غير صالحة.", variant: "destructive" });
      return;
    }

    if (capacityError()) {
      toast({ title: "خطأ في البيانات", description: capacityError()!, variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const capacity = Number(formData.vehicleCapacity);
      const finalCategory = formData.vehicleCategory;

      const payload = {
        paymentInformation: formData.paymentInformation,
        bagsPerSeat: Number(formData.bagsPerSeat),
        numberOfStops: Number(formData.numberOfStops),
        vehicleType: formData.vehicleType,
        vehicleYear: formData.vehicleYear,
        plateNumber: formData.plateNumber,
        vehicleCapacity: capacity,
        vehicleCategory: finalCategory,
        jurisdiction: {
          origin: formData.jurisdictionOrigin,
          destination: formData.jurisdictionDest
        },
        officeName: formData.officeName,
        officePhone: formData.officePhone,
        sidePanelNumber: formData.sidePanelNumber,
        updatedAt: serverTimestamp(),
        isPartial: false,
      };

      await updateDoc(userProfileRef, payload);
      toast({ title: t('saveButton'), description: "تم تحديث البيانات بنجاح" });
      router.push('/carrier');
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "فشل في الحفظ، حاول مجدداً", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Vehicle Section */}
          <Card className="bg-muted/30 p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CarFront className="h-4 w-4" /> {t('vehicleSection')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2 md:col-span-2">
                <Label>نوع وسيلة السفر <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.vehicleCategory}
                  onValueChange={(val) => setFormData({ ...formData, vehicleCategory: val, vehicleCapacity: '' })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر النوع (حافلة / سيارة)" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    <SelectItem value="bus">🚌 حافلة</SelectItem>
                    <SelectItem value="small">🚗 سيارة صغيرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('vehicleType')} <span className="text-red-500">*</span></Label>
                <Input placeholder={t('placeholders.vehicleType')} value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>{t('vehicleYear')} <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder={t('placeholders.vehicleYear')}
                  value={formData.vehicleYear}
                  onChange={e => setFormData({ ...formData, vehicleYear: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('plateNumber')} <span className="text-red-500">*</span></Label>
                <Input placeholder={t('placeholders.plateNumber')} value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>{t('vehicleCapacity')} <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${capacityError() ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  placeholder={formData.vehicleCategory === 'small' ? 'أقصى 8 مقاعد' : formData.vehicleCategory === 'bus' ? 'أقصى 54 مقعد' : t('placeholders.vehicleCapacity')}
                  value={formData.vehicleCapacity}
                  onChange={e => handleCapacityChange(e.target.value)}
                  max={getMaxCapacity()}
                  min={1}
                />
                {capacityError() && (
                  <p className="text-red-500 text-xs font-medium">⚠️ {capacityError()}</p>
                )}
              </div>

            </div>
          </Card>

          {/* Office Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                {t('officeSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('officeName')}</Label>
                  <Input placeholder={t('placeholders.officeName')} value={formData.officeName} onChange={e => setFormData({ ...formData, officeName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('officePhone')}</Label>
                  <Input type="tel" placeholder={t('placeholders.officePhone')} value={formData.officePhone} onChange={e => setFormData({ ...formData, officePhone: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('sidePanelNumber')}</Label>
                  <Input placeholder={t('placeholders.sidePanelNumber')} value={formData.sidePanelNumber} onChange={e => setFormData({ ...formData, sidePanelNumber: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* International Route */}
          <Card className="bg-muted/30 p-4 space-y-4">
            <h4 className="font-semibold text-sm">{t('internationalRoute')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('origin')} <span className="text-red-500">*</span></Label>
                <Select value={formData.jurisdictionOrigin} onValueChange={val => setFormData({ ...formData, jurisdictionOrigin: val })}>
                  <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CITIES).map(([key, { name }]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('destination')} <span className="text-red-500">*</span></Label>
                <Select value={formData.jurisdictionDest} onValueChange={val => setFormData({ ...formData, jurisdictionDest: val })}>
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

          <Button className="w-full mt-6" onClick={handleSave} disabled={isSaving || !!capacityError()}>
            {isSaving ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 h-4 w-4" />}
            {t('saveButton')}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}