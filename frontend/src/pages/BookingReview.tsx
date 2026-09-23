import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ShieldCheck, User, Train, Calendar, MapPin, IndianRupee } from 'lucide-react';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const BookingReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { train, fromStation, toStation, journeyDate, quota, chosenClass, passengers } =
    location.state || {};

  if (!train || !passengers) {
    navigate('/search');
    return null;
  }

  const baseFare = chosenClass.fare * passengers.length;
  const convenienceFee = 17.7;
  const gst = Math.round(baseFare * 0.05);
  const totalAmount = baseFare + convenienceFee + gst;

  const handleProceedToPayment = () => {
    navigate('/payment', {
      state: {
        train,
        fromStation,
        toStation,
        journeyDate,
        quota,
        chosenClass,
        passengers,
        baseFare,
        taxes: convenienceFee + gst,
        totalAmount,
      },
    });
  };

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
          <h1 className="text-base font-extrabold text-slate-900">Review Journey</h1>
          <span className="text-[11px] font-semibold text-slate-400">Step 3 of 4</span>
        </div>
      </div>

      {/* Train Details Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <span className="text-xs font-black text-blue-700">{train.number}</span>
            <h3 className="text-xs font-extrabold text-slate-900">{train.name}</h3>
          </div>
          <span className="bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-xl text-xs">
            {chosenClass.class_code} • {quota}
          </span>
        </div>

        {/* Schedule */}
        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <span className="font-extrabold text-slate-900 block text-sm">{train.departure_time}</span>
            <span className="text-slate-500 font-semibold">{fromStation.name} ({fromStation.code})</span>
            <span className="text-[10px] text-slate-400 block">{journeyDate}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-medium">{train.duration_hours}h</span>
            <div className="w-16 h-0.5 bg-slate-300 relative my-1">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute -top-0.5 right-0" />
            </div>
          </div>

          <div className="text-right">
            <span className="font-extrabold text-slate-900 block text-sm">{train.arrival_time}</span>
            <span className="text-slate-500 font-semibold">{toStation.name} ({toStation.code})</span>
            <span className="text-[10px] text-slate-400 block">Next Day</span>
          </div>
        </div>
      </div>

      {/* Passenger List Summary */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-2.5">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
          Passenger Details ({passengers.length})
        </span>

        <div className="divide-y divide-slate-100">
          {passengers.map((p: any, i: number) => (
            <div key={i} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                  {i + 1}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{p.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {p.age} yrs • {p.gender} • {p.berth_preference}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Confirmed
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fare Breakdown */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-2.5">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
          Fare Breakdown
        </span>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Ticket Base Fare ({passengers.length} × ₹{chosenClass.fare})</span>
            <span className="font-bold text-slate-900">₹{baseFare.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IRCTC Convenience Fee</span>
            <span className="font-bold text-slate-900">₹{convenienceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Applicable GST (5%)</span>
            <span className="font-bold text-slate-900">₹{gst.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
            <span>Total Payable Amount</span>
            <span className="text-blue-700 text-base">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Safety assurance */}
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-2xl p-2.5 text-emerald-800 text-[11px]">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
        <span>Safe & encrypted mock transaction simulation. Zero real card info required.</span>
      </div>

      {/* Proceed Button */}
      <button
        onClick={handleProceedToPayment}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-card transition-all flex items-center justify-center gap-1.5"
      >
        <span>Proceed to Payment (₹{totalAmount.toFixed(2)})</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
