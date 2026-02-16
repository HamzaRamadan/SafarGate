'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';
import { askAi } from '@/ai/flows/ask-ai-flow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function AskAiDialog() {
  const t = useTranslations('askAi');

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { profile } = useUserProfile();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInput('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: userQuestion }
    ]);

    setInput('');
    setIsLoading(true);

    try {
      const { answerText } = await askAi({
        question: userQuestion,
        context: {
          path: pathname,
          role: profile?.role
        }
      });

      setMessages(prev => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: answerText }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'assistant', content: t('error') }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-20 left-4 z-50 rounded-full h-12 w-12 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-transform"
          size="icon"
        >
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
          <span className="sr-only">{t('openSrOnly')}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 bg-muted/50 border-b">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Bot className="h-5 w-5" />
            <span>{t('title')}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-10 space-y-2">
                <p>{t('welcome')}</p>
                <p>
                  {profile?.role === 'carrier'
                    ? t('carrierHelp')
                    : t('travelerHelp')}
                </p>
                <p className="text-xs opacity-70">
                  {t('hint')}
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    m.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {m.role === 'user'
                    ? <User className="h-4 w-4" />
                    : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={cn(
                    "p-3 rounded-lg text-sm max-w-[80%]",
                    m.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-lg bg-muted text-sm flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('thinking')}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
