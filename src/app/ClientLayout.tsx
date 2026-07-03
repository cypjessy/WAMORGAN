"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ReactNode } from "react";
import { isNative, setStatusBarStyle, hideSplashScreen, addAppStateListener } from "@/lib/capacitor";

export default function ClientLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!isNative()) return;

    // Initialize native plugins on app start
    const init = async () => {
      // Status Bar — dark theme
      await setStatusBarStyle('dark');

      // Splash Screen — hide after mount
      await hideSplashScreen();

      // App lifecycle — track foreground/background
      await addAppStateListener((isActive) => {
        if (isActive) {
          // Refresh data on foreground
          setStatusBarStyle('dark');
        }
      });
    };

    init();
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
