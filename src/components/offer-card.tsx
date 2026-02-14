'use client';

import type { Offer, UserProfile, Trip } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DollarSign, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface OfferCardProps {
  offer: any; // Using 'any' because it has processed fields like isBestValue
  carrier: UserProfile; 
  onAccept: () => void;
  isAccepting: boolean;
}

export function OfferCard({ offer, carrier, onAccept, isAccepting }: OfferCardProps) {

    return (
        <div className={cn(
            "relative bg-card border rounded-xl overflow-hidden shadow-sm transition-all h-full flex flex-col",
            offer.isBestValue && "border-green-500/50 shadow-green-900/10",
            offer.isTopTier && !offer.isBestValue && "border-amber-500/50 shadow-amber-900/10"
        )}>
            <div className="absolute top-0 right-0 left-0 flex justify-between p-3 z-10 pointer-events-none">
                {offer.isBestValue && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1 shadow-md">
                        <DollarSign className="h-3 w-3" /> الأوفر
                    </Badge>
                )}
                {offer.isTopTier && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 shadow-md ml-auto">
                        <ShieldCheck className="h-3 w-3" /> نخبة
                    </Badge>
                )}
            </div>

            <div className="p-5 pt-10 flex-1 flex flex-col items-center text-center space-y-3">
                <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                    <AvatarImage src={carrier.photoURL} alt={carrier.firstName} />
                    <AvatarFallback>{carrier.firstName?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                
                <div>
                    <h3 className="font-bold text-lg">{carrier.firstName}</h3>
                    <div className="flex items-center justify-center gap-1 text-amber-500 text-sm">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-medium">{carrier.ratingStats?.average?.toFixed(1) || 'جديد'}</span>
                    </div>
                </div>

                <div className="w-full h-px bg-border/50 my-2" />

                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-primary">{offer.price}</span>
                    <span className="text-sm text-muted-foreground">{offer.currency}</span>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {offer.notes || "لا توجد ملاحظات إضافية من الناقل."}
                </p>
            </div>

            <div className="p-4 bg-muted/30 mt-auto">
                <Button 
                    className="w-full gap-2 font-bold" 
                    size="lg" 
                    onClick={onAccept}
                    disabled={isAccepting}
                >
                    {isAccepting ? "جاري المعالجة..." : (
                        <>
                            <CheckCircle2 className="h-5 w-5" />
                            قبول العرض
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
