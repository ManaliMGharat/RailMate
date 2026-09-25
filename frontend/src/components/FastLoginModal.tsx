import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  KeyRound,
  Lock,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { MPINPad } from './MPINPad';
import { useAuth } from '../context/AuthContext';
import {
  isPlatformAuthenticatorAvailable,
  authenticateBiometricsWithBrowser,
} from '../utils/webauthn';
import { apiRequest } from '../api/client';
import { MPINStatus } from '../types';

interface FastLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FastLoginModal: React.FC<FastLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { login, loginWithMPIN, loginWithBiometric } = useAuth();
  const [activeTab, setActiveTab] = useState<'biometric' | 'mpin' | 'password'>('biometric');
  const [mpinStatus, setMpinStatus] = useState<MPINStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('demo@railone.com');
  const [password, setPassword] = useState('password123');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);

    // Fetch pre-login status for demo account
    apiRequest<MPINStatus>(`/auth/mpin/status?email_or_mobile=${encodeURIComponent(email)}`)
      .then((status) => {
        setMpinStatus(status);
        if (status.is_locked) {
          setActiveTab('password');
        }
      })
      .catch(() => {});
  }, [isOpen, email]);

  const handleBiometricAuth = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const isAvailable = await isPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        // Fallback directly to mPIN
        setActiveTab('mpin');
        return;
      }

      // 1. Get login challenge
      const challengeData = await apiRequest<any>(
        `/auth/biometric/login-challenge?email_or_mobile=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );

      // 2. Invoke browser biometric credential
      const assertion = await authenticateBiometricsWithBrowser(challengeData);

      // 3. Login with assertion
      await loginWithBiometric(
        assertion.credential_id,
        email,
        assertion.authenticator_data,
        assertion.client_data_json,
        assertion.signature
      );

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.warn('Biometric auth failed or cancelled, falling back to mPIN:', err);
      // Seamless immediate fallback to 6-digit mPIN as required by prompt!
      setErrorMessage(err.message?.includes('cancelled') ? 'Biometrics cancelled. Switched to 6-digit mPIN.' : err.message);
      setActiveTab('mpin');
    } finally {
      setLoading(false);
    }
  };

  const handleMPINComplete = async (mpin: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithMPIN(mpin, email);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect mPIN');
      // Refresh status to check lockouts
      apiRequest<MPINStatus>(`/auth/mpin/status?email_or_mobile=${encodeURIComponent(email)}`)
        .then((s) => setMpinStatus(s))
        .catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher: Biometric -> mPIN -> Password */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('biometric');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'biometric'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Biometric</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('mpin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'mpin'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>mPIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
        </div>

        {/* TAB 1: Biometric Fast Login */}
        {activeTab === 'biometric' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <Fingerprint className="w-9 h-9 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Biometric Fast Login</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Touch your fingerprint sensor or look at your camera to sign in instantly.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handleBiometricAuth}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Unlock with Windows Hello / Touch ID'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mpin')}
              className="text-xs font-bold text-blue-600 hover:underline block mx-auto"
            >
              Fallback: Use 6-Digit mPIN instead
            </button>
          </div>
        )}

        {/* TAB 2: 6-Digit mPIN Pad */}
        {activeTab === 'mpin' && (
          <div>
            <MPINPad
              title="6-Digit mPIN Login"
              subtitle="Enter your 6-digit passcode (Demo default: 123456)"
              errorMessage={errorMessage}
              isLocked={Boolean(mpinStatus?.is_locked)}
              attemptsRemaining={mpinStatus?.attempts_remaining ?? 5}
              loading={loading}
              onComplete={handleMPINComplete}
              onClearError={() => setErrorMessage(null)}
            />

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className="text-xs font-bold text-slate-500 hover:text-blue-600"
              >
                Forgot mPIN? Sign in with Password
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Traditional Password */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Email / Mobile
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In with Password'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mpin')}
              className="text-xs font-bold text-blue-600 hover:underline block mx-auto text-center"
            >
              Switch to 6-Digit mPIN Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
