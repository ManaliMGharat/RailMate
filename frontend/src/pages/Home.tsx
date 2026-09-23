import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Ticket,
  TrainTrack,
  Radio,
  UtensilsCrossed,
  RotateCcw,
  HeartHandshake,
  Wallet,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ReservedIllustration,
  UnreservedIllustration,
  PlatformIllustration,
} from '../assets/illustrations';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const userName = user?.full_name || 'Manali Manish Gharat';

  // 8 Colorful pastel service tiles matching the screenshot
  const services = [
    {
      id: 'search',
      title: t('search_trains'),
      icon: Search,
      bg: 'bg-rose-50 hover:bg-rose-100/80 border-rose-100',
      iconColor: 'text-rose-500',
      path: '/search',
    },
    {
      id: 'pnr',
      title: t('pnr_status'),
      icon: Ticket,
      bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100',
      iconColor: 'text-emerald-600',
      path: '/pnr',
    },
    {
      id: 'coach',
      title: t('coach_position'),
      icon: TrainTrack,
      bg: 'bg-sky-50 hover:bg-sky-100/80 border-sky-100',
      iconColor: 'text-sky-600',
      path: '/coach-position',
    },
    {
      id: 'track',
      title: t('track_your_train'),
      icon: Radio,
      bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-100',
      iconColor: 'text-amber-600',
      path: '/track-train',
    },
    {
      id: 'food',
      title: t('order_food'),
      icon: UtensilsCrossed,
      bg: 'bg-purple-50 hover:bg-purple-100/80 border-purple-100',
      iconColor: 'text-purple-600',
      path: '/food',
    },
    {
      id: 'refund',
      title: t('file_refund'),
      icon: Clock,
      bg: 'bg-slate-100 hover:bg-slate-200/80 border-slate-200',
      iconColor: 'text-slate-600',
      path: '/refunds',
    },
    {
      id: 'support',
      title: t('rail_support'),
      icon: HeartHandshake,
      bg: 'bg-red-50 hover:bg-red-100/80 border-red-100',
      iconColor: 'text-red-500',
      path: '/support',
    },
    {
      id: 'wallet',
      title: t('wallet_services'),
      icon: Wallet,
      bg: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100',
      iconColor: 'text-indigo-600',
      path: '/wallet',
    },
  ];

  // Did you know cards
  const triviaCards = [
    {
      id: 1,
      badge: 'Heritage',
      title: 'First Journey in 1853',
      text: 'India’s first passenger train traversed 34 km between Bori Bunder (CSMT) and Thane on 16 April 1853.',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60',
      gradient: 'from-amber-600 to-amber-900',
    },
    {
      id: 2,
      badge: 'Engineering Marvel',
      title: 'Chenab Bridge (359m)',
      text: 'Higher than the Eiffel Tower, the Chenab Arch Bridge in Kashmir is the world’s highest railway arch.',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60',
      gradient: 'from-blue-600 to-blue-900',
    },
    {
      id: 3,
      badge: 'Speed & Tech',
      title: 'Vande Bharat Express',
      text: 'Indigenously built semi-high speed train capable of 180 km/h with Kavach automated anti-collision system.',
      image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=500&auto=format&fit=crop&q=60',
      gradient: 'from-purple-600 to-indigo-900',
    },
  ];

  return (
    <div className="pb-24 pt-3 px-4 space-y-6">
      <DemoNoticeBanner compact />

      {/* Greeting Banner */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 tracking-wide">
          {t('greeting')}
        </h2>
        <h1 className="text-xl font-extrabold text-[#1B254B] tracking-tight">
          {userName}!
        </h1>
      </div>

      {/* SECTION 1: Journey Planner */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B254B]">
            {t('journey_planner')}
          </h2>
          <span className="text-[11px] font-semibold text-blue-600 flex items-center">
            Tap to book <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 3 Large Journey Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* 1. Reserved Card */}
          <div
            onClick={() => navigate('/search')}
            className="group cursor-pointer flex flex-col items-center text-center transition-all duration-200 active:scale-95"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 shadow-soft bg-white p-1 group-hover:shadow-card group-hover:border-blue-300 transition-all">
              <ReservedIllustration className="w-full h-full object-cover rounded-xl" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {t('reserved')}
            </span>
          </div>

          {/* 2. Unreserved Card */}
          <div
            onClick={() => navigate('/unreserved')}
            className="group cursor-pointer flex flex-col items-center text-center transition-all duration-200 active:scale-95"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 shadow-soft bg-white p-1 group-hover:shadow-card group-hover:border-blue-300 transition-all">
              <UnreservedIllustration className="w-full h-full object-cover rounded-xl" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {t('unreserved')}
            </span>
          </div>

          {/* 3. Platform Card */}
          <div
            onClick={() => navigate('/platform-ticket')}
            className="group cursor-pointer flex flex-col items-center text-center transition-all duration-200 active:scale-95"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 shadow-soft bg-white p-1 group-hover:shadow-card group-hover:border-blue-300 transition-all">
              <PlatformIllustration className="w-full h-full object-cover rounded-xl" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {t('platform')}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: More Offerings Grid */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1B254B]">
          {t('more_offerings')}
        </h2>

        <div className="grid grid-cols-4 gap-2.5">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center text-center group active:scale-95 transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-soft transition-all duration-200 group-hover:scale-105 group-hover:shadow-card ${item.bg}`}
                >
                  <Icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                <span className="mt-1.5 text-[11px] font-semibold text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Transit Utilities Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-4 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full inline-block">
              Station & Timetables
            </span>
            <h3 className="text-sm font-bold">Live Station Board</h3>
            <p className="text-[11px] text-blue-100 max-w-[200px]">
              Find real-time arrivals, departures, and platforms.
            </p>
          </div>
          <button
            onClick={() => navigate('/live-station')}
            className="bg-white text-blue-800 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:bg-blue-50 transition-all active:scale-95"
          >
            Check Now
          </button>
        </div>
        {/* Subtle decorative background circles */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* SECTION 3: Do You Know? Carousel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B254B] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {t('do_you_know')}
          </h2>
          <span className="text-[11px] font-medium text-slate-400">Railway Heritage</span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x">
          {triviaCards.map((card) => (
            <div
              key={card.id}
              className="snap-start shrink-0 w-[240px] rounded-2xl bg-white border border-slate-100 shadow-soft overflow-hidden group hover:shadow-card transition-all"
            >
              <div className="h-28 relative overflow-hidden bg-slate-200">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient} opacity-50`} />
                <span className="absolute top-2 left-2 text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-slate-900 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {card.badge}
                </span>
              </div>
              <div className="p-3">
                <h4 className="text-xs font-bold text-slate-800 mb-1 line-clamp-1">
                  {card.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
