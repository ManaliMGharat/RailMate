import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Wallet, WalletTransaction } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const WalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(500);
  const [loading, setLoading] = useState(false);

  const fetchWallet = async () => {
    try {
      const data = await apiRequest<Wallet>('/wallet');
      setWallet(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleAddMoney = async (amt: number) => {
    setLoading(true);
    try {
      const updated = await apiRequest<Wallet>('/wallet/add-money', {
        method: 'POST',
        body: JSON.stringify({ amount: amt, payment_method: 'UPI' }),
      });
      setWallet(updated);
      alert(`₹${amt} added to R-Wallet successfully!`);
    } catch (err: any) {
      alert(err.message || 'Top-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          R-Wallet (Railway Wallet)
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Instant 1-click checkout for tickets, food & automatic refunds
        </p>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-5 shadow-card space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/40 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-blue-200">
              RailMate Cash
            </span>
          </div>
          <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
            Simulated
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-semibold block">Available Balance</span>
          <h2 className="text-3xl font-black tracking-tight text-white mt-0.5">
            ₹{wallet?.balance.toFixed(2) || '0.00'}
          </h2>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
          <span>Instant Refunds Enabled</span>
          <span className="text-emerald-400 font-bold">100% Guaranteed</span>
        </div>
      </div>

      {/* Add Money Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
          Add Money to Wallet
        </span>

        <div className="flex gap-2">
          {[100, 500, 1000, 2000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setTopupAmount(amt)}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                topupAmount === amt
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              +₹{amt}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleAddMoney(topupAmount)}
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{loading ? 'Adding...' : `Add ₹${topupAmount} via Mock UPI`}</span>
        </button>
      </div>

      {/* Transaction History */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
          Recent Transactions
        </span>

        {wallet?.transactions && wallet.transactions.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card divide-y divide-slate-100 overflow-hidden">
            {wallet.transactions.map((t) => (
              <div key={t.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      t.transaction_type === 'CREDIT' || t.transaction_type === 'REFUND'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {t.transaction_type === 'CREDIT' || t.transaction_type === 'REFUND' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">{t.description}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()} • {t.reference}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-black text-xs ${
                    t.transaction_type === 'CREDIT' || t.transaction_type === 'REFUND'
                      ? 'text-emerald-600'
                      : 'text-slate-900'
                  }`}
                >
                  {t.transaction_type === 'DEBIT' ? '-' : '+'}₹{t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 text-center text-xs text-slate-400">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
};
