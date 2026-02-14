'use client';

import { useState } from 'react'; // (+) State for Dialog
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // (+) Button Import
import { ShieldCheck, AlertTriangle, Zap, ArrowLeft } from "lucide-react";
import { useCarrierSubscription } from "@/hooks/use-carrier-subscription";
import { Progress } from "@/components/ui/progress";
import { TopupDialog } from "@/components/carrier/topup-dialog"; // (+) Import Dialog

export function SubscriptionStatusCard() {
  const { subscriptionState, daysRemaining, gracePeriodTotal, status } = useCarrierSubscription();
  const [isTopupOpen, setIsTopupOpen] = useState(false); // (+) Dialog State

  if (status === 'loading') return null;

  // حساب النسبة المئوية للتقدم
  const progressValue = ((gracePeriodTotal - daysRemaining) / gracePeriodTotal) * 100;

  // إعدادات الحالة البصرية (The Visual State Machine)
  const stateConfig = {
    active: {
        color: "green",
        icon: ShieldCheck,
        title: "فترة سماح نشطة",
        message: "تتمتع بفترة الإطلاق التجريبي المجانية. انطلق بأمان!",
        badge: "مجاني / Free",
        badgeStyle: "text-green-700 bg-green-50 border-green-200"
    },
    warning: {
        color: "yellow",
        icon: AlertTriangle,
        title: "تنبيه: اقترب التجديد",
        message: "شريكنا العزيز، تنتهي باقتك خلال يومين. استعد للتجديد لضمان استمرار رحلاتك.",
        badge: "يستحق قريباً",
        badgeStyle: "text-yellow-700 bg-yellow-50 border-yellow-200"
    },
    expired: {
        color: "red",
        icon: Zap, 
        title: "انتهت الباقة الحالية",
        message: "حسابك لا يزال نشطاً للأرشيف، لكن لقبول رحلات جديدة وزيادة دخلك، يرجى تجديد الاشتراك.",
        badge: "التجديد مطلوب",
        badgeStyle: "text-red-700 bg-red-50 border-red-200"
    }
  };

  const config = stateConfig[subscriptionState];
  const Icon = config.icon;

  // ألوان ديناميكية للحدود وشريط التقدم
  const borderClass = 
    subscriptionState === 'active' ? 'border-l-green-500' : 
    subscriptionState === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500';
    
  const iconColorClass = 
    subscriptionState === 'active' ? 'text-green-600' : 
    subscriptionState === 'warning' ? 'text-yellow-600' : 'text-red-600';

  const progressColorClass = 
    subscriptionState === 'active' ? '[&>div]:bg-green-500' : 
    subscriptionState === 'warning' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500';

  return (
    <>
        <Card className={`border-l-4 ${borderClass} shadow-sm mb-4 transition-all duration-300`}>
        <CardContent className="p-4 pt-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">
                    <h3 className={`font-bold text-foreground flex items-center gap-2 text-sm`}>
                        <Icon className={`w-4 h-4 ${iconColorClass}`} />
                        {config.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
                        {config.message}
                    </p>
                </div>
                <Badge variant="outline" className={config.badgeStyle}>
                    {config.badge}
                </Badge>
            </div>

            {subscriptionState !== 'expired' && (
                <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">صلاحية الفترة التجريبية</span>
                        <span className={`${iconColorClass} font-bold`}>{daysRemaining} يوم متبقي</span>
                    </div>
                    <Progress value={progressValue} className={`h-1.5 bg-secondary ${progressColorClass}`} />
                    <p className="text-[10px] text-muted-foreground text-left">
                        من أصل {gracePeriodTotal} يوم
                    </p>
                </div>
            )}

            {/* [SC-191] زر التجديد يظهر في الحالات الحرجة */}
            {(subscriptionState === 'warning' || subscriptionState === 'expired') && (
                <div className="mt-4 pt-3 border-t border-dashed">
                    <Button 
                        size="sm" 
                        className={`w-full font-bold ${subscriptionState === 'expired' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                        onClick={() => setIsTopupOpen(true)}
                    >
                        <Zap className="ml-2 h-4 w-4" />
                        تجديد الاشتراك الآن
                        <ArrowLeft className="mr-auto h-4 w-4 opacity-70" />
                    </Button>
                </div>
            )}
        </CardContent>
        </Card>

        {/* [SC-191] Dialog Injection */}
        <TopupDialog isOpen={isTopupOpen} onOpenChange={setIsTopupOpen} />
    </>
  );
}
