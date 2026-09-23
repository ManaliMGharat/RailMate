import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Fingerprint,
  Globe,
  Lock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const profilePercent = user?.profile_completion || 85;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          {t('nav_you')} (My Account)
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Profile, saved travelers, preferences and security
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
            {user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'MG'}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 leading-tight">
              {user?.full_name || 'Manali Manish Gharat'}
            </h2>
            <span className="text-[11px] text-slate-400 block mt-0.5">{user?.email || 'demo@railmate.com'}</span>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.2 rounded-full inline-block mt-1">
              Verified RailMate Traveler
            </span>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-600">Profile Completion</span>
            <span className="text-blue-700">{profilePercent}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${profilePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Account Settings List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden text-xs">
        {/* Saved Passengers */}
        <div
          onClick={() => navigate('/search')}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block">Master Passenger List</span>
              <span className="text-[10px] text-slate-400">Pre-fill co-travelers for faster booking</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Biometric Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block">Biometric Fast Login</span>
              <span className="text-[10px] text-slate-400">Unlock RailMate with fingerprint / Face ID</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={biometricEnabled}
            onChange={(e) => setBiometricEnabled(e.target.checked)}
            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
          />
        </div>

        {/* Language Selection */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block">Language Preference</span>
              <span className="text-[10px] text-slate-400">English, Hindi, Marathi</span>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border-none focus:outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        {/* Security & Password */}
        <div
          onClick={() => alert('Demo Mode: Password change simulated.')}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block">Change Password</span>
              <span className="text-[10px] text-slate-400">Update security credentials</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Admin Portal Shortcut */}
      {user?.role === 'admin' ? (
        <button
          onClick={() => navigate('/admin')}
          className="w-full py-3 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-2xl shadow-card transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Access Admin Control Center</span>
        </button>
      ) : (
        <button
          onClick={() => navigate('/admin')}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Admin Panel Demo View</span>
        </button>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-2.5 bg-red-50 hover:bg-red-100/80 text-red-600 font-bold text-xs rounded-2xl border border-red-200 transition-all flex items-center justify-center gap-1.5"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of RailMate</span>
      </button>
    </div>
  );
};
