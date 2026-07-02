'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/lib/db';
import type { Product as DbProduct } from '@/lib/db';
import BottomNav from '../components/BottomNav';
import ProductsPageHeader from './components/ProductsPageHeader';
import CategoryPills from './components/CategoryPills';
import ViewToggle from './components/ViewToggle';
import AdminProductGrid from './components/AdminProductGrid';
import AdminProductDetailSheet from '@/app/admin/components/AdminProductDetailSheet';
import ProductFormSheet from './components/ProductFormSheet';
import FilterSheet from './components/FilterSheet';
import type { FilterState } from './components/FilterSheet';
import DeleteDialog from './components/DeleteDialog';
import Snackbar from './components/Snackbar';
import RefreshIndicator from './components/RefreshIndicator';
import MoreSheet from '../components/MoreSheet';
import './products.css';
import './components/admin_products.css';

interface LocalProduct {
  id: number;
  name: string;
  emoji: string;
  imageUrl?: string;
  price: number;
  original: number;
  stock: number;
  status: string;
  category: string;
  subcategory?: string;
  specs?: Record<string, string[]>;
  badge: string;
  sold: number;
  revenue: string;
  desc: string;
  variants: string[];
  active?: boolean;
  trackInventory?: boolean;
  allowWhatsApp?: boolean;
  orderLink?: string;
  _firestoreId?: string;
}

function toLocalProduct(p: DbProduct, index: number): LocalProduct {
  return {
    id: index + 1,
    name: p.name,
    emoji: p.emoji || '📦',
    imageUrl: p.imageUrl || '',
    price: p.price,
    original: p.originalPrice || p.price,
    stock: p.stock || 0,
    status: p.status || 'in',
    category: p.category || 'other',
    subcategory: p.categoryName,
    badge: p.badge || '',
    sold: p.sold || 0,
    revenue: p.revenue || '',
    desc: p.description || '',
    variants: p.variants?.map(v => Object.values(v.specs).join(' / ')) || [],
    active: p.active ?? (p.status === 'active' || p.status === 'in'),
    trackInventory: p.trackInventory,
    allowWhatsApp: p.allowWhatsApp,
    specs: p.specs,
    orderLink: p.orderLink,
    _firestoreId: p.id,
  };
}

function toDbProduct(lp: LocalProduct): Omit<DbProduct, "id" | "createdAt" | "updatedAt"> {
  return {
    name: lp.name,
    description: lp.desc,
    price: lp.price,
    originalPrice: lp.original,
    emoji: lp.emoji,
    imageUrl: lp.imageUrl,
    badge: lp.badge,
    sold: lp.sold,
    revenue: lp.revenue,
    stock: lp.stock,
    status: lp.status as any,
    category: lp.category,
    categoryName: lp.subcategory,
    variants: lp.variants.map((v, i) => ({ id: `v${i}`, specs: { variant: v }, sku: '', price: lp.price, stock: lp.stock })),
    orderLink: lp.orderLink,
  };
}


export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Products from Firestore
  const [allProducts, setAllProducts] = useState<LocalProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setProductsLoading(true);
    try {
      const products = await productService.getProducts();
      setAllProducts(products.map((p, i) => toLocalProduct(p, i)));
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Category
  const [activeCategory, setActiveCategory] = useState('all');

  // View
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');

  // Nav
  const [navIndex, setNavIndex] = useState(1);

  // FAB
  const [fabOpen, setFabOpen] = useState(false);

  // More sheet
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Filter state
  const [filterActive, setFilterActive] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);

  // Product detail
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null);

  // Add/Edit form
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalProduct | null>(null);

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
      setTimeout(() => {
        isRefreshing.current = false;
        setPullVisible(false);
        setPullSpinning(false);
        setPullOffset(0);
        loadProducts();
        showToast('Products refreshed', 'success');
      }, 1500);
    } else {
      setPullVisible(false);
      setPullOffset(0);
    }
  }, [showToast, loadProducts]);

  // Filter products
  const filteredProducts = allProducts.filter((p) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q)) return false;
    }
    // Category
    if (activeCategory !== 'all' && p.category?.toLowerCase() !== activeCategory.toLowerCase()) return false;
    // Applied filters
    if (appliedFilters) {
      if (appliedFilters.category !== 'All' && p.category?.toLowerCase() !== appliedFilters.category.toLowerCase()) return false;
      if (appliedFilters.stockStatus === 'In Stock' && (p.status === 'low' || p.status === 'out' || p.stock === 0)) return false;
      if (appliedFilters.stockStatus === 'Low Stock' && p.status !== 'low') return false;
      if (appliedFilters.stockStatus === 'Out of Stock' && p.stock > 0) return false;
      if (p.price > appliedFilters.maxPrice) return false;
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!appliedFilters) return 0;
    switch (appliedFilters.sortBy) {
      case 'Price: Low to High': return a.price - b.price;
      case 'Price: High to Low': return b.price - a.price;
      case 'Best Selling': return b.sold - a.sold;
      default: return 0; // Newest (by id)
    }
  });

  // Handlers
  const handleClearSearch = () => setSearchQuery('');

  const handleProductClick = useCallback((id: number) => {
    const p = allProducts.find((x) => x.id === id);
    if (p) {
      setSelectedProduct(p);
      setDetailSheetOpen(true);
    }
  }, [allProducts]);

  const handleEditClick = useCallback((id: number) => {
    const p = allProducts.find((x) => x.id === id);
    if (p) {
      setEditingProduct(p);
      setFormMode('edit');
      setFormSheetOpen(true);
    }
  }, [allProducts]);

  const handleDeleteClick = useCallback((id: number) => {
    const p = allProducts.find((x) => x.id === id);
    if (p) {
      setDeleteTarget(p);
      setDeleteDialogOpen(true);
    }
  }, [allProducts]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?._firestoreId) return;
    try {
      await productService.deleteProduct(deleteTarget._firestoreId);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      showToast('Product deleted', 'success');
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  }, [user, deleteTarget, showToast, loadProducts]);

  const handleSaveProduct = useCallback(async (data: any) => {
    try {
      const appBaseUrl = 'https://wamorgan.vercel.app';

      const productData: any = {
        name: data.name,
        description: data.desc || '',
        price: parseFloat(data.price) || 0,
        emoji: data.emoji || '📦',
        stock: parseInt(data.stock) || 0,
        status: (parseInt(data.stock) > 0 ? 'active' : 'out') as any,
        sku: '',
        category: data.category || 'other',
        categoryName: data.subcategory,
        imageUrl: data.imageUrl || '',
        images: data.images || [],
        specs: data.specs,
        variants: data.variants?.map((v: string, i: number) => ({
          id: `v${i}`, specs: { variant: v }, sku: '', price: parseFloat(data.price) || 0, stock: parseInt(data.stock) || 0,
        })),
        active: data.active,
        trackInventory: data.trackInventory,
        allowWhatsApp: data.allowWhatsApp,
      };

      // Inline edit from detail sheet (has _firestoreId in data)
      if (data._firestoreId) {
        const pid = data._firestoreId;
        productData.orderLink = data.orderLink || `${appBaseUrl}/client/order/${pid}`;
        await productService.updateProduct(pid, productData);
        showToast('Product updated successfully!', 'success');
      } else if (formMode === 'edit' && editingProduct?._firestoreId) {
        const pid = editingProduct._firestoreId;
        productData.orderLink = data.orderLink || `${appBaseUrl}/client/order/${pid}`;
        await productService.updateProduct(pid, productData);
        showToast('Product updated successfully!', 'success');
      } else {
        const created = await productService.createProduct(productData);
        await productService.updateProduct(created.id, { orderLink: `${appBaseUrl}/client/order/${created.id}` });
        showToast('Product added successfully!', 'success');
      }

      setFormSheetOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  }, [showToast, loadProducts, formMode, editingProduct]);

  const handleApplyFilters = useCallback((filters: FilterState) => {
    setAppliedFilters(filters);
    setFilterActive(true);
    showToast('Filters applied', 'success');
  }, [showToast]);

  const handleFabAction = useCallback((action: string) => {
    setFabOpen(false);
    if (action === 'add-product') {
      setEditingProduct(null);
      setFormMode('add');
      setFormSheetOpen(true);
    } else {
      showToast(action.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 'success');
    }
  }, [showToast]);

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

        <ProductsPageHeader
          totalCount={allProducts.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={handleClearSearch}
          onFilterClick={() => setFilterSheetOpen(true)}
          filterActive={filterActive}
        />

        <CategoryPills
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          products={allProducts}
        />

        <ViewToggle currentView={currentView} onViewChange={setCurrentView} totalCount={0} />

        {productsLoading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '40px auto' }} />
          </div>
        ) : (
          <AdminProductGrid
            products={sortedProducts}
            currentView={currentView}
            onProductClick={handleProductClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onAddProduct={() => { setEditingProduct(null); setFormMode('add'); setFormSheetOpen(true); }}
          />
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
        onFabClick={() => { setFabOpen(!fabOpen); setFormMode('add'); setFormSheetOpen(true); }}
        onMoreClick={() => setMoreSheetOpen(true)}
      />

      {/* Product Detail Sheet */}
          <AdminProductDetailSheet
            open={detailSheetOpen}
            product={selectedProduct}
            onClose={() => setDetailSheetOpen(false)}
            onEdit={(id) => { setDetailSheetOpen(false); handleEditClick(id); }}
            onDelete={(id) => { setDetailSheetOpen(false); handleDeleteClick(id); }}
            onSave={handleSaveProduct}
          />

      {/* Product Form Sheet */}
      <ProductFormSheet
        open={formSheetOpen}
        mode={formMode}
        editProduct={editingProduct}
        onClose={() => { setFormSheetOpen(false); setEditingProduct(null); setFabOpen(false); }}
        onSave={handleSaveProduct}
      />

      {/* Filter Sheet */}
      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={handleApplyFilters}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        productName={deleteTarget?.name || ''}
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
