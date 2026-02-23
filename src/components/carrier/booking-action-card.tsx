'use client';
import { useState } from 'react';
import type { Booking, UserProfile } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import {
  Phone,
  MessageCircle,
  Users,
  Ticket,
  User,
  Loader2,
  CheckCircle2, 
  XCircle,
  Ghost
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatDialog } from '@/components/chat/chat-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BookingActionCardProps {
  booking: Booking;
  userProfile?: UserProfile;
  onReject: (bookingId: string) => Promise<void>;
}

export function BookingActionCard({ booking, userProfile, onReject }: BookingActionCardProps) {
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();

  // [SC-197] THE GHOST PROTOCOL (Logic Injection)
  // Check if the user is a "ghost" (deleted or deactivated)
  const isGhost = !userProfile || userProfile.isDeactivated || userProfile.firstName?.includes('Deleted');
  
  // Logic to retrieve name: if ghost, get the name from the original booking record (archive)
  const displayName = isGhost 
      ? booking.passengersDetails?.[0]?.name || 'مسافر (حساب محذوف)' 
      : userProfile?.firstName;

  const getTicketId = (index: number) => `#${booking.id.slice(-4).toUpperCase()}-${index + 1}`;

  const depositAmount = (booking.totalPrice * 0.10).toFixed(2);
  const remainingAmount = (booking.totalPrice - parseFloat(depositAmount)).toFixed(2);
  
  const handleAccept = async () => {
    setLoading(true);
    try {
      const { getFirestore, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');
      const db = getFirestore(getApp());
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, { 
        status: 'Pending-Payment', 
        updatedAt: serverTimestamp() 
      });
      toast({ title: 'تم قبول الرحلة بنجاح ✅', className: 'bg-green-50 text-green-800' });
    } catch (error: any) {
      console.error('Accept booking error:', error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ أثناء المعالجة.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReject = async () => {
      setLoading(true);
      await onReject(booking.id);
      setLoading(false);
  };


  return (
    <>
      <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm">
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={userProfile?.photoURL || ""} alt="User Avatar" />
                <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              {/* [SC-197] Ghost Badge & Historical Name Display */}
              <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm", isGhost && "text-muted-foreground line-through decoration-destructive/50")}>
                          {displayName}
                      </span>
                      {isGhost && (
                          <Badge variant="outline" className="px-1.5 py-0 h-5 text-[10px] bg-slate-100 text-slate-500 border-slate-200 gap-1">
                              <Ghost className="h-3 w-3" />
                              <span>محذوف</span>
                          </Badge>
                      )}
                  </div>
                  {/* عرض عدد المقاعد */}
                  <span className="text-xs text-muted-foreground">{booking.seats} مقاعد</span>
              </div>
            </div>
            
            <div className="flex gap-1">
              {/* [SC-197] Safe Chat Button */}
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => !isGhost && setIsChatOpen(true)} // Prevent opening
                  disabled={isGhost} // Disable button
                  title={isGhost ? "لا يمكن مراسلة حساب محذوف" : "مراسلة المسافر"}
              >
                  <MessageCircle className={cn("h-4 w-4", isGhost ? "text-muted-foreground" : "text-primary")} />
              </Button>
              {userProfile?.phoneNumber && !isGhost && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => window.open(`tel:${userProfile.phoneNumber}`, '_self')}>
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details" className="border-b-0">
              <AccordionTrigger className="px-4 py-2 text-sm text-muted-foreground hover:no-underline bg-muted/10">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{booking.seats} مقاعد</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mx-2">
                    {booking.totalPrice} {booking.currency}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 space-y-4">
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/30 p-2 rounded-lg border">
                  <div>
                    <p className="text-muted-foreground">الإجمالي</p>
                    <p className="font-bold text-sm">{booking.totalPrice}</p>
                  </div>
                  <div className="border-r border-l">
                    <p className="text-muted-foreground">العربون</p>
                    <p className="font-bold text-sm text-green-600">{depositAmount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المتبقي</p>
                    <p className="font-bold text-sm text-red-500">{remainingAmount}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold flex items-center gap-1 text-primary">
                    <Ticket className="h-3 w-3" /> قائمة التذاكر والركاب
                  </h4>
                  <div className="border rounded-md divide-y">
                    {booking.passengersDetails?.map((p, i) => (
                      <div key={i} className="flex justify-between items-center p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">{getTicketId(i)}</Badge>
                          <span className="font-medium">{p.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {p.type === 'adult' ? 'بالغ' : p.type === 'minor' ? 'طفل' : 'رضيع'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        {booking.status === 'Pending-Carrier-Confirmation' && (
            <CardFooter className="bg-gray-50 p-3 flex gap-2">
                <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleAccept} 
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 ml-2" /> قبول</>}
                </Button>
                <Button 
                    variant="outline" 
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-900"
                    disabled={loading}
                    onClick={handleReject}
                >
                    <XCircle className="w-4 h-4 ml-2" /> اعتذار
                </Button>
            </CardFooter>
        )}
      </Card>
      
      {isChatOpen && (
          <ChatDialog 
              isOpen={isChatOpen} 
              onOpenChange={setIsChatOpen} 
              bookingId={booking.id} 
              otherPartyId={booking.userId} 
              otherPartyName={displayName || 'المسافر'} 
          />
      )}
    </>
  );
}