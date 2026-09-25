import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fingerprint,
  ScanFace,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  ShieldCheck,
  Phone,
  Smartphone,
  RefreshCw,
  User as UserIcon,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { RailOneLogo } from '../assets/illustrations';
import { apiRequest } from '../api/client';
import { MPINStatus, BiometricStatus } from '../types';
import {
  isPlatformAuthenticatorAvailable,
  authenticateBiometricsWithBrowser,
  registerBiometricsWithBrowser,
} from '../utils/webauthn';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, loginWithMPIN, loginWithBiometric, register, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('demo@railone.com');
  const [userName, setUserName] = useState('Manali Manish Gharat');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShake, setIsShake] = useState(false);

  // Biometric state
  const [biometricSupported, setBiometricSupported] = useState<boolean>(true);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [bioLoading, setBioLoading] = useState(false);

  // Sign In / Register Modal state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [modalTab, setModalTab] = useState<'signin' | 'register'>('signin');
  const [showResetModal, setShowResetModal] = useState(false);
  const [password, setPassword] = useState('password123');

  // Registration fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Phone OTP Verification Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Check if device supports platform authenticator
    isPlatformAuthenticatorAvailable().then((supported) => {
      setBiometricSupported(supported);
    });

    // Check pre-login security status for email
    apiRequest<MPINStatus>(`/auth/mpin/status?email_or_mobile=${encodeURIComponent(email)}`)
      .then(() => {})
      .catch(() => {});

    apiRequest<BiometricStatus>(`/auth/biometric/status?email_or_mobile=${encodeURIComponent(email)}`)
      .then((status) => {
        setBiometricEnabled(status.biometric_enabled);
      })
      .catch(() => {});

    if (user?.full_name) {
      setUserName(user.full_name);
    }

    // Auto-focus first input box
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  }, [email, user]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const next = [...digits];
      for (let i = 0; i < 6 && i < clean.length; i++) {
        next[i] = clean[i];
      }
      setDigits(next);
      const targetIndex = Math.min(clean.length, 5);
      inputRefs.current[targetIndex]?.focus();

      if (clean.length >= 6) {
        submitMPIN(next.join(''));
      }
      return;
    }

    const next = [...digits];
    next[index] = clean[clean.length - 1];
    setDigits(next);
    setErrorMsg(null);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      const fullPin = next.join('');
      if (fullPin.length === 6) {
        submitMPIN(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const submitMPIN = async (pin: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithMPIN(pin, email);
      setSuccessMsg('mPIN verification successful!');
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect mPIN. Please try again.');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Biometric toggle click handler
  const handleToggleBiometric = async () => {
    if (!biometricSupported) {
      setErrorMsg("Biometric authentication isn't available on this device.");
      return;
    }

    setBioLoading(true);
    setErrorMsg(null);
    try {
      if (!biometricEnabled) {
        const challenge = await apiRequest<any>('/auth/biometric/challenge');
        const credential = await registerBiometricsWithBrowser(challenge);
        await apiRequest('/auth/biometric/register', {
          method: 'POST',
          body: JSON.stringify(credential),
        });
        setBiometricEnabled(true);
        setSuccessMsg('✓ Biometric login enabled successfully!');
      } else {
        await apiRequest('/auth/biometric/toggle', {
          method: 'POST',
          body: JSON.stringify({ enabled: false }),
        });
        setBiometricEnabled(false);
        setSuccessMsg('Biometric login disabled.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication wasn't completed. Use mPIN instead.");
    } finally {
      setBioLoading(false);
    }
  };

  // Quick Biometric Login Trigger
  const handleTriggerBiometricLogin = async () => {
    if (!biometricSupported) {
      setErrorMsg("Biometric authentication isn't available on this device.");
      return;
    }
    setBioLoading(true);
    setErrorMsg(null);
    try {
      const challengeData = await apiRequest<any>(
        `/auth/biometric/login-challenge?email_or_mobile=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );
      const assertion = await authenticateBiometricsWithBrowser(challengeData);
      await loginWithBiometric(
        assertion.credential_id,
        email,
        assertion.authenticator_data,
        assertion.client_data_json,
        assertion.signature
      );
      setSuccessMsg('Biometric authentication verified!');
      setTimeout(() => navigate('/'), 400);
    } catch (err: any) {
      setErrorMsg("Authentication wasn't completed. Please enter your 6-digit mPIN below.");
      inputRefs.current[0]?.focus();
    } finally {
      setBioLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      setShowAccountModal(false);
      
      // Check if logged-in user needs phone verification
      const profile = await apiRequest<any>('/users/me');
      if (profile && profile.is_phone_verified === false) {
        setOtpPhone(profile.mobile || '');
        setShowOtpModal(true);
        // Automatically request OTP
        await triggerSendPhoneOtp(profile.mobile || '');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const validateIndianMobile = (mobile: string) => {
    const clean = mobile.replace(/\D/g, '');
    const tenDigit = clean.length === 12 && clean.startsWith('91') ? clean.slice(2) : clean;
    return tenDigit.length === 10 && ['6', '7', '8', '9'].includes(tenDigit[0]);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!validateIndianMobile(regMobile)) {
      setRegError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const cleanMobile = regMobile.replace(/\D/g, '');
      const formattedMobile = cleanMobile.length === 10 ? `+91${cleanMobile}` : `+${cleanMobile}`;
      await register(regFullName, regEmail, formattedMobile, regPassword);
      setShowAccountModal(false);

      // Open OTP Verification Modal
      setOtpPhone(formattedMobile);
      setShowOtpModal(true);
      await triggerSendPhoneOtp(formattedMobile);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const triggerSendPhoneOtp = async (phone: string) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await apiRequest<any>('/auth/send-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phone }),
      });
      setOtpSuccess(res.message || 'Demo OTP sent! Code: 123456');
      setResendCooldown(30);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    if (clean.length > 1) {
      const next = [...otpDigits];
      for (let i = 0; i < 6 && i < clean.length; i++) {
        next[i] = clean[i];
      }
      setOtpDigits(next);
      const targetIndex = Math.min(clean.length, 5);
      otpInputRefs.current[targetIndex]?.focus();
      if (clean.length >= 6) {
        submitPhoneOtp(next.join(''));
      }
      return;
    }

    const next = [...otpDigits];
    next[index] = clean[clean.length - 1];
    setOtpDigits(next);
    setOtpError(null);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else {
      const fullOtp = next.join('');
      if (fullOtp.length === 6) {
        submitPhoneOtp(fullOtp);
      }
    }
  };

  const submitPhoneOtp = async (code: string) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      await apiRequest('/auth/verify-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ phone_number: otpPhone, otp: code }),
      });
      await refreshProfile();
      setOtpSuccess('✓ Phone number verified successfully!');
      setTimeout(() => {
        setShowOtpModal(false);
        navigate('/');
      }, 700);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP code. Please enter 123456.');
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between px-6 py-6 max-w-md mx-auto">
      {/* Top Header with Back & Centered RailOne Logo */}
      <div className="relative flex items-center justify-center pt-2 pb-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute left-0 p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <RailOneLogo size={32} />
      </div>

      {/* Main Content: matches Screenshot 1000490820.jpg */}
      <div className="flex-1 flex flex-col justify-center space-y-6 pt-4 pb-8">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-extrabold text-[#172A63] tracking-tight">
            Login using mPIN
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Welcome {userName}!
          </p>
          <p className="text-xs font-semibold text-slate-400 pt-1">
            Enter mPIN below
          </p>
        </div>

        {/* 6 Square PIN Input Boxes */}
        <div
          className={`flex items-center justify-center gap-2.5 sm:gap-3 my-2 ${
            isShake ? 'animate-shake' : ''
          }`}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-12 h-14 sm:w-13 sm:h-15 text-center text-xl font-extrabold rounded-2xl bg-white border-2 transition-all shadow-xs focus:outline-none ${
                digit
                  ? 'border-blue-600 bg-blue-50/20 text-slate-900 ring-2 ring-blue-500/20'
                  : 'border-sky-200 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
          ))}
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 py-2 px-3 rounded-xl animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-3 rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Links: Forgot Password? | Reset mPIN? */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setModalTab('signin');
              setShowAccountModal(true);
            }}
            className="text-xs font-bold text-[#172A63] hover:text-blue-700 active:scale-95 transition-colors"
          >
            Forgot Password?
          </button>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-xs font-bold text-[#172A63] hover:text-blue-700 active:scale-95 transition-colors"
          >
            Reset mPIN?
          </button>
        </div>

        {/* Biometric Trigger Button (if supported & enrolled) */}
        {biometricSupported && biometricEnabled && (
          <button
            type="button"
            onClick={handleTriggerBiometricLogin}
            disabled={bioLoading}
            className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
          >
            <Fingerprint className="w-4 h-4 text-blue-600" />
            <span>{bioLoading ? 'Verifying Biometrics...' : 'Use Biometric Login'}</span>
          </button>
        )}

        {/* Divider: ---------------- Enable biometric ? ---------------- */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-slate-300" />
          </div>
          <span className="relative bg-white px-3 text-xs font-semibold text-slate-500">
            Enable biometric ?
          </span>
        </div>

        {/* Biometric Toggle Section */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
              <ScanFace className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
              <Fingerprint className="w-6 h-6 stroke-[1.8]" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleBiometric}
            disabled={bioLoading}
            aria-label="Toggle biometric authentication"
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
              biometricEnabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                biometricEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {bioLoading && (
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </button>
        </div>

        <p className="text-[12px] text-slate-500 font-normal leading-relaxed px-1">
          By enabling biometric authentication, you can log in using your device's biometric authentication.
        </p>
      </div>

      {/* Bottom Link: Different User? */}
      <div className="pt-4 text-center pb-2 border-t border-slate-100 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            setModalTab('signin');
            setShowAccountModal(true);
          }}
          className="text-sm font-extrabold text-[#172A63] hover:text-blue-700 transition-colors active:scale-95"
        >
          Different User?
        </button>
        <span className="text-slate-300">•</span>
        <button
          type="button"
          onClick={() => {
            setModalTab('register');
            setShowAccountModal(true);
          }}
          className="text-sm font-extrabold text-blue-600 hover:text-blue-700 transition-colors active:scale-95"
        >
          Register New Account
        </button>
      </div>

      {/* Sign In & Register Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-card space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('signin')}
                className={`flex-1 py-1.5 rounded-xl transition-all ${
                  modalTab === 'signin' ? 'bg-white text-blue-700 shadow-soft' : 'text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setModalTab('register')}
                className={`flex-1 py-1.5 rounded-xl transition-all ${
                  modalTab === 'register' ? 'bg-white text-blue-700 shadow-soft' : 'text-slate-600'
                }`}
              >
                Register
              </button>
            </div>

            {modalTab === 'signin' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Email / Mobile Number
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@railone.com or 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Mobile Number (India +91)
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="9876543210 (10 digits)"
                      maxLength={10}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                {regError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                  >
                    {loading ? 'Creating...' : 'Register & Verify Phone'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Phone OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-card space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Verify Mobile Number</h3>
              <p className="text-xs text-slate-500">
                Enter the 6-digit OTP code sent to <span className="font-bold text-slate-800">{otpPhone}</span>
              </p>
            </div>

            {/* Demo Notice Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 text-center text-xs text-amber-800 space-y-0.5">
              <span className="font-bold block">Demo Mode Active</span>
              <span className="text-[11px]">Use demo OTP code: <span className="font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">123456</span></span>
            </div>

            {/* OTP input boxes */}
            <div className="flex items-center justify-center gap-2 my-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  className={`w-10 h-12 text-center text-lg font-extrabold rounded-xl bg-slate-50 border-2 transition-all ${
                    digit
                      ? 'border-blue-600 bg-blue-50/20 text-slate-900'
                      : 'border-slate-200 text-slate-800 focus:border-blue-500'
                  }`}
                />
              ))}
            </div>

            {otpError && (
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                disabled={resendCooldown > 0 || otpLoading}
                onClick={() => triggerSendPhoneOtp(otpPhone)}
                className="font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${otpLoading ? 'animate-spin' : ''}`} />
                <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpDigits(['1', '2', '3', '4', '5', '6']);
                  submitPhoneOtp('123456');
                }}
                className="font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                Auto-fill 123456
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={otpLoading || otpDigits.join('').length !== 6}
                onClick={() => submitPhoneOtp(otpDigits.join(''))}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                {otpLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset mPIN Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-card space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Reset 6-digit mPIN</h3>
            <p className="text-xs text-slate-500">
              For security, please enter your account password to set a new 6-digit mPIN.
            </p>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Account password"
                defaultValue="password123"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setSuccessMsg('mPIN reset instructions sent to registered mobile/email.');
                  }}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
