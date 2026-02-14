'use client';

import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Hash } from "lucide-react";

interface QRDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    tripId: string;
    bookingId: string;
    passengerName: string;
    seats: number;
    pickup: string;
  };
}

export function QRDialog({ isOpen, onOpenChange, data }: QRDialogProps) {
  // Protocol 88: Minimal payload for visual verification
  const qrPayload = JSON.stringify({
    bid: data.bookingId,
    tid: data.tripId,
    pax: data.passengerName
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-auto rounded-xl border-2 border-primary/20">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold text-center text-primary">ختم العبور الرقمي</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            أبرز هذا الرمز للكابتن للمسح أو المطابقة
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {/* The Digital Seal */}
          <div className="p-6 bg-white rounded-2xl shadow-inner border-4 border-dashed border-gray-200">
            <QRCode 
                value={qrPayload} 
                size={180} 
                level="M" 
                fgColor="#000000"
                bgColor="#FFFFFF"
            />
          </div>

          {/* Human Readable Manifest (Visual Handshake) */}
          <div className="w-full space-y-4 bg-muted/40 p-5 rounded-xl border text-center">
            
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3"/> المسافر</span>
                <span className="text-xl font-bold text-foreground">{data.passengerName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-200/50 pt-4">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">المقاعد</span>
                    <Badge variant="secondary" className="text-lg px-4 py-1 font-mono">{data.seats}</Badge>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3"/> رقم الحجز</span>
                    <span className="font-mono text-sm font-bold tracking-wider">{data.bookingId.slice(-6).toUpperCase()}</span>
                </div>
            </div>

             <div className="pt-2 border-t border-gray-200/50 mt-2">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-1"><MapPin className="h-3 w-3"/> نقطة التجمع</p>
                <p className="text-sm font-medium leading-tight">{data.pickup}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
