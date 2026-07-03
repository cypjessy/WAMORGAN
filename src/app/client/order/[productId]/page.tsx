import { getAllProductIds } from '@/lib/static-params';
import ProductOrderClient from './ProductOrderClient';

export async function generateStaticParams() {
  try {
    const ids = await getAllProductIds();
    return ids.map(productId => ({ productId }));
  } catch (e) {
    console.warn('[generateStaticParams] Failed to fetch product IDs:', e);
    return [];
  }
}

export default function ProductOrderPage() {
  return <ProductOrderClient />;
}
