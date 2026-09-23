import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { RailMateLogo } from '../assets/illustrations';
import { useLanguage, Language } from '../context/LanguageContext';

interface HeaderProps {
  unreadCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ unreadCount = 15, onOpenNotifications }) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-soft">
      {/* Left: Language Selector circular button A/अ */}
      <div className="relative">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          aria-label="Change Language"
          className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50/60 flex items-center justify-center text-blue-700 font-semibold text-xs shadow-sm hover:bg-blue-100/70 transition-all active:scale-95"
        >
          <span className="flex items-center gap-0.5 font-bold tracking-tight">
            <span>A</span>
            <span className="text-[10px] text-blue-500">/</span>
            <span className="text-[13px]">अ</span>
          </span>
        </button>

        {showLangMenu && (
          <div className="absolute left-0 mt-2 w-44 bg-white rounded-2xl shadow-card border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">
              Select Language
            </div>
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  setShowLangMenu(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                  language === l.code ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{l.label}</span>
                <span className="text-[11px] opacity-75">{l.native}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: RailMate Logo */}
      <div
        onClick={() => navigate('/')}
        className="cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
      >
        <RailMateLogo size={28} />
      </div>

      {/* Right: Notification Bell with Badge */}
      <div className="relative">
        <button
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            } else {
              navigate('/notifications');
            }
          }}
          aria-label="Notifications"
          className="w-10 h-10 rounded-full border border-slate-100 bg-white flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
