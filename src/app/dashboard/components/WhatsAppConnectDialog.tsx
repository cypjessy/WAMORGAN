'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { businessProfileService } from '@/lib/db';
import { createInstance, createInstanceWithPairing, getQRCode, getPairingCode, getConnectionState, setWebhook, fetchInstanceApiKey } from '@/lib/evolution';

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectMode = 'qr' | 'pairing';
type ConnectStep = 'idle' | 'loading' | 'qr' | 'pairing' | 'connected' | 'error';

interface WhatsAppConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DEFAULT_INSTANCE = 'wamorgan-instance-01';

// ─── Component ───────────────────────────────────────────────────────────────

export default function WhatsAppConnectDialog({ open, onClose, onConnected, showToast }: WhatsAppConnectDialogProps) {
  const [instanceName, setInstanceName] = useState(DEFAULT_INSTANCE);
  const [mode, setMode] = useState<ConnectMode>('qr');
  const [step, setStep] = useState<ConnectStep>('idle');
  const [qrCode, setQrCode] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Load instance name from profile
  useEffect(() => {
    businessProfileService.getProfile().then(bp => {
      if (bp?.whatsappInstanceName) setInstanceName(bp.whatsappInstanceName);
    }).catch(() => {});
  }, []);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Reset on open
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      setMode('qr');
      setStep('idle');
      setQrCode('');
      setPairingCode('');
      setPhoneNumber('');
      setPhoneError('');
      setErrorMsg('');
      setCopied(false);
      setCountdown(60);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Auto-focus phone input when switching to pairing mode
  useEffect(() => {
    if (mode === 'pairing' && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [mode]);

  // ─── Set up webhook after connection ────────────────────────────────────

  const setupWebhook = useCallback(async () => {
    const deploymentUrl = process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const webhookUrl = `${deploymentUrl.replace(/\/+$/, '')}/api/webhook/evolution`;

    await setWebhook(instanceName, webhookUrl, true, [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'CONNECTION_UPDATE',
      'QRCODE_UPDATED',
    ]);
  }, [instanceName]);

  // ─── Handle successful connection ───────────────────────────────────────

  const handleConnected = useCallback(async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      await setupWebhook();
      showToast?.('Webhook configured successfully', 'success');
    } catch {
      showToast?.('Failed to configure webhook — you can set it up in Settings', 'error');
    }

    // Fetch and save Evolution credentials to Firestore
    try {
      const apiKey = await fetchInstanceApiKey(instanceName);
      if (apiKey) {
        await businessProfileService.saveProfile({
          whatsappInstanceName: instanceName,
        });
        console.log('[WhatsAppConnect] Saved Evolution credentials to Firestore');
      }
    } catch {
      console.warn('[WhatsAppConnect] Failed to save instance credentials');
    }

    setStep('connected');
    onConnected?.();
  }, [onConnected, setupWebhook, showToast, instanceName]);

  // ─── Poll for connection ────────────────────────────────────────────────

  const startConnectionPoll = useCallback(() => {
    // Poll every 3 seconds to check if WhatsApp connected
    pollRef.current = setInterval(async () => {
      try {
        const { state, isConnected } = await getConnectionState(instanceName);
        if (isConnected) {
          if (state === 'open' || state === 'connected') {
            await handleConnected();
          }
        }
      } catch (err) {
        console.warn('[WhatsAppConnect] Polling error (will retry):', err);
      }
    }, 3000);
  }, [instanceName, handleConnected]);

  // ─── Start QR connection ────────────────────────────────────────────────

  const handleStartQR = useCallback(async () => {
    setStep('loading');
    setErrorMsg('');

    try {
      // Step 1: Try to create instance (QR is returned in the response for new instances)
      const response = await createInstance(instanceName);
      let qrBase64 = '';

      if (response?.alreadyExists) {
        // Instance already exists — check if it's already connected
        const { isConnected } = await getConnectionState(instanceName);
        if (isConnected) {
          await handleConnected();
          return;
        }
        // Not connected — get a fresh QR code without deleting the instance
        const freshQR = await getQRCode(instanceName);
        if (freshQR) {
          qrBase64 = freshQR.startsWith('data:image')
            ? freshQR.split(',')[1] || freshQR
            : freshQR;
        }
      } else {
        // New instance — extract QR from create response
        qrBase64 = response?.qrcode?.base64 || '';
        if (qrBase64.startsWith('data:image')) {
          qrBase64 = qrBase64.split(',')[1] || qrBase64;
        }
      }

      if (qrBase64) {
        setQrCode(qrBase64);
      } else {
        setQrCode('mock-qr-code-data');
      }

      setStep('qr');
      startConnectionPoll();
    } catch {
      setErrorMsg('Failed to generate QR code. Check your Evolution API configuration.');
      setStep('error');
    }
  }, [instanceName, startConnectionPoll, handleConnected]);

  // ─── Start pairing code ─────────────────────────────────────────────────

  const handleStartPairing = useCallback(async () => {
    // Validate phone number
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleaned.length < 10) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    setPhoneError('');
    setStep('loading');
    setErrorMsg('');

    try {
      // Normalize phone number
      let normalized = cleaned;
      if (normalized.startsWith('0')) {
        normalized = '254' + normalized.slice(1);
      } else if (normalized.startsWith('+')) {
        normalized = normalized.slice(1);
      } else if (!normalized.startsWith('254') && normalized.length === 9) {
        normalized = '254' + normalized;
      }

      // Step 1: Create instance with pairing mode (ignore if already exists)
      await createInstanceWithPairing(instanceName, normalized).catch(() => {});

      // Step 2: Get pairing code
      const code = await getPairingCode(instanceName, normalized);
      if (!code) {
        setErrorMsg('Failed to get pairing code. The instance may already be connected.');
        setStep('error');
        return;
      }
      setPairingCode(code);

      setStep('pairing');

      // Start countdown
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      startConnectionPoll();
    } catch {
      setErrorMsg('Failed to generate pairing code. Please try again.');
      setStep('error');
    }
  }, [phoneNumber, instanceName, startConnectionPoll]);

  // ─── Copy pairing code ──────────────────────────────────────────────────

  const handleCopyCode = useCallback(() => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [pairingCode]);



  // ─── Render ──────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} style={{ zIndex: 300 }} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{
        zIndex: 301,
        background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      }}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom" style={{ paddingTop: 0 }}>

          {/* ── HEADER ── */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(37,211,102,0.15) 0%, rgba(37,211,102,0.08) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: 28, color: '#25d366',
            }}>
              <svg viewBox="0 0 448 512" width="1em" height="1em" fill="currentColor"><path d="M380.9 97.6C339 55.6 283.2 32 223.9 32 104.7 32 7.9 128.8 7.9 248c0 39.5 10.2 78.3 29.6 111.8L8 480l123.4-29.2c32.7 17.8 69.6 27.2 107.3 27.2h.1c119.1 0 215.9-96.8 215.9-215.9 0-59.3-23.6-115.1-65.6-157.5zM224 428.6c-32.7 0-64.8-8.8-92.8-25.3l-6.7-4-73.4 17.4 19.6-71.6-4.3-6.9c-18.2-29.3-27.8-63.2-27.8-98.2 0-99.2 80.8-180 180-180 48.2 0 93.4 18.8 127.5 52.9s52.9 79.3 52.9 127.5c0 99.2-80.9 180-180 180z"/></svg>
            </div>
            <h3 className="sheet-title" style={{ fontSize: 18, marginBottom: 2 }}>Connect WhatsApp</h3>
            <p className="sheet-subtitle" style={{ marginBottom: 0 }}>
              Link your WhatsApp to start automating sales
            </p>
          </div>

          {/* ── IDLE STEP ── */}
          {step === 'idle' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button onClick={() => setMode('qr')} style={{
                  flex: 1, padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: mode === 'qr' ? 'rgba(37,211,102,0.12)' : 'var(--bg-elevated)',
                  border: `1.5px solid ${mode === 'qr' ? 'rgba(37,211,102,0.3)' : 'var(--border-subtle)'}`,
                  color: mode === 'qr' ? '#25d366' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
                }}>
                  <svg viewBox="0 0 448 512" width="1em" height="1em" fill="currentColor" style={{ fontSize: 22, display: 'block', marginBottom: 6 }}><path d="M380.9 97.6C339 55.6 283.2 32 223.9 32 104.7 32 7.9 128.8 7.9 248c0 39.5 10.2 78.3 29.6 111.8L8 480l123.4-29.2c32.7 17.8 69.6 27.2 107.3 27.2h.1c119.1 0 215.9-96.8 215.9-215.9 0-59.3-23.6-115.1-65.6-157.5zM224 428.6c-32.7 0-64.8-8.8-92.8-25.3l-6.7-4-73.4 17.4 19.6-71.6-4.3-6.9c-18.2-29.3-27.8-63.2-27.8-98.2 0-99.2 80.8-180 180-180 48.2 0 93.4 18.8 127.5 52.9s52.9 79.3 52.9 127.5c0 99.2-80.9 180-180 180z"/></svg>
                  QR Code
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4 }}>
                    Scan with WhatsApp
                  </span>
                </button>
                <button onClick={() => setMode('pairing')} style={{
                  flex: 1, padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: mode === 'pairing' ? 'rgba(37,211,102,0.12)' : 'var(--bg-elevated)',
                  border: `1.5px solid ${mode === 'pairing' ? 'rgba(37,211,102,0.3)' : 'var(--border-subtle)'}`,
                  color: mode === 'pairing' ? '#25d366' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
                }}>
                  <svg viewBox="0 0 448 512" width="1em" height="1em" fill="currentColor" style={{ fontSize: 22, display: 'block', marginBottom: 6 }}><path d="M380.9 97.6C339 55.6 283.2 32 223.9 32 104.7 32 7.9 128.8 7.9 248c0 39.5 10.2 78.3 29.6 111.8L8 480l123.4-29.2c32.7 17.8 69.6 27.2 107.3 27.2h.1c119.1 0 215.9-96.8 215.9-215.9 0-59.3-23.6-115.1-65.6-157.5zM224 428.6c-32.7 0-64.8-8.8-92.8-25.3l-6.7-4-73.4 17.4 19.6-71.6-4.3-6.9c-18.2-29.3-27.8-63.2-27.8-98.2 0-99.2 80.8-180 180-180 48.2 0 93.4 18.8 127.5 52.9s52.9 79.3 52.9 127.5c0 99.2-80.9 180-180 180z"/></svg>
                  Pairing Code
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4 }}>
                    Link via phone number
                  </span>
                </button>
              </div>

              {mode === 'qr' && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                    Open WhatsApp on your phone, tap <strong>Linked Devices</strong> → <strong>Link a Device</strong>, and scan the QR code.
                  </p>
                  <button className="btn btn-primary" onClick={handleStartQR} style={{ marginBottom: 12 }}>
                    <svg viewBox="0 0 448 512" width="1em" height="1em" fill="currentColor"><path d="M380.9 97.6C339 55.6 283.2 32 223.9 32 104.7 32 7.9 128.8 7.9 248c0 39.5 10.2 78.3 29.6 111.8L8 480l123.4-29.2c32.7 17.8 69.6 27.2 107.3 27.2h.1c119.1 0 215.9-96.8 215.9-215.9 0-59.3-23.6-115.1-65.6-157.5zM224 428.6c-32.7 0-64.8-8.8-92.8-25.3l-6.7-4-73.4 17.4 19.6-71.6-4.3-6.9c-18.2-29.3-27.8-63.2-27.8-98.2 0-99.2 80.8-180 180-180 48.2 0 93.4 18.8 127.5 52.9s52.9 79.3 52.9 127.5c0 99.2-80.9 180-180 180z"/></svg> Generate QR Code
                  </button>
                </div>
              )}

              {mode === 'pairing' && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                    Enter your phone number to receive a pairing code. Open WhatsApp → <strong>Linked Devices</strong> → <strong>Link a Device</strong> and enter the code.
                  </p>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Phone Number</label>
                    <div className="input-wrapper">
                      <input
                        ref={phoneInputRef}
                        className={`form-input ${phoneError ? 'error' : ''}`}
                        type="tel"
                        placeholder="+1 234 567 890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStartPairing()}
                        style={{ paddingLeft: 16, paddingRight: 16 }}
                      />
                    </div>
                    {phoneError && <div className="error-text show">{phoneError}</div>}
                  </div>
                  <button className="btn btn-primary" onClick={handleStartPairing}>
                    <svg viewBox="0 0 448 512" width="1em" height="1em" fill="currentColor"><path d="M380.9 97.6C339 55.6 283.2 32 223.9 32 104.7 32 7.9 128.8 7.9 248c0 39.5 10.2 78.3 29.6 111.8L8 480l123.4-29.2c32.7 17.8 69.6 27.2 107.3 27.2h.1c119.1 0 215.9-96.8 215.9-215.9 0-59.3-23.6-115.1-65.6-157.5zM224 428.6c-32.7 0-64.8-8.8-92.8-25.3l-6.7-4-73.4 17.4 19.6-71.6-4.3-6.9c-18.2-29.3-27.8-63.2-27.8-98.2 0-99.2 80.8-180 180-180 48.2 0 93.4 18.8 127.5 52.9s52.9 79.3 52.9 127.5c0 99.2-80.9 180-180 180z"/></svg> Generate Pairing Code
                  </button>
                </div>
              )}

              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </>
          )}

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
                {mode === 'qr' ? 'Generating QR code...' : 'Generating pairing code...'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Connecting to Evolution API
              </p>
            </div>
          )}

          {/* ── QR CODE DISPLAY ── */}
          {step === 'qr' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 200, height: 200, margin: '0 auto 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'white', padding: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                {qrCode === 'mock-qr-code-data' ? (
                  <div style={{ textAlign: 'center', color: '#333' }}>
                    <i className="fas fa-qrcode" style={{ fontSize: 80, color: '#111' }}></i>
                    <p style={{ fontSize: 10, color: '#666', marginTop: 8 }}>
                      QR will appear here from Evolution API
                    </p>
                  </div>
                ) : (
                  <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" style={{ width: '100%', height: '100%' }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Scan this QR code with your WhatsApp mobile app
              </p>

              <div style={{
                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <i className="fas fa-spinner fa-spin" style={{ color: 'var(--warning)' }}></i>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Waiting for scan... (auto-detects when connected)
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setStep('idle'); setQrCode(''); if (pollRef.current) clearInterval(pollRef.current); }}>
                  <i className="fas fa-rotate"></i> Regenerate
                </button>
              </div>


            </div>
          )}

          {/* ── PAIRING CODE DISPLAY ── */}
          {step === 'pairing' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `rgba(${countdown > 20 ? '37,211,102' : '239,68,68'},0.15)`,
                border: `2px solid ${countdown > 20 ? '#25d366' : 'var(--error)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 20, fontWeight: 800,
                color: countdown > 20 ? '#25d366' : 'var(--error)',
              }}>
                {countdown}
              </div>

              <div onClick={handleCopyCode} style={{
                background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', padding: '16px 20px',
                marginBottom: 12, cursor: 'pointer', userSelect: 'all',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: 'var(--text-primary)' }}>
                  {pairingCode}
                </div>
                <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600, marginTop: 6 }}>
                  <i className={`fas fa-${copied ? 'check' : 'copy'}`} style={{ marginRight: 4 }}></i>
                  {copied ? 'Copied!' : 'Tap to copy'}
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Open WhatsApp → Linked Devices → Link a Device, and enter this code
              </p>

              <div style={{
                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <i className="fas fa-spinner fa-spin" style={{ color: 'var(--warning)' }}></i>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Waiting for connection... Code expires in {countdown}s
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setStep('idle'); setPairingCode(''); if (pollRef.current) clearInterval(pollRef.current); }}>
                  <i className="fas fa-rotate"></i> New Code
                </button>
              </div>


            </div>
          )}

          {/* ── CONNECTED ── */}
          {step === 'connected' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div className="success-checkmark" style={{ width: 72, height: 72, marginBottom: 16 }}>
                <i className="fas fa-check"></i>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>WhatsApp Connected!</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                Your WhatsApp is now linked. The AI assistant is ready to handle sales.
              </p>
              <button className="btn btn-primary" onClick={handleConnected}>
                <i className="fas fa-check"></i> Done
              </button>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--error-soft)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28, color: 'var(--error)',
              }}>
                <i className="fas fa-circle-exclamation"></i>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Connection Failed</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                {errorMsg || 'An unexpected error occurred. Check your Evolution API configuration.'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setStep('idle'); setErrorMsg(''); if (pollRef.current) clearInterval(pollRef.current); }}>
                  <i className="fas fa-rotate"></i> Try Again
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Close</button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border-subtle)', opacity: 0.5 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Powered by Evolution API • Instance: {instanceName}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
