'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  type DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { useUser } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * It waits for authentication to be ready before subscribing and handles nullable references.
 *
 * IMPORTANT: Memoize the `docRef` prop (e.g., with `useMemo`) to prevent unnecessary re-subscriptions.
 *
 * @template T Type of the document data.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef The Firestore DocumentReference.
 * @returns {UseDocResult<T>} An object with the document data, loading state, and error.
 */
export function useDoc<T = any>(
  docRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const { isUserLoading } = useUser();

  useEffect(() => {
    // Gatekeeping: Wait for auth to be ready and for a valid docRef.
    if (isUserLoading) {
      return;
    }

    if (!docRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        // Create a contextual error and emit it for the development overlay.
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: docRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);

        // Treat permission denied as "no data" from the component's perspective.
        setData(null); 
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount or when docRef changes.
    return () => unsubscribe();
  }, [docRef, isUserLoading]); // Re-run if the docRef changes or when auth state is resolved.

  return { data, isLoading, error };
}
