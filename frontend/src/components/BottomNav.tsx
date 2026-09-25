import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Ticket, User, Menu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'home',
      label: t('nav_home'),
      path: '/',
      icon: Home,
    },
    {
      id: 'bookings',
      label: t('nav_bookings'),
      path: '/my-bookings',
      icon: Ticket,
    },
    {
      id: 'you',
      label: t('nav_you'),
      path: '/profile',
      icon: User,
    },
    {
      id: 'menu',
      label: t('nav_menu'),
      path: '/menu',
      icon: Menu,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-[#0868F7] border-t border-blue-500/20 px-2 pt-2 text-white shadow-floating"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-white font-bold opacity-100'
                  : 'text-blue-100/70 hover:text-white font-medium opacity-80'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.6px]' : 'stroke-[1.8px]'}`} />
              </div>
              <span className={`text-[11px] mt-1 tracking-tight leading-tight ${isActive ? 'font-bold text-white' : 'text-blue-100/80'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
