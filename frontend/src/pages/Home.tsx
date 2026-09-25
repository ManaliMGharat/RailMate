import React, { useState } from 'react';
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
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Fingerprint,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ReservedIllustration,
  UnreservedIllustration,
  PlatformIllustration,
} from '../assets/illustrations';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { FastLoginModal } from '../components/FastLoginModal';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showFastLogin, setShowFastLogin] = useState(false);

  // Personalized Greeting: use current authenticated user's name, fallback to 'Manali Manish Gharat' or 'Manali'
  const userName = user?.full_name || 'Manali Manish Gharat';

  // 8 Colorful pastel service tiles matching the screenshot exactly
  const services = [
    {
      id: 'search',
      title: 'Search Trains',
      icon: Search,
      bg: 'bg-[#FDF2F4] hover:bg-[#FCE7EB] border-[#FCE7EB]',
      iconColor: 'text-[#E11D48]',
      path: '/search',
    },
    {
      id: 'pnr',
      title: 'PNR Status',
      icon: Ticket,
      bg: 'bg-[#F0FDF4] hover:bg-[#DCFCE7] border-[#DCFCE7]',
      iconColor: 'text-[#16A34A]',
      path: '/pnr',
    },
    {
      id: 'coach',
      title: 'Coach Position',
      icon: TrainTrack,
      bg: 'bg-[#F0F9FF] hover:bg-[#E0F2FE] border-[#E0F2FE]',
      iconColor: 'text-[#0284C7]',
      path: '/coach-position',
    },
    {
      id: 'track',
      title: 'Track Your Train',
      icon: Radio,
      bg: 'bg-[#FEFCE8] hover:bg-[#FEF9C3] border-[#FEF9C3]',
      iconColor: 'text-[#CA8A04]',
      path: '/track-train',
    },
    {
      id: 'food',
      title: 'Order Food',
      icon: UtensilsCrossed,
      bg: 'bg-[#F3E8FF] hover:bg-[#E9D5FF] border-[#E9D5FF]',
      iconColor: 'text-[#9333EA]',
      path: '/food',
    },
    {
      id: 'refund',
      title: 'File Refund',
      icon: RotateCcw,
      bg: 'bg-[#F1F5F9] hover:bg-[#E2E8F0] border-[#E2E8F0]',
      iconColor: 'text-[#475569]',
      path: '/refunds',
    },
    {
      id: 'support',
      title: 'Rail Madad',
      icon: HeartHandshake,
      bg: 'bg-[#FEE2E2] hover:bg-[#FECACA] border-[#FECACA]',
      iconColor: 'text-[#EF4444]',
      path: '/support',
    },
    {
      id: 'waves',
      title: 'Go To WAVES',
      icon: Wallet,
      bg: 'bg-[#505A6F] hover:bg-[#434C5E] border-[#434C5E]',
      iconColor: 'text-white',
      path: '/wallet',
    },
  ];

  // Did you know cards matching screenshot
  const triviaCards = [
    {
      id: 1,
      title: 'First Passenger Train (1853)',
      text: 'First ever passenger train was run between Bori Bandar to Thane on April 16, 1853.',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=70',
    },
    {
      id: 2,
      title: 'Highest Railway Bridge',
      text: "Chenab Railway Bridge in Dharot, Jammu & Kashmir is the World's highest Railway Bridge.",
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=70',
    },
    {
      id: 3,
      title: 'Vande Bharat Technology',
      text: 'Indigenously built semi-high speed train capable of 180 km/h with automated doors and Kavach safety system.',
      image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=500&auto=format&fit=crop&q=70',
    },
    {
      id: 4,
      title: '100% Electrification',
      text: 'Indian Railways is rapidly achieving 100% broad gauge electrification, pioneering green mass transit globally.',
      image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=500&auto=format&fit=crop&q=70',
    },
  ];

  return (
    <div className="pb-24 pt-2 px-4 space-y-6">
      <DemoNoticeBanner compact />

      {/* Greeting Banner */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[17px] font-bold text-[#172A63] tracking-tight">
            Hi, {userName}!
          </h1>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/90 hover:bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold transition-all border border-blue-200 shadow-2xs active:scale-95"
          title="Sign in with mPIN or Biometrics"
        >
          <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
          <span>mPIN Login</span>
        </button>
      </div>

      {/* SECTION 1: Journey Planner (3 Large Horizontal Cards) */}
      <section className="space-y-3">
        <h2 className="text-[18px] font-extrabold text-[#172A63] tracking-tight">
          Journey Planner
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          {/* 1. Reserved Card */}
          <div
            onClick={() => navigate('/search')}
            className="group cursor-pointer flex flex-col items-center text-center transition-all duration-200 active:scale-95"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white group-hover:shadow-card group-hover:border-blue-300 transition-all">
              <ReservedIllustration className="w-full h-full object-cover" />
            </div>
            <span className="mt-2 text-xs font-semibold text-[#475569] group-hover:text-blue-700 transition-colors">
              Reserved
            </span>
          </div>

          {/* 2. Unreserved Card */}
          <div
            onClick={() => navigate('/unreserved')}
            className="group cursor-pointer flex flex-col items-center text-center transition-all duration-200 active:scale-95"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white group-hover:shadow-card group-hover:border-blue-300 transition-all">
              <UnreservedIllustration className="w-full h-full object-cover" />
            </div>
            <span className="mt-2 text-xs font-semibold text-[#475569] group-hover:text-blue-700 transition-colors">
              Unreserved
            </span>
          </div>

          {/* 3. Platform Card */}
          <div
            onClick={() => navigate('/platform-ticket')}
            className="group cursor-pointer flex flex-col items-center text-center transition-all duration-200 active:scale-95"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-white group-hover:shadow-card group-hover:border-blue-300 transition-all">
              <PlatformIllustration className="w-full h-full object-cover" />
            </div>
            <span className="mt-2 text-xs font-semibold text-[#475569] group-hover:text-blue-700 transition-colors">
              Platform
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: More Offerings Grid (4 columns, 8 pastel squircle tiles) */}
      <section className="space-y-3">
        <h2 className="text-[18px] font-extrabold text-[#172A63] tracking-tight">
          More Offerings
        </h2>

        <div className="grid grid-cols-4 gap-x-2 gap-y-3.5">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center text-center group active:scale-95 transition-all"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] border flex items-center justify-center shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:shadow-card ${item.bg}`}
                >
                  <Icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                <span className="mt-1.5 text-[11px] font-semibold text-[#334155] leading-tight text-center line-clamp-2 max-w-[72px] group-hover:text-blue-700 transition-colors">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Do You Know? Carousel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold text-[#172A63] tracking-tight">
            Do You know?
          </h2>
        </div>

        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 snap-x scroll-smooth">
          {triviaCards.map((card) => (
            <div
              key={card.id}
              className="snap-start shrink-0 w-[240px] sm:w-[260px] rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden group hover:shadow-card transition-all"
            >
              <div className="h-32 relative overflow-hidden bg-slate-100">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-[11px] text-[#475569] font-medium leading-relaxed line-clamp-3">
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Follow Us On Social Media Platforms (Matches Screenshot 3) */}
      <section className="space-y-3">
        <h2 className="text-[18px] font-extrabold text-[#172A63] tracking-tight">
          Follow Us On Social Media Platforms
        </h2>

        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-card border border-slate-200/80 group">
          {/* Train crossing scenic bridge photo */}
          <div className="h-44 sm:h-52 w-full relative bg-slate-900 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=75"
              alt="Indian Railways Scenic Bridge"
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
            />
            {/* Subtle dusk overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-900/30" />

            {/* 4 Centered Circular Social Icons */}
            <div className="absolute inset-0 flex items-center justify-center gap-3.5 sm:gap-4 z-10">
              {/* 1. X (Twitter) */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on X"
                className="w-11 h-11 rounded-full bg-black/90 hover:bg-black text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 border border-white/20"
              >
                <span className="font-extrabold text-base">✕</span>
              </a>

              {/* 2. Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                className="w-11 h-11 rounded-full bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 border border-white/20"
              >
                <span className="font-bold text-lg leading-none">f</span>
              </a>

              {/* 3. Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 border border-white/20"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* 4. YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Subscribe to our YouTube"
                className="w-11 h-11 rounded-full bg-[#FF0000] hover:bg-[#E60000] text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 border border-white/20"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Fast Login Modal */}
      <FastLoginModal
        isOpen={showFastLogin}
        onClose={() => setShowFastLogin(false)}
      />
    </div>
  );
};
