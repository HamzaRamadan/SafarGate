'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  type DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { useUser } from '../provider';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a Firestore collection in real-time.
 * It safely handles auth state and absorbs 'permission-denied' errors.
 *
 * IMPORTANT: Memoize the `targetRefOrQuery` prop (e.g., with `useMemo`) to prevent unnecessary re-subscriptions.
 *
 * @template T Type of the document data.
 * @param {CollectionReference | Query | null | undefined} targetRefOrQuery The Firestore query or collection reference.
 * @returns {UseCollectionResult<T>} An object with the collection data, loading state, and error.
 */
export function useCollection<T = any>(
   targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData>  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const { isUserLoading } = useUser();

  useEffect(() => {
    // Gatekeeping: Wait for auth to be ready and for a valid query.
    if (isUserLoading) {
      return;
    }
    
    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id });
        });
        setData(results);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        // A permission error occurred. Create a contextual error and emit it,
        // but treat it as "empty" from the component's perspective to prevent crashing.
        if (err.code === 'permission-denied') {
          console.warn(`[useCollection] Security Rule blocked access to ${('path' in targetRefOrQuery) ? targetRefOrQuery.path : 'query'}. Suppressing crash.`);
          setData([]); 
          setIsLoading(false);
          setError(null); 
        } else {
          console.error('[useCollection] Firestore Error:', err);
          setError(err);
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery, isUserLoading]); // Re-run if query or auth state changes

  return { data, isLoading, error };
}
