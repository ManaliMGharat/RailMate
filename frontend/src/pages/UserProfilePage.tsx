import React, { useState, useEffect } from 'react';
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
  Users,
  KeyRound,
  Laptop,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { MPINSetupModal } from '../components/MPINSetupModal';
import { MPINStatus, BiometricStatus } from '../types';
import { apiRequest } from '../api/client';
import {
  isPlatformAuthenticatorAvailable,
  registerBiometricsWithBrowser,
} from '../utils/webauthn';

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mpinStatus, setMpinStatus] = useState<MPINStatus | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [mpinModalChange, setMpinModalChange] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone verification state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [phoneOtpSuccess, setPhoneOtpSuccess] = useState<string | null>(null);

  const handleOpenPhoneVerify = async () => {
    setShowPhoneModal(true);
    setPhoneOtp('');
    setPhoneOtpError(null);
    setPhoneOtpSuccess(null);
    setPhoneOtpLoading(true);
    try {
      await apiRequest('/auth/send-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ phone_number: user?.mobile || '9876543210' }),
      });
      setPhoneOtpSuccess('Demo OTP sent! Code: 123456');
    } catch (err: any) {
      setPhoneOtpError(err.message || 'Failed to send OTP.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneOtpLoading(true);
    setPhoneOtpError(null);
    try {
      await apiRequest('/auth/verify-phone-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: user?.mobile || '9876543210',
          otp: phoneOtp.trim() || '123456',
        }),
      });
      await refreshProfile();
      setPhoneOtpSuccess('✓ Mobile number verified successfully!');
      setTimeout(() => {
        setShowPhoneModal(false);
      }, 1000);
    } catch (err: any) {
      setPhoneOtpError(err.message || 'Invalid OTP code.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const profilePercent = user?.profile_completion || 85;

  const loadSecurityStatus = async () => {
    try {
      const [mStatus, bStatus] = await Promise.all([
        apiRequest<MPINStatus>('/auth/mpin/status'),
        apiRequest<BiometricStatus>('/auth/biometric/status'),
      ]);
      setMpinStatus(mStatus);
      setBiometricStatus(bStatus);
    } catch (e) {
      console.error('Failed to load security status', e);
    }
  };

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const handleToggleMpin = async (enabled: boolean) => {
    if (enabled && !mpinStatus?.has_mpin) {
      setMpinModalChange(false);
      setShowMpinModal(true);
      return;
    }
    try {
      await apiRequest('/auth/mpin/toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      setMpinStatus((prev) => (prev ? { ...prev, mpin_enabled: enabled } : null));
      setNotification({
        type: 'success',
        text: `mPIN login ${enabled ? 'enabled' : 'disabled'} successfully.`,
      });
      refreshProfile();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to toggle mPIN' });
    }
  };

  const handleRegisterBiometrics = async () => {
    setBioLoading(true);
    setNotification(null);
    try {
      const available = await isPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('Platform biometric authenticator (Windows Hello, Touch ID, Face ID) is not available on this browser/device.');
      }

      // 1. Get challenge
      const challengeData = await apiRequest<any>('/auth/biometric/register-challenge', {
        method: 'POST',
      });

      // 2. Invoke browser WebAuthn API
      const result = await registerBiometricsWithBrowser(challengeData);

      // 3. Verify and save on backend
      await apiRequest('/auth/biometric/register-verify', {
        method: 'POST',
        body: JSON.stringify(result),
      });

      setNotification({
        type: 'success',
        text: 'Biometric passkey registered successfully with Windows Hello / Touch ID!',
      });
      loadSecurityStatus();
      refreshProfile();
    } catch (err: any) {
      console.warn('Biometric registration error:', err);
      // Helpful fallback note
      setNotification({
        type: 'error',
        text: err.message || 'Biometric authentication was cancelled or not supported.',
      });
    } finally {
      setBioLoading(false);
    }
  };

  const handleToggleBiometrics = async (enabled: boolean) => {
    try {
      await apiRequest('/auth/biometric/toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      setBiometricStatus((prev) => (prev ? { ...prev, biometric_enabled: enabled } : null));
      setNotification({
        type: 'success',
        text: `Biometrics ${enabled ? 'enabled' : 'disabled'} successfully.`,
      });
      refreshProfile();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to toggle biometrics' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

      {notification && (
        <div
          className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
            {user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'MG'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-slate-900 leading-tight truncate">
              {user?.full_name || 'Manali Manish Gharat'}
            </h2>
            <div className="text-[11px] text-slate-500 flex flex-col gap-0.5 mt-0.5">
              <span className="truncate">{user?.email || 'demo@railone.com'}</span>
              <span className="font-semibold text-slate-700">{user?.mobile || '+91 9876543210'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                Verified Traveler
              </span>
              {user?.is_phone_verified ? (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  ✓ Phone Verified
                </span>
              ) : (
                <div className="inline-flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    ⚠ Phone Not Verified
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenPhoneVerify}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline"
                  >
                    Verify Now
                  </button>
                </div>
              )}
              {mpinStatus?.mpin_enabled && (
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                  mPIN Active
                </span>
              )}
            </div>
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

      {/* Security & Authentication Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Security & Fast Login
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">Biometric & mPIN</span>
        </div>

        {/* 6-Digit mPIN Card */}
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">6-Digit mPIN Login</span>
                <span className="text-[10px] text-slate-500">
                  {mpinStatus?.has_mpin
                    ? mpinStatus.mpin_enabled
                      ? 'Enabled (Default demo PIN: 123456)'
                      : 'Disabled'
                    : 'Not configured'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(mpinStatus?.mpin_enabled)}
              onChange={(e) => handleToggleMpin(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
            {mpinStatus?.has_mpin ? (
              <button
                type="button"
                onClick={() => {
                  setMpinModalChange(true);
                  setShowMpinModal(true);
                }}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all"
              >
                Change 6-Digit mPIN
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMpinModalChange(false);
                  setShowMpinModal(true);
                }}
                className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all"
              >
                Set Up 6-Digit mPIN
              </button>
            )}
            {mpinStatus?.is_locked && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                Locked
              </span>
            )}
          </div>
        </div>

        {/* WebAuthn Biometrics Card */}
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">Biometric Fast Login</span>
                <span className="text-[10px] text-slate-500">
                  W3C WebAuthn (Windows Hello / Touch ID / Face ID)
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(biometricStatus?.biometric_enabled)}
              onChange={(e) => handleToggleBiometrics(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <button
              type="button"
              disabled={bioLoading}
              onClick={handleRegisterBiometrics}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{bioLoading ? 'Registering...' : 'Register Passkey / Biometrics'}</span>
            </button>

            {biometricStatus && biometricStatus.credentials_count > 0 && (
              <span className="text-[10px] font-bold text-slate-400">
                {biometricStatus.credentials_count} device(s)
              </span>
            )}
          </div>

          {biometricStatus?.device_names && biometricStatus.device_names.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {biometricStatus.device_names.map((name, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1"
                >
                  <Laptop className="w-3 h-3 text-slate-400" />
                  {name}
                </span>
              ))}
            </div>
          )}
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
          onClick={() => {
            setMpinModalChange(true);
            setShowMpinModal(true);
          }}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block">Manage Security PIN</span>
              <span className="text-[10px] text-slate-400">Update 6-digit mPIN passcode</span>
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
        <span>Log Out of RailOne</span>
      </button>

      {/* mPIN Setup / Change Modal */}
      <MPINSetupModal
        isOpen={showMpinModal}
        isChange={mpinModalChange}
        onClose={() => setShowMpinModal(false)}
        onSuccess={() => {
          loadSecurityStatus();
          setNotification({
            type: 'success',
            text: '6-digit mPIN updated successfully.',
          });
        }}
      />

      {/* Phone OTP Verification Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-card space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Phone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Verify Mobile Number</h3>
              <p className="text-xs text-slate-500">
                Enter OTP code sent to <span className="font-bold text-slate-800">{user?.mobile || '+91 9876543210'}</span>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 text-center text-xs text-amber-800 space-y-0.5">
              <span className="font-bold block">Demo Mode Active</span>
              <span className="text-[11px]">Use demo OTP code: <span className="font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">123456</span></span>
            </div>

            <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
              <input
                type="text"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP (e.g. 123456)"
                className="w-full text-center tracking-widest text-lg font-extrabold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                maxLength={6}
                required
              />

              {phoneOtpError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{phoneOtpError}</span>
                </div>
              )}

              {phoneOtpSuccess && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{phoneOtpSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={phoneOtpLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  {phoneOtpLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
