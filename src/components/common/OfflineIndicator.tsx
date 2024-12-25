import React from 'react';
import { WifiOff } from 'lucide-react';
import { useFirebaseConnection } from '../../hooks/useFirebaseConnection';
import { cn } from '../../utils/cn';

export function OfflineIndicator() {
  const { isOnline, isReconnecting, lastError } = useFirebaseConnection();

  if (isOnline && !lastError) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50",
      "flex items-center gap-2 px-4 py-2 rounded-lg",
      "text-sm font-medium",
      isReconnecting ? "bg-yellow-500/90" : "bg-red-500/90",
      "text-white backdrop-blur-sm shadow-lg"
    )}>
      <WifiOff size={16} className="animate-pulse" />
      <span>
        {isReconnecting ? 'Reconnecting...' : 
         lastError || 'You are currently offline'}
      </span>
    </div>
  );
}