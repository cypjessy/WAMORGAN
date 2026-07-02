'use client';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Snackbar({ visible, message, type }: SnackbarProps) {
  return (
    <div className={`toast ${visible ? 'show' : ''} ${type}`} id="toast">
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
      <span id="toastMsg">{message}</span>
    </div>
  );
}
