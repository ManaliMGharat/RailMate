import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../api/client';
import { Booking } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    train,
    fromStation,
    toStation,
    journeyDate,
    quota,
    chosenClass,
    passengers,
    baseFare,
    taxes,
    totalAmount,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'WALLET' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('manali@okaxis');
  const [walletBalance, setWalletBalance] = useState<number>(2500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('Initiating Mock Payment...');

  useEffect(() => {
    if (!train || !passengers) {
      navigate('/search');
      return;
    }
    // Fetch wallet balance
    apiRequest<{ balance: number }>('/wallet')
      .then((data) => setWalletBalance(data.balance))
      .catch(() => {});
  }, [train]);

  const handlePay = async () => {
    setIsProcessing(true);
    setProcessingStep('Connecting to Mock Gateway...');

    try {
      await new Promise((r) => setTimeout(r, 700));
      setProcessingStep('Authorizing simulated transaction...');
      await new Promise((r) => setTimeout(r, 800));
      setProcessingStep('Allocating seats and issuing PNR...');

      // Call Backend API to create confirmed booking
      const payload = {
        train_id: train.id,
        from_station_id: fromStation.id,
        to_station_id: toStation.id,
        journey_date: journeyDate,
        travel_class: chosenClass.class_code,
        quota: quota,
        passengers: passengers.map((p: any) => ({
          name: p.name,
          age: p.age,
          gender: p.gender,
          berth_preference: p.berth_preference,
        })),
        payment_method: paymentMethod,
      };

      const booking = await apiRequest<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Celebration Confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setProcessingStep('Booking Confirmed!');
      await new Promise((r) => setTimeout(r, 600));

      navigate(`/ticket/${booking.id}`, { replace: true });
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed. Please try another method.');
      setIsProcessing(false);
    }
  };

  if (!train) return null;

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      {/* Top Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-slate-900">Mock Payment</h1>
          <span className="text-[11px] font-semibold text-slate-400">Step 4 of 4</span>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-4 text-white shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs text-blue-100 font-medium block">Total Payable</span>
          <span className="text-2xl font-black">₹{totalAmount?.toFixed(2)}</span>
        </div>
        <div className="text-right text-xs">
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider block">
            {passengers?.length} Passenger(s)
          </span>
          <span className="text-blue-100 text-[11px] block mt-1">
            {train.number} ({chosenClass.class_code})
          </span>
        </div>
      </div>

      {/* Payment Options */}
      <div className="space-y-3">
        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block px-1">
          Select Payment Method
        </span>

        {/* 1. UPI */}
        <div
          onClick={() => setPaymentMethod('UPI')}
          className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer ${
            paymentMethod === 'UPI'
              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-card'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">UPI (Instant)</span>
                <span className="text-[10px] text-slate-400">GPay, PhonePe, Paytm, BHIM</span>
              </div>
            </div>
            <input
              type="radio"
              checked={paymentMethod === 'UPI'}
              onChange={() => setPaymentMethod('UPI')}
              className="w-4 h-4 text-blue-600"
            />
          </div>

          {paymentMethod === 'UPI' && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-500">
                Enter Simulated Virtual UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@bank"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* 2. R-Wallet */}
        <div
          onClick={() => setPaymentMethod('WALLET')}
          className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer ${
            paymentMethod === 'WALLET'
              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-card'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">R-Wallet</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                    Fastest
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Available Balance: ₹{walletBalance.toFixed(2)}
                </span>
              </div>
            </div>
            <input
              type="radio"
              checked={paymentMethod === 'WALLET'}
              onChange={() => setPaymentMethod('WALLET')}
              className="w-4 h-4 text-blue-600"
            />
          </div>

          {paymentMethod === 'WALLET' && walletBalance < totalAmount && (
            <div className="mt-2.5 p-2 bg-red-50 text-red-600 text-[11px] rounded-lg font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Insufficient wallet balance. Please choose UPI or Card.
            </div>
          )}
        </div>

        {/* 3. Debit / Credit Cards */}
        <div
          onClick={() => setPaymentMethod('CARD')}
          className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer ${
            paymentMethod === 'CARD'
              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-card'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Debit / Credit Card</span>
                <span className="text-[10px] text-slate-400">Visa, Mastercard, RuPay</span>
              </div>
            </div>
            <input
              type="radio"
              checked={paymentMethod === 'CARD'}
              onChange={() => setPaymentMethod('CARD')}
              className="w-4 h-4 text-blue-600"
            />
          </div>

          {paymentMethod === 'CARD' && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <input
                type="text"
                disabled
                value="•••• •••• •••• 4242 (Demo Card)"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  disabled
                  value="12/28"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                />
                <input
                  type="text"
                  disabled
                  value="•••"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Net Banking */}
        <div
          onClick={() => setPaymentMethod('NETBANKING')}
          className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer ${
            paymentMethod === 'NETBANKING'
              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-card'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Net Banking</span>
                <span className="text-[10px] text-slate-400">SBI, HDFC, ICICI, Axis, PNB</span>
              </div>
            </div>
            <input
              type="radio"
              checked={paymentMethod === 'NETBANKING'}
              onChange={() => setPaymentMethod('NETBANKING')}
              className="w-4 h-4 text-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Pay Action Button */}
      <div className="pt-2">
        <button
          onClick={handlePay}
          disabled={isProcessing || (paymentMethod === 'WALLET' && walletBalance < totalAmount)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-card transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{processingStep}</span>
            </>
          ) : (
            <>
              <span>Pay & Confirm ₹{totalAmount?.toFixed(2)}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Processing Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-600 border-t-transparent animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                Processing Mock Payment
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {processingStep}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Please do not press back or refresh
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
