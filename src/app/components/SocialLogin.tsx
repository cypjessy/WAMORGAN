'use client';

interface SocialLoginProps {
  onSocialLogin: (provider: string) => void;
  onGoToRegister: () => void;
  onBiometricClick: () => void;
}

export default function SocialLogin({ onSocialLogin, onGoToRegister, onBiometricClick }: SocialLoginProps) {
  return (
    <>
      <div className="divider">or continue with</div>

      <div className="social-grid">
        <button className="btn btn-social google" onClick={() => onSocialLogin('Google')}>
          <i className="fab fa-google"></i>
          Google
        </button>
        <button className="btn btn-social apple" onClick={() => onSocialLogin('Apple')}>
          <i className="fab fa-apple"></i>
          Apple
        </button>
      </div>

      <div className="bottom-text">
        Don't have an account? <a onClick={onGoToRegister}>Create one</a>
      </div>

      <div className="biometric-btn" onClick={onBiometricClick} title="Use biometric login">
        <i className="fas fa-fingerprint"></i>
      </div>
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Use biometric</p>
    </>
  );
}
