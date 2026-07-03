import { getAllProductIds } from '@/lib/static-params';
import ProductDetailClient from './ProductDetailClient';

export async function generateStaticParams() {
  try {
    const ids = await getAllProductIds();
    return ids.map(id => ({ id }));
  } catch (e) {
    console.warn('[generateStaticParams] Failed to fetch product IDs:', e);
    return [];
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
