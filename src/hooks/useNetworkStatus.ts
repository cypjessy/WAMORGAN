"use client";

import { useState, useEffect } from "react";
import { getNetworkStatus, addNetworkListener, isNative } from "@/lib/capacitor";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial status
    getNetworkStatus().then(status => setIsOnline(status.connected));

    // Listen for changes
    const remove = addNetworkListener((connected) => {
      setIsOnline(connected);
    });

    return remove;
  }, []);

  return isOnline;
}
