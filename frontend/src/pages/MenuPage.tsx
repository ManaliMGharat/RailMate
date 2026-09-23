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
  Globe,
  Bell,
  ShieldCheck,
  FileText,
  Info,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const sections = [
    {
      title: 'Journey & Schedules',
      items: [
        { label: 'Search Trains Between Stations', path: '/search', icon: Search, color: 'text-rose-500' },
        { label: 'PNR Status Enquiry', path: '/pnr', icon: Ticket, color: 'text-emerald-500' },
        { label: 'Live Train Tracking (GPS)', path: '/track-train', icon: Radio, color: 'text-amber-500' },
        { label: 'Coach Position Finder', path: '/coach-position', icon: TrainTrack, color: 'text-sky-500' },
        { label: 'Live Station Board', path: '/live-station', icon: MapPin, color: 'text-blue-500' },
        { label: 'Train Timetable & Route', path: '/train-schedule/12951', icon: Calendar, color: 'text-purple-500' },
      ],
    },
    {
      title: 'Tickets & UTS',
      items: [
        { label: 'My Bookings & Digital Tickets', path: '/my-bookings', icon: Ticket, color: 'text-blue-600' },
        { label: 'Unreserved Suburban Pass (UTS)', path: '/unreserved', icon: Ticket, color: 'text-orange-500' },
        { label: 'Platform Entry Passes', path: '/platform-ticket', icon: MapPin, color: 'text-amber-600' },
      ],
    },
    {
      title: 'Services & Support',
      items: [
        { label: 'Onboard Food Delivery (e-Catering)', path: '/food', icon: UtensilsCrossed, color: 'text-purple-600' },
        { label: 'R-Wallet & Payments', path: '/wallet', icon: Wallet, color: 'text-emerald-600' },
        { label: 'File Ticket Refund', path: '/refunds', icon: Clock, color: 'text-slate-600' },
        { label: 'Rail Support (Passenger Grievance)', path: '/support', icon: HeartHandshake, color: 'text-red-500' },
        { label: 'Notification Center', path: '/notifications', icon: Bell, color: 'text-blue-500' },
      ],
    },
    {
      title: 'Administration & System',
      items: [
        { label: 'Admin Dashboard & Management', path: '/admin', icon: ShieldCheck, color: 'text-slate-900' },
      ],
    },
  ];

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          All Services Directory
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Comprehensive access to all RailMate digital railway tools
        </p>
      </div>

      {sections.map((sec, idx) => (
        <div key={idx} className="space-y-1.5">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
            {sec.title}
          </span>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden">
            {sec.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  onClick={() => navigate(item.path)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* About Box */}
      <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-500 space-y-1 border border-slate-200/60">
        <span className="font-extrabold text-slate-800 block">RailMate v1.0.0 (Demo Mode)</span>
        <p className="text-[11px] text-slate-400">
          Independent educational demo. Not affiliated with IRCTC or CRIS.
        </p>
      </div>
    </div>
  );
};
