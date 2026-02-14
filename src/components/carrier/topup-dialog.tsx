'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Zap, UploadCloud, CheckCircle2, Copy } from "lucide-react";
import { useTopup } from "@/hooks/use-topup"; // Hook from SC-190
import { useToast } from "@/hooks/use-toast";
import type { PaymentMethod } from "@/lib/data";

interface TopupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopupDialog({ isOpen, onOpenChange }: TopupDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'subscription' | 'points' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submitRequest, isSubmitting } = useTopup();
  const { toast } = useToast();

  // بيانات حساب الشركة (Sovereign Constants)
  const COMPANY_CLIQ = "SAFAR-GATE@ZAIN";
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !selectedFile) return;

    // في بيئة الإنتاج، هنا يتم رفع الصورة إلى Storage والحصول على الرابط
    // لمحاكاة البروتوكول 88، سنستخدم رابطاً وهمياً الآن
    const mockUrl = "https://firebasestorage.googleapis.com/v0/b/placeholder/o/receipt.jpg";
    
    const amount = selectedPlan === 'subscription' ? 50 : 10;
    const method: PaymentMethod = 'CLIQ'; // افتراضي حالياً لتبسيط الواجهة

    const success = await submitRequest(amount, method, mockUrl, "الناقل (أنت)");
    
    if (success) {
      onOpenChange(false);
      setSelectedFile(null);
      setSelectedPlan(null);
    }
  };

  const copyCliq = () => {
    navigator.clipboard.writeText(COMPANY_CLIQ);
    toast({ title: "تم نسخ معرف كليك بنجاح" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95%] rounded-xl p-4 gap-4 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-right">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            ⚡ متجر الطاقة
          </DialogTitle>
          <DialogDescription className="text-xs">
            اختر الباقة المناسبة لشحن رصيدك والاستمرار في العمل.
          </DialogDescription>
        </DialogHeader>

        {/* 1. Plan Selection (Cards designed for Thumbs) */}
        <div className="grid grid-cols-1 gap-3 mt-2">
          <Card 
            className={`p-4 cursor-pointer transition-all border-2 relative overflow-hidden ${selectedPlan === 'subscription' ? 'border-amber-500 bg-amber-50/50' : 'border-border'}`}
            onClick={() => setSelectedPlan('subscription')}
          >
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedPlan === 'subscription' ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                        <Crown className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">الباقة الذهبية</h3>
                        <p className="text-xs text-muted-foreground">اشتراك شهري مفتوح</p>
                    </div>
                </div>
                <span className="font-black text-lg">50 د.أ</span>
            </div>
            {selectedPlan === 'subscription' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
          </Card>

          <Card 
            className={`p-4 cursor-pointer transition-all border-2 relative overflow-hidden ${selectedPlan === 'points' ? 'border-blue-500 bg-blue-50/50' : 'border-border'}`}
            onClick={() => setSelectedPlan('points')}
          >
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedPlan === 'points' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">باقة التوفير</h3>
                        <p className="text-xs text-muted-foreground">رصيد 10 رحلات</p>
                    </div>
                </div>
                <span className="font-black text-lg">10 د.أ</span>
            </div>
            {selectedPlan === 'points' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
          </Card>
        </div>

        {/* 2. Payment Instructions & Upload (Only shows after selection) */}
        {selectedPlan && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="bg-muted/30 p-3 rounded-lg border border-dashed border-primary/20">
                    <p className="text-xs text-center mb-2 font-medium">حول المبلغ عبر CliQ إلى:</p>
                    <div className="flex items-center justify-between bg-background p-2 rounded border shadow-sm">
                        <span className="font-mono font-bold text-sm mx-auto tracking-wider">{COMPANY_CLIQ}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyCliq}>
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                    />
                    <Button 
                        variant="outline" 
                        className="w-full h-12 border-dashed border-2" 
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {selectedFile ? (
                            <span className="text-green-600 flex items-center gap-2 font-bold">
                                <CheckCircle2 className="h-4 w-4" /> تم اختيار الصورة
                            </span>
                        ) : (
                            <span className="text-muted-foreground flex items-center gap-2">
                                <UploadCloud className="h-4 w-4" /> ارفع صورة الحوالة
                            </span>
                        )}
                    </Button>
                </div>

                <Button 
                    className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700" 
                    onClick={handleSubmit}
                    disabled={!selectedFile || isSubmitting}
                >
                    {isSubmitting ? "جاري الإرسال..." : "تأكيد وإرسال الطلب"}
                </Button>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
