'use client';

import { useRef } from 'react';

interface OtpVerificationProps {
  emailDisplay: string;
  otpValues: string[];
  verifyLoading: boolean;
  resendTimerValue: number;
  resendDisabled: boolean;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onVerify: () => void;
  onResend: () => void;
  onGoBack: () => void;
}

export default function OtpVerification({
  emailDisplay, otpValues, verifyLoading,
  resendTimerValue, resendDisabled,
  onOtpChange, onOtpKeyDown, onVerify, onResend, onGoBack,
}: OtpVerificationProps) {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    onOtpChange(index, sanitized);
    if (sanitized && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    onOtpKeyDown(index, e);
  };

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={onGoBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Verify Code</h2>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
        Enter the 4-digit code sent to
      </p>
      <p id="verifyEmailDisplay" style={{ fontSize: '15px', fontWeight: 600, textAlign: 'center', marginBottom: '24px' }}>
        {emailDisplay}
      </p>

      <div className="otp-container">
        {[0, 1, 2, 3].map(index => (
          <input
            key={index}
            ref={el => { otpRefs.current[index] = el; }}
            type="text"
            className="otp-input"
            maxLength={1}
            inputMode="numeric"
            value={otpValues[index]}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
          />
        ))}
      </div>

      <button className="btn btn-primary" id="verifyBtn" onClick={onVerify} style={{ marginTop: '8px' }} disabled={verifyLoading}>
        {verifyLoading ? (
          <div className="spinner"></div>
        ) : (
          <><span>Verify</span><i className="fas fa-check"></i></>
        )}
      </button>

      <p className="resend-text">
        Didn't receive it?{' '}
        <span
          id="resendLink"
          className="resend-link"
          onClick={onResend}
          style={{ pointerEvents: resendDisabled ? 'none' : 'all', opacity: resendDisabled ? 0.5 : 1 }}
        >
          Resend
        </span>
        {resendTimerValue > 0 && <span className="timer" id="resendTimer"> ({resendTimerValue}s)</span>}
      </p>
    </>
  );
}
