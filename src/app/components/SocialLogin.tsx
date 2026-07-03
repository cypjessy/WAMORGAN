'use client';

interface SocialLoginProps {
  onSocialLogin: (provider: string) => void;
  onGoToRegister: () => void;
  onBiometricClick: () => void;
  nativeBiometricAvailable?: boolean;
}

export default function SocialLogin({ onSocialLogin, onGoToRegister, onBiometricClick, nativeBiometricAvailable }: SocialLoginProps) {
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

      <div
        className={`biometric-btn ${nativeBiometricAvailable ? 'available' : ''}`}
        onClick={onBiometricClick}
        title={nativeBiometricAvailable ? 'Use fingerprint or face to sign in' : 'Biometric login (mobile app)'}
      >
        {nativeBiometricAvailable ? (
          <i className="fas fa-fingerprint"></i>
        ) : (
          <i className="fas fa-mobile-screen-button"></i>
        )}
      </div>
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
        {nativeBiometricAvailable ? 'Use biometric' : 'Biometric (app only)'}
      </p>
    </>
  );
}
