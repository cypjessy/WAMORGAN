'use client';

interface WelcomeStepProps {
  onGetStarted: () => void;
  onBrowseGuest: () => void;
}

const features = [
  { icon: 'fa-robot', title: 'AI Shopping Assistant', desc: 'Find products through natural conversation' },
  { icon: 'fab fa-whatsapp', title: 'Shop on WhatsApp', desc: 'Order directly through your favorite chat app' },
  { icon: 'fa-truck-fast', title: 'Fast Delivery', desc: 'Track your orders in real-time' },
];

export default function WelcomeStep({ onGetStarted, onBrowseGuest }: WelcomeStepProps) {
  return (
    <div className="onboarding-page welcome-page">
      <div className="welcome-logo">
        <i className="fas fa-bag-shopping"></i>
      </div>
      <h1>Welcome to WAMORGAN</h1>
      <p>Your AI-powered shopping experience. Browse, buy, and get support — all in one place.</p>

      <div className="welcome-features">
        {features.map((f, i) => (
          <div key={i} className="welcome-feature" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
            <i className={f.icon}></i>
            <div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={onGetStarted} style={{ marginBottom: 12 }}>
        Get Started
        <i className="fas fa-arrow-right"></i>
      </button>
      <button className="btn btn-ghost" onClick={onBrowseGuest}>
        Browse as Guest
      </button>
    </div>
  );
}
