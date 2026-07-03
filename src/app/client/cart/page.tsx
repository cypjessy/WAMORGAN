'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hapticsImpact } from '@/lib/capacitor';
import { businessProfileService, orderService, cartService } from '@/lib/db';
import type { ShippingMethod, PickupStation } from '@/lib/db';
import { sendOrderConfirmation } from '@/lib/webhook-handlers/order-notification';
import CartHeader from './components/CartHeader';
import CartItemsSection, { CartItemData } from './components/CartItemsSection';
import EmptyCart from './components/EmptyCart';
import RemoveItemSheet from './components/RemoveItemSheet';
import ClientBottomNav from '../components/ClientBottomNav';
import Snackbar from './components/Snackbar';
import '../client.css';

interface PaymentMethodDef {
  value: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
}

export default function CartCheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [placing, setPlacing] = useState(false);

  // Firestore store config
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [pickupStations, setPickupStations] = useState<PickupStation[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDef[]>([]);
  const [rawPaymentConfig, setRawPaymentConfig] = useState<any>(null);

  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Payment
  const [selectedPayment, setSelectedPayment] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [productOrderId, setProductOrderId] = useState('');

  const counties = useMemo(() => {
    const set = new Set(pickupStations.filter(s => s.isActive).map(s => s.county));
    return [...set].sort();
  }, [pickupStations]);

  const towns = useMemo(() => {
    if (!selectedCounty) return [];
    const set = new Set(pickupStations.filter(s => s.isActive && s.county === selectedCounty).map(s => s.town));
    return [...set].sort();
  }, [pickupStations, selectedCounty]);

  const stations = useMemo(() => {
    if (!selectedTown) return [];
    return pickupStations.filter(s => s.isActive && s.county === selectedCounty && s.town === selectedTown);
  }, [pickupStations, selectedCounty, selectedTown]);

  // Sheets
  const [removeSheetOpen, setRemoveSheetOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: number; name: string; imageUrl: string; price: string } | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  // Load cart from Firestore
  useEffect(() => {
    if (!user) { setCartLoaded(true); return; }
    cartService.getCart(user.uid).then(items => {
      setCart(items.map((item, i) => ({
        id: i + 1,
        productId: item.productId,
        name: item.name,
        imageUrl: item.image || '',
        variant: '',
        price: item.price,
        qty: 1,
      })));
    }).catch(() => {}).finally(() => setCartLoaded(true));
  }, [user]);

  // Load delivery, pickup stations & payment methods from Firestore
  useEffect(() => {
    businessProfileService.getStoreConfig().then(config => {
      if (config.shippingMethods?.length) {
        setShippingMethods(config.shippingMethods);
      }
      if (config.pickupStations?.length) {
        setPickupStations(config.pickupStations.filter(s => s.isActive));
      }
      setRawPaymentConfig(config.paymentMethods || {});
      const pm = config.paymentMethods || {};
      const enabledPMs: PaymentMethodDef[] = [];
      if (pm.mpesa?.enabled) {
        if (pm.mpesa.buyGoods?.tillNumber) {
          enabledPMs.push({ value: 'mpesa_buygoods', label: `M-Pesa Buy Goods (Till: ${pm.mpesa.buyGoods.tillNumber})`, icon: 'fas fa-store', color: '#10b981', desc: 'Pay via M-Pesa Buy Goods' });
        }
        if (pm.mpesa.paybill?.paybillNumber) {
          const accountLabel = pm.mpesa.paybill.accountNumber ? ` - Acc: ${pm.mpesa.paybill.accountNumber}` : '';
          enabledPMs.push({ value: 'mpesa_paybill', label: `M-Pesa Paybill ${pm.mpesa.paybill.paybillNumber}${accountLabel}`, icon: 'fas fa-building', color: '#10b981', desc: 'Pay via M-Pesa Paybill' });
        }
        if (pm.mpesa.personal?.name) {
          enabledPMs.push({ value: 'mpesa_personal', label: `M-Pesa (${pm.mpesa.personal.name})`, icon: 'fas fa-user', color: '#10b981', desc: 'Pay via M-Pesa Personal' });
        }
      }
      if (pm.card?.enabled) enabledPMs.push({ value: 'card', label: 'Credit/Debit Card', icon: 'fas fa-credit-card', color: 'var(--accent-primary)', desc: 'Pay with your card' });
      if (pm.bank?.enabled) enabledPMs.push({ value: 'bank', label: 'Bank Transfer', icon: 'fas fa-building-columns', color: 'var(--info)', desc: 'Transfer to our bank account' });
      if (pm.cash?.enabled) enabledPMs.push({ value: 'cod', label: 'Cash on Delivery', icon: 'fas fa-money-bill', color: 'var(--warning)', desc: 'Pay when you receive' });
      if (enabledPMs.length > 0) {
        setPaymentMethods(enabledPMs);
        setSelectedPayment(enabledPMs[0].value);
      }
    }).catch(() => {});
  }, []);

  // Computed totals
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const discount = 0;
  const shippingCost = useMemo(() => {
    if (!selectedStation) return 0;
    const station = stations.find(s => s.id === selectedStation);
    if (!station) return 0;
    const countyFee = shippingMethods.find(s => s.name === station.county);
    return countyFee ? parseFloat(countyFee.price) || 0 : 0;
  }, [shippingMethods, selectedStation, stations]);
  const tax = useMemo(() => (subtotal - discount) * 0.08, [subtotal, discount]);
  const total = useMemo(() => subtotal - discount + shippingCost + tax, [subtotal, discount, shippingCost, tax]);

  const validate = (): string | null => {
    if (!customerName.trim()) return 'Please enter your name';
    if (!customerPhone.trim()) return 'Please enter your phone number';
    if (!selectedStation) return 'Please select a pickup station';
    if (!selectedPayment) return 'Please select a payment method';
    return null;
  };

  const handleUpdateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ));
  };

  const handleRemoveClick = (id: number) => {
    const item = cart.find(i => i.id === id);
    if (item) {
      setRemoveTarget({ id, name: item.name, imageUrl: item.imageUrl, price: `KSh ${item.price.toFixed(2)}` });
      setRemoveSheetOpen(true);
    }
  };

  const handleConfirmRemove = () => {
    if (removeTarget && user) {
      const item = cart.find(i => i.id === removeTarget.id);
      setCart(prev => prev.filter(item => item.id !== removeTarget.id));
      setRemoveSheetOpen(false);
      setRemoveTarget(null);
      if (item?.productId) cartService.removeFromCart(user.uid, item.productId);
      showToast('Item removed from cart', 'success');
    }
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep(0);
    }
  };

  const handlePlaceOrder = async () => {
    await hapticsImpact('medium');
    const error = validate();
    if (error) { showToast(error, 'error'); return; }
    if (placing) return;
    setPlacing(true);
    try {
      const selectedStationData = selectedStation ? stations.find(s => s.id === selectedStation) : null;
      const order = await orderService.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerId: user?.uid,
        items: cart.map(item => ({
          productId: item.productId || String(item.id),
          name: item.name,
          quantity: item.qty,
          price: item.price,
          imageUrl: item.imageUrl || undefined,
          orderLink: item.productId ? `${window.location.origin}/client/order/${item.productId}` : undefined,
        })),
        subtotal,
        shipping: shippingCost,
        tax,
        discount,
        total,
        status: 'pending',
        paymentMethod: selectedPayment,
        deliveryMethod: 'Pickup Station',
        pickupLocation: selectedStationData ? `${selectedStationData.stationName}, ${selectedStationData.town}, ${selectedStationData.county}` : undefined,
        source: 'member_portal',
      });
      setOrderNumber(order.orderNumber || order.id);
      setProductOrderId(order.id);
      setCart([]);
      if (user) cartService.clearCart(user.uid);
      setStep(3);
      showToast('Order placed successfully!', 'success');

      // Send WhatsApp confirmation
      if (customerPhone.trim()) {
        const pmLabel = paymentMethods.find(p => p.value === selectedPayment)?.label || selectedPayment;
        sendOrderConfirmation(customerPhone.trim(), {
          id: order.orderNumber || order.id,
          items: cart.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
            orderLink: item.productId ? `${window.location.origin}/client/order/${item.productId}` : undefined,
          })),
          total,
          customer: customerName.trim(),
          delivery: { method: 'pickup', pickupLocation: selectedStationData ? `${selectedStationData.stationName}, ${selectedStationData.town}, ${selectedStationData.county}` : '' },
          paymentInfo: { method: pmLabel },
        }).catch(err => console.error('Failed to send WhatsApp confirmation:', err));
      }
    } catch (e) {
      showToast('Failed to place order', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!productOrderId || !paymentMessage.trim()) return;
    setConfirmingPayment(true);
    try {
      await orderService.updateOrder(productOrderId, {
        paymentDetails: paymentMessage.trim(),
        paymentStatus: 'pending',
      });
      setPaymentConfirmed(true);
      showToast('Payment confirmation saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save payment confirmation', 'error');
    }
    setConfirmingPayment(false);
  };

  const empty = cart.length === 0;

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* ====== CART STEP ====== */}
      {step === 0 && (
        <>
          <div className="main-scroll cart-scroll" id="cartPage">
            <CartHeader onBack={handleBack} title="Shopping Cart" itemCount={itemCount} />

            {!cartLoaded ? (
              <div className="loading-state"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '32px auto' }} /></div>
            ) : empty ? (
              <EmptyCart onStartShopping={() => router.push('/client/shop')} />
            ) : (
              <>
                <CartItemsSection items={cart} onUpdateQty={handleUpdateQty} onRemove={handleRemoveClick} />
                <div style={{ height: 20 }}></div>
              </>
            )}
          </div>

          {!empty && cartLoaded && (
            <div style={{
              position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: 430, padding: '14px 20px',
              paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
              background: 'rgba(18, 18, 26, 0.98)', backdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 14, zIndex: 101,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total ({itemCount} items)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)' }}>KSh {subtotal.toFixed(2)}</div>
              </div>
              <button className="btn btn-primary" style={{ padding: '0 28px', height: 48 }} onClick={() => setStep(1)}>
                <i className="fas fa-truck"></i> Proceed to Checkout
              </button>
            </div>
          )}
        </>
      )}

      {/* ====== CHECKOUT STEP ====== */}
      {step === 1 && (
        <>
          <div className="main-scroll">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 16px', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
              <button className="back-btn" onClick={handleBack}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Complete Order</h2>
              <div style={{ width: 40 }} />
            </div>

            {/* Cart Items Summary */}
            <div style={{ margin: '0 20px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <div style={{ padding: 14, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="fas fa-shopping-cart" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i>
                <h4 style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>Order Items ({itemCount})</h4>
                <button onClick={() => setStep(0)} style={{ fontSize: 12, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                  Edit
                </button>
              </div>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} /> : '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ fontSize: 13, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h5>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Qty: {item.qty}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', flexShrink: 0 }}>KSh {(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                <span>Subtotal</span>
                <span style={{ color: 'var(--accent-primary)' }}>KSh {subtotal.toFixed(2)}</span>
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

            {/* Pickup Station */}
            <div style={{ margin: '0 20px 16px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-store" style={{ color: 'var(--accent-primary)', fontSize: 14 }}></i> Pickup Station
              </h4>

              {pickupStations.length > 0 ? (
                <>
                  <select
                    className="form-input form-select"
                    value={selectedCounty}
                    onChange={e => { setSelectedCounty(e.target.value); setSelectedTown(''); setSelectedStation(null); }}
                    style={{ marginBottom: 8 }}
                  >
                    <option value="">Select county</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {selectedCounty && (
                    <select
                      className="form-input form-select"
                      value={selectedTown}
                      onChange={e => { setSelectedTown(e.target.value); setSelectedStation(null); }}
                      style={{ marginBottom: 8 }}
                    >
                      <option value="">Select town</option>
                      {towns.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                  {selectedTown && (
                    <div>
                      {stations.map(station => (
                        <div key={station.id} onClick={() => setSelectedStation(station.id)}
                          style={{
                            padding: 14, borderRadius: 'var(--radius-md)',
                            background: selectedStation === station.id ? 'var(--accent-gradient-soft)' : 'var(--bg-card)',
                            border: `1.5px solid ${selectedStation === station.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            marginBottom: 6, cursor: 'pointer',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              border: `2px solid ${selectedStation === station.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                              background: selectedStation === station.id ? 'var(--accent-primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              {selectedStation === station.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
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
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="fas fa-store" style={{ fontSize: 20, marginBottom: 8, display: 'block' }}></i>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>No pickup stations available</span>
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
                  const active = selectedPayment === pm.value;
                  return (
                    <div key={pm.value} onClick={() => setSelectedPayment(pm.value)}
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
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Subtotal ({itemCount} item{itemCount > 1 ? 's' : ''})</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>KSh {subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Pickup Fee</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: shippingCost === 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {shippingCost === 0 ? 'FREE' : `KSh ${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Tax (8%)</span>
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
            width: '100%', maxWidth: 430, padding: '14px 20px',
            paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(18, 18, 26, 0.98)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 14, zIndex: 100,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total Amount</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)' }}>KSh {total.toFixed(2)}</div>
            </div>
            <button className="btn btn-primary" style={{ padding: '0 28px', height: 48 }} onClick={handlePlaceOrder} disabled={placing}>
              <i className="fas fa-lock"></i> {placing ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </>
      )}

      {/* ====== SUCCESS OVERLAY ====== */}
      {step === 3 && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto', padding: '40px 24px' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid var(--success)', opacity: 0.3 }} />
            <i className="fas fa-check" style={{ fontSize: 44, color: 'var(--success)' }}></i>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, textAlign: 'center' }}>Order Placed!</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, maxWidth: 300, marginBottom: 8 }}>
            {paymentConfirmed ? 'Payment confirmed! Your order is being processed.' : 'Complete your payment to confirm your order.'}
          </p>
          <div style={{ padding: '12px 24px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', margin: '12px 0', width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, textAlign: 'center' }}>Order Number</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-primary)', textAlign: 'center', fontFamily: 'monospace' }}>#{orderNumber}</div>
          </div>

          {/* Payment Instructions */}
          {!paymentConfirmed && rawPaymentConfig?.mpesa && selectedPayment.startsWith('mpesa') && (
            <div style={{ width: '100%', maxWidth: 320, marginBottom: 16 }}>
              <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', marginBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-credit-card" style={{ color: 'var(--accent-primary)' }}></i> Payment Instructions
                </h4>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <p style={{ marginBottom: 10, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Send <strong style={{ color: 'var(--accent-primary)' }}>KSh {total.toFixed(2)}</strong> via M-Pesa:
                  </p>
                  {selectedPayment === 'mpesa_buygoods' && rawPaymentConfig.mpesa.buyGoods?.tillNumber && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Buy Goods Till Number</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace', letterSpacing: 2 }}>{rawPaymentConfig.mpesa.buyGoods.tillNumber}</div>
                    </div>
                  )}
                  {selectedPayment === 'mpesa_paybill' && rawPaymentConfig.mpesa.paybill?.paybillNumber && (
                    <>
                      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Paybill Number</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace', letterSpacing: 2 }}>{rawPaymentConfig.mpesa.paybill.paybillNumber}</div>
                      </div>
                      {rawPaymentConfig.mpesa.paybill.accountNumber && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Account Number</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{rawPaymentConfig.mpesa.paybill.accountNumber}</div>
                        </div>
                      )}
                    </>
                  )}
                  {selectedPayment === 'mpesa_personal' && (
                    <>
                      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Send to</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{rawPaymentConfig.mpesa.personal.name}</div>
                      </div>
                      {rawPaymentConfig.mpesa.personal.phone && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Phone</div>
                          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{rawPaymentConfig.mpesa.personal.phone}</div>
                        </div>
                      )}
                    </>
                  )}
                  <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    After sending, paste the M-Pesa confirmation message below.
                  </p>
                </div>
              </div>

              {/* Payment Confirmation Textarea */}
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="payment-message" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-paste" style={{ marginRight: 6 }}></i>
                  Paste M-Pesa Confirmation Message
                </label>
                <textarea
                  id="payment-message"
                  autoFocus
                  style={{
                    width: '100%', minHeight: 100, padding: 14, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)', border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.6,
                    resize: 'vertical', outline: 'none',
                  }}
                  placeholder="Paste the M-Pesa confirmation message you received via SMS here..."
                  value={paymentMessage}
                  onChange={e => setPaymentMessage(e.target.value)}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  This helps us verify your payment and process your order faster.
                </p>
              </div>

              <button
                className="btn btn-primary"
                style={{ maxWidth: 320, width: '100%', marginBottom: 10 }}
                onClick={handleConfirmPayment}
                disabled={confirmingPayment || !paymentMessage.trim()}
              >
                <i className={confirmingPayment ? 'fas fa-spinner fa-spin' : 'fas fa-check-circle'}></i>
                {confirmingPayment ? 'Confirming...' : 'Confirm Payment'}
              </button>
            </div>
          )}

          {/* Non-M-Pesa or after payment shown */}
          {!paymentConfirmed && !(selectedPayment.startsWith('mpesa') && rawPaymentConfig?.mpesa) && (
            <div style={{ width: '100%', maxWidth: 320, marginBottom: 16 }}>
              <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', marginBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-credit-card" style={{ color: 'var(--accent-primary)' }}></i> Payment Instructions
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Please complete your payment of <strong style={{ color: 'var(--accent-primary)' }}>KSh {total.toFixed(2)}</strong> using {paymentMethods.find(p => p.value === selectedPayment)?.label || selectedPayment}.
                </p>
              </div>
              <button className="btn btn-ghost" style={{ maxWidth: 320, width: '100%' }} onClick={() => router.push('/client/orders')}>
                Skip, I'll pay later
              </button>
            </div>
          )}

          {/* Payment Confirmed State */}
          {paymentConfirmed && (
            <div style={{ width: '100%', maxWidth: 320, marginBottom: 24 }}>
              <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--success-soft)', border: '1px solid var(--success)', marginBottom: 16, textAlign: 'center' }}>
                <i className="fas fa-check-circle" style={{ fontSize: 24, color: 'var(--success)', marginBottom: 8 }}></i>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>Payment Confirmed</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your payment confirmation has been saved. The admin will verify and process your order.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Items</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{itemCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-primary)' }}>KSh {total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Payment</span>
                <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                  {paymentMethods.find(p => p.value === selectedPayment)?.label || selectedPayment}
                </span>
              </div>
            </div>
          )}

          {paymentConfirmed && (
            <>
              <button className="btn btn-primary" style={{ maxWidth: 320, width: '100%', marginBottom: 10 }} onClick={() => router.push('/client/orders')}>
                <i className="fas fa-box"></i> View My Orders
              </button>
              <button className="btn btn-ghost" style={{ maxWidth: 320, width: '100%' }} onClick={() => router.push('/client/shop')}>
                Continue Shopping
              </button>
            </>
          )}
        </div>
      )}

      {/* Bottom Nav (only on cart step) */}
      {step === 0 && <ClientBottomNav activeIndex={2} />}

      <RemoveItemSheet open={removeSheetOpen} onClose={() => setRemoveSheetOpen(false)} onConfirm={handleConfirmRemove} item={removeTarget} />

      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
