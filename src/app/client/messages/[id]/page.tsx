import { getRecentTicketIds } from '@/lib/static-params';
import TicketChatClient from './TicketChatClient';

export async function generateStaticParams() {
  try {
    const ids = await getRecentTicketIds();
    return ids.map(id => ({ id }));
  } catch (e) {
    console.warn('[generateStaticParams] Failed to fetch ticket IDs:', e);
    return [];
  }
}

export default function TicketChatPage() {
  return <TicketChatClient />;
}
