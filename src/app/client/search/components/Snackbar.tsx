'use client';

import { useState, useEffect } from 'react';

interface SnackbarProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
}

export default function Snackbar({ message, type, visible, onHide }: SnackbarProps) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShow(true);
        });
      });
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 400);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!mounted) return null;

  return (
    <div className={`toast ${type} ${show ? 'show' : ''}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
      <span>{message}</span>
    </div>
  );
}
