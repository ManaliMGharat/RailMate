import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, IndianRupee } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Refund } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const RefundsPage: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = async () => {
    try {
      const data = await apiRequest<Refund[]>('/refunds');
      setRefunds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          Cancellation & Refunds
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Track electronic refund status & cancellation charges
        </p>
      </div>

      {/* Railway Cancellation Rules Brief */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-4 text-xs space-y-2">
        <span className="font-extrabold text-blue-900 block">
          Standard Railway Cancellation Slabs:
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-blue-800">
          <div>• 1st AC / Executive: ₹240 / pax</div>
          <div>• 2nd AC: ₹200 / pax</div>
          <div>• 3rd AC / Chair Car: ₹180 / pax</div>
          <div>• Sleeper Class: ₹120 / pax</div>
        </div>
        <p className="text-[10px] text-blue-600 font-medium pt-1">
          Refunds on RailMate are credited directly to your R-Wallet balance instantly.
        </p>
      </div>

      {/* Refunds Ledger */}
      <div className="space-y-3">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
          Refund Records ({refunds.length})
        </span>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading refunds...</div>
        ) : refunds.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-soft">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No refund requests found</p>
          </div>
        ) : (
          refunds.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold text-blue-700 tracking-wider">
                    {r.refund_ref}
                  </span>
                  <span className="text-xs font-bold text-slate-900 block">
                    Booking ID #{r.booking_id}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    r.status === 'APPROVED' || r.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Original Fare Paid</span>
                  <span className="font-semibold text-slate-800">₹{r.original_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Cancellation Deduction</span>
                  <span>-₹{r.cancellation_charge.toFixed(2)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black text-xs text-slate-900">
                  <span>Net Refund to R-Wallet</span>
                  <span className="text-emerald-600 text-sm">₹{r.refund_amount.toFixed(2)}</span>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 block pt-1 font-semibold">
                Processed on: {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
