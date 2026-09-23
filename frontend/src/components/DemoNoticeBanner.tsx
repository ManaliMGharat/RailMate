import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DemoNoticeBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] text-amber-800">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{t('demo_notice')}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-800 p-0.5"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-y border-amber-200/60 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-900 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <span className="font-medium">
          <strong className="font-semibold text-amber-950">Demo Simulation:</strong> {t('demo_notice')}
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-900 p-1"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
