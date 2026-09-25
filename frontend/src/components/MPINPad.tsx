import React, { useEffect, useState } from 'react';
import { Delete, Lock, AlertTriangle } from 'lucide-react';

interface MPINPadProps {
  onComplete: (mpin: string) => void;
  title?: string;
  subtitle?: string;
  errorMessage?: string | null;
  isLocked?: boolean;
  lockoutTimeRemaining?: string | null;
  attemptsRemaining?: number;
  loading?: boolean;
  onClearError?: () => void;
}

export const MPINPad: React.FC<MPINPadProps> = ({
  onComplete,
  title = 'Enter 6-Digit mPIN',
  subtitle = 'Enter your 6-digit security mPIN to proceed',
  errorMessage = null,
  isLocked = false,
  lockoutTimeRemaining = null,
  attemptsRemaining = 5,
  loading = false,
  onClearError,
}) => {
  const [digits, setDigits] = useState<string[]>([]);
  const [shake, setShake] = useState(false);

  // Trigger shake animation on new error
  useEffect(() => {
    if (errorMessage) {
      setShake(true);
      const timer = setTimeout(() => {
        setShake(false);
        setDigits([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Physical keyboard support
  useEffect(() => {
    if (isLocked || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [digits, isLocked, loading]);

  const handleDigit = (digit: string) => {
    if (isLocked || loading) return;
    if (errorMessage && onClearError) {
      onClearError();
    }
    if (digits.length < 6) {
      const next = [...digits, digit];
      setDigits(next);
      if (next.length === 6) {
        onComplete(next.join(''));
      }
    }
  };

  const handleBackspace = () => {
    if (isLocked || loading) return;
    if (errorMessage && onClearError) {
      onClearError();
    }
    if (digits.length > 0) {
      setDigits(digits.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (isLocked || loading) return;
    if (errorMessage && onClearError) {
      onClearError();
    }
    setDigits([]);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-4 py-3 select-none">
      {/* Title & Subtitle */}
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
      </div>

      {/* Lockout Warning */}
      {isLocked && (
        <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <div>
            <p className="font-bold">mPIN Temporarily Locked</p>
            <p className="text-[11px] text-rose-600">
              {lockoutTimeRemaining || 'Locked for 15 minutes due to multiple failed attempts.'}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && !isLocked && (
        <div className="w-full mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-bold text-rose-600">
          {errorMessage}
        </div>
      )}

      {/* Attempts remaining banner */}
      {attemptsRemaining < 5 && !isLocked && !errorMessage && (
        <div className="mb-3 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
        </div>
      )}

      {/* 6-Digit Masked Dots Indicator */}
      <div
        className={`flex items-center justify-center gap-3.5 mb-7 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const isFilled = digits.length > idx;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center ${
                isFilled
                  ? 'bg-blue-600 scale-110 shadow-sm shadow-blue-500/30'
                  : 'bg-slate-200 border-2 border-transparent'
              } ${isLocked ? 'opacity-40' : ''}`}
            >
              {isFilled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          );
        })}
      </div>

      {/* Numeric Touch Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[270px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            disabled={isLocked || loading}
            onClick={() => handleDigit(num)}
            className="h-14 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xl font-bold flex items-center justify-center shadow-sm active:scale-95 active:bg-blue-50 active:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {num}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={isLocked || loading || digits.length === 0}
          onClick={handleClear}
          className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Clear
        </button>

        {/* 0 Button */}
        <button
          type="button"
          disabled={isLocked || loading}
          onClick={() => handleDigit('0')}
          className="h-14 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xl font-bold flex items-center justify-center shadow-sm active:scale-95 active:bg-blue-50 active:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={isLocked || loading || digits.length === 0}
          onClick={handleBackspace}
          className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Verifying mPIN...</span>
        </div>
      )}
    </div>
  );
};
