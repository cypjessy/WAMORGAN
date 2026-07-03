'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { businessProfileService, orderService } from '@/lib/db';
import type { ShippingMethod, PickupStation } from '@/lib/db';
import CartHeader from './components/CartHeader';
import CheckoutSteps from './components/CheckoutSteps';
import CartItemsSection, { CartItemData } from './components/CartItemsSection';
import PromoCode from './components/PromoCode';
import PriceBreakdown from './components/PriceBreakdown';
import SavedItems from './components/SavedItems';
import EmptyCart from './components/EmptyCart';
import AddressCard from './components/AddressCard';
import DeliveryMethod from './components/DeliveryMethod';
import PaymentMethod from './components/PaymentMethod';
import OrderSummaryCompact from './components/OrderSummaryCompact';
import SuccessPage from './components/SuccessPage';
import StickyBottom from './components/StickyBottom';
import RemoveItemSheet from './components/RemoveItemSheet';
import AddAddressSheet from './components/AddAddressSheet';
import AddCardSheet from './components/AddCardSheet';
import ConfirmOrderDialog from './components/ConfirmOrderDialog';
import PaymentFailDialog from './components/PaymentFailDialog';
import ClientBottomNav from '../components/ClientBottomNav';
import Snackbar from './components/Snackbar';
import '../client.css';

interface PaymentOption {
  icon: string;
  iconStyle?: React.CSSProperties;
  name: string;
  description: string;
  value: string;
}

const savedItems: Array<{ name: string; price: string; imageUrl: string }> = [];

const defaultAddresses = [
  { label: 'Home', address: '123 Main Street, Apt 4B\nNew York, NY 10001\nUnited States', isDefault: true },
  { label: 'Office', address: '456 Business Ave, Suite 200\nBrooklyn, NY 11201\nUnited States' },
];

export default function CartCheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [promoActive, setPromoActive] = useState(false);
  const [promoRate, setPromoRate] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [addressesList] = useState(defaultAddresses);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [placing, setPlacing] = useState(false);

  // Firestore data
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [pickupStations, setPickupStations] = useState<PickupStation[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([
    { icon: 'fas fa-credit-card', iconStyle: { color: 'var(--accent-primary)' }, name: 'Credit Card', description: 'Pay with card', value: 'card' },
    { icon: 'fas fa-money-bill', iconStyle: { background: 'var(--warning-soft)', color: 'var(--warning)' }, name: 'Cash on Delivery', description: 'Pay when you receive', value: 'cod' },
  ]);

  // Pickup station drill-down
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

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
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wamorgan_cart');
      if (saved) {
        const items: Array<{ productId?: string; image: string; name: string; price: number }> = JSON.parse(saved);
        setCart(items.map((item, i) => ({
          id: i + 1,
          productId: item.productId,
          name: item.name,
          imageUrl: item.image || '',
          variant: '',
          price: item.price,
          qty: 1,
        })));
      }
    } catch {}
    setCartLoaded(true);
  }, []);

  // Save cart back to localStorage
  useEffect(() => {
    if (!cartLoaded) return;
    try {
      localStorage.setItem('wamorgan_cart', JSON.stringify(cart.map(item => ({
        image: item.imageUrl, name: item.name, price: item.price, productId: item.productId,
      }))));
    } catch {}
  }, [cart, cartLoaded]);

  // Load delivery, pickup stations & payment methods from Firestore
  useEffect(() => {
    businessProfileService.getStoreConfig().then(config => {
      if (config.shippingMethods?.length) {
        setShippingMethods(config.shippingMethods);
        setSelectedDelivery(config.shippingMethods[0]?.id || 'standard');
      }
      if (config.pickupStations?.length) {
        setPickupStations(config.pickupStations.filter(s => s.isActive));
      }
      const opts: PaymentOption[] = [];
      const pm = config.paymentMethods;
      if (pm?.card?.enabled) {
        opts.push({ icon: 'fas fa-credit-card', iconStyle: { color: 'var(--accent-primary)' }, name: 'Credit Card', description: 'Pay with card', value: 'card' });
      }
      if (pm?.cash?.enabled) {
        opts.push({ icon: 'fas fa-money-bill', iconStyle: { background: 'var(--warning-soft)', color: 'var(--warning)' }, name: 'Cash on Delivery', description: 'Pay when you receive', value: 'cod' });
      }
      if (pm?.mpesa?.enabled) {
        let desc = 'M-Pesa';
        if (pm.mpesa.paybill?.enabled) desc = `Paybill ${pm.mpesa.paybill.paybillNumber}`;
        else if (pm.mpesa.buyGoods?.enabled) desc = `Till ${pm.mpesa.buyGoods.tillNumber}`;
        opts.push({ icon: 'fas fa-mobile-alt', iconStyle: { background: 'var(--success-soft)', color: 'var(--success)' }, name: 'M-Pesa', description: desc, value: 'mpesa' });
      }
      if (pm?.bank?.enabled) {
        opts.push({ icon: 'fas fa-university', iconStyle: { color: 'var(--info)' }, name: 'Bank Transfer', description: pm.bank.bankName || 'Bank transfer', value: 'bank' });
      }
      if (opts.length) setPaymentOptions(opts);
    }).catch(() => {});
  }, []);

  const deliveryOptions = useMemo(() =>
    shippingMethods.map(sm => ({
      name: sm.name,
      description: sm.estimatedDays ? `${sm.estimatedDays} days` : sm.description,
      price: sm.price === '0' || sm.price === 'Free' ? 'Free' : `KSh ${sm.price}`,
      value: sm.id,
    })),
  [shippingMethods]);

  // Computed totals
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const discount = useMemo(() => promoActive ? subtotal * promoRate : 0, [subtotal, promoActive, promoRate]);
  const shippingCost = useMemo(() => {
    if (deliveryMode === 'pickup') return 0;
    const sm = shippingMethods.find(s => s.id === selectedDelivery);
    return sm ? parseFloat(sm.price) || 0 : 0;
  }, [selectedDelivery, shippingMethods, deliveryMode]);
  const tax = useMemo(() => (subtotal - discount) * 0.08, [subtotal, discount]);
  const total = useMemo(() => subtotal - discount + shippingCost + tax, [subtotal, discount, shippingCost, tax]);

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
    if (removeTarget) {
      setCart(prev => prev.filter(item => item.id !== removeTarget.id));
      setRemoveSheetOpen(false);
      setRemoveTarget(null);
      showToast('Item removed from cart', 'success');
    }
  };

  const handlePromoApply = (success: boolean, rate: number) => {
    if (success) {
      setPromoActive(true);
      setPromoRate(rate);
      showToast('Promo code applied!', 'success');
    } else {
      showToast('Invalid promo code', 'error');
    }
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handlePlaceOrder = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmOrder = async () => {
    setConfirmDialogOpen(false);
    if (placing) return;
    setPlacing(true);
    try {
      const selectedStationData = selectedStation ? stations.find(s => s.id === selectedStation) : null;
      const order = await orderService.createOrder({
        customerName: 'Member',
        customerPhone: '',
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
        paymentMethod: selectedPayment === 'mpesa' ? 'M-Pesa' : selectedPayment === 'card' ? 'Card' : selectedPayment === 'cod' ? 'Cash on Delivery' : 'Bank Transfer',
        deliveryMethod: deliveryMode === 'pickup' ? 'Pickup Station' : shippingMethods.find(s => s.id === selectedDelivery)?.name || selectedDelivery,
        pickupLocation: selectedStationData ? `${selectedStationData.stationName}, ${selectedStationData.town}, ${selectedStationData.county}` : undefined,
        source: 'member_portal',
      });
      setOrderNumber(order.orderNumber || order.id);
      setCart([]);
      localStorage.removeItem('wamorgan_cart');
      setStep(3);
      showToast('Order placed successfully!', 'success');
    } catch (e) {
      setFailDialogOpen(true);
    } finally {
      setPlacing(false);
    }
  };

  const handleAddAddressSave = (addr: any) => {
    setAddAddressOpen(false);
    showToast('Address added successfully', 'success');
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
            <CheckoutSteps currentStep={0} />

            {!cartLoaded ? (
              <div className="loading-state"><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '32px auto' }} /></div>
            ) : empty ? (
              <EmptyCart onStartShopping={() => router.push('/client/shop')} />
            ) : (
              <>
                <CartItemsSection items={cart} onUpdateQty={handleUpdateQty} onRemove={handleRemoveClick} />
                <PromoCode onApply={handlePromoApply} applied={promoActive} discount={discount} />
                <PriceBreakdown subtotal={subtotal} discount={discount} shipping="Calculated at next step" tax="Calculated at next step" total={subtotal - discount} />
                {savedItems.length > 0 && (
                  <SavedItems items={savedItems} onMoveToCart={(item) => showToast(`${item.name} moved to cart`, 'success')} onRemove={(item) => showToast(`${item.name} removed from saved`, 'success')} />
                )}
                <div style={{ height: 20 }}></div>
              </>
            )}
          </div>

          {!empty && cartLoaded && (
            <StickyBottom total={subtotal - discount} label={`Total (${itemCount} items)`} buttonText="Proceed to Shipping" buttonIcon="fas fa-truck" onAction={() => setStep(1)} />
          )}
        </>
      )}

      {/* ====== SHIPPING STEP ====== */}
      {step === 1 && (
        <>
          <div className="main-scroll cart-scroll" id="shippingPage">
            <CartHeader onBack={handleBack} title="Shipping" itemCount={itemCount} />
            <CheckoutSteps currentStep={1} />

            {/* Delivery Mode Toggle */}
            {pickupStations.length > 0 && (
              <div style={{ display: 'flex', margin: '0 20px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <button
                  onClick={() => setDeliveryMode('delivery')}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    background: deliveryMode === 'delivery' ? 'var(--accent-primary)' : 'transparent',
                    color: deliveryMode === 'delivery' ? 'white' : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                  }}
                >
                  <i className="fas fa-truck"></i> Delivery
                </button>
                <button
                  onClick={() => setDeliveryMode('pickup')}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    background: deliveryMode === 'pickup' ? 'var(--accent-primary)' : 'transparent',
                    color: deliveryMode === 'pickup' ? 'white' : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                  }}
                >
                  <i className="fas fa-store"></i> Pickup Station
                </button>
              </div>
            )}

            {deliveryMode === 'delivery' ? (
              <>
                <div className="section-header" style={{ padding: '0 20px', marginBottom: 12 }}>
                  <span className="section-title">Delivery Address</span>
                </div>
                {addressesList.map((addr, i) => (
                  <AddressCard key={i} address={addr} selected={selectedAddress === i} onSelect={() => setSelectedAddress(i)} />
                ))}
                <button className="add-address-btn" onClick={() => setAddAddressOpen(true)}>
                  <i className="fas fa-plus"></i> Add New Address
                </button>

                <div className="section-header" style={{ padding: '0 20px', margin: '20px 0 12px' }}>
                  <span className="section-title">Delivery Method</span>
                </div>
                <DeliveryMethod options={deliveryOptions} selected={selectedDelivery} onSelect={setSelectedDelivery} />
              </>
            ) : (
              <>
                {/* County Selection */}
                <div className="section-header" style={{ padding: '0 20px', marginBottom: 12 }}>
                  <span className="section-title">Select County</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 20px', marginBottom: 16 }}>
                  {counties.map(county => (
                    <button
                      key={county}
                      onClick={() => { setSelectedCounty(county); setSelectedTown(''); setSelectedStation(null); }}
                      style={{
                        padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)',
                        background: selectedCounty === county ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                        color: selectedCounty === county ? 'white' : 'var(--text-secondary)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {county}
                    </button>
                  ))}
                </div>

                {/* Town Selection */}
                {selectedCounty && towns.length > 0 && (
                  <>
                    <div className="section-header" style={{ padding: '0 20px', marginBottom: 12 }}>
                      <span className="section-title">Select Town</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 20px', marginBottom: 16 }}>
                      {towns.map(town => (
                        <button
                          key={town}
                          onClick={() => { setSelectedTown(town); setSelectedStation(null); }}
                          style={{
                            padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)',
                            background: selectedTown === town ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                            color: selectedTown === town ? 'white' : 'var(--text-secondary)',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {town}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Station Cards */}
                {selectedTown && stations.length > 0 && (
                  <>
                    <div className="section-header" style={{ padding: '0 20px', marginBottom: 12 }}>
                      <span className="section-title">Select Pickup Station</span>
                    </div>
                    {stations.map(station => (
                      <div
                        key={station.id}
                        onClick={() => setSelectedStation(station.id)}
                        style={{
                          padding: '14px 16px', margin: '0 20px 8px', borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-elevated)', border: `1.5px solid ${selectedStation === station.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>
                              <i className="fas fa-location-dot" style={{ color: 'var(--accent-primary)', marginRight: 6, fontSize: 12 }}></i>
                              {station.stationName}
                            </h4>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{station.address}</p>
                          </div>
                          {selectedStation === station.id && (
                            <i className="fas fa-check-circle" style={{ color: 'var(--accent-primary)', fontSize: 18, flexShrink: 0 }}></i>
                          )}
                        </div>
                        {station.contactPhone && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                            <i className="fas fa-phone" style={{ marginRight: 4 }}></i> {station.contactPhone}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            <div style={{ height: 20 }}></div>
          </div>

          <StickyBottom total={total} label="Total" buttonText="Continue to Payment" buttonIcon="fas fa-credit-card" onAction={() => setStep(2)} />
        </>
      )}

      {/* ====== PAYMENT STEP ====== */}
      {step === 2 && (
        <>
          <div className="main-scroll cart-scroll" id="paymentPage">
            <CartHeader onBack={handleBack} title="Payment" itemCount={itemCount} />
            <CheckoutSteps currentStep={2} />

            <OrderSummaryCompact items={cart} />
            <PriceBreakdown subtotal={subtotal} discount={discount} shipping={shippingCost === 0 ? 'Free' : `KSh ${shippingCost.toFixed(2)}`} tax={`KSh ${tax.toFixed(2)}`} total={total} />

            <div className="section-header" style={{ padding: '0 20px', margin: '0 0 12px' }}>
              <span className="section-title">Payment Method</span>
            </div>
            <PaymentMethod options={paymentOptions} selected={selectedPayment} onSelect={setSelectedPayment} />
            <button className="add-payment-btn" onClick={() => setAddCardOpen(true)}>
              <i className="fas fa-plus"></i> Add New Card
            </button>

            <div style={{ height: 20 }}></div>
          </div>

          <StickyBottom total={total} label="Total" buttonText="Place Order" buttonIcon="fas fa-lock" onAction={handlePlaceOrder} />
        </>
      )}

      {/* ====== SUCCESS STEP ====== */}
      {step === 3 && (
        <div className="main-scroll cart-scroll" id="successPage">
          <SuccessPage
            orderNumber={orderNumber}
            onTrackOrder={() => router.push('/client/orders')}
            onContinueShopping={() => router.push('/client/shop')}
            onShareReceipt={() => showToast('Receipt shared', 'success')}
          />
        </div>
      )}

      {/* Bottom Nav */}
      <ClientBottomNav activeIndex={2} />

      <RemoveItemSheet open={removeSheetOpen} onClose={() => setRemoveSheetOpen(false)} onConfirm={handleConfirmRemove} item={removeTarget} />
      <AddAddressSheet open={addAddressOpen} onClose={() => setAddAddressOpen(false)} onSave={handleAddAddressSave} />
      <AddCardSheet open={addCardOpen} onClose={() => setAddCardOpen(false)} onSave={() => { setAddCardOpen(false); showToast('Card added successfully', 'success'); }} />
      <ConfirmOrderDialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} onConfirm={handleConfirmOrder} total={total} />
      <PaymentFailDialog open={failDialogOpen} onClose={() => setFailDialogOpen(false)} onRetry={() => { setFailDialogOpen(false); showToast('Retrying payment...', 'success'); }} />

      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
