'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './customers.css';
import AuthGuard from '@/components/AuthGuard';
import { customerService } from '@/lib/db';
import { sendMessage } from '@/lib/evolution';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { useInstanceName } from '@/utils/useInstanceName';
import BottomNav from '../components/BottomNav';
import CustomersPageHeader from './components/CustomersPageHeader';
import SegmentTabs from './components/SegmentTabs';
import type { SegmentType } from './components/SegmentTabs';
import CustomerList from './components/CustomerList';
import type { Customer } from './components/CustomerItem';
import CustomerProfileSheet from './components/CustomerProfileSheet';
import SegmentsSheet from './components/SegmentsSheet';
import CustomerFormSheet from './components/CustomerFormSheet';
import DeleteDialog from './components/DeleteDialog';
import Snackbar from './components/Snackbar';
import RefreshIndicator from './components/RefreshIndicator';
import AlphabetIndex from './components/AlphabetIndex';
import MoreSheet from '../components/MoreSheet';

export default function CustomersPage() {
  const router = useRouter();
  const instanceName = useInstanceName();

  // Theme
  const [theme, setTheme] = useState('light');

  // Customers from Firestore
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const dbCustomers = await customerService.getCustomers();
      setCustomers(dbCustomers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        segment: c.segment || 'regular',
        spent: c.spent || 0,
        orders: c.orders || 0,
        avg: c.avg || 0,
        lastOrder: c.lastOrder || 'Never',
        notes: c.notes || '',
      })));
    } catch (err) { console.error('Failed to load customers:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Nav
  const [navIndex, setNavIndex] = useState(4);
  const [fabOpen, setFabOpen] = useState(false);

  // More sheet
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Segment
  const [currentSegment, setCurrentSegment] = useState<SegmentType>('all');

  // Profile sheet
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Segments sheet
  const [segmentsSheetOpen, setSegmentsSheetOpen] = useState(false);

  // Add/Edit form
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

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
  const [pullOffset, setPullOffset] = useState(0);
  const touchStartY = useRef(0);
  const isRefreshing = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scroll = scrollRef.current;
    if (scroll && scroll.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing.current) return;
    const scroll = scrollRef.current;
    if (!scroll || scroll.scrollTop > 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0 && diff < 100) {
      setPullVisible(true);
      setPullOffset(diff);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const scroll = scrollRef.current;
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80 && scroll && scroll.scrollTop <= 0 && !isRefreshing.current) {
      isRefreshing.current = true;
      setPullSpinning(true);
      loadCustomers().then(() => {
        isRefreshing.current = false;
        setPullVisible(false);
        setPullSpinning(false);
        setPullOffset(0);
        showToast('Customers refreshed', 'success');
      });
    } else {
      setPullVisible(false);
      setPullOffset(0);
    }
  }, [showToast, loadCustomers]);

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.email || '').toLowerCase().includes(q) && !(c.phone || '').toLowerCase().includes(q)) return false;
    }
    if (currentSegment !== 'all' && c.segment !== currentSegment) return false;
    return true;
  });

  // Handlers
  const handleClearSearch = () => setSearchQuery('');

  const handleCustomerClick = useCallback((id: string) => {
    const c = customers.find((x) => x.id === id);
    if (c) {
      setSelectedCustomer(c);
      setProfileSheetOpen(true);
    }
  }, [customers]);

  const handleEditClick = useCallback((id: string) => {
    const c = customers.find((x) => x.id === id);
    if (c) setEditingCustomer(c);
    setFormMode('edit');
    setFormSheetOpen(true);
  }, [customers]);

  const handleDeleteClick = useCallback((id: string) => {
    const c = customers.find((x) => x.id === id);
    if (c) {
      setDeleteTarget(c);
      setDeleteDialogOpen(true);
    }
  }, [customers]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      try {
        await customerService.deleteCustomer(deleteTarget.id);
        showToast('Customer deleted', 'success');
        loadCustomers();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete customer', 'error');
      }
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, [showToast, deleteTarget, loadCustomers]);

  // Send WhatsApp welcome message to new customers
  const sendCustomerWelcome = useCallback(async (name: string, phone: string) => {
    try {
      const msg = `🎉 *Welcome to WAMORGAN, ${name}!*\n\nWe're excited to have you on board! 🛍️\n\nReply *MENU* to see the main menu and start shopping!\n\nThank you for choosing us! 💪`;
      await sendMessage(instanceName, phone, msg);
    } catch (err) {
      console.error('Failed to send customer welcome:', err);
    }
  }, [instanceName]);

  const handleSaveCustomer = useCallback(async (data: any) => {
    try {
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      const phone = formatPhoneNumber(data.phone || '');
      const customerData = {
        name: fullName || 'Customer',
        email: data.email,
        phone,
        address: data.address,
        segment: data.segment || 'regular',
        spent: 0, orders: 0, avg: 0, lastOrder: 'Never',
      };

      if (formMode === 'add') {
        await customerService.createCustomer(customerData);
        showToast('Customer added successfully!', 'success');

        if (phone) {
          sendCustomerWelcome(fullName, phone);
        }
      } else {
        if (editingCustomer) {
          await customerService.updateCustomer(editingCustomer.id, customerData);
          showToast('Customer updated successfully!', 'success');
        }
      }
      loadCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'error');
    }
    setFormSheetOpen(false);
    setEditingCustomer(null);
  }, [showToast, formMode, sendCustomerWelcome, editingCustomer, loadCustomers]);

  const handleSegmentFromSheet = useCallback((segment: SegmentType) => {
    setCurrentSegment(segment);
  }, []);

  const handleAlphabetClick = useCallback((letter: string) => {
    const sections = document.querySelectorAll('.section-letter');
    for (const s of sections) {
      if (s.textContent === letter) {
        s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(toastTimeout.current);
  }, []);

  return (
    <AuthGuard>
    <div className="app-container">
      {/* Background */}
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Scroll */}
      <div className="main-scroll" ref={scrollRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <RefreshIndicator visible={pullVisible} spinning={pullSpinning} offset={pullOffset} />

        <CustomersPageHeader
          totalCount={customers.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={handleClearSearch}
          onSegmentClick={() => setSegmentsSheetOpen(true)}
        />

        <SegmentTabs
          currentSegment={currentSegment}
          onSelect={setCurrentSegment}
        />

        <CustomerList
          customers={filteredCustomers}
          onCustomerClick={handleCustomerClick}
          onAddCustomer={() => { setFormMode('add'); setEditingCustomer(null); setFormSheetOpen(true); }}
        />

        <div style={{ height: '20px' }}></div>
      </div>

      {/* Alphabet Index */}
      <AlphabetIndex
        availableLetters={[...new Set(filteredCustomers.map(c => c.name[0]?.toUpperCase()).filter(Boolean))]}
        onLetterClick={handleAlphabetClick}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeIndex={navIndex}
        fabOpen={fabOpen}
        onNavClick={(i) => {
          setNavIndex(i);
          const routes = ['/dashboard', '/products', '/chats', '/orders', '/settings'];
          if (i < routes.length) router.push(routes[i]);
        }}
        onFabClick={() => { setFabOpen(true); setFormMode('add'); setEditingCustomer(null); setFormSheetOpen(true); }}
        onMoreClick={() => setMoreSheetOpen(true)}
      />

      {/* Customer Profile Sheet */}
      <CustomerProfileSheet
        open={profileSheetOpen}
        customer={selectedCustomer}
        onClose={() => setProfileSheetOpen(false)}
        onEdit={(id) => { setProfileSheetOpen(false); handleEditClick(id); }}
        onDelete={(id) => { setProfileSheetOpen(false); handleDeleteClick(id); }}
      />

      {/* Segments Sheet */}
      <SegmentsSheet
        open={segmentsSheetOpen}
        customers={customers}
        onClose={() => setSegmentsSheetOpen(false)}
        onSelectSegment={handleSegmentFromSheet}
      />

      {/* Customer Form Sheet */}
      <CustomerFormSheet
        open={formSheetOpen}
        mode={formMode}
        initialData={editingCustomer ? {
          firstName: editingCustomer.name.split(' ').slice(0, -1).join(' ') || editingCustomer.name,
          lastName: editingCustomer.name.split(' ').slice(-1).join(' '),
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          address: editingCustomer.address,
          segment: editingCustomer.segment,
        } : null}
        onClose={() => { setFormSheetOpen(false); setEditingCustomer(null); setFabOpen(false); }}
        onSave={handleSaveCustomer}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        customerName={deleteTarget?.name || ''}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* More Sheet */}
      <MoreSheet open={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} />

      {/* Toast */}
      <Snackbar visible={toastVisible} message={toastMessage} type={toastType} />
    </div>
    </AuthGuard>
  );
}
