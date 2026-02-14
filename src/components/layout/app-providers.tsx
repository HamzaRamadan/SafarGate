'use client';

import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import React from 'react';
// [SC-227] Static Import: Prevents ChunkLoadError and ensures PWA stability
import { AskAiTrigger } from '@/components/ai/ask-ai-trigger';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      {children}
      <AskAiTrigger />
      <Toaster />
    </FirebaseClientProvider>
  );
}
