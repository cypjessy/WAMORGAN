'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './settings.css';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { businessProfileService, productSettingsService, whatsappSettingsService, ShippingMethod, PickupStation } from '@/lib/db';
import { createInstance, createInstanceWithPairing, getConnectionState, getQRCode, getPairingCode, disconnectInstance, logoutInstance, setWebhook } from '@/lib/evolution';
import BottomNav from '../components/BottomNav';
import MoreSheet from '../components/MoreSheet';
import SettingsPageHeader from './components/SettingsPageHeader';
import LogoutDialog from './components/LogoutDialog';
import DeleteAccountDialog from './components/DeleteAccountDialog';
import Snackbar from './components/Snackbar';

const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Machakos', 'Malindi', 'Naivasha'];
type SettingsTab = 'profile' | 'products' | 'shipping' | 'pickup' | 'whatsapp' | 'payments' | 'security' | 'ai' | 'team';

const shippingPresets = [
  { name: 'Standard Delivery', price: '299', days: '5-7', desc: 'Delivered within a week' },
  { name: 'Express Delivery', price: '599', days: '1-3', desc: 'Fast tracked shipping' },
  { name: 'Same Day', price: '999', days: 'Same day', desc: 'Order before 12PM' },
  { name: 'Free Shipping', price: '0', days: '7-14', desc: 'Free delivery, takes longer' },
];

const welcomeTemplates = [
  { name: 'Friendly Greeting', icon: 'fa-hand-wave', color: '#3b82f6', message: "👋 Hi there! Welcome to {{business_name}}!\n\nWe're excited to have you here. How can we help you today?\n\n📞 Contact us: {{phone}}\n🌐 Visit: {{website}}" },
  { name: 'Professional Intro', icon: 'fa-check-circle', color: '#10b981', message: "Hello! 👋\n\nThank you for contacting {{business_name}}.\n\nWe offer:\n✅ Quality products\n✅ Fast delivery\n✅ Excellent customer support\n\nHow can we assist you today?" },
  { name: 'Business Info', icon: 'fa-clock', color: '#8b5cf6', message: "🎉 Welcome to {{business_name}}!\n\nWe're here to serve you.\n\n⏰ Hours: Mon-Sat, 9AM-6PM\n📍 Location: {{address}}\n📱 WhatsApp: {{phone}}\n\nWhat would you like to know about?" },
  { name: 'Interactive Menu', icon: 'fa-keyboard', color: '#06b6d4', message: "👋 Hello!\n\nYou've reached {{business_name}}.\n\nFor quick assistance:\n1️⃣ Browse our catalog\n2️⃣ Check order status\n3️⃣ Place an order\n4️⃣ Speak with support\n\nReply with a number or ask away!" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Snackbar & Dialogs
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  // ─── Profile Tab State ───
  const [profile, setProfile] = useState({
    businessName: '',
    tagline: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    category: 'Retail',
  });

  // Load business profile from Firestore
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const bp = await businessProfileService.getProfile();
        if (bp) {
          setProfile({
            businessName: bp.businessName || '',
            tagline: bp.tagline || '',
            description: bp.description || '',
            email: bp.email || user.email || '',
            phone: bp.phone || '',
            whatsapp: bp.whatsappNumber || '',
            website: bp.website || '',
            address: bp.address || '',
            city: bp.city || '',
            postalCode: bp.postalCode || '',
            country: bp.country || '',
            category: bp.category || 'Retail',
          });
          // Load shipping methods
          if (bp.shippingMethods && bp.shippingMethods.length > 0) {
            setShippingMethods(bp.shippingMethods);
          }
          // Load pickup stations
          if (bp.pickupStations && bp.pickupStations.length > 0) {
            setStations(bp.pickupStations);
          }
          // Load payment methods
          const pm = bp.paymentMethods;
          if (pm) {
            setMpesaEnabled(pm.mpesa?.enabled || false);
            setMpesaBuyGoodsTill(pm.mpesa?.buyGoods?.tillNumber || '');
            setMpesaPaybillNumber(pm.mpesa?.paybill?.paybillNumber || '');
            setMpesaPaybillAccount(pm.mpesa?.paybill?.accountNumber || '');
            setMpesaPersonalName(pm.mpesa?.personal?.name || '');
            setMpesaPersonalPhone(pm.mpesa?.personal?.phone || '');
            setBankEnabled(pm.bank?.enabled || false);
            setBankName(pm.bank?.bankName || '');
            setBankAccountName(pm.bank?.accountName || '');
            setBankAccountNumber(pm.bank?.accountNumber || '');
            setCardEnabled(pm.card?.enabled || false);
            setCashEnabled(pm.cash?.enabled || false);
          }
          if (bp.biometricEnabled !== undefined) {
            setBiometricEnabled(bp.biometricEnabled);
          }
          if (bp.whatsappInstanceName) {
            setInstanceName(bp.whatsappInstanceName);
          }
        } else {
          // Pre-fill email from auth
          setProfile(prev => ({ ...prev, email: user.email || '' }));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
  }, [user]);

  // ─── Product Settings ───
  const [productEnabled, setProductEnabled] = useState(true);
  const [storeDescription, setStoreDescription] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('Returns accepted within 14 days of delivery. Items must be unused and in original packaging.');
  const [warrantyInfo, setWarrantyInfo] = useState('All products come with a 1-year manufacturer warranty against defects.');

  // Load product settings from Firestore
  useEffect(() => {
    productSettingsService.getSettings().then(s => {
      if (s) {
        setStoreDescription(s.storeDescription || '');
        setReturnPolicy(s.returnPolicy || 'Returns accepted within 14 days of delivery. Items must be unused and in original packaging.');
        setWarrantyInfo(s.warrantyInfo || 'All products come with a 1-year manufacturer warranty against defects.');
      }
    }).catch(err => console.error('Failed to load product settings:', err));
  }, []);

  // ─── Shipping Tab State ───
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [newShipping, setNewShipping] = useState({ name: '', price: '', estimatedDays: '', description: '' });
  const [editingShippingId, setEditingShippingId] = useState<string | null>(null);
  const [showShippingForm, setShowShippingForm] = useState(false);

  // ─── Pickup Tab State ───
  const [stations, setStations] = useState<PickupStation[]>([]);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [editingStation, setEditingStation] = useState<PickupStation | null>(null);
  const [newStation, setNewStation] = useState({ county: '', town: '', stationName: '', address: '', contactPhone: '', isActive: true });

  // ─── WhatsApp Tab State ───
  const [whatsappTab, setWhatsappTab] = useState<'connection' | 'automation'>('connection');
  const [instanceName, setInstanceName] = useState('wamorgan-instance-01');
  const [isConnected, setIsConnected] = useState(false);
  const [connectMode, setConnectMode] = useState<'qr' | 'pairing'>('qr');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'loading' | 'qr' | 'pairing' | 'connected' | 'error'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCountdown, setPairingCountdown] = useState(60);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [webhookEvents, setWebhookEvents] = useState({ newMessages: true, messageStatus: true, qrUpdated: false, connectionState: true });
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("Thank you for your message! We'll get back to you shortly.");
  const [awayEnabled, setAwayEnabled] = useState(false);
  const [awayMessage, setAwayMessage] = useState("Hi! Thanks for reaching out. We're currently away but will respond as soon as we're back.");

  // Load AI settings from Firestore
  useEffect(() => {
    businessProfileService.getProfile().then(bp => {
      const ai = bp?.aiSettings;
      if (ai) {
        setAiTone(ai.tone || 'Friendly & Professional');
        setAiLanguage(ai.language || 'English');
        setAiGreeting(ai.greetingMessage || '');
        setAiAutoReply(ai.autoReplyEnabled ?? true);
        setAiOrderStatus(ai.orderStatusEnabled ?? true);
        setAiRecommendations(ai.productRecommendations ?? false);
        setAiBusinessHours(ai.businessHoursOnly ?? true);
      }
      setTeamMembers(bp?.teamMembers || []);
      setTeamLoading(false);
    }).catch(() => setTeamLoading(false));
  }, []);

  // Load WhatsApp automation settings from Firestore
  useEffect(() => {
    whatsappSettingsService.getSettings().then(s => {
      if (s) {
        setWelcomeEnabled(s.welcomeMessageEnabled ?? true);
        setWelcomeMessage(s.welcomeMessage || '');
        setAutoReplyEnabled(s.autoReplyEnabled ?? false);
        setAutoReplyMessage(s.autoReplyMessage || "Thank you for your message! We'll get back to you shortly.");
        setAwayEnabled(s.awayMessageEnabled ?? false);
        setAwayMessage(s.awayMessage || "Hi! Thanks for reaching out. We're currently away but will respond as soon as we're back.");
      }
    }).catch(err => console.error('Failed to load WhatsApp settings:', err));
  }, []);

  // ─── Payments Tab State ───
  const [mpesaEnabled, setMpesaEnabled] = useState(false);
  const [mpesaActiveTab, setMpesaActiveTab] = useState<'buyGoods' | 'paybill' | 'personal'>('buyGoods');
  const [mpesaBuyGoodsTill, setMpesaBuyGoodsTill] = useState('');
  const [mpesaPaybillNumber, setMpesaPaybillNumber] = useState('');
  const [mpesaPaybillAccount, setMpesaPaybillAccount] = useState('');
  const [mpesaPersonalName, setMpesaPersonalName] = useState('');
  const [mpesaPersonalPhone, setMpesaPersonalPhone] = useState('');
  const [bankEnabled, setBankEnabled] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankSwiftCode, setBankSwiftCode] = useState('');
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cashEnabled, setCashEnabled] = useState(false);

  // ─── Security ───
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // AI Tab State
  const [aiTone, setAiTone] = useState('Friendly & Professional');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [aiGreeting, setAiGreeting] = useState('');
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [aiOrderStatus, setAiOrderStatus] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState(false);
  const [aiBusinessHours, setAiBusinessHours] = useState(true);
  const [aiTonePicker, setAiTonePicker] = useState(false);
  const [aiLangPicker, setAiLangPicker] = useState(false);

  // Team Tab State
  const [teamMembers, setTeamMembers] = useState<import('@/lib/db').TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');

  // Delete Account Dialog
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // Bottom Nav
  const [navIndex, setNavIndex] = useState(4); // Settings doesn't have a dedicated nav tab
  const [fabOpen, setFabOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // ─── Tabs (matching WhatsApp WAMORGAN exactly) ───
  const tabs: { id: SettingsTab; label: string; icon: string; brand?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: 'fa-store' },
    { id: 'products', label: 'Products', icon: 'fa-box' },
    { id: 'shipping', label: 'Shipping', icon: 'fa-truck' },
    { id: 'pickup', label: 'Pickup', icon: 'fa-map-pin' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'fa-whatsapp', brand: true },
    { id: 'payments', label: 'Payments', icon: 'fa-wallet' },
    { id: 'security', label: 'Security', icon: 'fa-shield' },
    { id: 'ai', label: 'AI', icon: 'fa-brain' },
    { id: 'team', label: 'Team', icon: 'fa-users' },
  ];

  const saveProfile = async () => {
    try {
      await businessProfileService.saveProfile({
        businessName: profile.businessName,
        tagline: profile.tagline,
        description: profile.description,
        email: profile.email,
        phone: profile.phone,
        whatsappNumber: profile.whatsapp,
        website: profile.website,
        address: profile.address,
        city: profile.city,
        postalCode: profile.postalCode,
        country: profile.country,
        category: profile.category,
      });
      showToast('Business profile saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    }
  };
  const saveProductSettings = async () => {
    try {
      await productSettingsService.saveSettings({
        storeDescription,
        returnPolicy,
        warrantyInfo,
      });
      showToast('Product settings saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save product settings', 'error');
    }
  };
  const saveWhatsAppAutomation = async () => {
    try {
      await whatsappSettingsService.saveSettings({
        welcomeMessageEnabled: welcomeEnabled,
        welcomeMessage,
        autoReplyEnabled,
        autoReplyMessage,
        awayMessageEnabled: awayEnabled,
        awayMessage,
      });
      await businessProfileService.saveProfile({ whatsappInstanceName: instanceName });
      showToast('WhatsApp automation saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save WhatsApp settings', 'error');
    }
  };
  const savePayments = async () => {
    try {
      await businessProfileService.savePaymentMethods({
        mpesa: {
          enabled: mpesaEnabled,
          buyGoods: { enabled: mpesaEnabled && mpesaBuyGoodsTill.trim().length > 0, tillNumber: mpesaBuyGoodsTill },
          paybill: { enabled: mpesaEnabled && mpesaPaybillNumber.trim().length > 0, paybillNumber: mpesaPaybillNumber, accountNumber: mpesaPaybillAccount },
          personal: { enabled: mpesaEnabled && mpesaPersonalName.trim().length > 0 && mpesaPersonalPhone.trim().length > 0, name: mpesaPersonalName, phone: mpesaPersonalPhone },
        },
        bank: { enabled: bankEnabled, bankName, accountName: bankAccountName, accountNumber: bankAccountNumber },
        card: { enabled: cardEnabled },
        cash: { enabled: cashEnabled },
      });
      showToast('Payment methods saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save payments', 'error');
    }
  };
  const saveSecurity = async () => {
    try {
      await businessProfileService.saveProfile({ biometricEnabled });
      showToast('Security settings saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save security settings', 'error');
    }
  };

  const insertVariable = (variable: string) => {
    setWelcomeMessage(prev => prev + variable);
  };

  // ─── Webhook URL Helper ───
  function getWebhookUrl(): string {
    const deploymentUrl = process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${deploymentUrl.replace(/\/+$/, '')}/api/webhook/evolution`;
  }

  function getSelectedEvents(): string[] {
    const eventMap: Record<string, string> = {
      newMessages: 'MESSAGES_UPSERT',
      messageStatus: 'MESSAGES_UPDATE',
      qrUpdated: 'QRCODE_UPDATED',
      connectionState: 'CONNECTION_UPDATE',
    };
    return Object.entries(webhookEvents)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => eventMap[key])
      .filter(Boolean);
  }

  async function updateWebhookConfig() {
    try {
      const webhookUrl = getWebhookUrl();
      const enabledEvents = getSelectedEvents();
      await setWebhook(instanceName, webhookUrl, true, enabledEvents);
    } catch (err) {
      console.error('Failed to update webhook config:', err);
      throw err;
    }
  }

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
    setConnectionStatus('loading');
    setConnectionError(null);
    setQrCode(null);
    try {
      await createInstance(instanceName);
      const qr = await getQRCode(instanceName);
      if (qr) {
        setQrCode(qr);
        setConnectionStatus('qr');
      } else {
        setConnectionError('No QR code returned from server');
        setConnectionStatus('error');
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to generate QR code');
      setConnectionStatus('error');
    }
  };

  const handleGetPairingCode = async () => {
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
      await createInstanceWithPairing(instanceName, normalized);
      const code = await getPairingCode(instanceName, normalized);
      if (code) {
        setPairingCode(code);
        setConnectionStatus('pairing');
        setPairingCountdown(60);
      } else {
        setConnectionError('No pairing code returned from server');
        setConnectionStatus('error');
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Failed to get pairing code');
      setConnectionStatus('error');
    }
  };

  const handleConnected = async () => {
    setIsConnected(true);
    setConnectionStatus('connected');

    // Auto-configure the webhook on the Evolution instance
    try {
      await updateWebhookConfig();
      showToast('WhatsApp connected! Webhook configured.', 'success');
    } catch (err) {
      console.error('Failed to set webhook after connection:', err);
      showToast('WhatsApp connected, but webhook setup failed', 'error');
    }
  };

  // Connection polling — checks real connection state
  useEffect(() => {
    if (connectionStatus !== 'qr' && connectionStatus !== 'pairing') return;
    const interval = setInterval(async () => {
      try {
        const state = await getConnectionState(instanceName);
        if (state.isConnected) {
          clearInterval(interval);
          await handleConnected();
        }
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [connectionStatus, instanceName, handleConnected]);

  // Pairing countdown
  useEffect(() => {
    if (connectionStatus !== 'pairing' || pairingCountdown <= 0) return;
    const timer = setTimeout(() => setPairingCountdown(p => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [connectionStatus, pairingCountdown]);

  const handleDisconnect = async () => {
    try {
      await disconnectInstance(instanceName);
    } catch {
      // If disconnect fails, try logout
      try { await logoutInstance(instanceName); } catch {}
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setQrCode(null);
    setPairingCode(null);
    showToast('WhatsApp disconnected', 'success');
  };

  const handleSaveWebhookEvents = async () => {
    try {
      await updateWebhookConfig();
      showToast('Webhook configuration updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update webhook', 'error');
    }
  };

  const applyTemplate = (template: typeof welcomeTemplates[0]) => {
    setWelcomeMessage(template.message
      .replace(/{{business_name}}/g, profile.businessName)
      .replace(/{{phone}}/g, profile.phone)
      .replace(/{{website}}/g, profile.website)
      .replace(/{{address}}/g, profile.address)
    );
    showToast('Template applied!', 'success');
  };

  const selectShippingPreset = (preset: typeof shippingPresets[0]) => {
    setNewShipping({ name: preset.name, price: preset.price, estimatedDays: preset.days, description: preset.desc });
    setShowShippingForm(true);
  };

  const persistShippingMethods = useCallback(async (methods: ShippingMethod[]) => {
    try {
      await businessProfileService.saveShippingMethods(methods);
    } catch (err) {
      console.error('Failed to save shipping methods:', err);
    }
  }, []);

  const handleSaveShipping = () => {
    if (!newShipping.name) { showToast('Please enter a shipping method name', 'error'); return; }
    let updated: ShippingMethod[];
    if (editingShippingId) {
      updated = shippingMethods.map(s => s.id === editingShippingId ? { ...s, ...newShipping } : s);
      showToast('Shipping method updated!', 'success');
    } else {
      updated = [...shippingMethods, { id: Date.now().toString(), ...newShipping }];
      showToast('Shipping method added!', 'success');
    }
    setShippingMethods(updated);
    persistShippingMethods(updated);
    setNewShipping({ name: '', price: '', estimatedDays: '', description: '' });
    setEditingShippingId(null);
    setShowShippingForm(false);
  };

  const handleEditShipping = (method: ShippingMethod) => {
    setNewShipping({ name: method.name, price: method.price, estimatedDays: method.estimatedDays, description: method.description });
    setEditingShippingId(method.id);
    setShowShippingForm(true);
  };

  const handleDeleteShipping = (id: string) => {
    const updated = shippingMethods.filter(s => s.id !== id);
    setShippingMethods(updated);
    persistShippingMethods(updated);
    showToast('Shipping method removed', 'success');
    if (editingShippingId === id) { setEditingShippingId(null); setShowShippingForm(false); }
  };

  const resetPickupForm = () => {
    setNewStation({ county: '', town: '', stationName: '', address: '', contactPhone: '', isActive: true });
    setEditingStation(null);
    setShowPickupForm(false);
  };

  const persistStations = useCallback(async (stations: PickupStation[]) => {
    try {
      await businessProfileService.savePickupStations(stations);
    } catch (err) {
      console.error('Failed to save pickup stations:', err);
    }
  }, []);

  const handleSaveStation = () => {
    if (!newStation.county || !newStation.town || !newStation.stationName) {
      showToast('Please fill in county, town, and station name', 'error');
      return;
    }
    let updated: PickupStation[];
    if (editingStation) {
      updated = stations.map(s => s.id === editingStation.id ? { ...s, ...newStation } : s);
      showToast('Pickup station updated!', 'success');
    } else {
      updated = [...stations, { id: Date.now().toString(), ...newStation }];
      showToast('Pickup station added!', 'success');
    }
    setStations(updated);
    persistStations(updated);
    resetPickupForm();
  };

  const handleEditStation = (station: PickupStation) => {
    setNewStation({ county: station.county, town: station.town, stationName: station.stationName, address: station.address, contactPhone: station.contactPhone, isActive: station.isActive });
    setEditingStation(station);
    setShowPickupForm(true);
  };

  const handleDeleteStation = (id: string) => {
    const updated = stations.filter(s => s.id !== id);
    setStations(updated);
    persistStations(updated);
    showToast('Pickup station removed', 'success');
    if (editingStation?.id === id) resetPickupForm();
  };

  // ─── Style helpers ───
  const toggleStyle = (enabled: boolean) => ({
    width: 44, height: 24, borderRadius: 12,
    background: enabled ? 'var(--accent-primary)' : 'var(--bg-elevated)',
    border: `1.5px solid ${enabled ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
    position: 'relative' as const, cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 as number | 0,
  });
  const toggleKnob = (enabled: boolean) => ({
    position: 'absolute' as const, top: 2, left: enabled ? 22 : 2,
    width: 18, height: 18, borderRadius: '50%', background: 'white',
    transition: 'all 0.2s ease', boxShadow: enabled ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
  });
  const tabBtn = (tab: SettingsTab) => ({
    padding: '8px 16px',
    borderRadius: 'var(--radius-full)',
    background: activeTab === tab ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
    border: activeTab === tab ? 'none' : '1.5px solid var(--border-subtle)',
    color: activeTab === tab ? 'white' : 'var(--text-secondary)',
    fontSize: 13, fontWeight: 700, fontFamily: 'inherit' as const,
    cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' as const,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    boxShadow: activeTab === tab ? '0 4px 16px rgba(232,168,56,0.3)' : 'none',
  });

  const renderTextarea = (value: string, setter: (v: string) => void, placeholder: string, h = 80) => (
    <textarea
      className="form-input"
      value={value}
      onChange={(e) => setter(e.target.value)}
      placeholder={placeholder}
      style={{ height: 'auto', padding: '14px 16px', minHeight: h, resize: 'none', fontSize: 13, lineHeight: 1.6 }}
    />
  );

  const renderFormGroup = (label: string, placeholder: string, value?: string, setter?: (v: string) => void, type = 'text') => (
    <div className="form-group" style={{ marginBottom: 10 }}>
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={value || ''} onChange={(e) => setter?.(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 16, paddingRight: 16 }} />
    </div>
  );

  // ─── Profile Tab ───
  const renderProfileTab = () => (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white', fontWeight: 700, boxShadow: '0 0 30px rgba(232,168,56,0.3)', position: 'relative' }}>
          {profile.businessName.charAt(0)}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid var(--bg-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer' }}>
            <i className="fas fa-camera"></i>
          </div>
        </div>
      </div>

      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <i className="fas fa-info-circle" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Basic Information
      </h4>
      {renderFormGroup('Business Name *', 'Your business name', profile.businessName, (v) => setProfile(p => ({ ...p, businessName: v })))}
      {renderFormGroup('Tagline', 'Short business tagline', profile.tagline, (v) => setProfile(p => ({ ...p, tagline: v })))}
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">Description</label>
        {renderTextarea(profile.description, (v) => setProfile(p => ({ ...p, description: v })), 'Tell customers about your business...', 70)}
      </div>

      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 24 }}>
        <i className="fas fa-address-card" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Contact Information
      </h4>
      {renderFormGroup('Email', 'your@email.com', profile.email, (v) => setProfile(p => ({ ...p, email: v })))}
      {renderFormGroup('Phone', '+1 555 000 0000', profile.phone, (v) => setProfile(p => ({ ...p, phone: v })))}
      {renderFormGroup('WhatsApp', '+1 555 000 0000', profile.whatsapp, (v) => setProfile(p => ({ ...p, whatsapp: v })))}
      {renderFormGroup('Website', 'yourstore.com', profile.website, (v) => setProfile(p => ({ ...p, website: v })))}

      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 24 }}>
        <i className="fas fa-location-dot" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Address
      </h4>
      {renderFormGroup('Street Address', '123 Main St', profile.address, (v) => setProfile(p => ({ ...p, address: v })))}
      <div className="form-row">
        <div className="form-group" style={{ marginBottom: 10, flex: 1 }}>
          <label className="form-label">City</label>
          <input className="form-input" value={profile.city} onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="City" style={{ paddingLeft: 16, paddingRight: 16 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 10, flex: 1 }}>
          <label className="form-label">Postal Code</label>
          <input className="form-input" value={profile.postalCode} onChange={(e) => setProfile(p => ({ ...p, postalCode: e.target.value }))} placeholder="10001" style={{ paddingLeft: 16, paddingRight: 16 }} />
        </div>
      </div>
      {renderFormGroup('Country', 'United States', profile.country, (v) => setProfile(p => ({ ...p, country: v })))}

      <div className="form-group" style={{ marginBottom: 24 }}>
        <label className="form-label">Business Category</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Retail', 'Wholesale', 'E-commerce', 'Services', 'Manufacturing', 'Food & Beverage'].map(cat => (
            <button
              key={cat}
              onClick={() => setProfile(p => ({ ...p, category: cat }))}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                background: profile.category === cat ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                border: `1.5px solid ${profile.category === cat ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                color: profile.category === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={saveProfile}>
        <i className="fas fa-check"></i> Save Business Profile
      </button>

      {/* Logout */}
      <div style={{ marginTop: 32, marginBottom: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setLogoutDialogOpen(true)}
          style={{
            width: '100%', height: 48, borderRadius: 'var(--radius-md)',
            background: 'transparent', border: '1.5px solid rgba(239,68,68,0.3)',
            color: 'var(--error)', fontSize: 14, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <i className="fas fa-right-from-bracket"></i>
          Log Out
        </button>
        <button
          onClick={() => setDeleteAccountOpen(true)}
          style={{
            width: '100%', height: 48, borderRadius: 'var(--radius-md)',
            background: 'transparent', border: '1.5px solid rgba(239,68,68,0.5)',
            color: 'var(--error)', fontSize: 14, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10,
          }}
        >
          <i className="fas fa-trash"></i>
          Delete Account
        </button>
      </div>
    </>
  );

  // ─── Products Tab ───
  const renderProductsTab = () => (
    <>
      <div style={{ marginBottom: 20, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: productEnabled ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--accent-primary)' }}>
              <i className="fas fa-box"></i>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700 }}>Product Store</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Sell physical or digital products</p>
            </div>
          </div>
          <div style={toggleStyle(productEnabled)} onClick={() => setProductEnabled(!productEnabled)}>
            <div style={toggleKnob(productEnabled)} />
          </div>
        </div>
        {productEnabled && (
          <>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Store Description</label>
              {renderTextarea(storeDescription, setStoreDescription, 'Describe your product store...', 70)}
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Return Policy</label>
              {renderTextarea(returnPolicy, setReturnPolicy, 'Your return policy...', 70)}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Warranty Information</label>
              {renderTextarea(warrantyInfo, setWarrantyInfo, 'Your warranty terms...', 70)}
            </div>
          </>
        )}
      </div>
      <button className="btn btn-primary" onClick={saveProductSettings}>
        <i className="fas fa-check"></i> Save Product Settings
      </button>
    </>
  );

  // ─── Shipping Tab ───
  const renderShippingTab = () => (
    <>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <i className="fas fa-bolt" style={{ marginRight: 6, color: 'var(--warning)' }}></i> Quick Presets
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {shippingPresets.map((p, i) => (
            <button key={i} onClick={() => selectShippingPreset(p)}
              style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {p.price !== '0' ? `KSh ${p.price}` : 'Free'} · {p.days}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => { if (!showShippingForm) { setShowShippingForm(true); setEditingShippingId(null); setNewShipping({ name: '', price: '', estimatedDays: '', description: '' }); }}}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <i className="fas fa-truck" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Shipping Methods
            <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient-soft)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700 }}>{shippingMethods.length}</span>
          </h4>
          <button
            onClick={(e) => { e.stopPropagation(); setShowShippingForm(!showShippingForm); if (!showShippingForm) { setEditingShippingId(null); setNewShipping({ name: '', price: '', estimatedDays: '', description: '' }); }}}
            style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <i className="fas fa-plus" style={{ marginRight: 4 }}></i> Add Method
          </button>
        </div>
      </div>

      {showShippingForm && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent-primary)' }}>
            <i className="fas fa-truck-fast"></i> {editingShippingId ? 'Edit' : 'New'} Shipping Method
          </h4>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Method Name *</label>
            <input className="form-input" value={newShipping.name} onChange={(e) => setNewShipping(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Express Delivery" style={{ paddingLeft: 16, paddingRight: 16 }} />
          </div>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Price (KSh)</label>
              <input className="form-input" type="number" value={newShipping.price} onChange={(e) => setNewShipping(p => ({ ...p, price: e.target.value }))} placeholder="0" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Est. Days</label>
              <input className="form-input" value={newShipping.estimatedDays} onChange={(e) => setNewShipping(p => ({ ...p, estimatedDays: e.target.value }))} placeholder="3-5" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Description</label>
            <input className="form-input" value={newShipping.description} onChange={(e) => setNewShipping(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" style={{ paddingLeft: 16, paddingRight: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1, height: 44, fontSize: 14 }} onClick={handleSaveShipping}>
              <i className={`fas ${editingShippingId ? 'fa-save' : 'fa-plus'}`}></i> {editingShippingId ? 'Update' : 'Add'}
            </button>
            <button className="btn btn-secondary" style={{ flex: 0.4, height: 44, fontSize: 14 }} onClick={() => { setShowShippingForm(false); setEditingShippingId(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        {shippingMethods.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fas fa-truck" style={{ fontSize: 24, marginBottom: 8, display: 'block' }}></i>
            <span style={{ fontSize: 13, fontWeight: 500 }}>No shipping methods added yet</span>
          </div>
        ) : (
          shippingMethods.map((method) => (
            <div key={method.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--info)', flexShrink: 0 }}><i className="fas fa-truck-fast"></i></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{method.name}</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>KSh {method.price} · {method.estimatedDays} days</p>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => handleEditShipping(method)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-edit"></i></button>
                <button onClick={() => handleDeleteShipping(method.id)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: 'none', color: 'var(--error)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // ─── Pickup Tab ───
  const renderPickupTab = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <i className="fas fa-map-marker-alt" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Pickup Stations
          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient-soft)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 700 }}>{stations.length}</span>
        </h4>
        <button onClick={() => { setShowPickupForm(true); setNewStation({ county: '', town: '', stationName: '', address: '', contactPhone: '', isActive: true }); setEditingStation(null); }}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <i className="fas fa-plus" style={{ marginRight: 4 }}></i> Add Station
        </button>
      </div>

      {showPickupForm && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent-primary)' }}><i className="fas fa-map-pin"></i> {editingStation ? 'Edit Station' : 'New Pickup Station'}</h4>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">County/Region *</label>
            <select className="form-input form-select" value={newStation.county} onChange={(e) => setNewStation(p => ({ ...p, county: e.target.value }))} style={{ paddingLeft: 16, paddingRight: 40 }}>
              <option value="">Select county</option>
              {counties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Town *</label>
              <input className="form-input" value={newStation.town} onChange={(e) => setNewStation(p => ({ ...p, town: e.target.value }))} placeholder="e.g. CBD, Westlands" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Station Name *</label>
              <input className="form-input" value={newStation.stationName} onChange={(e) => setNewStation(p => ({ ...p, stationName: e.target.value }))} placeholder="e.g. CBD Branch" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Address</label>
            <input className="form-input" value={newStation.address} onChange={(e) => setNewStation(p => ({ ...p, address: e.target.value }))} placeholder="Street address" style={{ paddingLeft: 16, paddingRight: 16 }} />
          </div>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Contact Phone</label>
              <input className="form-input" value={newStation.contactPhone} onChange={(e) => setNewStation(p => ({ ...p, contactPhone: e.target.value }))} placeholder="+254 712 345 678" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>Active</label>
              <div style={toggleStyle(newStation.isActive)} onClick={() => setNewStation(p => ({ ...p, isActive: !p.isActive }))}><div style={toggleKnob(newStation.isActive)} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1, height: 44, fontSize: 14 }} onClick={handleSaveStation}>
              <i className={`fas ${editingStation ? 'fa-save' : 'fa-plus'}`}></i> {editingStation ? 'Update' : 'Add'} Station
            </button>
            <button className="btn btn-secondary" style={{ flex: 0.4, height: 44, fontSize: 14 }} onClick={resetPickupForm}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        {stations.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fas fa-map-marker-alt" style={{ fontSize: 24, marginBottom: 8, display: 'block' }}></i>
            <span style={{ fontSize: 13, fontWeight: 500 }}>No pickup stations added yet</span>
          </div>
        ) : (
          stations.map((station) => (
            <div key={station.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', marginBottom: 8, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: `1px solid ${station.isActive ? 'var(--border-subtle)' : 'rgba(239,68,68,0.2)'}`, opacity: station.isActive ? 1 : 0.6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: station.isActive ? 'var(--success-soft)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: station.isActive ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}><i className="fas fa-location-dot"></i></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{station.stationName}</span>
                  {!station.isActive && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--error-soft)', color: 'var(--error)' }}>Inactive</span>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>{station.county}, {station.town}</p>
                {station.address && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{station.address}</p>}
                {station.contactPhone && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}><i className="fas fa-phone" style={{ fontSize: 9, marginRight: 4 }}></i>{station.contactPhone}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => handleEditStation(station)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-edit"></i></button>
                <button onClick={() => handleDeleteStation(station.id)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: 'none', color: 'var(--error)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // ─── WhatsApp Tab ───
  const renderWhatsAppTab = () => (
    <>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setWhatsappTab('connection')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
            background: whatsappTab === 'connection' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
            border: `1.5px solid ${whatsappTab === 'connection' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            color: whatsappTab === 'connection' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <i className="fas fa-plug"></i> Connection
        </button>
        <button
          onClick={() => setWhatsappTab('automation')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
            background: whatsappTab === 'automation' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
            border: `1.5px solid ${whatsappTab === 'automation' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            color: whatsappTab === 'automation' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <i className="fas fa-robot"></i> Automation
        </button>
      </div>

      {/* ═══════ CONNECTION TAB ═══════ */}
      {whatsappTab === 'connection' && (
        <>
          {/* ── CONNECTED VIEW ── */}
          {isConnected && (
            <>
              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12, boxShadow: '0 0 30px rgba(37,211,102,0.3)',
                }}>
                  <i className="fab fa-whatsapp" style={{ fontSize: 36, color: 'white' }}></i>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>WhatsApp Connected</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>+1 234 567 890</span>
              </div>

              {/* Instance Details */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-server" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Instance Details
                </h4>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {[
                    { label: 'Instance Name', value: instanceName },
                    { label: 'API URL', value: 'https://evo.campushub.co.ke' },
                    { label: 'Status', value: 'Connected', color: 'var(--success)' },
                    { label: 'Phone', value: '+1 234 567 890' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: (item as any).color || 'var(--text-primary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Events */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-code-branch" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Webhook Events
                </h4>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {[
                    { key: 'newMessages', label: 'New Messages' },
                    { key: 'messageStatus', label: 'Message Status' },
                    { key: 'qrUpdated', label: 'QR Updated' },
                    { key: 'connectionState', label: 'Connection State' },
                  ].map((evt, i) => {
                    const isActive = webhookEvents[evt.key as keyof typeof webhookEvents];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{evt.label}</span>
                        <div onClick={() => setWebhookEvents(prev => ({ ...prev, [evt.key]: !prev[evt.key as keyof typeof prev] }))} style={toggleStyle(isActive)}>
                          <div style={toggleKnob(isActive)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                style={{
                  width: '100%', height: 48, borderRadius: 'var(--radius-md)',
                  background: 'transparent', border: '1.5px solid rgba(239,68,68,0.3)',
                  color: 'var(--error)', fontSize: 14, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', marginBottom: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <i className="fas fa-unlink"></i> Disconnect WhatsApp
              </button>
            </>
          )}

          {/* ── DISCONNECTED VIEW ── */}
          {!isConnected && (
            <>
              {/* Mode Selector: QR vs Pairing Code */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 4, borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)' }}>
                <button
                  onClick={() => { setConnectMode('qr'); setConnectionStatus('disconnected'); setConnectionError(null); setPhoneError(''); }}
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
                  onClick={() => { setConnectMode('pairing'); setConnectionStatus('disconnected'); setConnectionError(null); setPhoneError(''); }}
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

              {/* Loading State */}
              {connectionStatus === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, border: '3px solid rgba(37,211,102,0.2)', borderTopColor: '#25D366', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {connectMode === 'qr' ? 'Generating QR Code...' : 'Getting Pairing Code...'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {connectionStatus === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, textAlign: 'center' }}>
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

              {/* ── QR CODE MODE ── */}
              {connectMode === 'qr' && connectionStatus === 'disconnected' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <i className="fas fa-qrcode" style={{ fontSize: 28, color: '#25D366' }}></i>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Connect with QR Code</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Open WhatsApp → Linked Devices → Link a Device
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
                    Then scan the QR code shown here
                  </p>
                  <button
                    onClick={handleGenerateQR}
                    className="btn btn-primary"
                    style={{ maxWidth: 220, height: 48, fontSize: 14 }}
                  >
                    <i className="fas fa-qrcode"></i> Generate QR Code
                  </button>
                </div>
              )}

              {connectMode === 'qr' && connectionStatus === 'qr' && qrCode && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', textAlign: 'center' }}>
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
                      onClick={handleConnected}
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: '#25D366', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <i className="fas fa-check" style={{ marginRight: 4 }}></i> I've Scanned
                    </button>
                  </div>
                </div>
              )}

              {/* ── PAIRING CODE MODE ── */}
              {connectMode === 'pairing' && connectionStatus === 'disconnected' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
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
                    style={{ maxWidth: 220, height: 48, fontSize: 14, opacity: phoneNumber.trim() ? 1 : 0.5 }}
                  >
                    <i className="fas fa-key"></i> Get Pairing Code
                  </button>
                </div>
              )}

              {connectMode === 'pairing' && connectionStatus === 'pairing' && pairingCode && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', textAlign: 'center' }}>
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
                      onClick={() => { navigator.clipboard.writeText(pairingCode); showToast('Code copied!', 'success'); }}
                    >
                      {pairingCode}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(pairingCode); showToast('Code copied!', 'success'); }}
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
                    background: 'var(--bg-elevated)', marginBottom: 12, textAlign: 'left',
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
                    <button onClick={handleConnected} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                      <i className="fas fa-check" style={{ marginRight: 6 }}></i> Connected
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══════ AUTOMATION TAB ═══════ */}
      {whatsappTab === 'automation' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <i className="fas fa-hand-sparkles" style={{ marginRight: 6, color: 'var(--success)' }}></i> Welcome Message
              </h4>
              <div style={toggleStyle(welcomeEnabled)} onClick={() => setWelcomeEnabled(!welcomeEnabled)}><div style={toggleKnob(welcomeEnabled)} /></div>
            </div>
            {welcomeEnabled && (
              <>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Message Template</label>
                  {renderTextarea(welcomeMessage, setWelcomeMessage, 'Enter your welcome message...', 100)}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>Quick Templates</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {welcomeTemplates.map((tpl, i) => (
                      <button key={i} onClick={() => applyTemplate(tpl)}
                        style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: tpl.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: tpl.color }}><i className={`fas ${tpl.icon}`}></i></div>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{tpl.name}</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', lineHeight: 1.3 }}>Click to apply template</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ marginBottom: 6, fontSize: 12 }}>Insert Variables</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['{{business_name}}', '{{phone}}', '{{website}}', '{{address}}'].map(v => (
                      <button key={v} onClick={() => insertVariable(v)}
                        style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: 12, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: autoReplyEnabled ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--success)' }}><i className="fas fa-reply"></i></div>
                <div><span style={{ fontSize: 14, fontWeight: 700 }}>Auto Reply</span><p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Automatic response to all messages</p></div>
              </div>
              <div style={toggleStyle(autoReplyEnabled)} onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}><div style={toggleKnob(autoReplyEnabled)} /></div>
            </div>
            {autoReplyEnabled && (
              <textarea className="form-input" value={autoReplyMessage} onChange={(e) => setAutoReplyMessage(e.target.value)} style={{ height: 'auto', padding: '12px 14px', minHeight: 60, resize: 'none', fontSize: 13, marginTop: 10 }} />
            )}
          </div>

          <div style={{ marginBottom: 20, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: awayEnabled ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--warning)' }}><i className="fas fa-moon"></i></div>
                <div><span style={{ fontSize: 14, fontWeight: 700 }}>Away Message</span><p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Sent when you're unavailable</p></div>
              </div>
              <div style={toggleStyle(awayEnabled)} onClick={() => setAwayEnabled(!awayEnabled)}><div style={toggleKnob(awayEnabled)} /></div>
            </div>
            {awayEnabled && (
              <textarea className="form-input" value={awayMessage} onChange={(e) => setAwayMessage(e.target.value)} style={{ height: 'auto', padding: '12px 14px', minHeight: 60, resize: 'none', fontSize: 13, marginTop: 10 }} />
            )}
          </div>

          <button className="btn btn-primary" onClick={saveWhatsAppAutomation}>
            <i className="fas fa-check"></i> Save Automation
          </button>
        </>
      )}
    </>
  );

  // ─── Payments Tab ───
  const renderPaymentsTab = () => (
    <>
      <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mpesaEnabled ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--success)' }}><i className="fas fa-mobile-screen"></i></div>
            <div><h4 style={{ fontSize: 15, fontWeight: 700 }}>M-Pesa</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Kenya mobile money</p></div>
          </div>
          <div style={toggleStyle(mpesaEnabled)} onClick={() => setMpesaEnabled(!mpesaEnabled)}><div style={toggleKnob(mpesaEnabled)} /></div>
        </div>
        {mpesaEnabled && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, marginTop: 8 }}>
              {([{id: 'buyGoods', label: 'Buy Goods', icon: 'fa-store'}, {id: 'paybill', label: 'Paybill', icon: 'fa-building'}, {id: 'personal', label: 'Personal', icon: 'fa-user'}] as const).map(tab => (
                <button key={tab.id} onClick={() => setMpesaActiveTab(tab.id)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: mpesaActiveTab === tab.id ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)', border: `1px solid ${mpesaActiveTab === tab.id ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`, color: mpesaActiveTab === tab.id ? 'var(--success)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <i className={`fas ${tab.icon}`}></i> {tab.label}
                </button>
              ))}
            </div>
            {mpesaActiveTab === 'buyGoods' && <>{renderFormGroup('Till Number', 'e.g. 123456', mpesaBuyGoodsTill, setMpesaBuyGoodsTill)}</>}
            {mpesaActiveTab === 'paybill' && <>{renderFormGroup('Paybill Number', 'e.g. 400200', mpesaPaybillNumber, setMpesaPaybillNumber)}{renderFormGroup('Account Number (optional)', 'e.g. SELLFLOW001', mpesaPaybillAccount, setMpesaPaybillAccount)}</>}
            {mpesaActiveTab === 'personal' && <>{renderFormGroup('Account Name', 'e.g. John Doe', mpesaPersonalName, setMpesaPersonalName)}{renderFormGroup('Phone Number', 'e.g. 0712345678', mpesaPersonalPhone, setMpesaPersonalPhone)}</>}
          </>
        )}
      </div>

      <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: bankEnabled ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--info)' }}><i className="fas fa-building-columns"></i></div>
            <div><h4 style={{ fontSize: 15, fontWeight: 700 }}>Bank Transfer</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Direct bank deposits</p></div>
          </div>
          <div style={toggleStyle(bankEnabled)} onClick={() => setBankEnabled(!bankEnabled)}><div style={toggleKnob(bankEnabled)} /></div>
        </div>
        {bankEnabled && <>{renderFormGroup('Bank Name', 'e.g. First National Bank', bankName, setBankName)}{renderFormGroup('Account Name', 'Your business name', bankAccountName, setBankAccountName)}{renderFormGroup('Account Number', 'e.g. 1002003004', bankAccountNumber, setBankAccountNumber)}{renderFormGroup('SWIFT Code (optional)', 'e.g. XYZBKENX', bankSwiftCode, setBankSwiftCode)}</>}
      </div>

      <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--accent-primary)' }}><i className="fas fa-credit-card"></i></div>
            <div><h4 style={{ fontSize: 15, fontWeight: 700 }}>Card Payments</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Visa / Mastercard</p></div>
          </div>
          <div style={toggleStyle(cardEnabled)} onClick={() => setCardEnabled(!cardEnabled)}><div style={toggleKnob(cardEnabled)} /></div>
        </div>
      </div>

      <div style={{ marginBottom: 24, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--warning)' }}><i className="fas fa-money-bill-wave"></i></div>
            <div><h4 style={{ fontSize: 15, fontWeight: 700 }}>Cash on Delivery</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Pay when you receive</p></div>
          </div>
          <div style={toggleStyle(cashEnabled)} onClick={() => setCashEnabled(!cashEnabled)}><div style={toggleKnob(cashEnabled)} /></div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={savePayments}>
        <i className="fas fa-check"></i> Save Payment Methods
      </button>
    </>
  );

  // ─── Security Tab ───
  const renderSecurityTab = () => (
    <>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <i className="fas fa-key" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Password
        </h4>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--info)' }}><i className="fas fa-key"></i></div>
            <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Change Password</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Update your account password</p></div>
            <i className="fas fa-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--success)' }}><i className="fas fa-shield-halved"></i></div>
              <div><h4 style={{ fontSize: 15, fontWeight: 600 }}>Two-Factor Authentication</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Add an extra layer of security</p></div>
            </div>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Off</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <i className="fas fa-fingerprint" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Biometric
        </h4>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent-primary)' }}><i className="fas fa-fingerprint"></i></div>
              <div><h4 style={{ fontSize: 15, fontWeight: 600 }}>Face ID / Fingerprint</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Quick access with biometrics</p></div>
            </div>
            <div style={toggleStyle(biometricEnabled)} onClick={() => setBiometricEnabled(!biometricEnabled)}><div style={toggleKnob(biometricEnabled)} /></div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <i className="fas fa-display" style={{ marginRight: 6, color: 'var(--accent-primary)' }}></i> Active Sessions
        </h4>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className="fas fa-display"></i></div>
            <div style={{ flex: 1 }}><h4 style={{ fontSize: 14, fontWeight: 600 }}>MacBook Pro — Safari</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Active now · San Francisco, CA</p></div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'var(--success-soft)', color: 'var(--success)' }}>Current</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className="fas fa-mobile-screen"></i></div>
            <div style={{ flex: 1 }}><h4 style={{ fontSize: 14, fontWeight: 600 }}>iPhone 16 Pro</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>2 hours ago · New York, NY</p></div>
            <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600, cursor: 'pointer' }}>Revoke</span>
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={saveSecurity}>
        <i className="fas fa-check"></i> Save Security Settings
      </button>
    </>
  );

  // ─── AI Tab ───
  const saveAiSettings = async () => {
    try {
      await businessProfileService.saveProfile({
        aiSettings: {
          tone: aiTone,
          language: aiLanguage,
          greetingMessage: aiGreeting,
          autoReplyEnabled: aiAutoReply,
          orderStatusEnabled: aiOrderStatus,
          productRecommendations: aiRecommendations,
          businessHoursOnly: aiBusinessHours,
        },
      });
      showToast('AI settings saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save AI settings', 'error');
    }
  };

  const renderAiTab = () => (
    <>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personality</h4>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Tone */}
          <div>
            <div onClick={() => setAiTonePicker(!aiTonePicker)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent-primary)' }}><i className="fas fa-face-smile"></i></div>
              <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Tone</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{aiTone}</p></div>
              <i className={`fas fa-chevron-${aiTonePicker ? 'up' : 'right'}`} style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
            </div>
            {aiTonePicker && (
              <div style={{ padding: '8px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Friendly & Professional', 'Casual', 'Formal', 'Playful', 'Minimal'].map(t => (
                  <button key={t} onClick={() => { setAiTone(t); setAiTonePicker(false); }}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: aiTone === t ? 'var(--accent-gradient)' : 'var(--bg-card)', border: 'none', color: aiTone === t ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Language */}
          <div>
            <div onClick={() => setAiLangPicker(!aiLangPicker)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--success)' }}><i className="fas fa-language"></i></div>
              <div style={{ flex: 1 }}><h4 style={{ fontSize: 15, fontWeight: 600 }}>Language</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{aiLanguage}</p></div>
              <i className={`fas fa-chevron-${aiLangPicker ? 'up' : 'right'}`} style={{ color: 'var(--text-muted)', fontSize: 14 }}></i>
            </div>
            {aiLangPicker && (
              <div style={{ padding: '8px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['English', 'Swahili', 'French', 'Arabic', 'Spanish'].map(l => (
                  <button key={l} onClick={() => { setAiLanguage(l); setAiLangPicker(false); }}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', background: aiLanguage === l ? 'var(--accent-gradient)' : 'var(--bg-card)', border: 'none', color: aiLanguage === l ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 24 }}>
        <label className="form-label">Greeting Message</label>
        <textarea className="form-input" value={aiGreeting} onChange={(e) => setAiGreeting(e.target.value)}
          placeholder="Hi! 👋 Thanks for reaching out. How can I help you today?"
          style={{ height: 'auto', padding: '14px 16px', minHeight: 80, resize: 'none' }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Automation</h4>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {[
            { label: 'Auto-Reply to New Messages', desc: 'AI responds to first messages', val: aiAutoReply, set: setAiAutoReply },
            { label: 'Order Status Inquiries', desc: 'Answer order-related questions', val: aiOrderStatus, set: setAiOrderStatus },
            { label: 'Product Recommendations', desc: 'Suggest products to customers', val: aiRecommendations, set: setAiRecommendations },
            { label: 'Business Hours Only', desc: 'Only respond during business hours', val: aiBusinessHours, set: setAiBusinessHours },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div><h4 style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</h4><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</p></div>
              <div style={toggleStyle(item.val)} onClick={() => item.set(!item.val)}><div style={toggleKnob(item.val)} /></div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={saveAiSettings}>
        <i className="fas fa-check"></i> Save AI Settings
      </button>
    </>
  );

  // ─── Team Tab ───
  const persistTeamMembers = async (updated: import('@/lib/db').TeamMember[]) => {
    await businessProfileService.saveProfile({ teamMembers: updated });
    setTeamMembers(updated);
  };

  const handleInviteMember = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    const newMember = {
      id: Date.now().toString(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      phone: invitePhone.trim(),
      role: inviteRole,
      active: true,
      invitedAt: new Date().toISOString(),
    };
    await persistTeamMembers([...teamMembers, newMember]);
    showToast(`${newMember.name} invited as ${inviteRole}`, 'success');
    setInviteName('');
    setInviteEmail('');
    setInvitePhone('');
    setShowInviteForm(false);
  };

  const handleToggleMemberActive = async (id: string) => {
    const updated = teamMembers.map(m => m.id === id ? { ...m, active: !m.active } : m);
    await persistTeamMembers(updated);
  };

  const handleRemoveMember = async (id: string) => {
    const updated = teamMembers.filter(m => m.id !== id);
    await persistTeamMembers(updated);
    showToast('Team member removed', 'success');
  };

  const roleColors: Record<string, string> = {
    owner: 'var(--accent-gradient)',
    admin: 'var(--success-soft)',
    staff: 'var(--info-soft)',
  };

  const renderTeamTab = () => (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {teamLoading ? (
            <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" /></div>
          ) : teamMembers.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-users" style={{ fontSize: 24, marginBottom: 8, display: 'block' }}></i>
              <span style={{ fontSize: 13, fontWeight: 500 }}>No team members yet. Invite someone!</span>
            </div>
          ) : (
            teamMembers.map((member, i) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < teamMembers.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: roleColors[member.role] || 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700 }}>{member.name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    {member.email ? ` · ${member.email}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div onClick={() => handleToggleMemberActive(member.id)}
                    style={{ width: 10, height: 10, borderRadius: '50%', background: member.active ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease' }} />
                  {member.role !== 'owner' && (
                    <button onClick={() => handleRemoveMember(member.id)}
                      style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: 'none', color: 'var(--error)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showInviteForm ? (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent-primary)' }}>
            <i className="fas fa-user-plus"></i> Invite Team Member
          </h4>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Name *</label>
            <input className="form-input" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" style={{ paddingLeft: 16, paddingRight: 16 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" style={{ paddingLeft: 16, paddingRight: 16 }} />
          </div>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+254 712 345 678" style={{ paddingLeft: 16, paddingRight: 16 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'admin' | 'staff')} style={{ paddingLeft: 16, paddingRight: 40 }}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1, height: 44, fontSize: 14 }} onClick={handleInviteMember}>
              <i className="fas fa-paper-plane"></i> Send Invite
            </button>
            <button className="btn btn-secondary" style={{ flex: 0.4, height: 44, fontSize: 14 }} onClick={() => setShowInviteForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <button className="btn btn-primary" onClick={() => setShowInviteForm(true)}>
            <i className="fas fa-user-plus"></i> Invite Member
          </button>
        </div>
      )}
    </>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'products': return renderProductsTab();
      case 'shipping': return renderShippingTab();
      case 'pickup': return renderPickupTab();
      case 'whatsapp': return renderWhatsAppTab();
      case 'payments': return renderPaymentsTab();
      case 'security': return renderSecurityTab();
      case 'ai': return renderAiTab();
      case 'team': return renderTeamTab();
    }
  };

  return (
    <AuthGuard>
    <div className="app-container">
      {/* Status Bar */}
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Scroll */}
      <div className="main-scroll" id="mainScroll">
        {/* Header */}
        <SettingsPageHeader onBack={() => router.push('/dashboard')} />

        {/* Tab Navigation */}
        <div style={{ padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {tabs.map(tab => (
              <button key={tab.id} style={tabBtn(tab.id)} onClick={() => setActiveTab(tab.id)}>
                <i className={`${tab.brand ? 'fab' : 'fas'} ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '0 20px' }}>
          {renderTabContent()}
        </div>
      </div>

      {/* Logout Dialog */}
      <LogoutDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onLogout={async () => {
          setLogoutDialogOpen(false);
          try {
            const { signOut } = await import('firebase/auth');
            const { auth } = await import('@/lib/firebase');
            await signOut(auth);
          } catch {}
          showToast('Logged out successfully', 'success');
          setTimeout(() => router.push('/'), 1000);
        }}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeIndex={navIndex}
        fabOpen={fabOpen}
        onNavClick={(i) => {
          setNavIndex(i);
          const routes = ['/dashboard', '/products', '/chats', '/orders', '/settings'];
          router.push(routes[i]);
        }}
        onFabClick={() => setFabOpen(!fabOpen)}
        onMoreClick={() => setMoreSheetOpen(true)}
      />

      {/* More Sheet */}
n      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onShowToast={showToast}
      />

      <MoreSheet open={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} />

      {/* Snackbar */}
      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
    </AuthGuard>
  );
}
