'use client';

import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
      <div className="success-checkmark" style={{ width: '100px', height: '100px', marginBottom: '32px' }}>
        <i className="fas fa-check" style={{ fontSize: '48px' }}></i>
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>All Set!</h2>
      <p style={{
        fontSize: '15px', color: 'var(--text-secondary)',
        textAlign: 'center', lineHeight: '1.6', marginBottom: '32px',
        maxWidth: '300px', margin: '0 auto 32px',
      }}>
        Your account is ready. Start managing products and automating your WhatsApp sales.
      </p>
      <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
        Go to Dashboard <i className="fas fa-arrow-right"></i>
      </button>
    </div>
  );
}
