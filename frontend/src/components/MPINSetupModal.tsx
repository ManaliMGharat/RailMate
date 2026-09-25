import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { MPINPad } from './MPINPad';
import { apiRequest } from '../api/client';

interface MPINSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isChange?: boolean;
  onSuccess: () => void;
}

export const MPINSetupModal: React.FC<MPINSetupModalProps> = ({
  isOpen,
  onClose,
  isChange = false,
  onSuccess,
}) => {
  const [step, setStep] = useState<'current' | 'new' | 'confirm' | 'success'>(
    isChange ? 'current' : 'new'
  );
  const [currentMPIN, setCurrentMPIN] = useState('');
  const [newMPIN, setNewMPIN] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCurrentComplete = (mpin: string) => {
    setCurrentMPIN(mpin);
    setErrorMsg(null);
    setStep('new');
  };

  const handleNewComplete = (mpin: string) => {
    setNewMPIN(mpin);
    setErrorMsg(null);
    setStep('confirm');
  };

  const handleConfirmComplete = async (confirmMpin: string) => {
    if (confirmMpin !== newMPIN) {
      setErrorMsg('mPIN did not match. Please enter new mPIN again.');
      setStep('new');
      setNewMPIN('');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (isChange) {
        await apiRequest('/auth/mpin/change', {
          method: 'POST',
          body: JSON.stringify({ old_mpin: currentMPIN, new_mpin: newMPIN }),
        });
      } else {
        await apiRequest('/auth/mpin/set', {
          method: 'POST',
          body: JSON.stringify({ mpin: newMPIN }),
        });
      }
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset modal state
        setStep(isChange ? 'current' : 'new');
        setCurrentMPIN('');
        setNewMPIN('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update mPIN');
      if (isChange) {
        setStep('current');
        setCurrentMPIN('');
      } else {
        setStep('new');
      }
      setNewMPIN('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'success' ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">mPIN Configured!</h3>
            <p className="text-xs text-slate-500 font-medium">
              Your 6-digit mPIN has been securely saved and enabled.
            </p>
          </div>
        ) : (
          <div className="pt-2">
            {step === 'current' && (
              <MPINPad
                title="Enter Current mPIN"
                subtitle="Verify your existing 6-digit mPIN"
                errorMessage={errorMsg}
                loading={loading}
                onComplete={handleCurrentComplete}
                onClearError={() => setErrorMsg(null)}
              />
            )}

            {step === 'new' && (
              <MPINPad
                title={isChange ? 'Enter New mPIN' : 'Create 6-Digit mPIN'}
                subtitle="Choose a secure 6-digit passcode you'll remember"
                errorMessage={errorMsg}
                loading={loading}
                onComplete={handleNewComplete}
                onClearError={() => setErrorMsg(null)}
              />
            )}

            {step === 'confirm' && (
              <MPINPad
                title="Confirm Your mPIN"
                subtitle="Re-enter the same 6 digits to verify"
                errorMessage={errorMsg}
                loading={loading}
                onComplete={handleConfirmComplete}
                onClearError={() => setErrorMsg(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
