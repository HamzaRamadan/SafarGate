'use client';

import { Button } from '@/components/ui/button';
import type { Trip } from '@/lib/data';
import { Calendar, Users, Handshake, ArrowRight, CircleDollarSign, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCityName } from '@/lib/constants';
import { formatDate } from '@/lib/formatters';

interface RequestCardProps {
    tripRequest: Trip;
    onOffer: (trip: Trip) => void;
}

export function RequestCard({ tripRequest, onOffer }: RequestCardProps) {
    const isDirectRequest = tripRequest.requestType === 'Direct';

    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between",
            "w-full p-4 border rounded-lg shadow-sm transition-shadow duration-300 bg-card",
            isDirectRequest ? "border-primary hover:shadow-primary/20" : "hover:shadow-accent/20"
        )}>
            <div className="flex-1 mb-4 sm:mb-0">
                
                {isDirectRequest && (
                    <Badge variant="default" className="mb-2">
                        <UserCheck className="ml-1 h-3 w-3" />
                        موجه لك خصيصاً
                    </Badge>
                )}
                
                <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                    <span>{getCityName(tripRequest.origin)}</span>
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <span>{getCityName(tripRequest.destination)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1 font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(tripRequest.departureDate, 'd MMMM')}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold">
                        <Users className="h-3.5 w-3.5" />
                        <span>{tripRequest.passengers || 1} راكب</span>
                    </div>
                     {tripRequest.targetPrice && (
                        <div className="flex items-center gap-1 font-semibold text-green-600">
                            <CircleDollarSign className="h-3.5 w-3.5" />
                            <span>الميزانية: ~{tripRequest.targetPrice} {tripRequest.currency || 'د.أ'}</span>
                        </div>
                     )}
                </div>
                 {tripRequest.notes && (
                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded-md border border-dashed">
                       <span className="font-bold">ملاحظات المسافر:</span> {tripRequest.notes}
                    </div>
                )}
            </div>

            <div className="flex-shrink-0">
                 <Button className="w-full sm:w-auto" onClick={() => onOffer(tripRequest)}>
                    <Handshake className="ml-2 h-4 w-4" />
                    {isDirectRequest ? 'موافقة وتحديد السعر' : 'تقديم عرض'}
                </Button>
            </div>
        </div>
    );
}
