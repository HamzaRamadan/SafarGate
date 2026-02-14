'use client';

import { useUserProfile } from '@/hooks/use-user-profile';
import { differenceInDays } from 'date-fns';

export type SubscriptionState = 'active' | 'warning' | 'expired';

export function useCarrierSubscription() {
  const { profile, isLoading } = useUserProfile();

  // فترة السماح الافتراضية السيادية: 90 يوماً
  const GRACE_PERIOD_DAYS = 90;

  if (isLoading || !profile || !profile.createdAt) {
    return { 
        status: 'loading', 
        daysRemaining: 0, 
        subscriptionState: 'active' as SubscriptionState, 
        gracePeriodTotal: GRACE_PERIOD_DAYS 
    };
  }

  const joinDate = profile.createdAt?.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
  const today = new Date();
  
  const daysElapsed = differenceInDays(today, joinDate);
  const daysRemaining = GRACE_PERIOD_DAYS - daysElapsed;

  // منطق الحالة الذكية (The Smart State Logic)
  let subscriptionState: SubscriptionState = 'active';
  
  if (daysRemaining <= 0) {
      subscriptionState = 'expired';
  } else if (daysRemaining <= 2) {
      subscriptionState = 'warning'; // الإنذار الأصفر
  }

  return {
    status: 'ready',
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    subscriptionState,
    gracePeriodTotal: GRACE_PERIOD_DAYS
  };
}
