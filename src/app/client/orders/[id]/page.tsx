import { getRecentOrderIds } from '@/lib/static-params';
import OrderTrackingClient from './OrderTrackingClient';

export async function generateStaticParams() {
  try {
    const ids = await getRecentOrderIds();
    return ids.map(id => ({ id }));
  } catch (e) {
    console.warn('[generateStaticParams] Failed to fetch order IDs:', e);
    return [];
  }
}

export default function OrderTrackingPage() {
  return <OrderTrackingClient />;
}
