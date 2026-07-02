'use client';

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ visible, message, type }: ToastProps) {
  return (
    <div className={`toast ${visible ? 'show' : ''} ${type}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
      <span id="toastMsg">{message}</span>
    </div>
  );
}
