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
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-blue-600 border-t border-blue-500/30 px-3 py-2 text-white shadow-floating">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-white font-bold opacity-100 scale-105'
                  : 'text-blue-200/80 hover:text-white font-medium opacity-85'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
