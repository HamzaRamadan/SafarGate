'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  writeBatch,
  type CollectionReference,
  type DocumentReference,
  type SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    // Silently fail if permission is denied or doc not found, log other errors.
    if (error.code === 'permission-denied' || error.code === 'not-found') {
      console.warn(`[Non-Blocking Set] Ignored permission error for ${docRef.path}.`);
      return;
    }
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: options && 'merge' in options ? 'update' : 'create',
        requestResourceData: data,
      })
    )
  })
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      // Silently fail if permission is denied, log other errors.
      if (error.code === 'permission-denied') {
        console.warn(`[Non-Blocking Add] Ignored permission error for ${colRef.path}.`);
        return;
      }
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      // THE CRITICAL FIX: Silently fail on permission/not-found errors.
      if (error.code === 'permission-denied' || error.code === 'not-found') {
        console.warn(`[Non-Blocking Update] Ignored permission/not-found error for ${docRef.path}.`);
        return; // Exit safely
      }

      // For other unexpected errors, emit the permission error for debugging.
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
       // Silently fail if permission is denied, log other errors.
      if (error.code === 'permission-denied' || error.code === 'not-found') {
        console.warn(`[Non-Blocking Delete] Ignored permission error for ${docRef.path}.`);
        return;
      }
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}

/**
 * Initiates a batch write operation.
 * Does NOT await the write operation internally.
 */
export function commitBatchNonBlocking(batch: ReturnType<typeof writeBatch>) {
    batch.commit().catch(error => {
        if (error.code === 'permission-denied') {
            console.warn(`[Non-Blocking Batch] Ignored permission error during batch commit.`);
            return;
        }
        // NOTE: Batch writes don't have a single path or data payload,
        // so we create a more generic error for debugging purposes.
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: '[BATCH_WRITE]',
                operation: 'write',
                requestResourceData: { note: 'This was a batch operation.' }
            })
        );
    });
}
