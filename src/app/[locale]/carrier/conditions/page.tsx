'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  });

  const [isSaving, setIsSaving] = useState(false);

  const [vehicleImageFile, setVehicleImageFile] = useState<File | null>(null);
const [plateImageFile, setPlateImageFile] = useState<File | null>(null);
const [vehicleImagePreview, setVehicleImagePreview] = useState<string | null>(null);
const [plateImagePreview, setPlateImagePreview] = useState<string | null>(null);

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
        isPartial: false,
      };
      await updateDoc(userProfileRef, payload);
      toast({ title: t('saveButton'), description: t('saveButton') });
      router.push('/carrier');
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save. Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'vehicle' | 'plate') => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    if (type === 'vehicle') {
      setVehicleImagePreview(reader.result as string);
      setVehicleImageFile(file);
    } else {
      setPlateImagePreview(reader.result as string);
      setPlateImageFile(file);
    }
  };
  reader.readAsDataURL(file);
};

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
            <h4 className="font-semibold text-sm">{t('vehicleSection')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vehicleType')} <span className="text-red-500">*</span></Label>
                <Input placeholder={t('placeholders.vehicleType')} value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('vehicleYear')} <span className="text-red-500">*</span></Label>
                <Input type="number" placeholder={t('placeholders.vehicleYear')} value={formData.vehicleYear} onChange={e => setFormData({...formData, vehicleYear: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('plateNumber')} <span className="text-red-500">*</span></Label>
                <Input placeholder={t('placeholders.plateNumber')} value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('vehicleCapacity')} <span className="text-red-500">*</span></Label>
                <Input type="number" placeholder={t('placeholders.vehicleCapacity')} value={formData.vehicleCapacity} onChange={e => setFormData({...formData, vehicleCapacity: e.target.value})} />
              </div>
            </div>
          </Card>

{/* Vehicle & Plate Upload Section */}
<Card className="bg-muted/30 p-4 space-y-4">
  <h4 className="font-semibold text-sm">{t('placeholders.vehicleAndPlateImages')}</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* Vehicle Image Upload */}
    <div className="flex flex-col items-center gap-2">
      <Label>{t('placeholders.vehicleImage')}</Label>
      <div className={`relative w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden 
        ${vehicleImagePreview ? 'bg-gray-50' : 'bg-[#321118]'} text-gray-300`}>
        {vehicleImagePreview ? (
          <img
            src={vehicleImagePreview}
            alt={t('placeholders.vehicleImagePreviewAlt')}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-gray-300 text-sm">{t('placeholders.vehicleImagePlaceholder')}</span>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleImageChange(e, 'vehicle')}
        />
      </div>
    </div>

    {/* Plate Image Upload */}
    <div className="flex flex-col items-center gap-2">
      <Label>{t('placeholders.plateImage')}</Label>
      <div className={`relative w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden 
        ${plateImagePreview ? 'bg-gray-50' : 'bg-[#321118]'} text-gray-300`}>
        {plateImagePreview ? (
          <img
            src={plateImagePreview}
            alt={t('placeholders.plateImagePreviewAlt')}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-gray-300 text-sm">{t('placeholders.plateImagePlaceholder')}</span>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleImageChange(e, 'plate')}
        />
      </div>
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
              <CardDescription>بيانات المكتب التابع له ورقم اللوحة الجانبية للمركبة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('officeName')}</Label>
                  <Input placeholder={t('placeholders.officeName')} value={formData.officeName} onChange={e => setFormData({...formData, officeName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t('officePhone')}</Label>
                  <Input type="tel" placeholder={t('placeholders.officePhone')} value={formData.officePhone} onChange={e => setFormData({...formData, officePhone: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('sidePanelNumber')}</Label>
                  <Input placeholder={t('placeholders.sidePanelNumber')} value={formData.sidePanelNumber} onChange={e => setFormData({...formData, sidePanelNumber: e.target.value})} />
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
                <Select value={formData.jurisdictionOrigin} onValueChange={val => setFormData({...formData, jurisdictionOrigin: val})}>
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
                <Select value={formData.jurisdictionDest} onValueChange={val => setFormData({...formData, jurisdictionDest: val})}>
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

          {/* Permanent Operational Terms */}
          <Card className="bg-muted/30 p-4 space-y-4">
            <h4 className="font-semibold text-sm">{t('permanentConditions')}</h4>
            <div className="space-y-2">
              <Label>{t('paymentInfo')}</Label>
              <Textarea placeholder={t('placeholders.paymentInfo')} value={formData.paymentInformation} onChange={e => setFormData({...formData, paymentInformation: e.target.value})} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('bagsPerSeat')}</Label>
                <Select value={formData.bagsPerSeat} onValueChange={val => setFormData({...formData, bagsPerSeat: val})}>
                  <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('numberOfStops')}</Label>
                <Select value={formData.numberOfStops} onValueChange={val => setFormData({...formData, numberOfStops: val})}>
                  <SelectTrigger><SelectValue placeholder="اختر العدد" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Button className="w-full mt-6" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2 h-4 w-4" />}
            {t('saveButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
