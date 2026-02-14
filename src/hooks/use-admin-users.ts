'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, limit, getDocs, startAfter, where, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export function useAdminUsers() {
  const firestore = useFirestore();
  const functions = useFunctions();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    country: 'all',
    class: 'all',
    status: 'all',
  });

  const setFilterCountry = (val: string) => setFilters(prev => ({ ...prev, country: val }));
  const setFilterClass = (val: string) => setFilters(prev => ({ ...prev, class: val }));
  const setFilterStatus = (val: string) => setFilters(prev => ({ ...prev, status: val }));

  const fetchUsers = useCallback(async (isNextPage = false) => {
    if (!firestore) return;
    
    if (isNextPage) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setUsers([]); 
      setLastDoc(null);
    }

    try {
      let constraints: any[] = [orderBy('createdAt', 'desc'), limit(20)];

      if (filters.country !== 'all') constraints.push(where('operatingCountry', '==', filters.country));
      if (filters.class !== 'all') constraints.push(where('vehicleClass', '==', filters.class));
      if (filters.status === 'active') constraints.push(where('subscriptionStatus', '==', 'active'));
      if (filters.status === 'frozen') constraints.push(where('isFinancialFrozen', '==', true));
      
      let q = query(collection(firestore, 'users'), ...constraints);
      
      if (isNextPage && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      
      setHasMore(fetchedUsers.length === 20);
      setUsers(prev => isNextPage ? [...prev, ...fetchedUsers] : fetchedUsers);
      setLastDoc(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null);

    } catch (error) {
      console.error("Query Error (Verify Indexes):", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [firestore, filters, lastDoc]);

  useEffect(() => {
    fetchUsers(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [SC-208] Specialized Logic Handler (Data Only, No Routing)
  const toggleUserFreeze = async (action: 'finance_freeze' | 'security_freeze', id: string) => {
    
    if (!functions) {
        toast({ variant: 'destructive', title: 'خطأ', description: "النظام السحابي غير متصل." });
        return;
    }

    const freezeType = action === 'finance_freeze' ? 'financial' : 'security';
    const actionName = action === 'finance_freeze' ? 'تجميد/فك مالي' : 'تجميد/فك أمني';

    if (!confirm(`⚠️ تأكيد سيادي:\n\nهل أنت متأكد من تنفيذ إجراء (${actionName}) لهذا المستخدم؟\nسيتم تسجيل هذا الإجراء في سجلات الرقابة للأبد.`)) return;

    toast({ title: "جاري التنفيذ...", description: "يتم الاتصال بمحرك العدالة..." });

    try {
        const toggleFn = httpsCallable(functions, 'toggleUserFreezeStatus');
        
        await toggleFn({ 
            targetUserId: id, 
            freezeType: freezeType,
            reason: "Manual Override by Admin" 
        });
        
        toast({ 
            title: "تم التنفيذ بنجاح ✅", 
            description: "تم تحديث حالة المستخدم وتوثيق القرار في السجلات.",
            className: "bg-green-50 text-green-900 border-green-200"
        });
        
        // [SC-207] Confirmed Update Logic
        setUsers(currentUsers => currentUsers.map(user => {
            if (user.id === id) {
                const fieldToUpdate = freezeType === 'financial' ? 'isFinancialFrozen' : 'isDeactivated';
                return {
                    ...user,
                    [fieldToUpdate as keyof UserProfile]: !user[fieldToUpdate as keyof UserProfile],
                    lastAdminAction: { toDate: () => new Date() } as any 
                };
            }
            return user;
        }));

    } catch (error: any) {
        console.error("Sovereign Command Failed:", error);
        toast({ 
            variant: "destructive", 
            title: "فشل الإجراء", 
            description: error.message || "حدث خطأ أثناء تنفيذ الأمر السيادي." 
        });
    }
  };


  return {
    users,
    loading,
    loadingMore,
    hasMore,
    fetchUsers,
    toggleUserFreeze, // [SC-208] Exporting the specialized function
    setFilterCountry,
    setFilterClass,
    setFilterStatus
  };
}
