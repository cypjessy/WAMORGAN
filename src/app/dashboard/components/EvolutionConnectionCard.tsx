'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { businessProfileService } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getEvolutionConfig, getConnectionState, logoutInstance } from '@/lib/evolution';

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

interface EvolutionConnectionCardProps {
  onOpenConnect: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  refreshTrigger?: number;
}

const DEFAULT_INSTANCE = 'wamorgan-instance-01';

// ─── Component ───────────────────────────────────────────────────────────────

export default function EvolutionConnectionCard({ onOpenConnect, showToast, refreshTrigger = 0 }: EvolutionConnectionCardProps) {
  const [instanceName, setInstanceName] = useState(DEFAULT_INSTANCE);
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [isChecking, setIsChecking] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    instanceName: DEFAULT_INSTANCE,
    phone: '',
    serverUrl: 'https://evo.campushub.co.ke',
  });

  // Load instance name from profile
  useEffect(() => {
    businessProfileService.getProfile().then(bp => {
      if (bp?.whatsappInstanceName) {
        setInstanceName(bp.whatsappInstanceName);
        setConnectionInfo(prev => ({ ...prev, instanceName: bp.whatsappInstanceName! }));
      }
    }).catch(() => {});
  }, []);

  // Listen for real-time connection updates written by the webhook
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'businessProfiles', 'main'), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const conn = data?.whatsappConnection;
      if (conn?.isConnected && (conn?.state === 'open' || conn?.state === 'connected')) {
        setStatus('connected');
        setIsChecking(false);
        setConnectionInfo(prev => ({
          ...prev,
          instanceName: conn.instanceName || prev.instanceName,
          phone: conn.phone || prev.phone,
        }));
      }
    }, () => {
      // Firestore listener error — non-critical, fallback to polling
    });
    return () => unsub();
  }, []);

  // Check connection status via the Evolution API
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    setStatus('checking');

    try {
      // Check connection state directly via Evolution API
      const config = await getEvolutionConfig();

      if (!config.apiUrl) {
        setStatus('disconnected');
        return;
      }

      const { isConnected, phone } = await getConnectionState(instanceName);

      if (isConnected) {
        setStatus('connected');
        setConnectionInfo(prev => ({
          ...prev,
          phone: phone || prev.phone,
          serverUrl: config.apiUrl || prev.serverUrl,
        }));
      } else {
        setStatus('disconnected');
      }
    } catch (err) {
      console.warn('[EvolutionCard] Connection check failed:', err);
      // Evolution API not available — show disconnected
      setStatus('disconnected');
    } finally {
      setIsChecking(false);
    }
  }, [instanceName]);

  useEffect(() => {
    startTransition(() => {
      checkConnection();
    });
  }, [checkConnection, refreshTrigger]);

  const handleReconnect = useCallback(async () => {
    setStatus('reconnecting');
    setIsChecking(true);

    try {
      // Check connection state directly
      const config = await getEvolutionConfig();

      if (!config.apiUrl) {
        setStatus('disconnected');
        showToast?.('Evolution API not configured. Add API URL in .env.local', 'error');
        return;
      }

      setStatus('disconnected');
      onOpenConnect();
      showToast?.('Opening WhatsApp connection...', 'info');
    } catch {
      setStatus('error');
      showToast?.('Failed to connect to Evolution API', 'error');
    } finally {
      setIsChecking(false);
    }
  }, [onOpenConnect, showToast]);

  const handleDisconnect = useCallback(async () => {
    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      setTimeout(() => setConfirmDisconnect(false), 4000);
      return;
    }

    setIsDisconnecting(true);
    try {
      await logoutInstance(instanceName);
      setStatus('disconnected');
      // Update businessProfiles in Firestore so the status stays synced
      try {
        await businessProfileService.saveProfile({
          whatsappConnection: {
            instanceName,
            state: 'close',
            phone: '',
            lastChecked: new Date(),
            isConnected: false,
          }
        } as any);
      } catch (dbErr) {
        console.error('Failed to update db state on disconnect:', dbErr);
      }
      showToast?.('WhatsApp disconnected successfully', 'success');
    } catch {
      showToast?.('Failed to disconnect', 'error');
    } finally {
      setIsDisconnecting(false);
      setConfirmDisconnect(false);
    }
  }, [confirmDisconnect, instanceName, showToast]);

  const handleRefresh = useCallback(() => {
    checkConnection();
    showToast?.('Checking connection...', 'info');
  }, [checkConnection, showToast]);

  // ─── Render States ──────────────────────────────────────────────────────

  // Loading skeleton
  if (isChecking && status === 'checking') {
    return (
      <div style={{
        margin: '0 20px 20px', padding: '16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)', flexShrink: 0,
          animation: 'shimmer 1.5s ease-in-out infinite',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            width: '40%', height: 14, borderRadius: 6,
            background: 'var(--bg-card)', marginBottom: 8,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }} />
          <div style={{
            width: '60%', height: 11, borderRadius: 6,
            background: 'var(--bg-card)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
    );
  }

  // Connected state
  if (status === 'connected') {
    return (
      <div
        style={{
          margin: '0 20px 20px', padding: '16px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(37,211,102,0.03) 100%)',
          border: '1px solid rgba(37,211,102,0.2)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: '-50%', right: '-20%',
          width: 120, height: 120,
          background: 'radial-gradient(circle, rgba(37,211,102,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-md)',
            background: 'rgba(37,211,102,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 448 512" width="24" height="24" fill="#25d366">
              <path d="M380.9 97.6C339 55.6 283.2 32 223.9 32 104.7 32 7.9 128.8 7.9 248c0 39.5 10.2 78.3 29.6 111.8L8 480l123.4-29.2c32.7 17.8 69.6 27.2 107.3 27.2h.1c119.1 0 215.9-96.8 215.9-215.9 0-59.3-23.6-115.1-65.6-157.5zM224 428.6c-32.7 0-64.8-8.8-92.8-25.3l-6.7-4-73.4 17.4 19.6-71.6-4.3-6.9c-18.2-29.3-27.8-63.2-27.8-98.2 0-99.2 80.8-180 180-180 48.2 0 93.4 18.8 127.5 52.9s52.9 79.3 52.9 127.5c0 99.2-80.9 180-180 180z"/>
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700 }}>WhatsApp Connected</h4>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {connectionInfo.phone
                ? `${connectionInfo.phone} • ${connectionInfo.instanceName}`
                : `Evolution API • ${connectionInfo.instanceName}`
              }
            </p>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--radius-full)',
            background: 'rgba(37,211,102,0.15)', color: '#25d366',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            <span style={{
              width: 6, height: 6, background: '#25d366',
              borderRadius: '50%', animation: 'blink 2s infinite',
            }} />
            Active
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, position: 'relative', zIndex: 1 }}>
          <button onClick={handleRefresh} style={{
            flex: 1, height: 40, borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}>
            <i className="fas fa-rotate"></i> Refresh
          </button>
          <button onClick={onOpenConnect} style={{
            flex: 1, height: 40, borderRadius: 'var(--radius-md)',
            background: 'rgba(37,211,102,0.1)', border: '1.5px solid rgba(37,211,102,0.2)',
            color: '#25d366', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease',
          }}>
            <i className="fas fa-arrows-rotate"></i> Reconnect
          </button>
          <button onClick={handleDisconnect} style={{
            height: 40, borderRadius: 'var(--radius-md)',
            background: confirmDisconnect ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)',
            border: `1.5px solid ${confirmDisconnect ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
            color: confirmDisconnect ? 'var(--error)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s ease', whiteSpace: 'nowrap',
          }}>
            {isDisconnecting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : confirmDisconnect ? (
              <><i className="fas fa-triangle-exclamation"></i> Confirm</>
            ) : (
              <i className="fas fa-power-off"></i>
            )}
          </button>
        </div>

        {confirmDisconnect && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            fontSize: 12, color: 'var(--error)', lineHeight: 1.5,
            position: 'relative', zIndex: 1,
          }}>
            <i className="fas fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
            Disconnecting will log out your WhatsApp from this instance.
          </div>
        )}
      </div>
    );
  }

  // Disconnected state (clickable to open connect dialog)
  if (status === 'disconnected') {
    return (
      <div onClick={onOpenConnect} style={{
        margin: '0 20px 20px', padding: '16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-md)',
            background: 'rgba(37,211,102,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg viewBox="0 0 448 512" width="24" height="24" fill="#25d366">
              <path d="M380.9 97.6C339 55.6 283.2 32 223.9 32 104.7 32 7.9 128.8 7.9 248c0 39.5 10.2 78.3 29.6 111.8L8 480l123.4-29.2c32.7 17.8 69.6 27.2 107.3 27.2h.1c119.1 0 215.9-96.8 215.9-215.9 0-59.3-23.6-115.1-65.6-157.5zM224 428.6c-32.7 0-64.8-8.8-92.8-25.3l-6.7-4-73.4 17.4 19.6-71.6-4.3-6.9c-18.2-29.3-27.8-63.2-27.8-98.2 0-99.2 80.8-180 180-180 48.2 0 93.4 18.8 127.5 52.9s52.9 79.3 52.9 127.5c0 99.2-80.9 180-180 180z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Connect WhatsApp</h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Connect your WhatsApp to start automating sales
            </p>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent-gradient-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--accent-primary)', flexShrink: 0,
          }}>
            <i className="fas fa-plus"></i>
          </div>
        </div>
      </div>
    );
  }

  // Reconnecting state
  if (status === 'reconnecting') {
    return (
      <div style={{
        margin: '0 20px 20px', padding: '16px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)',
        border: '1px solid rgba(245,158,11,0.2)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)',
          background: 'rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: 'var(--warning)', flexShrink: 0,
        }}>
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Reconnecting...</h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Establishing connection to Evolution API
          </p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div style={{
      margin: '0 20px 20px', padding: '16px',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)',
      border: '1px solid rgba(239,68,68,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)',
          background: 'rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: 'var(--error)', flexShrink: 0,
        }}>
          <i className="fas fa-circle-exclamation"></i>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Connection Error</h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Unable to reach Evolution API. Check your configuration.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={handleRefresh} style={{
          flex: 1, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--accent-gradient)', border: 'none', color: 'white',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 4px 16px rgba(232,168,56,0.3)',
        }}>
          <i className="fas fa-rotate"></i> Retry
        </button>
        <button onClick={onOpenConnect} style={{
          flex: 1, height: 40, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)',
          color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <i className="fas fa-wrench"></i> Configure
        </button>
      </div>
    </div>
  );
}
