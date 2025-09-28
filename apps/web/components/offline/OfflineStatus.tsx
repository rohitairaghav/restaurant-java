'use client';

import React, { useEffect, useState } from 'react';
import { syncManager } from '@/lib/offline/sync';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup sync on reconnection
    syncManager.setupOnlineListener(() => {
      setIsSyncing(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    try {
      await syncManager.syncOfflineData();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      isOnline
        ? 'bg-success-50 text-success-700'
        : 'bg-warning-50 text-warning-700'
    }`}>
      {isOnline ? (
        <Wifi size={16} />
      ) : (
        <WifiOff size={16} />
      )}

      <span>
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {isOnline && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="ml-2 p-1 hover:bg-success-100 rounded"
          title="Sync offline changes"
        >
          <RefreshCw
            size={14}
            className={isSyncing ? 'animate-spin' : ''}
          />
        </button>
      )}
    </div>
  );
}