'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PWAUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Check for updates
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is installed and waiting
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Manually check for updates
          registration.update();
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    checkForUpdates();

    // Check for updates every hour
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        // Tell the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating:', error);
      setIsUpdating(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
        <div>
          <p className="font-medium">Update Available</p>
          <p className="text-xs opacity-90">A new version is ready</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="ml-2 bg-white text-blue-500 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </button>
      </div>
    </div>
  );
}
