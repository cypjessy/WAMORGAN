'use client';

import { useState, useEffect, useCallback } from 'react';
import WelcomeStep from './components/WelcomeStep';
import LocationStep from './components/LocationStep';
import InterestsStep from './components/InterestsStep';
import PermissionsStep from './components/PermissionsStep';
import SuccessStep from './components/SuccessStep';
import CountrySheet from './components/CountrySheet';
import CurrencySheet from './components/CurrencySheet';
import LanguageSheet from './components/LanguageSheet';
import TermsSheet from './components/TermsSheet';
import PrivacySheet from './components/PrivacySheet';
import NotifDialog from './components/NotifDialog';
import LocDialog from './components/LocDialog';
import Snackbar from './components/Snackbar';

type OnboardingStep = 'welcome' | 'location' | 'interests' | 'permissions' | 'success';

export default function ClientOnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('welcome');

  // Location state
  const [country, setCountry] = useState('United States');
  const [currency, setCurrency] = useState('USD ($)');
  const [language, setLanguage] = useState('English');
  const [address, setAddress] = useState('');

  // Interests
  const [interests, setInterests] = useState<string[]>([]);

  // Permissions
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Sheet states
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [termsSheetOpen, setTermsSheetOpen] = useState(false);
  const [privacySheetOpen, setPrivacySheetOpen] = useState(false);

  // Dialog states
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [locDialogOpen, setLocDialogOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' as 'success' | 'error', visible: false });
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setSnackbar({ message, type, visible: true });
  }, []);
  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);



  // Navigate between steps with slide animation
  const goToStep = useCallback((nextStep: OnboardingStep) => {
    const scrollEl = document.getElementById('mainScroll');
    if (scrollEl) scrollEl.scrollTop = 0;
    setStep(nextStep);
  }, []);

  const handleGetStarted = () => goToStep('location');
  const handleBrowseGuest = () => {
    showToast('Welcome! You can update preferences in settings.', 'success');
    goToStep('success');
  };

  const handleToggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleToggleNotif = () => {
    if (!notifEnabled) {
      setNotifEnabled(true);
      setTimeout(() => setNotifDialogOpen(true), 300);
    } else {
      setNotifEnabled(false);
    }
  };

  const handleToggleLocation = () => {
    if (!locationEnabled) {
      setLocationEnabled(true);
      setTimeout(() => setLocDialogOpen(true), 300);
    } else {
      setLocationEnabled(false);
    }
  };

  return (
    <div className="app-container">
      {/* Background */}
      <div className="bg-mesh"></div>
      <div className="noise-overlay"></div>

      {/* Main Content - no bottom nav */}
      <div className="main-scroll" id="mainScroll" style={{ height: '100%', paddingBottom: 40 }}>
        {/* Welcome page */}
        <div className={`onboarding-page ${step === 'welcome' ? 'visible' : ''}`}>
          <WelcomeStep onGetStarted={handleGetStarted} onBrowseGuest={handleBrowseGuest} />
        </div>

        {/* Location page */}
        <div className={`onboarding-page ${step === 'location' ? 'visible' : ''}`}>
          <LocationStep
            country={country}
            currency={currency}
            language={language}
            address={address}
            onAddressChange={setAddress}
            onSelectCountry={() => setCountrySheetOpen(true)}
            onSelectCurrency={() => setCurrencySheetOpen(true)}
            onSelectLanguage={() => setLanguageSheetOpen(true)}
            onBack={() => goToStep('welcome')}
          />
          <div style={{ padding: '0 20px', marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => goToStep('interests')}>
              Continue <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>

        {/* Interests page */}
        <div className={`onboarding-page ${step === 'interests' ? 'visible' : ''}`}>
          <InterestsStep selected={interests} onToggle={handleToggleInterest} onBack={() => goToStep('location')} />
          <div style={{ padding: '0 20px' }}>
            <button className="btn btn-primary" onClick={() => goToStep('permissions')}>
              Continue <i className="fas fa-arrow-right"></i>
            </button>
            <button className="btn btn-ghost" onClick={() => goToStep('permissions')} style={{ marginTop: 10 }}>
              Skip for Now
            </button>
          </div>
        </div>

        {/* Permissions page */}
        <div className={`onboarding-page ${step === 'permissions' ? 'visible' : ''}`}>
          <PermissionsStep
            notifEnabled={notifEnabled}
            locationEnabled={locationEnabled}
            onToggleNotif={handleToggleNotif}
            onToggleLocation={handleToggleLocation}
            onTerms={() => setTermsSheetOpen(true)}
            onPrivacy={() => setPrivacySheetOpen(true)}
            onBack={() => goToStep('interests')}
          />
          <div style={{ padding: '0 20px', marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => goToStep('success')}>
              Finish Setup <i className="fas fa-check"></i>
            </button>
          </div>
        </div>

        {/* Success page */}
        <div className={`onboarding-page ${step === 'success' ? 'visible' : ''}`}>
          <SuccessStep onStartShopping={() => showToast('Shopping experience ready!', 'success')} />
        </div>
      </div>

      {/* Skip button for location/interests pages */}
      {(step === 'location' || step === 'interests') && (
        <button
          className="skip-btn"
          onClick={() => {
            showToast('Welcome! You can update preferences in settings.', 'success');
            goToStep('success');
          }}
        >
          Skip
        </button>
      )}

      {/* Sheets */}
      <CountrySheet
        open={countrySheetOpen}
        onClose={() => setCountrySheetOpen(false)}
        selected={country}
        onSelect={(_flag, name) => {
          setCountry(name);
          setCountrySheetOpen(false);
          showToast(`Country set to ${name}`, 'success');
        }}
      />
      <CurrencySheet
        open={currencySheetOpen}
        onClose={() => setCurrencySheetOpen(false)}
        selected={currency}
        onSelect={(cur) => {
          setCurrency(cur);
          setCurrencySheetOpen(false);
          showToast(`Currency set to ${cur}`, 'success');
        }}
      />
      <LanguageSheet
        open={languageSheetOpen}
        onClose={() => setLanguageSheetOpen(false)}
        selected={language}
        onSelect={(lang) => {
          setLanguage(lang);
          setLanguageSheetOpen(false);
          showToast(`Language set to ${lang}`, 'success');
        }}
      />
      <TermsSheet open={termsSheetOpen} onClose={() => setTermsSheetOpen(false)} />
      <PrivacySheet open={privacySheetOpen} onClose={() => setPrivacySheetOpen(false)} />

      {/* Dialogs */}
      <NotifDialog open={notifDialogOpen} onClose={() => setNotifDialogOpen(false)} onEnable={() => { showToast('Notifications enabled', 'success'); setNotifDialogOpen(false); }} />
      <LocDialog open={locDialogOpen} onClose={() => setLocDialogOpen(false)} onAllow={() => { showToast('Location access enabled', 'success'); setLocDialogOpen(false); }} />

      {/* Snackbar */}
      <Snackbar message={snackbar.message} type={snackbar.type} visible={snackbar.visible} onHide={hideToast} />
    </div>
  );
}
