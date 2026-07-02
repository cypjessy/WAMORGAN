'use client';

import { useState, useEffect } from 'react';
import { whatsappSettingsService, businessProfileService } from '@/lib/db';

interface WhatsAppSheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function WhatsAppSheet({ open, onClose, onShowToast }: WhatsAppSheetProps) {
  const [activeTab, setActiveTab] = useState<'connection' | 'automation'>('connection');
  const [loading, setLoading] = useState(true);

  // Automation state
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("Thank you for your message! We'll get back to you shortly.");
  const [awayEnabled, setAwayEnabled] = useState(false);
  const [awayMessage, setAwayMessage] = useState("Hi! Thanks for reaching out. We're currently away but will respond as soon as we're back.");

  // Connection state
  const [instanceName, setInstanceName] = useState('wamorgan-instance-01');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      whatsappSettingsService.getSettings(),
      businessProfileService.getProfile(),
    ]).then(([settings, profile]) => {
      if (settings) {
        setWelcomeEnabled(settings.welcomeMessageEnabled ?? true);
        setWelcomeMessage(settings.welcomeMessage || '');
        setAutoReplyEnabled(settings.autoReplyEnabled ?? false);
        setAutoReplyMessage(settings.autoReplyMessage || "Thank you for your message! We'll get back to you shortly.");
        setAwayEnabled(settings.awayMessageEnabled ?? false);
        setAwayMessage(settings.awayMessage || "Hi! Thanks for reaching out. We're currently away but will respond as soon as we're back.");
      }
      if (profile?.whatsappInstanceName) {
        setInstanceName(profile.whatsappInstanceName);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  const handleSave = async () => {
    try {
      await whatsappSettingsService.saveSettings({
        welcomeMessageEnabled: welcomeEnabled,
        welcomeMessage,
        autoReplyEnabled,
        autoReplyMessage,
        awayMessageEnabled: awayEnabled,
        awayMessage,
      });
      onShowToast('WhatsApp automation saved', 'success');
      onClose();
    } catch {
      onShowToast('Failed to save WhatsApp settings', 'error');
    }
  };

  if (loading) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">WhatsApp Settings</div>
          <div className="sheet-subtitle" style={{ marginBottom: 20 }}>Connection & automation management</div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button onClick={() => setActiveTab('connection')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)', background: activeTab === 'connection' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)', border: `1.5px solid ${activeTab === 'connection' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, color: activeTab === 'connection' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <i className="fas fa-plug"></i> Connection
            </button>
            <button onClick={() => setActiveTab('automation')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)', background: activeTab === 'automation' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)', border: `1.5px solid ${activeTab === 'automation' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, color: activeTab === 'automation' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <i className="fas fa-robot"></i> Automation
            </button>
          </div>

          {activeTab === 'connection' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Instance Details</h4>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {[
                    { label: 'Instance Name', value: instanceName },
                    { label: 'API URL', value: process.env.NEXT_PUBLIC_EVOLUTION_URL || 'https://evo.campushub.co.ke' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'automation' && (
            <>
              {/* Welcome Message */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <i className="fas fa-hand-sparkles" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Welcome Message
                  </h4>
                  <div className={`toggle-switch ${welcomeEnabled ? 'active' : ''}`} onClick={() => setWelcomeEnabled(!welcomeEnabled)}
                    style={{ width: 44, height: 24, borderRadius: 12, background: welcomeEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${welcomeEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: welcomeEnabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
                {welcomeEnabled && (
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <textarea className="form-input" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Enter your welcome message..." style={{ height: 'auto', padding: '14px 16px', minHeight: 100, resize: 'none', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }} />
                  </div>
                )}
              </div>

              {/* Auto Reply */}
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--success)' }}>
                      <i className="fas fa-reply"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>Auto Reply</span>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Automatic response to all messages</p>
                    </div>
                  </div>
                  <div className={`toggle-switch ${autoReplyEnabled ? 'active' : ''}`} onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                    style={{ width: 44, height: 24, borderRadius: 12, background: autoReplyEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${autoReplyEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: autoReplyEnabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'all 0.2s ease' }} />
                  </div>
                </div>
                {autoReplyEnabled && (
                  <textarea className="form-input" value={autoReplyMessage} onChange={(e) => setAutoReplyMessage(e.target.value)}
                    style={{ height: 'auto', padding: '12px 14px', minHeight: 60, resize: 'none', fontSize: 13 }} />
                )}
              </div>

              {/* Away Message */}
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--warning)' }}>
                      <i className="fas fa-moon"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>Away Message</span>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Sent when you're unavailable</p>
                    </div>
                  </div>
                  <div className={`toggle-switch ${awayEnabled ? 'active' : ''}`} onClick={() => setAwayEnabled(!awayEnabled)}
                    style={{ width: 44, height: 24, borderRadius: 12, background: awayEnabled ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1.5px solid ${awayEnabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: awayEnabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'all 0.2s ease' }} />
                  </div>
                </div>
                {awayEnabled && (
                  <textarea className="form-input" value={awayMessage} onChange={(e) => setAwayMessage(e.target.value)}
                    style={{ height: 'auto', padding: '12px 14px', minHeight: 60, resize: 'none', fontSize: 13 }} />
                )}
              </div>

              <button className="btn btn-primary" onClick={handleSave}>
                <i className="fas fa-check"></i> Save Automation
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}