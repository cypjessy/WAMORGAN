export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
  return '254' + cleaned;
}
