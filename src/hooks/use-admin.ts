'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';

export function useAdmin() {
  const { profile, isLoading, user } = useUserProfile();
  const router = useRouter();

  // This useEffect ONLY handles redirection and runs *after* the initial loading is complete.
  // The layout component itself is responsible for showing a loading state, preventing race conditions.
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/admin/login');
      } else if (profile && !(profile.role === 'admin' || profile.role === 'owner')) {
        router.replace('/dashboard');
      }
    }
  }, [profile, isLoading, user, router]);


  // Return the state for the consuming component to decide what to render.
  return { 
    isLoading: isLoading,
    isAdmin: profile?.role === 'admin' || profile?.role === 'owner'
  };
}
