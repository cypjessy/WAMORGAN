'use client';

import { useEffect } from 'react';

interface SnackbarProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
}

export default function Snackbar({ message, type, visible, onHide }: SnackbarProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  return (
    <div className={`toast ${type} ${visible ? 'show' : ''}`}>
      <i className={type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
      <span>{message}</span>
    </div>
  );
}
