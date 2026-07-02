"use client";

import { useState, useEffect } from "react";

type DeviceType = "mobile" | "desktop" | "loading";

export function useIsMobile(): DeviceType {
  const [device, setDevice] = useState<DeviceType>("loading");

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setDevice(isMobile ? "mobile" : "desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return device;
}
