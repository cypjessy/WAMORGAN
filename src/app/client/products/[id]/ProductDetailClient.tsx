'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { hapticsImpact, copyToClipboard, nativeShare } from '@/lib/capacitor';
import { productService, wishlistService, cartService } from '@/lib/db';
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

export default function ProductDetailClient() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const productId = params?.id as string;

  // State
  const [productData, setProductData] = useState<ProductDetailData | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [wishlisted, setWishlisted] = useState(false);

  // Load wishlist state on mount — uses product names to match shop/search pages
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wamorgan_wishlist');
      if (saved && productData) {
        const names: string[] = JSON.parse(saved);
        setWishlisted(names.includes(productData.name));
      }
    } catch {}
  }, [productData]);

  // Load product from Firestore
  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const p = await productService.getProductById(productId);
        if (p) {
          // Parse specs from product specifications or specs field
          const specs: { label: string; value: string }[] = [];
          if (p.specifications && typeof p.specifications === 'object') {
            Object.entries(p.specifications).forEach(([key, val]) => {
              specs.push({ label: key, value: String(val) });
            });
          }

          // Parse colors and sizes from variants
          const colors: { color: string; label: string }[] = [];
          const sizes: { label: string; outOfStock?: boolean }[] = [];
          const seenColors = new Set<string>();
          const seenSizes = new Set<string>();
          if (p.variants && Array.isArray(p.variants)) {
            p.variants.forEach(v => {
              const color = v.specs?.Color || v.specs?.color;
              const size = v.specs?.Size || v.specs?.size;
              if (color && !seenColors.has(color)) {
                seenColors.add(color);
                colors.push({ color: color.toLowerCase() === 'black' ? '#1a1a1a' : color.toLowerCase() === 'white' ? '#ffffff' : color.toLowerCase() === 'silver' ? '#c0c0c0' : color.toLowerCase() === 'blue' ? '#4a90d9' : color.toLowerCase() === 'red' ? '#ef4444' : color.toLowerCase() === 'green' ? '#10b981' : color.toLowerCase() === 'brown' ? '#8b4513' : color.toLowerCase() === 'gold' ? '#e8a838' : color.toLowerCase() === 'gray' ? '#6b7280' : '#6366f1', label: color });
              }
              if (size && !seenSizes.has(size)) {
                seenSizes.add(size);
                sizes.push({ label: size, outOfStock: v.stock === 0 });
              }
            });
          }

          // Build gallery from images array or imageUrl or emoji
          const gallerySlides = (p.images?.length ? p.images : [p.imageUrl || p.emoji || '📦']).filter(Boolean) as string[];
          // If no images, use emoji as fallback
          if (gallerySlides.length === 0 && p.emoji) gallerySlides.push(p.emoji);

          setProductData({
            id: p.id,
            brand: p.category || p.brand || 'Store',
            name: p.name,
            rating: p.rating || 4.8,
            reviewCount: p.orders ? `${(p.orders >= 1000 ? (p.orders / 1000).toFixed(1) + 'k' : String(p.orders))}` : '0',
            soldCount: p.sold ? `${p.sold >= 1000 ? (p.sold / 1000).toFixed(1) + 'k' : String(p.sold)}` : '0',
            price: p.price,
            oldPrice: p.originalPrice || undefined,
            discountLabel: p.originalPrice ? `SAVE KSh ${p.originalPrice - p.price}` : undefined,
            stockLabel: p.stock && p.stock > 0 ? `In Stock — ${p.stock} available` : 'Out of Stock',
            stockLow: p.stock ? p.stock > 0 && p.stock < 5 : false,
            emoji: p.emoji || '📦',
            imageUrl: p.imageUrl,
            images: p.images || [],
            colors,
            sizes,
            description: p.description || 'No description available.',
            specs,
            gallerySlides,
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

  const handleBack = () => {
    router.back();
  };

  const getOrderLink = useCallback(() => {
    return `${window.location.origin}/client/order/${productId}`;
  }, [productId]);

  const handleShare = async (method: string) => {
    await hapticsImpact('light');
    const link = getOrderLink();
    if (method === 'Copy Link') {
      const ok = await copyToClipboard(link);
      showToast(ok ? 'Order link copied!' : 'Failed to copy link', ok ? 'success' : 'error');
    } else if (method === 'WhatsApp') {
      const text = encodeURIComponent(`Check out this product: ${link}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      showToast('Opening WhatsApp...', 'success');
    } else {
      await nativeShare({ title: 'Check this out!', text: link });
      showToast(`Shared via ${method}`, 'success');
    }
  };

  const handleAddToCart = async () => {
    await hapticsImpact('light');
    const item = { productId, image: productData?.imageUrl || '', name: productData?.name || '', price: productData?.price || 0 };
    if (user) cartService.addToCart(user.uid, item);
    setCartDialogOpen(true);
  };

  const handleViewCart = () => {
    setCartDialogOpen(false);
    router.push('/client/cart');
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
        <div className="main-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {productLoading ? <div className="spinner" /> : <p style={{ color: 'var(--text-muted)' }}>Product not found</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
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
            const next = !wishlisted;
            setWishlisted(next);

            // Save to localStorage — uses product name to match shop/search pages
            try {
              const saved = localStorage.getItem('wamorgan_wishlist');
              const names: string[] = saved ? JSON.parse(saved) : [];
              const name = productData?.name || '';
              if (next) {
                if (!names.includes(name)) names.push(name);
              } else {
                const idx = names.indexOf(name);
                if (idx !== -1) names.splice(idx, 1);
              }
              localStorage.setItem('wamorgan_wishlist', JSON.stringify(names));
            } catch {}

            // Save to Firestore if logged in
            if (user) {
              if (next) {
                wishlistService.addToWishlist(user.uid, productId).catch(() => {});
              } else {
                wishlistService.removeFromWishlist(user.uid, productId).catch(() => {});
              }
            }

            showToast(next ? 'Added to wishlist' : 'Removed from wishlist', 'success');
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
