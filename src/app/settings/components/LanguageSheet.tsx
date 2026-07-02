'use client';

import { useState, useEffect } from 'react';
import { businessProfileService } from '@/lib/db';

interface LanguageSheetProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'zh', label: 'Chinese', native: '中文' },
];

export default function LanguageSheet({ open, onClose, onShowToast }: LanguageSheetProps) {
  const [selected, setSelected] = useState('en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    businessProfileService.getProfile().then(bp => {
      if (bp?.preferredLanguage) setSelected(bp.preferredLanguage);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  const handleSelect = async (code: string) => {
    setSelected(code);
    try {
      await businessProfileService.saveProfile({ preferredLanguage: code });
      onShowToast('Language updated', 'success');
    } catch {
      onShowToast('Failed to save language', 'error');
    }
  };

  if (loading) return null;

  return (
    <>
      <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`bottom-sheet ${open ? 'active' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-content safe-bottom">
          <div className="sheet-title">Language</div>
          <div className="sheet-subtitle">Choose your preferred language</div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {languages.map((lang, i) => (
              <div
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < languages.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
              >
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600 }}>{lang.label}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{lang.native}</p>
                </div>
                {selected === lang.code && (
                  <i className="fas fa-check" style={{ color: 'var(--accent-primary)', fontSize: 16 }}></i>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
