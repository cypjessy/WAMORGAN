'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productService } from '@/lib/db';
import DetailHeader from './components/DetailHeader';
import ImageGallery from './components/ImageGallery';
import ProductInfo from './components/ProductInfo';
import ColorSelector from './components/ColorSelector';
import SizeSelector from './components/SizeSelector';
import DescriptionSection from './components/DescriptionSection';
import SpecsSection from './components/SpecsSection';
import ReviewsSection from './components/ReviewsSection';
import RelatedProducts from './components/RelatedProducts';
import ActionBar from './components/ActionBar';
import ShareSheet from './components/ShareSheet';
import SizeGuideSheet from './components/SizeGuideSheet';
import ReviewFormSheet from './components/ReviewFormSheet';
import WaDialog from './components/WaDialog';
import CartDialog from './components/CartDialog';
import Snackbar from './components/Snackbar';

interface ProductDetailData {
  id: string;
  brand: string;
  name: string;
  rating: number;
  reviewCount: string;
  soldCount: string;
  price: number;
  oldPrice?: number;
  discountLabel?: string;
  stockLabel: string;
  stockLow: boolean;
  emoji: string;
  imageUrl?: string;
  images: string[];
  colors: { color: string; label: string }[];
  sizes: { label: string; outOfStock?: boolean }[];
  description: string;
  specs: { label: string; value: string }[];
  gallerySlides: string[];
  galleryBadge?: string;
  reviews: { avatar: string; avatarStyle?: string; name: string; rating: number; date: string; verified: boolean; text: string; images?: string[]; helpfulCount: number }[];
  ratingBreakdown: { stars: number; percentage: number; count: number }[];
  related: { name: string; price: string; imageUrl: string }[];
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  // State
  const [productData, setProductData] = useState<ProductDetailData | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [clock, setClock] = useState('9:41');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [wishlisted, setWishlisted] = useState(false);

  // Load product from Firestore
  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const p = await productService.getProductById(productId);
        if (p) {
          setProductData({
            id: p.id,
            brand: p.category || 'Store',
            name: p.name,
            rating: 4.8,
            reviewCount: '1.2k',
            soldCount: '5.2k',
            price: p.price,
            oldPrice: p.originalPrice || undefined,
            discountLabel: p.originalPrice ? `SAVE KSh ${p.originalPrice - p.price}` : undefined,
            stockLabel: p.stock && p.stock > 0 ? `In Stock — ${p.stock} available` : 'Out of Stock',
            stockLow: p.stock ? p.stock > 0 && p.stock < 5 : false,
            emoji: p.emoji || '📦',
            imageUrl: p.imageUrl,
            images: p.images || [],
            colors: [],
            sizes: [],
            description: p.description || 'No description available.',
            specs: [],
            gallerySlides: (p.images?.length ? p.images : [p.imageUrl || p.emoji || '📦']).filter(Boolean) as string[],
            galleryBadge: p.originalPrice ? `${Math.round((1 - p.price / p.originalPrice) * 100)}% OFF` : undefined,
            reviews: [],
            ratingBreakdown: [
              { stars: 5, percentage: 78, count: 972 },
              { stars: 4, percentage: 15, count: 187 },
              { stars: 3, percentage: 5, count: 62 },
              { stars: 2, percentage: 1.5, count: 18 },
              { stars: 1, percentage: 0.5, count: 8 },
            ],
            related: [],
          });
        }
      } catch (err) { console.error('Failed to load product:', err); }
      finally { setProductLoading(false); }
    })();
  }, [productId]);

  // Sheets & Dialogs
  const [shareOpen, setShareOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const getOrderLink = useCallback(() => {
    return `${window.location.origin}/client/order/${productId}`;
  }, [productId]);

  const handleShare = (method: string) => {
    const link = getOrderLink();
    if (method === 'Copy Link') {
      navigator.clipboard.writeText(link).then(() => {
        showToast('Order link copied!', 'success');
      }).catch(() => {
        showToast('Failed to copy link', 'error');
      });
    } else if (method === 'WhatsApp') {
      const text = encodeURIComponent(`Check out this product: ${link}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      showToast('Opening WhatsApp...', 'success');
    } else {
      showToast(`Shared via ${method}`, 'success');
    }
  };

  const handleAddToCart = () => {
    setCartDialogOpen(true);
  };

  const handleViewCart = () => {
    setCartDialogOpen(false);
    showToast('Cart page coming soon', 'success');
  };

  const handleWhatsApp = () => {
    setWaDialogOpen(true);
  };

  const handleWaChat = () => {
    setWaDialogOpen(false);
    const link = getOrderLink();
    const text = encodeURIComponent(`Hi! I'm interested in ordering this product: ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    showToast('Opening WhatsApp...', 'success');
  };

  const handleSubmitReview = (rating: number, text: string) => {
    setReviewFormOpen(false);
    showToast('Review submitted for approval', 'success');
  };

  const handleRelatedClick = (product: { name: string; price: string; imageUrl: string }) => {
    showToast(`${product.name} coming soon`, 'success');
  };

  if (!productData) {
    return (
      <div className="app-container">
        <div className="status-bar"><span className="time">{clock}</span><div className="icons"><i className="fas fa-signal"></i><i className="fas fa-wifi"></i><i className="fas fa-battery-full"></i></div></div>
        <div className="main-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {productLoading ? <div className="spinner" /> : <p style={{ color: 'var(--text-muted)' }}>Product not found</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Status Bar */}
      <div className="status-bar">
        <span className="time">{clock}</span>
        <div className="icons">
          <i className="fas fa-signal"></i>
          <i className="fas fa-wifi"></i>
          <i className="fas fa-battery-full"></i>
        </div>
      </div>

      {/* Background */}
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Scroll */}
      <div className="main-scroll product-detail-scroll" id="mainScroll">
        <DetailHeader
          onBack={handleBack}
          onShare={() => setShareOpen(true)}
          wishlisted={wishlisted}
          onWishlistToggle={() => {
            setWishlisted(!wishlisted);
            showToast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
          }}
        />

        <ImageGallery
          slides={productData.gallerySlides}
          badge={productData.galleryBadge}
        />

        <ProductInfo
          brand={productData.brand}
          name={productData.name}
          rating={productData.rating}
          reviewCount={productData.reviewCount}
          soldCount={productData.soldCount}
          price={productData.price.toString()}
          oldPrice={productData.oldPrice ? productData.oldPrice.toString() : undefined}
          discountLabel={productData.discountLabel}
          stockLabel={productData.stockLabel}
          stockLow={productData.stockLow}
        />

        <ColorSelector
          options={productData.colors}
          selected={selectedColor}
          onSelect={setSelectedColor}
        />

        <SizeSelector
          label="Style"
          options={productData.sizes}
          selected={selectedSize}
          onSelect={setSelectedSize}
        />

        <DescriptionSection text={productData.description} />

        <SpecsSection specs={productData.specs} />

        <ReviewsSection
          totalReviews={productData.reviewCount}
          averageRating={productData.rating}
          breakdown={productData.ratingBreakdown}
          reviews={productData.reviews}
          onWriteReview={() => setReviewFormOpen(true)}
          onSeeAll={() => showToast('All reviews coming soon', 'success')}
        />

        <RelatedProducts
          products={productData.related}
          onClick={handleRelatedClick}
        />

        <div style={{ height: 20 }}></div>
      </div>

      {/* Sticky Action Bar */}
      <ActionBar
        quantity={quantity}
        price={productData.price}
        onChangeQty={(delta) => setQuantity(prev => Math.max(1, Math.min(10, prev + delta)))}
        onAddToCart={handleAddToCart}
        onWhatsApp={handleWhatsApp}
      />

      {/* Sheets */}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} onShare={handleShare} />
      <SizeGuideSheet open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <ReviewFormSheet open={reviewFormOpen} onClose={() => setReviewFormOpen(false)} onSubmit={handleSubmitReview} />

      {/* Dialogs */}
      <WaDialog open={waDialogOpen} onClose={() => setWaDialogOpen(false)} onChat={handleWaChat} />
      <CartDialog
        open={cartDialogOpen}
        onClose={() => setCartDialogOpen(false)}
        onViewCart={handleViewCart}
        productName={productData.name}
        variant={selectedColor}
      />

      {/* Snackbar */}
      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
