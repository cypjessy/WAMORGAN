'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { businessProfileService, customerService, productService, ShippingMethod } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string;
  name: string;
  emoji: string;
  price: number;
  qty: number;
}

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface ProductOption {
  id: string;
  name: string;
  imageUrl: string;
  emoji: string;
  price: number;
  stock: number;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateOrder: (data: {
    customer: { name: string; phone: string; email?: string; address?: string; isNew: boolean };
    items: OrderItem[];
    delivery: { method: 'pickup' | 'delivery'; address?: string; pickupLocation?: string; expectedDate?: string };
    shippingMethod?: { name: string; price: string };
    payment: { method: string; reference?: string };
    discount: number;
    notes: string;
    sendWhatsApp: boolean;
    saveCustomer: boolean;
  }) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

type CreateStep = 'form' | 'confirm' | 'submitting';

// ─── Default Payment Methods ────────────────────────────────────────────────

const defaultPaymentMethodDefs = [
  { value: 'cash', label: 'Cash', icon: 'fa-money-bill-wave', color: 'var(--success)' },
  { value: 'card', label: 'Credit Card', icon: 'fa-credit-card', color: 'var(--accent-primary)' },
  { value: 'bank', label: 'Bank Transfer', icon: 'fa-building-columns', color: 'var(--info)' },
  { value: 'mpesa', label: 'M-Pesa', icon: 'fa-mobile-screen', color: 'var(--success)' },
];

interface PaymentMethodDef {
  value: string;
  label: string;
  icon: string;
  color: string;
}

// ─── Section Header Sub-Component ───────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 12, paddingTop: 4,
    }}>
      <span style={{
        fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {title}
      </span>
      {count !== undefined && (
        <span style={{
          padding: '2px 8px', borderRadius: 'var(--radius-full)',
          background: 'var(--accent-gradient-soft)', color: 'var(--accent-primary)',
          fontSize: 11, fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CreateOrderDialog({ open, onClose, onCreateOrder, showToast }: CreateOrderDialogProps) {
  const [step, setStep] = useState<CreateStep>('form');

  // ── Customer State ──
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // ── Product State ──
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  // ── Delivery State ──
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedPickupGroup, setSelectedPickupGroup] = useState('');
  const [selectedPickupStation, setSelectedPickupStation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');

  // ── Payment State ──
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');

  // ── Options State ──
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [saveCustomer, setSaveCustomer] = useState(true);

  // ── Settings from Firestore ──
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [stationsConfig, setStationsConfig] = useState<Array<{ group: string; stations: string[] }>>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDef[]>(defaultPaymentMethodDefs);

  // ── Customers from Firestore ──
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);

  // Load store config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await businessProfileService.getStoreConfig();
        // Map pickup stations into group format
        const stationsByCounty: Record<string, string[]> = {};
        (config.pickupStations || []).filter(s => s.isActive).forEach(s => {
          if (!stationsByCounty[s.county]) stationsByCounty[s.county] = [];
          stationsByCounty[s.county].push(s.stationName);
        });
        setStationsConfig(Object.entries(stationsByCounty).map(([group, stations]) => ({ group, stations })));
        setShippingMethods(config.shippingMethods || []);
        // Build payment methods from enabled ones in settings
        const pm = config.paymentMethods || {};
        const enabledPMs: PaymentMethodDef[] = [];
        if (pm.cash?.enabled) enabledPMs.push({ value: 'cash', label: 'Cash', icon: 'fa-money-bill-wave', color: 'var(--success)' });
        if (pm.card?.enabled) enabledPMs.push({ value: 'card', label: 'Credit Card', icon: 'fa-credit-card', color: 'var(--accent-primary)' });
        if (pm.bank?.enabled) enabledPMs.push({ value: 'bank', label: 'Bank Transfer', icon: 'fa-building-columns', color: 'var(--info)' });
        if (pm.mpesa?.enabled) enabledPMs.push({ value: 'mpesa', label: 'M-Pesa', icon: 'fa-mobile-screen', color: 'var(--success)' });
        if (enabledPMs.length > 0) setPaymentMethods(enabledPMs);
      } catch (err) {
        console.error('Failed to load store config:', err);
      }
    };
    loadConfig();
  }, []);

  // Load customers from Firestore
  useEffect(() => {
    customerService.getCustomers().then(all => {
      setCustomers(all.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
      })));
    }).catch(err => console.error('Failed to load customers:', err));
  }, []);

  // Load products from Firestore
  useEffect(() => {
    productService.getProducts().then(all => {
      setAvailableProducts(all.filter(p => (p.stock || 0) > 0).map(p => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl || '',
        emoji: p.emoji || '📦',
        price: p.price,
        stock: p.stock || 0,
      })));
    }).catch(err => console.error('Failed to load products:', err));
  }, []);

  // ── Validation ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Refs ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Filtered customers
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  // Filtered products
  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    p.stock > 0
  );

  // Cart calculations
  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );
  const discountAmount = useMemo(() =>
    Math.min(discount, 100) / 100 * subtotal,
    [subtotal, discount]
  );
  const shippingCost = useMemo(() => {
    if (deliveryMethod !== 'delivery' || !selectedShippingMethod) return 0;
    const sm = shippingMethods.find(s => s.id === selectedShippingMethod);
    return sm ? Number(sm.price) || 0 : 0;
  }, [deliveryMethod, selectedShippingMethod, shippingMethods]);
  const total = useMemo(() =>
    Math.max(0, subtotal - discountAmount + shippingCost),
    [subtotal, discountAmount, shippingCost]
  );

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('form');
      setCustomerSearch('');
      setSelectedCustomer(null);
      setIsNewCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
      setProductSearch('');
      setCartItems([]);
      setDeliveryMethod('pickup');
      setSelectedPickupGroup('');
      setSelectedPickupStation('');
      setDeliveryAddress('');
      setExpectedDate('');
      setSelectedShippingMethod('');
      setPaymentMethod('cash');
      setPaymentReference('');
      setDiscount(0);
      setNotes('');
      setSendWhatsApp(true);
      setSaveCustomer(true);
      setErrors({});
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [open]);

  // ── Customer Handlers ──

  const handleSelectCustomer = useCallback((customer: CustomerData) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setIsNewCustomer(false);
  }, []);

  const handleStartNewCustomer = useCallback(() => {
    setIsNewCustomer(true);
    setShowCustomerDropdown(false);
    setSelectedCustomer(null);
    setCustomerSearch('');
  }, []);

  // ── Product Handlers ──

  const handleAddProduct = useCallback((product: typeof availableProducts[0]) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, qty: Math.min(item.qty + 1, product.stock) }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        emoji: product.emoji,
        price: product.price,
        qty: 1,
      }];
    });
    setProductSearch('');
    setShowProductDropdown(false);
  }, []);

  const handleUpdateQty = useCallback((productId: string, delta: number) => {
    setCartItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, qty: Math.max(1, item.qty + delta) }
        : item
    ));
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  }, []);

  // ── Validation ──

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Customer validation
    if (isNewCustomer) {
      if (!newCustomerName.trim() || newCustomerName.trim().length < 2) {
        newErrors.customerName = 'Enter a valid customer name';
      }
      if (!newCustomerPhone.trim() || !/^[\d\s\-+()]{7,15}$/.test(newCustomerPhone.trim())) {
        newErrors.customerPhone = 'Enter a valid phone number';
      }
    } else if (!selectedCustomer) {
      newErrors.customer = 'Select a customer or add a new one';
    }

    // Products validation
    if (cartItems.length === 0) {
      newErrors.products = 'Add at least one product';
    }

    // Delivery validation
    if (deliveryMethod === 'pickup' && !selectedPickupStation) {
      newErrors.pickup = 'Select a pickup station';
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      newErrors.delivery = 'Enter a delivery address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [isNewCustomer, newCustomerName, newCustomerPhone, selectedCustomer, cartItems, deliveryMethod, selectedPickupStation, deliveryAddress]);

  // ── Submit ──

  const handleProceedToConfirm = useCallback(() => {
    if (validateForm()) {
      setStep('confirm');
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [validateForm]);

  const handleSubmit = useCallback(async () => {
    setStep('submitting');
    try {
      await onCreateOrder({
        customer: isNewCustomer
          ? { name: newCustomerName, phone: newCustomerPhone, email: newCustomerEmail, address: newCustomerAddress, isNew: true }
          : { name: selectedCustomer!.name, phone: selectedCustomer!.phone, email: selectedCustomer!.email, address: selectedCustomer!.address, isNew: false },
        items: cartItems,
        delivery: {
          method: deliveryMethod,
          address: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
          pickupLocation: deliveryMethod === 'pickup' ? selectedPickupStation : undefined,
          expectedDate: expectedDate || undefined,
        },
        shippingMethod: deliveryMethod === 'delivery' && selectedShippingMethod
          ? (() => {
              const sm = shippingMethods.find(s => s.id === selectedShippingMethod);
              return sm ? { name: sm.name, price: sm.price } : undefined;
            })()
          : undefined,
        payment: { method: paymentMethod, reference: paymentReference || undefined },
        discount,
        notes,
        sendWhatsApp,
        saveCustomer: isNewCustomer ? saveCustomer : false,
      });
      showToast?.('Order created successfully!', 'success');
      onClose();
    } catch (err: any) {
      showToast?.(err.message || 'Failed to create order', 'error');
    }
  }, [onCreateOrder, onClose, showToast, isNewCustomer, newCustomerName, newCustomerPhone, newCustomerEmail, newCustomerAddress, selectedCustomer, cartItems, deliveryMethod, deliveryAddress, selectedPickupStation, expectedDate, selectedShippingMethod, shippingMethods, paymentMethod, paymentReference, discount, notes, sendWhatsApp, saveCustomer]);

  // ── Render Helpers ──

  const renderError = (key: string) => {
    if (!errors[key]) return null;
    return (
      <div style={{
        fontSize: 12, color: 'var(--error)', marginTop: 4, fontWeight: 500,
      }}>
        <i className="fas fa-circle-exclamation" style={{ marginRight: 4, fontSize: 10 }}></i>
        {errors[key]}
      </div>
    );
  };

  // ── Render ──

  if (!open) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} style={{ zIndex: 300 }} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`} style={{
        zIndex: 301, maxHeight: '95vh',
        background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      }}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom" ref={scrollRef} style={{ padding: '8px 0 32px' }}>

          {/* ════════════ CONFIRMATION STEP ════════════ */}
          {step === 'confirm' && (
            <div style={{ padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--warning-soft)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontSize: 24, color: 'var(--warning)',
                }}>
                  <i className="fas fa-clipboard-check"></i>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Confirm Order</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Review the order details before creating
                </p>
              </div>

              {/* Customer */}
              <div className="detail-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="label">Customer</span>
                <span className="value">
                  {isNewCustomer ? newCustomerName : selectedCustomer?.name}
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                    {isNewCustomer ? newCustomerPhone : selectedCustomer?.phone}
                  </span>
                </span>
              </div>

              {/* Items */}
              <div className="detail-row" style={{ borderBottom: '1px solid var(--border-subtle)', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <span className="label">Items ({cartItems.length})</span>
                {cartItems.map(item => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.emoji} {item.name} x{item.qty}
                    </span>
                    <span style={{ fontWeight: 700 }}>KSh {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery */}
              <div className="detail-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="label">Delivery</span>
                <span className="value" style={{ textAlign: 'right' }}>
                  {deliveryMethod === 'pickup' ? `Pickup - ${selectedPickupStation}` : `Delivery to ${deliveryAddress}`}
                  {deliveryMethod === 'delivery' && selectedShippingMethod && (
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                      {shippingMethods.find(s => s.id === selectedShippingMethod)?.name} ({shippingMethods.find(s => s.id === selectedShippingMethod)?.price !== '0' ? `KSh ${shippingMethods.find(s => s.id === selectedShippingMethod)?.price}` : 'Free'})
                    </span>
                  )}
                </span>
              </div>

              {/* Payment */}
              <div className="detail-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="label">Payment</span>
                <span className="value">
                  {paymentMethods.find(p => p.value === paymentMethod)?.label || paymentMethod}
                  {paymentReference && <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Ref: {paymentReference}</span>}
                </span>
              </div>

              {/* Discount */}
              {discount > 0 && (
                <div className="detail-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="label">Discount</span>
                  <span className="value" style={{ color: 'var(--success)' }}>-${discountAmount.toFixed(2)} ({discount}%)</span>
                </div>
              )}

              {/* Shipping */}
              {shippingCost > 0 && (
                <div className="detail-row" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="label">Shipping</span>
                  <span className="value">KSh {shippingCost.toFixed(2)}</span>
                </div>
              )}

              {/* Total */}
              <div className="detail-row" style={{
                borderTop: '2px solid var(--border-subtle)', marginTop: 8,
                paddingTop: 16,
              }}>
                <span className="label" style={{ fontSize: 16, fontWeight: 800 }}>Total</span>
                <span className="value" style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* WhatsApp notice */}
              {sendWhatsApp && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.15)',
                  fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <i className="fab fa-whatsapp" style={{ color: '#25d366', fontSize: 16 }}></i>
                  Order confirmation and receipt will be sent via WhatsApp
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setStep('form')}
                >
                  <i className="fas fa-arrow-left"></i> Edit
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleSubmit}
                >
                  <i className="fas fa-check"></i> Create Order
                </button>
              </div>
            </div>
          )}

          {/* ════════════ SUBMITTING ════════════ */}
          {step === 'submitting' && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Creating your order...
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Processing payment and saving to database
              </p>
            </div>
          )}

          {/* ════════════ FORM STEP ════════════ */}
          {step === 'form' && (
            <div style={{ padding: '0 24px' }}>

              {/* ── HEADER ── */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                  background: 'var(--accent-gradient-soft)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px', fontSize: 24, color: 'var(--accent-primary)',
                }}>
                  <i className="fas fa-file-invoice"></i>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Create Order</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Fill in the details to create a new order
                </p>
              </div>

              {/* ── CUSTOMER SECTION ── */}
              <SectionHeader title="Customer" />

              {!isNewCustomer ? (
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <div className="input-wrapper">
                    <input
                      className={`form-input ${errors.customer ? 'error' : ''}`}
                      type="text"
                      placeholder="Search existing customer..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                        setSelectedCustomer(null);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      style={{ paddingLeft: 40, paddingRight: 16 }}
                    />
                    <i className="fas fa-search input-icon" style={{ left: 14, right: 'auto' }}></i>
                  </div>
                  {renderError('customer')}

                  {showCustomerDropdown && customerSearch && (
                    <div style={{
                      position: 'absolute', top: 58, left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)', zIndex: 10,
                      maxHeight: 200, overflowY: 'auto',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                      {filteredCustomers.map(c => (
                        <div key={c.id} onClick={() => handleSelectCustomer(c)} style={{
                          padding: '12px 14px', cursor: 'pointer',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'all 0.15s ease',
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone} • {c.email}</div>
                        </div>
                      ))}
                      <div onClick={handleStartNewCustomer} style={{
                        padding: '12px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: 'var(--accent-primary)', fontWeight: 600, fontSize: 13,
                        borderTop: '1px solid var(--border-subtle)',
                      }}>
                        <i className="fas fa-plus"></i>
                        Add new customer
                      </div>
                    </div>
                  )}

                  {selectedCustomer && (
                    <div style={{
                      marginTop: 8, padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(232,168,56,0.05)',
                      border: '1px solid var(--border-glow)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <i className="fas fa-user" style={{ color: 'var(--accent-primary)' }}></i>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedCustomer.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{selectedCustomer.phone}</span>
                      </div>
                      <button
                        onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)',
                          cursor: 'pointer', fontSize: 14, padding: 4,
                        }}
                      >
                        <i className="fas fa-xmark"></i>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>New Customer</span>
                    <button
                      onClick={() => setIsNewCustomer(false)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--accent-primary)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 4,
                      }}
                    >
                      <i className="fas fa-arrow-left" style={{ marginRight: 4 }}></i>Search existing
                    </button>
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      className={`form-input ${errors.customerName ? 'error' : ''}`}
                      type="text"
                      placeholder="John Doe"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      style={{ paddingLeft: 16, paddingRight: 16 }}
                    />
                    {renderError('customerName')}
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Phone Number *</label>
                    <input
                      className={`form-input ${errors.customerPhone ? 'error' : ''}`}
                      type="tel"
                      placeholder="+1 234 567 890"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      style={{ paddingLeft: 16, paddingRight: 16 }}
                    />
                    {renderError('customerPhone')}
                  </div>
                  <div className="form-row" style={{ marginBottom: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Email</label>
                      <input
                        className="form-input"
                        type="email"
                        placeholder="john@email.com"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        style={{ paddingLeft: 16, paddingRight: 16 }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Address</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="123 Main St"
                        value={newCustomerAddress}
                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                        style={{ paddingLeft: 16, paddingRight: 16 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── PRODUCTS SECTION ── */}
              <SectionHeader title="Products" count={cartItems.length} />

              {/* Product Search */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Search products to add..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    style={{ paddingLeft: 40, paddingRight: 16 }}
                  />
                  <i className="fas fa-search input-icon" style={{ left: 14, right: 'auto' }}></i>
                </div>

                {showProductDropdown && productSearch && (
                  <div style={{
                    position: 'absolute', top: 58, left: 0, right: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', zIndex: 10,
                    maxHeight: 220, overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}>
                    {filteredProducts.length === 0 ? (
                      <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                        No products found
                      </div>
                    ) : (
                      filteredProducts.map(p => (
                        <div key={p.id} onClick={() => handleAddProduct(p)} style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', gap: 12,
                          transition: 'all 0.15s ease',
                        }}>
                          <span style={{ fontSize: 24 }}>{p.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              ${p.price.toFixed(2)} • {p.stock} in stock
                            </div>
                          </div>
                          <button style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--accent-gradient-soft)', border: 'none',
                            color: 'var(--accent-primary)', fontSize: 14,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {renderError('products')}

              {/* Cart Items */}
              {cartItems.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {cartItems.map(item => {
                    const product = availableProducts.find(p => p.id === item.productId);
                    return (
                      <div key={item.productId} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', marginBottom: 8,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        <span style={{ fontSize: 24 }}>{item.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            ${item.price.toFixed(2)} each
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)', fontSize: 12,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                            {item.qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)', fontSize: 12,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-primary)', minWidth: 50, textAlign: 'right' }}>
                          ${(item.price * item.qty).toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            fontSize: 14, cursor: 'pointer', padding: 4,
                          }}
                        >
                          <i className="fas fa-trash-can"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── DELIVERY SECTION ── */}
              <SectionHeader title="Delivery" />

              {/* Delivery Method Toggle */}
              <div style={{
                display: 'flex', gap: 10, marginBottom: 16,
              }}>
                <button
                  onClick={() => setDeliveryMethod('pickup')}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
                    background: deliveryMethod === 'pickup' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                    border: `1.5px solid ${deliveryMethod === 'pickup' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    color: deliveryMethod === 'pickup' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="fas fa-store"></i> Pickup
                </button>
                <button
                  onClick={() => setDeliveryMethod('delivery')}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
                    background: deliveryMethod === 'delivery' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                    border: `1.5px solid ${deliveryMethod === 'delivery' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    color: deliveryMethod === 'delivery' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <i className="fas fa-truck"></i> Delivery
                </button>
              </div>

              {deliveryMethod === 'pickup' ? (
                <>
                  {/* Pickup Station Selection */}
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Pickup Location *</label>
                    {stationsConfig.length > 0 ? (
                      <>
                        <select
                          className="form-input form-select"
                          value={selectedPickupGroup}
                          onChange={(e) => { setSelectedPickupGroup(e.target.value); setSelectedPickupStation(''); }}
                          style={{ paddingLeft: 16, paddingRight: 40 }}
                        >
                          <option value="">Select county/region</option>
                          {stationsConfig.map(loc => (
                            <option key={loc.group} value={loc.group}>{loc.group}</option>
                          ))}
                        </select>
                        {selectedPickupGroup && (
                          <div className="pill-group" style={{ marginTop: 8 }}>
                            {stationsConfig.find(l => l.group === selectedPickupGroup)?.stations.map(station => (
                              <button
                                key={station}
                                className={`pill ${selectedPickupStation === station ? 'active' : ''}`}
                                onClick={() => setSelectedPickupStation(station)}
                              >
                                {station}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        className="form-input"
                        placeholder="Enter pickup location"
                        value={selectedPickupStation}
                        onChange={(e) => setSelectedPickupStation(e.target.value)}
                        style={{ paddingLeft: 16, paddingRight: 16 }}
                      />
                    )}
                    {renderError('pickup')}
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Delivery Address *</label>
                    <textarea
                      className={`form-input ${errors.delivery ? 'error' : ''}`}
                      placeholder="Street address, city, state, zip code"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={{ height: 80, padding: 14, resize: 'none', fontFamily: 'inherit' }}
                    />
                    {renderError('delivery')}
                  </div>
                  {/* Shipping Method */}
                  {shippingMethods.length > 0 && (
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Shipping Method</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {shippingMethods.map(sm => (
                          <button
                            key={sm.id}
                            onClick={() => setSelectedShippingMethod(sm.id === selectedShippingMethod ? '' : sm.id)}
                            style={{
                              padding: '12px', borderRadius: 'var(--radius-md)',
                              background: selectedShippingMethod === sm.id ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                              border: `1.5px solid ${selectedShippingMethod === sm.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                              color: selectedShippingMethod === sm.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                              cursor: 'pointer', textAlign: 'center',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <i className="fas fa-truck-fast" style={{ fontSize: 16, display: 'block', marginBottom: 4 }}></i>
                            {sm.name}
                            {sm.price !== '0' && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>KSh {sm.price}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Expected Date */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Expected Delivery/Pickup Date</label>
                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    style={{ paddingLeft: 16, paddingRight: 16, colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* ── PAYMENT SECTION ── */}
              <SectionHeader title="Payment" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {paymentMethods.map(pm => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    style={{
                      padding: '12px', borderRadius: 'var(--radius-md)',
                      background: paymentMethod === pm.value ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${paymentMethod === pm.value ? pm.color : 'var(--border-subtle)'}`,
                      color: paymentMethod === pm.value ? pm.color : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <i className={pm.icon} style={{ fontSize: 18, display: 'block', marginBottom: 4 }}></i>
                    {pm.label}
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Transaction Reference (optional)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. M-Pesa Confirmation Code"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  style={{ paddingLeft: 16, paddingRight: 16 }}
                />
              </div>

              {/* ── DISCOUNT & NOTES ── */}
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Discount (%)</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    style={{ paddingLeft: 16, paddingRight: 16 }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Order Notes</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Any special instructions"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ paddingLeft: 16, paddingRight: 16 }}
                  />
                </div>
              </div>

              {/* ── OPTIONS ── */}
              <div style={{
                marginBottom: 16, padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}>
                {/* Send WhatsApp toggle */}
                <div className="filter-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fab fa-whatsapp" style={{ color: '#25d366', fontSize: 16 }}></i>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Send WhatsApp Confirmation</span>
                  </div>
                  <div
                    className={`toggle-switch ${sendWhatsApp ? 'active' : ''}`}
                    onClick={() => setSendWhatsApp(!sendWhatsApp)}
                  />
                </div>

                {/* Save customer toggle (only for new customers) */}
                {isNewCustomer && (
                  <div className="filter-row" style={{ padding: '8px 0', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="fas fa-user-plus" style={{ color: 'var(--accent-primary)', fontSize: 16 }}></i>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Save as New Customer</span>
                    </div>
                    <div
                      className={`toggle-switch ${saveCustomer ? 'active' : ''}`}
                      onClick={() => setSaveCustomer(!saveCustomer)}
                    />
                  </div>
                )}
              </div>

              {/* ── ORDER SUMMARY ── */}
              <div style={{
                marginBottom: 20, padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>KSh {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Discount ({discount}%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Shipping</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>KSh {shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)' }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* ── ACTIONS ── */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleProceedToConfirm}>
                  Review Order <i className="fas fa-arrow-right"></i>
                </button>
              </div>

              <div style={{ height: 20 }}></div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
