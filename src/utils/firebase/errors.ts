import { FirebaseError } from 'firebase/app';

export const FIREBASE_ERROR_MESSAGES = {
  'permission-denied': 'You don\'t have permission to access this resource',
  'unavailable': 'Unable to connect to the server. Please check your internet connection',
  'not-found': 'The requested resource was not found',
  'already-exists': 'This resource already exists',
  'unauthenticated': 'Please sign in to continue',
  'cancelled': 'The operation was cancelled',
  default: 'An unexpected error occurred'
} as const;

export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const code = error.code.split('/')[1] || error.code;
    return FIREBASE_ERROR_MESSAGES[code] || FIREBASE_ERROR_MESSAGES.default;
  }
  return FIREBASE_ERROR_MESSAGES.default;
}