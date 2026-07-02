'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { productService, orderService, businessProfileService } from '@/lib/db';
import type { ShippingMethod, PickupStation } from '@/lib/db';
import Snackbar from '../../cart/components/Snackbar';

const TAX_RATE = 0.08;

interface PaymentMethodDef {
  value: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
}

export default function ProductOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const productId = params?.productId as string;

  const [clock, setClock] = useState('9:41');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Product
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Store config from admin settings
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [pickupStations, setPickupStations] = useState<PickupStation[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDef[]>([]);

  // Form state
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedPickupStation, setSelectedPickupStation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Derived data
  const counties = useMemo(() => [...new Set(pickupStations.map(s => s.county))].sort(), [pickupStations]);
  const towns = useMemo(() =>
    [...new Set(pickupStations.filter(s => s.county === selectedCounty).map(s => s.town))].sort(),
    [pickupStations, selectedCounty]
  );
  const stationsForTown = useMemo(() =>
    pickupStations.filter(s => s.town === selectedTown && s.county === selectedCounty),
    [pickupStations, selectedCounty, selectedTown]
  );

  // UI state
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);

  // Load product + store config
  useEffect(() => {
    if (!productId) return;
    Promise.all([
      productService.getProductById(productId),
      businessProfileService.getStoreConfig(),
    ]).then(([p, config]) => {
      if (p) {
        setProduct(p);
        const variants = p.variants || [];
        const allColors = [...new Set(variants.map((v: any) => v.specs?.color).filter(Boolean))] as string[];
        const allSizes = [...new Set(variants.map((v: any) => v.specs?.size).filter(Boolean))] as string[];
        if (allColors.length > 0) setSelectedColor(allColors[0]);
        if (allSizes.length > 0) setSelectedSize(allSizes[0]);
      }
      if (config) {
        setShippingMethods(config.shippingMethods || []);
        setPickupStations((config.pickupStations || []).filter(s => s.isActive));
        const pm = config.paymentMethods || {};
        const enabledPMs: PaymentMethodDef[] = [];
        if (pm.mpesa?.enabled) enabledPMs.push({ value: 'mpesa', label: 'M-Pesa', icon: 'fas fa-mobile-screen', color: '#10b981', desc: 'Pay via M-Pesa mobile money' });
        if (pm.card?.enabled) enabledPMs.push({ value: 'card', label: 'Credit/Debit Card', icon: 'fas fa-credit-card', color: 'var(--accent-primary)', desc: 'Pay with your card' });
        if (pm.bank?.enabled) enabledPMs.push({ value: 'bank', label: 'Bank Transfer', icon: 'fas fa-building-columns', color: 'var(--info)', desc: 'Transfer to our bank account' });
        if (pm.cash?.enabled) enabledPMs.push({ value: 'cod', label: 'Cash on Delivery', icon: 'fas fa-money-bill', color: 'var(--warning)', desc: 'Pay when you receive' });
        if (enabledPMs.length > 0) {
          setPaymentMethods(enabledPMs);
          setPaymentMethod(enabledPMs[0].value);
        }
        if (config.shippingMethods.length > 0) setSelectedShipping(config.shippingMethods[0].id);
      }
    }).catch(err => console.error('Failed to load:', err))
    .finally(() => setLoading(false));
  }, [productId]);

  // Compute prices
  const price = useMemo(() => product?.salePrice || product?.price || 0, [product]);
  const subtotal = price * quantity;
  const shippingCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    const method = shippingMethods.find(s => s.id === selectedShipping);
    return method ? parseFloat(method.price) || 0 : 0;
  }, [shippingMethods, selectedShipping, deliveryMethod]);
  const tax = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal + shippingCost + tax);

  const validate = (): string | null => {
    if (!customerName.trim()) return 'Please enter your name';
    if (!customerPhone.trim()) return 'Please enter your phone number';
    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress.trim()) return 'Please enter your delivery address';
    } else {
      if (!selectedPickupStation) return 'Please select a pickup station';
    }
    if (deliveryMethod === 'delivery' && !selectedShipping) return 'Please select a shipping method';
    if (!paymentMethod) return 'Please select a payment method';
    return null;
  };

  const placeOrder = async () => {
    const error = validate();
    if (error) { showToast(error, 'error'); return; }

    setPlacing(true);
    try {
      const shippingMethod = shippingMethods.find(s => s.id === selectedShipping);
      const orderData = {
        customerId: user?.uid,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
        items: [{
          productId: product.id,
          name: product.name + (selectedColor || selectedSize ? ` (${[selectedColor, selectedSize].filter(Boolean).join(', ')})` : ''),
          quantity,
          price,
          imageUrl: product.imageUrl || undefined,
          orderLink: `${window.location.origin}/client/order/${product.id}`,
        }],
        subtotal,
        shipping: shippingCost,
        tax,
        discount: 0,
        total,
        paymentMethod,
        paymentStatus: 'unpaid' as const,
        deliveryMethod,
        pickupLocation: deliveryMethod === 'pickup' ? selectedPickupStation : undefined,
        shippingMethod: shippingMethod ? { name: shippingMethod.name, price: shippingMethod.price } : undefined,
        source: 'order-link',
        status: 'pending' as const,
      };

      const order = await orderService.createOrder(orderData);
      setOrderId(order.orderNumber || order.id);
      setSuccess(true);
      showToast('Order placed successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to place order', 'error');
    }
    setPlacing(false);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="bg-mesh"></div>
        <div className="noise-overlay"></div>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="app-container">
        <div className="bg-mesh"></div>
        <div className="noise-overlay"></div>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>📦</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Product Not Found</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>This product may have been removed or the link is invalid.</p>
          <button className="btn btn-primary" style={{ maxWidth: 240 }} onClick={() => router.push('/client/shop')}>Browse Products</button>
        </div>
        <Snackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type} onHide={() => setSnackbar(s => ({ ...s, visible: false }))} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      <div className="status-bar">
        <span className="time">{clock}</span>
        <div className="icons">
          <i className="fas fa-signal"></i>
          <i className="fas fa-wifi"></i>
          <i className="fas fa-battery-full"></i>
        </div>
      </div>

      <div className="main-scroll" style={{ height: 'calc(100% - 44px)', paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 16px', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
          <button className="back-btn" onClick={() => router.back()}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Complete Order</h2>
          <div style={{ width: 40 }} />
        </div>

        {/* Product Hero */}
        <div style={{ margin: '0 20px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: 240, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100, position: 'relative', ...(product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: 0 } : {}) }}>
            {product.emoji || '📦'}
            {product.originalPrice && (
              <span style={{ position: 'absolute', top: 12, left: 12, padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--error)', color: 'white', fontSize: 12, fontWeight: 800 }}>
                -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>
          <div style={{ padding: 16 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{product.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)' }}>KSh {price?.toFixed(2)}</span>
              {product.originalPrice && (
                <span style={{ fontSize: 16, color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 500 }}>KSh {product.originalPrice.toFixed(2)}</span>
              )}
            </div>
            {product.description && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{product.description}</p>
            )}
          </div>
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <>
            {(() => {
              const colors = [...new Set(product.variants.map((v: any) => v.specs?.color).filter(Boolean))] as string[];
              const sizes = [...new Set(product.variants.map((v: any) => v.specs?.size).filter(Boolean))] as string[];
              return (
                <>
                  {colors.length > 0 && (
                    <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-palette" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Select Color
                      </h4>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {colors.map(c => (
                          <button key={c} onClick={() => setSelectedColor(c)}
                            style={{
                              padding: '10px 18px', borderRadius: 'var(--radius-full)', background: selectedColor === c ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                              border: `1.5px solid ${selectedColor === c ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                              fontSize: 13, fontWeight: 600, color: selectedColor === c ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', background: c }}></span>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {sizes.length > 0 && (
                    <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-ruler" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Select Size
                      </h4>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {sizes.map(s => (
                          <button key={s} onClick={() => setSelectedSize(s)}
                            style={{
                              padding: '10px 18px', borderRadius: 'var(--radius-full)', background: selectedSize === s ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                              border: `1.5px solid ${selectedSize === s ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                              fontSize: 13, fontWeight: 600, color: selectedSize === s ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* Quantity */}
        <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-layer-group" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Quantity
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-minus"></i>
            </button>
            <span style={{ fontSize: 18, fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
              style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-user" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Your Details
          </h4>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" type="text" placeholder="John Doe" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className="form-input" type="tel" placeholder="+254 712 345 678" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email (optional)</label>
            <input className="form-input" type="email" placeholder="john@email.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
          </div>
        </div>

        {/* Delivery Method Toggle */}
        <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-truck" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Delivery Method
          </h4>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => setDeliveryMethod('delivery')}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: deliveryMethod === 'delivery' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                border: `1.5px solid ${deliveryMethod === 'delivery' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                color: deliveryMethod === 'delivery' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <i className="fas fa-truck"></i> Delivery
            </button>
            <button
              onClick={() => setDeliveryMethod('pickup')}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)',
                background: deliveryMethod === 'pickup' ? 'var(--accent-gradient-soft)' : 'var(--bg-elevated)',
                border: `1.5px solid ${deliveryMethod === 'pickup' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                color: deliveryMethod === 'pickup' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <i className="fas fa-store"></i> Pickup
            </button>
          </div>

          {deliveryMethod === 'delivery' ? (
            <>
              <div className="form-group">
                <label className="form-label">Delivery Address *</label>
                <textarea
                  className="form-input"
                  placeholder="Street, city, county"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  style={{ height: 80, padding: 14, resize: 'none', fontFamily: 'inherit' }}
                />
              </div>
              {shippingMethods.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <label className="form-label">Shipping Method *</label>
                  {shippingMethods.map(m => {
                    const cost = parseFloat(m.price) || 0;
                    const active = selectedShipping === m.id;
                    return (
                      <div key={m.id} onClick={() => setSelectedShipping(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 'var(--radius-md)',
                          background: active ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                          border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          marginBottom: 8, cursor: 'pointer',
                        }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: `2px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          background: active ? 'var(--accent-primary)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{m.name}</h5>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{m.description} · {m.estimatedDays}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: cost === 0 ? 'var(--success)' : 'var(--accent-primary)' }}>
                          {cost === 0 ? 'FREE' : `KSh ${cost.toFixed(2)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="form-label">Pickup Location *</label>
              {pickupStations.length > 0 ? (
                <>
                  <select
                    className="form-input form-select"
                    value={selectedCounty}
                    onChange={e => { setSelectedCounty(e.target.value); setSelectedTown(''); setSelectedPickupStation(''); }}
                    style={{ marginBottom: 8 }}
                  >
                    <option value="">Select county</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {selectedCounty && (
                    <select
                      className="form-input form-select"
                      value={selectedTown}
                      onChange={e => { setSelectedTown(e.target.value); setSelectedPickupStation(''); }}
                      style={{ marginBottom: 8 }}
                    >
                      <option value="">Select town</option>
                      {towns.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                  {selectedTown && (
                    <div>
                      {stationsForTown.map(station => {
                        const active = selectedPickupStation === station.stationName;
                        return (
                          <div key={station.id} onClick={() => setSelectedPickupStation(station.stationName)}
                            style={{
                              padding: 14, borderRadius: 'var(--radius-md)',
                              background: active ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                              border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                              marginBottom: 8, cursor: 'pointer',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                border: `2px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                background: active ? 'var(--accent-primary)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ fontSize: 14, fontWeight: 700 }}>{station.stationName}</h5>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{station.address}</p>
                                {station.contactPhone && (
                                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{station.contactPhone}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <input
                  className="form-input"
                  placeholder="Enter pickup location"
                  value={selectedPickupStation}
                  onChange={e => setSelectedPickupStation(e.target.value)}
                />
              )}
            </div>
          )}
        </div>

        {/* Payment Method */}
        {paymentMethods.length > 0 && (
          <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-credit-card" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Payment Method
            </h4>
            {paymentMethods.map(pm => {
              const active = paymentMethod === pm.value;
              return (
                <div key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 'var(--radius-md)',
                    background: active ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                    border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    marginBottom: 10, cursor: 'pointer',
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: active ? 'var(--accent-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    <i className={pm.icon} style={{ color: pm.color }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{pm.label}</h5>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{pm.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Summary */}
        <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-receipt" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Order Summary
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>KSh {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: shippingCost === 0 ? 'var(--success)' : undefined }}>
              {deliveryMethod === 'pickup' ? 'FREE' : shippingCost === 0 ? 'FREE' : `KSh ${shippingCost.toFixed(2)}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>KSh {tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, marginTop: 4, borderTop: '2px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)' }}>KSh {total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>

      {/* Sticky Bottom Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '14px 20px', background: 'rgba(18, 18, 26, 0.98)',
        backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 14, zIndex: 100,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total Amount</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)' }}>KSh {total.toFixed(2)}</div>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '0 28px' }} onClick={placeOrder} disabled={placing}>
          <i className="fas fa-lock"></i> {placing ? 'Placing...' : 'Place Order'}
        </button>
      </div>

      {/* Success Overlay */}
      {success && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid var(--success)', opacity: 0.3 }} />
            <i className="fas fa-check" style={{ fontSize: 44, color: 'var(--success)' }}></i>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, textAlign: 'center' }}>Order Placed!</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, maxWidth: 300, marginBottom: 8 }}>
            Your order has been confirmed and is being processed.
          </p>
          <div style={{ padding: '12px 24px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', margin: '20px 0', width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, textAlign: 'center' }}>Order Number</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)', textAlign: 'center', fontFamily: 'monospace' }}>#{orderId}</div>
          </div>
          <div style={{ width: '100%', maxWidth: 320, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Product</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{product.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>KSh {total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Payment</span>
              <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                {paymentMethods.find(p => p.value === paymentMethod)?.label || paymentMethod}
              </span>
            </div>
          </div>
          <button className="btn btn-primary" style={{ maxWidth: 320, marginBottom: 10 }} onClick={() => router.push('/client/orders')}>
            <i className="fas fa-box"></i> View My Orders
          </button>
          <button className="btn btn-ghost" style={{ maxWidth: 320 }} onClick={() => router.push('/client/shop')}>
            Continue Shopping
          </button>
        </div>
      )}

      <Snackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type} onHide={() => setSnackbar(s => ({ ...s, visible: false }))} />
    </div>
  );
}
