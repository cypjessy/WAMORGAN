'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { orderService, businessProfileService, cancellationRequestService } from '@/lib/db';
import { sendOrderConfirmation, sendOrderStatusUpdate, sendOrderCancellation } from '@/lib/webhook-handlers/order-notification';
import { sendMessage } from '@/lib/evolution';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { useInstanceName } from '@/utils/useInstanceName';
import BottomNav from '../components/BottomNav';
import OrdersPageHeader from './components/OrdersPageHeader';
import SummaryCards from './components/SummaryCards';
import DateRangeBar from './components/DateRangeBar';
import StatusTabs from './components/StatusTabs';
import OrderCard from './components/OrderCard';
import OrderDetailSheet from './components/OrderDetailSheet';
import StatusUpdateSheet from './components/StatusUpdateSheet';
import InvoiceSheet from './components/InvoiceSheet';
import OrdersFilterSheet from './components/OrdersFilterSheet';
import DatePickerSheet from './components/DatePickerSheet';
import CreateOrderDialog from './components/CreateOrderDialog';
import CancelDialog from './components/CancelDialog';
import PaidDialog from './components/PaidDialog';
import CancellationRequestsSheet from './components/CancellationRequestsSheet';
import Snackbar from './components/Snackbar';
import RefreshIndicator from './components/RefreshIndicator';
import MoreSheet from '../components/MoreSheet';
import './orders.css';

interface LocalOrderItem {
  productId?: string;
  name: string;
  emoji: string;
  price: number;
  qty: number;
}

interface LocalOrder {
  id: string;
  _firestoreId?: string;
  items: LocalOrderItem[];
  total: number;
  status: string;
  payment: string;
  customer: string;
  phone: string;
  email?: string;
  address?: string;
  delivery?: { method: string; address?: string; pickupLocation?: string; expectedDate?: string };
  paymentInfo?: { method: string; reference?: string };
  discount?: number;
  notes?: string;
  sendWhatsApp?: boolean;
  date: string;
  time: string;
  source: string;
}

function toFirestoreOrder(o: LocalOrder) {
  return {
    customerName: o.customer,
    customerPhone: o.phone,
    customerEmail: o.email,
    customerAddress: o.address,
    items: o.items.map(i => ({ productId: i.productId || '', name: i.name, quantity: i.qty, price: i.price })),
    subtotal: o.items.reduce((s, i) => s + i.price * i.qty, 0),
    shipping: 0,
    tax: 0,
    discount: o.discount || 0,
    total: o.total,
    status: o.status,
    paymentStatus: o.payment,
    deliveryMethod: o.delivery?.method,
    pickupLocation: o.delivery?.pickupLocation,
    notes: o.notes,
    source: o.source || 'Manual',
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const instanceName = useInstanceName();

  // Orders from Firestore
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [firestoreOrders, profile, cancelReqs] = await Promise.all([
        orderService.getOrders(),
        businessProfileService.getProfile(),
        cancellationRequestService.getAll().catch(() => []),
      ]);
      setCancelRequests(cancelReqs);
      setBusinessName(profile?.businessName || '');
      setOrders(firestoreOrders.map((o) => ({
        id: o.orderNumber || o.id,
        _firestoreId: o.id,
        items: o.items?.map(item => ({
          productId: item.productId,
          name: item.name,
          imageUrl: item.imageUrl || '',
          emoji: '📦',
          price: item.price,
          qty: item.quantity,
        })) || [],
        total: o.total,
        status: o.status,
        payment: o.paymentStatus || 'unpaid',
        customer: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail,
        address: o.customerAddress,
        delivery: o.deliveryMethod ? { method: o.deliveryMethod, pickupLocation: o.pickupLocation } : undefined,
        notes: o.notes,
        date: o.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString(),
        time: o.createdAt?.toDate?.()?.toLocaleTimeString() || '',
        source: o.source || 'Manual',
      })));
    } catch (err) { console.error('Failed to load orders:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  function getStatusCounts(orders: LocalOrder[]): Record<string, number> {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Status filter
  const [activeStatus, setActiveStatus] = useState('all');

  // Nav
  const [navIndex, setNavIndex] = useState(3); // Orders is at index 3 (after Home, Products, FAB, Chats)

  // Date
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const [dateRangeText, setDateRangeText] = useState(`${fmt(weekAgo)} — ${fmt(today)}, ${today.getFullYear()}`);
  const [periodLabel, setPeriodLabel] = useState('This Week');

  // FAB
  const [fabOpen, setFabOpen] = useState(false);

  // More sheet
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Cancellation requests
  const [cancelRequests, setCancelRequests] = useState<any[]>([]);
  const [cancelRequestsLoading, setCancelRequestsLoading] = useState(false);
  const [cancelRequestsOpen, setCancelRequestsOpen] = useState(false);
  const pendingCancelCount = cancelRequests.filter((r: any) => r.status === 'pending').length;

  // Sheets
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LocalOrder | null>(null);
  const [statusUpdateSheetOpen, setStatusUpdateSheetOpen] = useState(false);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  // Dialogs
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [paidDialogOpen, setPaidDialogOpen] = useState(false);

  // Filter state
  const [filterActive, setFilterActive] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);



  // Pull to refresh
  const [pullVisible, setPullVisible] = useState(false);
  const [pullSpinning, setPullSpinning] = useState(false);
  const touchStartY = useRef(0);
  const isRefreshing = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scroll = scrollRef.current;
    if (scroll && scroll.scrollTop <= 0) touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing.current) return;
    const scroll = scrollRef.current;
    if (!scroll || scroll.scrollTop > 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && diff < 100) setPullVisible(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const scroll = scrollRef.current;
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80 && scroll && scroll.scrollTop <= 0 && !isRefreshing.current) {
      isRefreshing.current = true;
      setPullSpinning(true);
      setTimeout(async () => {
        isRefreshing.current = false;
        setPullVisible(false);
        setPullSpinning(false);
        await loadOrders();
        showToast('Orders refreshed', 'success');
      }, 1500);
    } else {
      setPullVisible(false);
    }
  }, [showToast, loadOrders]);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (activeStatus !== 'all' && o.status !== activeStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const itemNames = o.items.map(i => i.name.toLowerCase()).join(' ');
      if (!o.id.toLowerCase().includes(q) && !itemNames.includes(q) && !o.customer.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Status counts
  const statusCounts = getStatusCounts(orders);

  // Handlers
  const handleOrderClick = useCallback((order: LocalOrder) => {
    setSelectedOrder(order);
    setDetailSheetOpen(true);
  }, []);

  const handleUpdateStatus = useCallback(async (status: string) => {
    if (!selectedOrder?._firestoreId) return;
    try {
      const oldStatus = selectedOrder.status;
      // Also update paymentStatus based on status: processing/completed → paid, pending → unpaid
      const updateData: any = { status: status as any };
      if (status === 'processing' || status === 'completed') {
        updateData.paymentStatus = 'paid';
      } else if (status === 'pending') {
        updateData.paymentStatus = 'unpaid';
      }
      await orderService.updateOrder(selectedOrder._firestoreId, updateData);
      if (selectedOrder.phone) {
        sendOrderStatusUpdate(selectedOrder.phone, selectedOrder.id, oldStatus, status, selectedOrder.customer);
      }
      showToast(`Status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`, 'success');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  }, [selectedOrder, showToast, loadOrders]);

  const handleApplyFilters = useCallback(() => {
    setFilterActive(true);
    showToast('Filters applied', 'success');
  }, [showToast]);

  const handleDateApply = useCallback((label: string) => {
    setPeriodLabel(label);
    showToast('Date range updated', 'success');
  }, [showToast]);

  const handleCancelOrder = useCallback(async () => {
    if (!selectedOrder?._firestoreId) return;
    try {
      await orderService.updateOrder(selectedOrder._firestoreId, { status: 'cancelled' });
      if (selectedOrder.phone) {
        sendOrderCancellation(selectedOrder.phone, selectedOrder.id, selectedOrder.customer);
      }
      setCancelDialogOpen(false);
      showToast('Order cancelled', 'success');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order', 'error');
    }
  }, [selectedOrder, showToast, loadOrders]);

  const handleConfirmPaid = useCallback(async () => {
    if (!selectedOrder?._firestoreId) return;
    try {
      await orderService.updateOrder(selectedOrder._firestoreId, { paymentStatus: 'paid', status: 'processing' });
      if (selectedOrder.phone) {
        const msg = `✅ *Payment Confirmed — ${selectedOrder.id}*\n\nHi *${selectedOrder.customer}*,\n\nYour payment of KSh ${selectedOrder.total.toFixed(2)} has been received and confirmed! 🎉\n\nWe'll start processing your order right away. Thank you! 🙏`;
        await sendMessage(instanceName, selectedOrder.phone, msg);
      }
      setPaidDialogOpen(false);
      showToast('Payment confirmed', 'success');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm payment', 'error');
    }
  }, [selectedOrder, showToast, loadOrders]);

  const handleCreateOrder = useCallback(async (data: any) => {
    try {
      const items = data.items || [];
      const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0);
      const discount = data.discount || 0;
      const shippingCost = data.shippingMethod ? Number(data.shippingMethod.price) || 0 : 0;
      const total = subtotal * (1 - discount / 100) + shippingCost;
      const orderData = {
        customerName: data.customer?.name || 'Customer',
        customerPhone: formatPhoneNumber(data.customer?.phone || ''),
        items: items.map((i: any) => ({ productId: i.productId || '', name: i.name, quantity: i.qty, price: i.price, imageUrl: i.imageUrl || '' })),
        subtotal,
        shipping: shippingCost,
        tax: 0,
        discount,
        total,
        status: 'pending' as const,
        paymentStatus: 'unpaid' as const,
        deliveryMethod: data.delivery?.method,
        pickupLocation: data.delivery?.pickupLocation,
        deliveryAddress: data.delivery?.method === 'delivery' ? data.delivery?.address : undefined,
        notes: data.notes,
        source: 'Manual',
        paymentMethod: data.payment?.method,
        paymentDetails: data.payment?.reference,
      };
      const created = await orderService.createOrder(orderData);
      showToast('Order created successfully!', 'success');
      loadOrders();

      if (data.sendWhatsApp && data.customer?.phone) {
        sendOrderConfirmation(data.customer.phone, {
          id: created.orderNumber || created.id,
          items: items,
          total: total,
          customer: data.customer.name,
          delivery: data.delivery,
          paymentInfo: data.payment,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create order', 'error');
    }
  }, [showToast, loadOrders]);

  const handleDownloadInvoice = useCallback(() => {
    showToast('Invoice downloaded', 'success');
  }, [showToast]);

  const handleApproveCancellation = useCallback(async (requestId: string, orderNumber: string) => {
    try {
      // Find the order in our local list
      const order = orders.find(o => o.id === orderNumber);
      if (!order?._firestoreId) {
        showToast('Order not found', 'error');
        return;
      }
      // Update cancellation request status
      await cancellationRequestService.update(requestId, {
        status: 'approved',
        respondedAt: new Date().toISOString(),
      });
      // Update order status to cancelled
      await orderService.updateOrder(order._firestoreId, { status: 'cancelled' });
      // Send WhatsApp notification
      if (order.phone) {
        const { sendOrderCancellation } = await import('@/lib/webhook-handlers/order-notification');
        sendOrderCancellation(order.phone, order.id, order.customer);
      }
      showToast('Cancellation approved', 'success');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve cancellation', 'error');
    }
  }, [orders, showToast, loadOrders]);

  const handleRejectCancellation = useCallback(async (requestId: string, orderNumber: string) => {
    try {
      // Find the order in our local list
      const order = orders.find(o => o.id === orderNumber);
      if (!order?._firestoreId) {
        showToast('Order not found', 'error');
        return;
      }
      // Update cancellation request status
      await cancellationRequestService.update(requestId, {
        status: 'rejected',
        respondedAt: new Date().toISOString(),
      });
      // Revert order status back to pending
      await orderService.updateOrder(order._firestoreId, { status: 'pending' });
      // Send WhatsApp notification
      if (order.phone) {
        const { sendMessage } = await import('@/lib/evolution');
        await sendMessage(instanceName, order.phone,
          `✅ *Cancellation Declined — ${orderNumber}*\n\n` +
          `Hi *${order.customer}*,\n\n` +
          `Your cancellation request has been reviewed and declined.\n` +
          `Your order is still active and will be processed.\n\n` +
          `If you have any questions, please contact our support team.`
        );
      }
      showToast('Cancellation rejected', 'success');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject cancellation', 'error');
    }
  }, [orders, instanceName, showToast, loadOrders]);

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(toastTimeout.current);
  }, []);

  return (
    <AuthGuard>
    <div className="app-container">
      {/* Status Bar */}
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Scroll */}
      <div className="main-scroll" ref={scrollRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <RefreshIndicator visible={pullVisible} spinning={pullSpinning} />

        <OrdersPageHeader
          totalCount={filteredOrders.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          onFilterClick={() => setFilterSheetOpen(true)}
          filterActive={filterActive}
          pendingCancellations={pendingCancelCount}
          onCancellationsClick={() => setCancelRequestsOpen(true)}
        />

        <SummaryCards totalRevenue={totalRevenue} totalOrders={orders.length} />

        <DateRangeBar
          dateRangeText={dateRangeText}
          periodLabel={periodLabel}
          onDatePickerClick={() => setDateSheetOpen(true)}
        />

        <StatusTabs
          activeStatus={activeStatus}
          counts={statusCounts}
          onSelect={setActiveStatus}
        />

        {filteredOrders.length === 0 ? (
          <div className="empty-state show">
            <div className="empty-icon"><i className="fas fa-clipboard-list"></i></div>
            <h3>No orders found</h3>
            <p>Try adjusting your search or filters, or create a new order to get started.</p>
            <button className="btn btn-primary" onClick={() => setCreateOrderOpen(true)}>
              <i className="fas fa-plus"></i> Create Order
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((o) => (
              <OrderCard key={o.id} order={o} onClick={() => handleOrderClick(o)} />
            ))}
          </div>
        )}

        <div style={{ height: '20px' }}></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeIndex={navIndex}
        fabOpen={fabOpen}
        onNavClick={(i) => {
          setNavIndex(i);
          const routes = ['/dashboard', '/products', '/chats', '/orders'];
          router.push(routes[i]);
        }}
        onFabClick={() => { setFabOpen(!fabOpen); setCreateOrderOpen(true); }}
        onMoreClick={() => setMoreSheetOpen(true)}
      />

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        open={detailSheetOpen}
        order={selectedOrder}
        onClose={() => setDetailSheetOpen(false)}
        onUpdateStatus={() => { setDetailSheetOpen(false); setStatusUpdateSheetOpen(true); }}
        onInvoice={() => { setDetailSheetOpen(false); setInvoiceSheetOpen(true); }}
        onCancel={() => { setDetailSheetOpen(false); setCancelDialogOpen(true); }}
      />

      {/* Status Update Sheet */}
      <StatusUpdateSheet
        open={statusUpdateSheetOpen}
        onClose={() => setStatusUpdateSheetOpen(false)}
        onSave={handleUpdateStatus}
        currentStatus={selectedOrder?.status}
      />

      {/* Invoice Sheet */}
      <InvoiceSheet
        open={invoiceSheetOpen}
        order={selectedOrder}
        onClose={() => setInvoiceSheetOpen(false)}
        onDownload={handleDownloadInvoice}
        businessName={businessName}
      />

      {/* Filter Sheet */}
      <OrdersFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={handleApplyFilters}
      />

      {/* Date Picker Sheet */}
      <DatePickerSheet
        open={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        onApply={handleDateApply}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOrderOpen}
        onClose={() => { setCreateOrderOpen(false); setFabOpen(false); }}
        onCreateOrder={handleCreateOrder}
        showToast={showToast}
      />

      {/* Cancellation Requests Sheet */}
      <CancellationRequestsSheet
        open={cancelRequestsOpen}
        requests={cancelRequests}
        onClose={() => setCancelRequestsOpen(false)}
        onApprove={handleApproveCancellation}
        onReject={handleRejectCancellation}
        isLoading={cancelRequestsLoading}
      />

      {/* Dialogs */}
      <CancelDialog
        open={cancelDialogOpen}
        orderId={selectedOrder?.id || ''}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelOrder}
      />

      <PaidDialog
        open={paidDialogOpen}
        orderId={selectedOrder?.id || ''}
        onClose={() => setPaidDialogOpen(false)}
        onConfirm={handleConfirmPaid}
      />

      {/* More Sheet */}
      <MoreSheet open={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} />

      {/* Toast */}
      <Snackbar visible={toastVisible} message={toastMessage} type={toastType} />
    </div>
    </AuthGuard>
  );
}
