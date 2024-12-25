import { useState, useEffect } from 'react';
import { db } from '../config/firebase.config';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../utils/firebase/errors';

interface ConnectionState {
  isOnline: boolean;
  isReconnecting: boolean;
  lastError: string | null;
}

export function useFirebaseConnection(): ConnectionState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsReconnecting(true);
      setLastError(null);
      try {
        await enableNetwork(db);
        setIsOnline(true);
      } catch (error) {
        const message = getFirebaseErrorMessage(error);
        console.error('Error reconnecting to Firebase:', message);
        setLastError(message);
      } finally {
        setIsReconnecting(false);
      }
    };

    const handleOffline = async () => {
      setLastError(null);
      try {
        await disableNetwork(db);
        setIsOnline(false);
      } catch (error) {
        const message = getFirebaseErrorMessage(error);
        console.error('Error disconnecting from Firebase:', message);
        setLastError(message);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isReconnecting, lastError };
}