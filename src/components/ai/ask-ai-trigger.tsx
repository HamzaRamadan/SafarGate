'use client';

import { AskAiDialog } from './ask-ai-dialog';
import { useUser } from '@/firebase';

export function AskAiTrigger() {
  const { user, isUserLoading } = useUser();

  // Do not render the component if the user is not logged in or loading.
  if (isUserLoading || !user) {
    return null;
  }
  
  return <AskAiDialog />;
}
