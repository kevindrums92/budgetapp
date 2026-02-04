/**
 * Hook for tracking network connectivity status
 * Uses Capacitor Network plugin on native, browser APIs on web
 */

import { useState, useEffect } from "react";
import { getNetworkStatus, addNetworkListener } from "@/services/network.service";

type NetworkStatus = {
  isOnline: boolean;
  isLoading: boolean;
};

/**
 * Hook to track network connectivity
 * Returns current online status with reactive updates
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial status
    getNetworkStatus().then((status) => {
      setIsOnline(status);
      setIsLoading(false);
    });

    // Listen for changes
    const unsubscribe = addNetworkListener((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isLoading };
}

export default useNetworkStatus;
