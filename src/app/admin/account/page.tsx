'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createInstance, getPairingCode, getConnectionState, fetchInstanceApiKey, getInstanceDetails, getEvolutionConfig, deleteInstance, setWebhook } from '@/lib/evolution';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  category: string;
  country: string;
  currency: string;
}

interface EvolutionData {
  instanceId: string;
  evolutionUrl: string;
  evolutionKey: string;
  evolutionUUID: string;
}

const businessCategories = ['Retail', 'Wholesale', 'E-commerce', 'Services', 'Manufacturing', 'Food & Beverage', 'Technology', 'Health & Beauty', 'Automotive', 'Real Estate'];

const countries = [
  { code: 'KE', name: 'Kenya', currency: 'KES (Kenyan Shilling)' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN (Nigerian Naira)' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR (South African Rand)' },
  { code: 'GH', name: 'Ghana', currency: 'GHS (Ghanaian Cedi)' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS (Tanzanian Shilling)' },
  { code: 'UG', name: 'Uganda', currency: 'UGX (Ugandan Shilling)' },
  { code: 'US', name: 'United States', currency: 'USD (US Dollar)' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP (British Pound)' },
];

type ConnectMode = 'qr' | 'pairing';
type ConnectionStatus = 'idle' | 'loading' | 'qr' | 'pairing' | 'connected' | 'error';

export default function AdminAccountPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    category: '',
    country: 'KE',
    currency: 'KES (Kenyan Shilling)',
  });

  // WhatsApp connection state (matching WhatsAppConnect from WAMORGAN)
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState<ConnectMode>('qr');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCountdown, setPairingCountdown] = useState(60);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);

  const resetPairingCountdown = () => setPairingCountdown(60);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (id === 'country') {
      const country = countries.find(c => c.code === value);
      setFormData(prev => ({ ...prev, currency: country?.currency || 'USD (US Dollar)' }));
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const { firstName, lastName, email, phone, password } = formData;
      if (!firstName || !lastName || !email || !phone || !password) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return false;
      if (phone.length < 10) return false;
    }
    if (step === 2) {
      if (!formData.businessName || !formData.category) return false;
    }
    return true;
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 6) strength++;
    if (password.length > 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthInfo = (strength: number) => {
    if (strength < 3) return { label: 'Weak password', color: 'var(--error)', percent: 33 };
    if (strength < 5) return { label: 'Medium strength', color: 'var(--warning)', percent: 66 };
    return { label: 'Strong password', color: 'var(--success)', percent: 100 };
  };

  // ─── Account Creation (Step 1 → 2) ───
  const handleCreateAccount = async () => {
    setIsLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const tenantId = `tenant_${Date.now()}`;
      setInstanceName(tenantId);
      setCurrentStep(2);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  // ─── Business Save (Step 2 → 3) ───
  const handleSaveBusiness = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep(3);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save business info');
      setIsLoading(false);
    }
  };

  // ─── WhatsApp Connection Helpers ───
  const normalizePhone = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0') && clean.length === 10) return '254' + clean.slice(1);
    if ((clean.startsWith('7') || clean.startsWith('1')) && clean.length === 9) return '254' + clean;
    if (clean.startsWith('254')) return clean;
    if (!clean.startsWith('254')) return '254' + clean;
    return clean.replace(/^\+/, '');
  };

  const handleGenerateQR = async () => {
    if (!instanceName) return;
    setConnectionStatus('loading');
    setConnectionError(null);
    setQrCode(null);
    try {
      // Create or force-recreate the Evolution API instance (QR is in the response)
      let response = await createInstance(instanceName);
      if (response?.alreadyExists) {
        await deleteInstance(instanceName).catch(() => {});
        response = await createInstance(instanceName);
      }
      // Extract the QR code from the create response
      const qrBase64 = response?.qrcode?.base64 || '';
      if (qrBase64) {
        setQrCode(qrBase64);
      } else {
        // Fallback: use QR server API
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=5&data=${encodeURIComponent(instanceName)}`);
      }
      setConnectionStatus('qr');
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to generate QR code');
      setConnectionStatus('error');
    }
  };

  const handleGetPairingCode = async () => {
    if (!instanceName) return;
    if (!phoneNumber.trim()) { setPhoneError('Enter your WhatsApp number'); return; }
    const normalized = normalizePhone(phoneNumber);
    if (normalized.length !== 12) {
      setPhoneError('Invalid phone. Use format: 07XX XXX XXX or +254XXXXXXXXX');
      return;
    }
    setPhoneError('');
    setConnectionStatus('loading');
    setConnectionError(null);
    try {
      // Create instance with pairing enabled
      try {
        await createInstance(instanceName);
      } catch {}
      // Get the pairing code
      const code = await getPairingCode(instanceName, normalized);
      if (code) {
        setPairingCode(code);
        setConnectionStatus('pairing');
        resetPairingCountdown();
      } else {
        setConnectionError('Failed to get pairing code. Try QR code.');
        setConnectionStatus('error');
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to get pairing code');
      setConnectionStatus('error');
    }
  };

  // ─── WhatsApp Connected Handler (matching WAMORGAN's onConnected) ───
  const handleWhatsAppConnected = async () => {
    if (!instanceName) return;
    const deploymentUrl = process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const webhookUrl = `${deploymentUrl.replace(/\/+$/, '')}/api/webhook/evolution`;
    try {
      await setWebhook(instanceName, webhookUrl, true, [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ]);
    } catch (e) {
      console.error('Failed to set webhook:', e);
    }
    let apiKey = '';
    try {
      const key = await fetchInstanceApiKey(instanceName);
      if (key) apiKey = key;
    } catch {}
    let evolutionUUID = '';
    let evolutionUrl = '';
    try {
      const [details, config] = await Promise.all([
        getInstanceDetails(instanceName),
        getEvolutionConfig(),
      ]);
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || '';
      if (!apiKey && details?.instance?.apikey) apiKey = details.instance.apikey;
      evolutionUrl = config.apiUrl;
    } catch {}
    const data: EvolutionData = {
      instanceId: instanceName,
      evolutionUrl,
      evolutionKey: apiKey,
      evolutionUUID,
    };
    setEvolutionData(data);
    setConnectionStatus('connected');
    setCurrentStep(4);
  };

  // ─── Connection Polling — checks Evolution API every 3s ───
  useEffect(() => {
    if (connectionStatus !== 'qr' && connectionStatus !== 'pairing') return;
    if (!instanceName) return;
    const interval = setInterval(async () => {
      try {
        const state = await getConnectionState(instanceName);
        if (state.isConnected) {
          clearInterval(interval);
          await handleWhatsAppConnected();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [connectionStatus, instanceName, handleWhatsAppConnected]);

  // ─── Pairing countdown ───
  useEffect(() => {
    if (connectionStatus !== 'pairing' || pairingCountdown <= 0) return;
    const timer = setTimeout(() => setPairingCountdown(p => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [connectionStatus, pairingCountdown]);

  const handleSkipWhatsApp = () => {
    setCurrentStep(4);
  };

  const handleComplete = () => {
    setCurrentStep(1);
    setConnectionStatus('idle');
    setConnectMode('qr');
    setQrCode(null);
    setPairingCode(null);
    setEvolutionData(null);
    setInstanceName(null);
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', password: '',
      businessName: '', category: '', country: 'KE', currency: 'KES (Kenyan Shilling)',
    });
    setError('');
    router.push('/dashboard');
  };

  const strength = getPasswordStrength(formData.password);
  const strengthInfo = getStrengthInfo(strength);
  const stepLabels = ['Account', 'Business', 'WhatsApp', 'Complete'];

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      <div className="main-scroll" style={{ padding: '0 20px' }}>
        {/* Header */}
        <div className="page-header" style={{ padding: '12px 0 16px' }}>
          <button className="back-btn" onClick={() => router.push('/dashboard')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, #F5C76B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Admin Account
          </h1>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3, 4].map(step => (
            <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: currentStep >= step ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
                border: currentStep >= step ? 'none' : '1.5px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: currentStep >= step ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s ease',
              }}>
                {currentStep > step ? <i className="fas fa-check" style={{ fontSize: 10 }}></i> : step}
              </div>
              {step < 4 && <div style={{ flex: 1, height: 2, background: currentStep > step ? 'var(--accent-primary)' : 'var(--border-subtle)', borderRadius: 1, transition: 'all 0.3s ease' }} />}
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '0 4px' }}>
          {stepLabels.map((label, i) => (
            <span key={i} style={{
              fontSize: 10, fontWeight: 600, color: currentStep >= i + 1 ? 'var(--accent-primary)' : 'var(--text-muted)',
              textAlign: 'center', transition: 'all 0.3s ease',
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--error-soft)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--error)', fontWeight: 500 }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* ═══ Step 1: Account Details ═══ */}
        {currentStep === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: 'white', boxShadow: '0 0 30px rgba(232,168,56,0.3)' }}>
                <i className="fas fa-user-shield"></i>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Create Admin Account</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Step 1 of 4 — Account Information</p>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">First Name *</label>
                <input className="form-input" id="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" style={{ paddingLeft: 16, paddingRight: 16 }} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Last Name *</label>
                <input className="form-input" id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" style={{ paddingLeft: 16, paddingRight: 16 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-input" id="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+254 712 345 678" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Password *</label>
              <input className="form-input" id="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Create a strong password" style={{ paddingLeft: 16, paddingRight: 16 }} />
              {formData.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-card)', overflow: 'hidden' }}>
                    <div style={{ width: `${strengthInfo.percent}%`, height: '100%', background: strengthInfo.color, borderRadius: 2, transition: 'all 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: strengthInfo.color, fontWeight: 600, marginTop: 4, display: 'block' }}>{strengthInfo.label}</span>
                </div>
              )}
            </div>

            <button className="btn btn-primary" disabled={!validateStep(1) || isLoading} onClick={handleCreateAccount}>
              {isLoading ? (
                <><span className="spinner"></span> Creating...</>
              ) : (
                <><i className="fas fa-arrow-right"></i> Create Account</>
              )}
            </button>
          </div>
        )}

        {/* ═══ Step 2: Business Info ═══ */}
        {currentStep === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: 'white', boxShadow: '0 0 30px rgba(232,168,56,0.3)' }}>
                <i className="fas fa-store"></i>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Business Information</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Step 2 of 4 — Tell us about your business</p>
            </div>

            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input className="form-input" id="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="Your store name" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input form-select" id="category" value={formData.category} onChange={handleInputChange} style={{ paddingLeft: 16, paddingRight: 40 }}>
                <option value="">Select category</option>
                {businessCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-input form-select" id="country" value={formData.country} onChange={handleInputChange} style={{ paddingLeft: 16, paddingRight: 40 }}>
                {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Currency</label>
              <input className="form-input" value={formData.currency} readOnly style={{ paddingLeft: 16, paddingRight: 16, color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 0.4 }} onClick={() => setCurrentStep(1)}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!validateStep(2) || isLoading} onClick={handleSaveBusiness}>
                {isLoading ? (
                  <><span className="spinner"></span> Saving...</>
                ) : (
                  <><i className="fas fa-check"></i> Continue</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══ Step 3: WhatsApp Connection (matching WAMORGAN's WhatsAppConnect) ═══ */}
        {currentStep === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, color: 'white', boxShadow: '0 0 30px rgba(37,211,102,0.3)' }}>
                <i className="fab fa-whatsapp"></i>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Connect WhatsApp</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Step 3 of 4 — Link your number to start selling</p>
            </div>

            {/* Almost done banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-check" style={{ fontSize: 12, color: 'white' }}></i>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>Almost done!</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>Connect WhatsApp for orders &amp; chat</p>
              </div>
            </div>

            {/* Mode Selector: QR vs Pairing Code */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 4, borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)' }}>
              <button
                onClick={() => { setConnectMode('qr'); setConnectionStatus('idle'); setConnectionError(null); setPhoneError(''); }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)',
                  background: connectMode === 'qr' ? 'rgba(37,211,102,0.15)' : 'transparent',
                  border: 'none',
                  color: connectMode === 'qr' ? '#25D366' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <i className="fas fa-qrcode"></i> QR Code
              </button>
              <button
                onClick={() => { setConnectMode('pairing'); setConnectionStatus('idle'); setConnectionError(null); setPhoneError(''); }}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)',
                  background: connectMode === 'pairing' ? 'rgba(37,211,102,0.15)' : 'transparent',
                  border: 'none',
                  color: connectMode === 'pairing' ? '#25D366' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <i className="fas fa-mobile-alt"></i> Pairing Code
              </button>
            </div>

            {/* Connection Area */}
            <div style={{ padding: 24, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
              {/* Loading State */}
              {connectionStatus === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, border: '3px solid rgba(37,211,102,0.2)', borderTopColor: '#25D366', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {connectMode === 'qr' ? 'Generating QR Code...' : 'Getting Pairing Code...'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {connectionStatus === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: 24, color: 'var(--warning)' }}></i>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>{connectionError || 'Something went wrong'}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Try again or use a different method</p>
                  <button
                    onClick={connectMode === 'qr' ? handleGenerateQR : handleGetPairingCode}
                    style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', background: '#25D366', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    <i className="fas fa-redo" style={{ marginRight: 6 }}></i> Try Again
                  </button>
                </div>
              )}

              {/* ── IDLE: Show initial connect buttons ── */}
              {connectionStatus === 'idle' && connectMode === 'qr' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 140, height: 140, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '2px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 48, color: 'var(--text-muted)' }}>
                    <i className="fas fa-qrcode"></i>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>Scan QR to Connect</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Open WhatsApp → Linked Devices → Link a Device
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Then scan the QR code shown here
                  </p>
                  <button className="btn btn-primary" onClick={handleGenerateQR} style={{ height: 48, fontSize: 14, maxWidth: 220 }}>
                    <i className="fab fa-whatsapp"></i> Generate QR Code
                  </button>
                </div>
              )}

              {connectionStatus === 'idle' && connectMode === 'pairing' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <i className="fas fa-mobile-alt" style={{ fontSize: 28, color: '#25D366' }}></i>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Link with Phone Number</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Enter your WhatsApp number to get a pairing code
                  </p>

                  <div style={{ width: '100%', marginBottom: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Phone Number</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{
                          padding: '14px 12px', borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)',
                          fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                        }}>
                          <span>🇰🇪</span>
                          <span>+254</span>
                        </div>
                        <input
                          className="form-input"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleGetPairingCode(); }}
                          placeholder="712 345 678"
                          style={{ paddingLeft: 16, paddingRight: 16, flex: 1 }}
                        />
                      </div>
                      {phoneError && (
                        <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="fas fa-exclamation-circle"></i> {phoneError}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleGetPairingCode}
                    disabled={!phoneNumber.trim()}
                    className="btn btn-primary"
                    style={{ height: 48, fontSize: 14, maxWidth: 220, opacity: phoneNumber.trim() ? 1 : 0.5 }}
                  >
                    <i className="fas fa-key"></i> Get Pairing Code
                  </button>
                </div>
              )}

              {/* ── QR CODE DISPLAY ── */}
              {connectMode === 'qr' && connectionStatus === 'qr' && qrCode && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    WhatsApp → Linked Devices → Link a Device → Scan
                  </div>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={qrCode}
                      alt="QR Code"
                      style={{ width: 180, height: 180, borderRadius: 'var(--radius-md)', border: '2px solid rgba(37,211,102,0.3)' }}
                    />
                    <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse-badge 2s infinite' }}>
                      <i className="fas fa-sync" style={{ fontSize: 8, color: 'white' }}></i>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: '#25D366', fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366', display: 'inline-block', animation: 'blink 2s infinite' }}></span>
                    Waiting for scan...
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={handleGenerateQR}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'transparent', border: '1.5px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <i className="fas fa-redo" style={{ marginRight: 4 }}></i> Refresh
                    </button>
                    <button
                      onClick={handleWhatsAppConnected}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: '#25D366', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <i className="fas fa-check" style={{ marginRight: 4 }}></i> I've Scanned
                    </button>
                  </div>
                </div>
              )}

              {/* ── PAIRING CODE DISPLAY ── */}
              {connectMode === 'pairing' && connectionStatus === 'pairing' && pairingCode && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <i className="fas fa-key" style={{ fontSize: 24, color: 'white' }}></i>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Pairing Code</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Enter in WhatsApp to link your device
                  </p>

                  {/* Code Display */}
                  <div style={{
                    width: '100%', maxWidth: 200, padding: 20,
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(37,211,102,0.1), rgba(16,185,129,0.05))',
                    border: '2px solid rgba(37,211,102,0.3)',
                    marginBottom: 12,
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                      Your Code
                    </p>
                    <span
                      style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.15em', color: '#25D366', fontFamily: 'monospace', cursor: 'pointer', userSelect: 'all' }}
                    >
                      {pairingCode}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(pairingCode); }}
                      style={{
                        display: 'block', width: '100%', marginTop: 12,
                        padding: '10px', borderRadius: 'var(--radius-md)',
                        background: 'rgba(37,211,102,0.15)', border: 'none',
                        color: '#25D366', fontSize: 12, fontWeight: 700,
                        fontFamily: 'inherit', cursor: 'pointer',
                      }}
                    >
                      <i className="fas fa-copy" style={{ marginRight: 6 }}></i> Copy Code
                    </button>
                  </div>

                  {/* Steps */}
                  <div style={{
                    width: '100%', padding: 12, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)', marginBottom: 12, textAlign: 'left',
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>How to</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>1</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Open WhatsApp</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>2</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Linked Devices → Link with phone</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>3</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Enter code and tap Link</span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                    <i className="fas fa-hourglass-half" style={{ fontSize: 11 }}></i>
                    {pairingCountdown > 0 ? (
                      <span>Expires in <span style={{ fontWeight: 700, color: pairingCountdown <= 10 ? 'var(--error)' : '#25D366' }}>{pairingCountdown}s</span></span>
                    ) : (
                      <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Code expired</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pairingCountdown <= 0 && (
                      <button onClick={handleGetPairingCode} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: '#25D366', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                        <i className="fas fa-redo" style={{ marginRight: 6 }}></i> New Code
                      </button>
                    )}
                    <button onClick={handleWhatsAppConnected} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                      <i className="fas fa-check" style={{ marginRight: 6 }}></i> Connected
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Instance Name */}
            {instanceName && (
              <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="fas fa-server" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Instance: </span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{instanceName}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 0.4 }} onClick={() => setCurrentStep(2)}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              {connectionStatus === 'connected' ? (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setCurrentStep(4)}>
                  <i className="fas fa-check"></i> Complete Setup
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleSkipWhatsApp}>
                  Skip for now
                </button>
              )}
            </div>

            {/* Skip link (matches WAMORGAN style) */}
            {connectionStatus !== 'connected' && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={handleSkipWhatsApp}
                  style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                  Skip this step
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Step 4: Success ═══ */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 0 40px rgba(16,185,129,0.4)', animation: 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <i className="fas fa-check" style={{ fontSize: 32, color: 'white' }}></i>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Account Created!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 280 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{formData.businessName}</strong> has been successfully registered.
              {evolutionData ? ' WhatsApp is connected and ready.' : ''}
            </p>

            {/* Credentials Summary */}
            <div style={{ width: '100%', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', marginBottom: 16, textAlign: 'left' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fas fa-user" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Account Details
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Name:</span>
                <span style={{ fontWeight: 600 }}>{formData.firstName} {formData.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ fontWeight: 600 }}>{formData.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Password:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{formData.password}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Business:</span>
                <span style={{ fontWeight: 600 }}>{formData.businessName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>WhatsApp:</span>
                <span style={{ fontWeight: 600, color: evolutionData ? 'var(--success)' : 'var(--text-muted)' }}>
                  {evolutionData ? 'Connected' : 'Skipped'}
                </span>
              </div>
            </div>

            {/* Evolution API Details (shown when WhatsApp was connected) */}
            {evolutionData && (
              <div style={{ width: '100%', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', marginBottom: 24, textAlign: 'left' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-server" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Evolution API
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Instance:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{evolutionData.instanceId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Server:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{evolutionData.evolutionUrl}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>API Key:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11, color: 'var(--warning)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{evolutionData.evolutionKey}</span>
                </div>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleComplete} style={{ maxWidth: 200 }}>
              <i className="fas fa-check"></i> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
