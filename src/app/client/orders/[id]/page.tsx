'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderService } from '@/lib/db';
import OrderStatusCard from './components/OrderStatusCard';
import MapSection from './components/MapSection';
import CourierCard from './components/CourierCard';
import EstimateCard from './components/EstimateCard';
import TimelineSection from './components/TimelineSection';
import OrderItemsSection from './components/OrderItemsSection';
import ActionGrid from './components/ActionGrid';
import CancelSheet from './components/CancelSheet';
import ReturnSheet from './components/ReturnSheet';
import HelpSheet from './components/HelpSheet';
import CancelConfirmDialog from './components/CancelConfirmDialog';
import ReturnConfirmDialog from './components/ReturnConfirmDialog';
import ShareDialog from './components/ShareDialog';
import ClientBottomNav from '../../components/ClientBottomNav';
import Snackbar from './components/Snackbar';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function buildTimeline(order: any) {
  const createdDate = order.createdAt?.toDate
    ? order.createdAt.toDate()
    : new Date(order.createdAt || Date.now());

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const status = order.status?.toLowerCase() || 'pending';
  const steps = [
    { icon: 'fas fa-check', title: 'Order Placed', description: 'Your order has been confirmed and is being processed', time: fmtDate(createdDate), status: 'done' as const },
    { icon: 'fas fa-credit-card', title: 'Payment Confirmed', description: 'Payment received successfully', time: fmtDate(createdDate), status: (status === 'pending' ? 'pending' : 'done') as 'done' | 'pending' },
    { icon: 'fas fa-box', title: 'Order Processed', description: 'Items packed and ready for shipment', time: fmtDate(addDays(createdDate, 1)), status: (['pending', 'confirmed'].includes(status) ? 'pending' : 'done') as 'done' | 'pending' },
    { icon: 'fas fa-truck', title: 'Shipped', description: 'Package is in transit', time: fmtDate(addDays(createdDate, 2)), status: (status === 'shipped' ? 'current' : ['delivered', 'cancelled', 'refunded'].includes(status) ? 'done' : 'pending') as 'done' | 'current' | 'pending' },
    { icon: 'fas fa-house', title: 'Delivered', description: 'Package delivered to your address', time: fmtDate(addDays(createdDate, 4)), status: (status === 'delivered' ? 'done' : 'pending') as 'done' | 'pending' },
  ];

  if (['cancelled', 'refunded'].includes(status)) {
    steps[4] = {
      icon: status === 'cancelled' ? 'fas fa-xmark' : 'fas fa-rotate-left',
      title: status === 'cancelled' ? 'Cancelled' : 'Refunded',
      description: status === 'cancelled' ? 'Order has been cancelled' : 'Refund has been processed',
      time: fmtDate(addDays(createdDate, 1)),
      status: 'done' as const,
    };
  }

  return steps;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState('9:41');

  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [returnedItems, setReturnedItems] = useState<string[]>([]);

  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    orderService.getOrderById(orderId)
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        showToast('Order not found', 'error');
        setLoading(false);
      });
  }, [orderId]);

  const handleBack = () => router.back();

  const statusBadge = (order?.status?.toLowerCase() === 'shipped' ? 'shipped' :
    order?.status?.toLowerCase() === 'delivered' ? 'delivered' : 'processing') as 'shipped' | 'delivered' | 'processing';

  const firstItem = order?.items?.[0] || {};
  const orderDateStr = order?.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : order?.createdAt || '';

  const estDeliveryDate = order?.createdAt?.toDate
    ? (() => { const d = new Date(order.createdAt.toDate()); d.setDate(d.getDate() + 4); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); })()
    : order?.updatedAt || '';

  const daysLeft = order?.createdAt?.toDate
    ? (() => { const diff = Math.ceil((new Date(order.createdAt.toDate()).getTime() + 4 * 86400000 - Date.now()) / 86400000); return diff > 0 ? `${diff} days` : 'Today'; })()
    : '—';

  const timelineSteps = order ? buildTimeline(order) : [];

  const displayItems = (order?.items || []).map((item: any) => ({
    imageUrl: item.imageUrl || '',
    name: item.name,
    variant: item.orderLink ? `🔗 Re-order: ${item.orderLink}` : '',
    price: `KSh ${(item.price * item.quantity).toFixed(2)}`,
  }));

  const actions = [
    { icon: 'fas fa-xmark', label: 'Cancel Order', onClick: () => setCancelOpen(true) },
    { icon: 'fas fa-rotate-left', label: 'Return Items', onClick: () => setReturnOpen(true) },
    { icon: 'fas fa-file-invoice', label: 'Download Invoice', onClick: () => showToast('Invoice downloaded', 'success') },
    { icon: 'fas fa-headset', label: 'Need Help', onClick: () => setHelpOpen(true) },
  ];

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/client/orders/${orderId}`
    : '';

  const handleShare = () => {
    setShareDialogOpen(false);
    const text = encodeURIComponent(`Track my order ${order?.orderNumber || orderId}: ${trackingUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    showToast('Link copied to clipboard', 'success');
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

  if (!order) {
    return (
      <div className="app-container">
        <div className="bg-mesh"></div>
        <div className="noise-overlay"></div>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>📦</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Order Not Found</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>This order may have been removed or the link is invalid.</p>
          <button className="btn btn-primary" style={{ maxWidth: 240 }} onClick={() => router.push('/client/orders')}>My Orders</button>
        </div>
        <Snackbar visible={snackbar.visible} message={snackbar.message} type={snackbar.type} onHide={hideToast} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="status-bar">
        <span className="time">{clock}</span>
        <div className="icons"><i className="fas fa-signal"></i><i className="fas fa-wifi"></i><i className="fas fa-battery-full"></i></div>
      </div>
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      <div className="main-scroll order-scroll" id="mainScroll">
        <div className="page-header">
          <button className="back-btn" onClick={handleBack}><i className="fas fa-arrow-left"></i></button>
          <h2>Track Order</h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setHelpOpen(true)}><i className="fas fa-circle-question"></i></button>
            <button className="icon-btn" onClick={() => setShareDialogOpen(true)}><i className="fas fa-share-nodes"></i></button>
          </div>
        </div>

        <OrderStatusCard
          imageUrl={firstItem.imageUrl || ''}
          productName={firstItem.name || `Order ${order.orderNumber || order.id}`}
          orderNumber={order.orderNumber || order.id}
          status={statusBadge}
          orderDate={orderDateStr}
          estDelivery={estDeliveryDate}
          courier={order.deliveryMethod || 'Standard'}
          trackingNumber={order.id?.slice(-8).toUpperCase() || '—'}
        />

        <MapSection onViewMap={() => showToast('Full map view coming soon', 'success')} />

        <CourierCard
          avatar={order.deliveryMethod?.charAt(0)?.toUpperCase() || 'C'}
          name={order.deliveryMethod || 'Standard Delivery'}
          onCall={() => showToast('Calling courier...', 'success')}
          onMessage={() => showToast('Messaging courier...', 'success')}
        />

        <EstimateCard estimate={estDeliveryDate || 'To be confirmed'} daysLeft={daysLeft} />

        <TimelineSection steps={timelineSteps} />

        <OrderItemsSection items={displayItems} />

        <ActionGrid actions={actions} />

        <div style={{ height: 20 }}></div>
      </div>

      <ClientBottomNav activeIndex={4} />

      <CancelSheet open={cancelOpen} onClose={() => setCancelOpen(false)} onContinue={(reason) => { setCancelOpen(false); setTimeout(() => setCancelConfirmOpen(true), 300); }} />
      <ReturnSheet open={returnOpen} onClose={() => setReturnOpen(false)} onSubmit={(items, reason) => { setReturnedItems(items); setReturnOpen(false); setTimeout(() => setReturnConfirmOpen(true), 300); }} items={displayItems} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} onOption={(opt) => showToast(`${opt} coming soon`, 'success')} />

      <CancelConfirmDialog open={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)} onConfirm={() => { setCancelConfirmOpen(false); showToast('Order cancelled successfully', 'success'); }} />
      <ReturnConfirmDialog open={returnConfirmOpen} onClose={() => setReturnConfirmOpen(false)} items={returnedItems} />
      <ShareDialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} onCopy={handleCopy} onShare={handleShare} trackingUrl={trackingUrl} />

      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
