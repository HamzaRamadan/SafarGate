'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import type { Message, Trip, Booking, UserProfile } from '@/lib/data';
import { MessageList } from './message-list';
import { Loader2, Send, Sparkles, PowerOff, AlertTriangle, X } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { suggestChatReply, type SuggestChatReplyInput } from '@/ai/flows/suggest-chat-reply-flow';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface ChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // MODIFIED: Support both group (trip) and 1-on-1 (booking) chats
  trip?: Trip | null;
  bookingId?: string | null; 
  otherPartyName?: string;
  otherPartyId?: string;
}

export function ChatDialog({ isOpen, onOpenChange, trip, bookingId, otherPartyName, otherPartyId }: ChatDialogProps) {
  const { user } = useUser();
  const { profile } = useUserProfile();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [isClosingChat, setIsClosingChat] = useState(false);

  // Determine chat type and ID
  const isGroupChat = !!trip;
  const chatId = isGroupChat ? trip?.id : bookingId;

  const messagesQuery = useMemo(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, chatId]);

  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
  
  const chatDocRef = useMemo(() => {
    if (!firestore || !chatId) return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, chatId]);
  const { data: chatDoc } = useDoc(chatDocRef);

  useEffect(() => {
    if (isOpen) {
      setSuggestedReplies([]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Automatically create the chat document if it doesn't exist for 1-on-1 chats
    const ensureChatExists = async () => {
        if (firestore && user && !isGroupChat && bookingId && otherPartyId && !(chatDoc as any)?.id) {
            const chatDocRef = doc(firestore, 'chats', bookingId);
            const chatData = {
                id: bookingId,
                isGroupChat: false,
                participants: [user.uid, otherPartyId],
                unreadCounts: { [user.uid]: 0, [otherPartyId]: 0 },
                isClosed: false,
                lastMessage: 'تم إنشاء المحادثة',
                lastMessageSenderId: 'system',
                lastMessageTimestamp: serverTimestamp(),
            };
            await setDoc(chatDocRef, chatData, { merge: true });
        }
    };
    if (isOpen) {
        ensureChatExists();
    }
  }, [isOpen, firestore, user, isGroupChat, bookingId, otherPartyId, chatDoc]);


  const handleSendMessage = async (content?: string) => {
    const messageContent = content || newMessage;
    if (!firestore || !user || !profile || !messageContent.trim() || !chatId) return;

    const messagesCollection = collection(firestore, 'chats', chatId, 'messages');
    const chatDocRef = doc(firestore, 'chats', chatId);
    
    const messageData = {
      content: messageContent,
      senderId: user.uid,
      senderName: profile.firstName,
      timestamp: serverTimestamp(),
    };
    
    addDocumentNonBlocking(messagesCollection, messageData);
    
    // Update last message details on the chat document
    const chatUpdateData = {
        lastMessage: messageContent,
        lastMessageSenderId: user.uid,
        lastMessageTimestamp: serverTimestamp(),
    };
    updateDocumentNonBlocking(chatDocRef, chatUpdateData);

    setNewMessage('');
    setSuggestedReplies([]);
  };

  const handleSuggestReply = async () => {
      if (!messages || messages.length === 0) {
        toast({ title: "لا يمكن إنشاء اقتراح", description: "لا توجد رسائل لتحليلها بعد."});
        return;
      }
      setIsSuggesting(true);
      try {
          const conversationHistory = messages.map(m => `${m.senderName}: ${m.content}`).join('\n');
          const input: SuggestChatReplyInput = {
              conversationHistory,
              userRole: (profile?.role === 'carrier' ? 'carrier' : 'traveler')
          };
          const result = await suggestChatReply(input);
          setSuggestedReplies(result.suggestedReplies);
      } catch (error) {
          toast({ variant: 'destructive', title: "فشل إنشاء الاقتراح", description: "حدث خطأ أثناء التواصل مع الذكاء الاصطناعي." });
      } finally {
          setIsSuggesting(false);
      }
  }

  const handleCloseChat = async () => {
    if (!firestore || !chatId) return;
    setIsClosingChat(true);
    const chatDocRef = doc(firestore, 'chats', chatId);
    try {
      await updateDocumentNonBlocking(chatDocRef, { isClosed: true });
      toast({ title: "تم إغلاق الدردشة", description: "لن يتمكن المشاركون من إرسال رسائل جديدة." });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: "فشل إغلاق الدردشة" });
    } finally {
      setIsClosingChat(false);
    }
  }
  
  const isChatClosed = (chatDoc as any)?.isClosed;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{isGroupChat ? 'دردشة الرحلة الجماعية' : `محادثة مع ${otherPartyName}`}</DialogTitle>
           {trip && (
            <DialogDescription>
              رحلة {trip.origin} - {trip.destination}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto bg-muted/20">
          <MessageList messages={messages || []} isLoading={isLoading} currentUserId={user?.uid || ""} />
        </div>
        
        <DialogFooter className="p-4 border-t bg-background flex-col gap-2">
            {profile?.role === 'carrier' && suggestedReplies.length > 0 && !isChatClosed && (
                <div className="flex flex-wrap gap-2 justify-center pb-2">
                    {suggestedReplies.map((reply, index) => (
                        <Button key={index} variant="outline" size="sm" onClick={() => handleSendMessage(reply)}>
                            {reply}
                        </Button>
                    ))}
                </div>
            )}
            <div className="flex w-full items-center space-x-2 rtl:space-x-reverse">
              {profile?.role === 'carrier' && !isChatClosed && (
                <>
                  <Button variant="outline" size="icon" onClick={handleSuggestReply} disabled={isSuggesting || isLoading}>
                      {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <PowerOff className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>تأكيد إغلاق الدردشة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من رغبتك في إغلاق هذه الدردشة بشكل نهائي؟ لن يتمكن أي من المشاركين من إرسال رسائل جديدة بعد هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>تراجع</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCloseChat} disabled={isClosingChat}>
                             {isClosingChat ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : 'نعم، قم بالإغلاق'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {isChatClosed ? (
                    <div className="flex-1 text-center text-sm text-muted-foreground font-semibold">الدردشة مغلقة من قبل الناقل.</div>
                ) : (
                    <>
                        <Input
                            id="message-input"
                            placeholder="اكتب رسالتك هنا..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isLoading}
                            className="flex-1"
                            />
                        <Button type="submit" size="icon" onClick={() => handleSendMessage()} disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">إرسال</span>
                        </Button>
                    </>
                )}

            </div>
             {profile?.role === 'carrier' && (
                 <Button variant="ghost" className="w-fit self-end text-xs h-auto p-1" onClick={() => onOpenChange(false)}>
                    <X className="ml-1 h-3 w-3"/>
                    إغلاق
                </Button>
             )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}