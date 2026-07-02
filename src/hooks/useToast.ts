"use client";

import { useState, useCallback, useRef } from "react";

interface ToastState {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: "", type: "success", visible: false });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
