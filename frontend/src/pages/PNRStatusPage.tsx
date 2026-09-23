import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Train,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { PNRStatus } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const PNRStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [pnrData, setPnrData] = useState<PNRStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<any[]>([]);

  useEffect(() => {
    // Fetch quick demo samples
    apiRequest<any[]>('/pnr/samples')
      .then((data) => setSamples(data))
      .catch(() => {});

    if (initialPnr) {
      handleSearchPnr(initialPnr);
    }
  }, []);

  const handleSearchPnr = async (pnrToQuery: string) => {
    const cleaned = pnrToQuery.trim().replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit numeric PNR.');
      return;
    }

    setLoading(true);
    setError(null);
    setPnrData(null);

    try {
      const data = await apiRequest<PNRStatus>(`/pnr/${cleaned}`);
      setPnrData(data);
    } catch (err: any) {
      setError(err.message || 'PNR record not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (num: string) => {
    setPnrInput(num);
    handleSearchPnr(num);
  };

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          PNR Status Enquiry
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Check real-time chart status & coach/berth allocation
        </p>
      </div>

      {/* PNR Search Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
          Enter 10-Digit PNR Number
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              maxLength={10}
              value={pnrInput}
              onChange={(e) => {
                setPnrInput(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 8421098451"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={() => handleSearchPnr(pnrInput)}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        {/* Demo PNR Quick Chips */}
        {samples.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Test PNRs
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samples.map((s) => (
                <button
                  key={s.pnr_number}
                  type="button"
                  onClick={() => handleSampleClick(s.pnr_number)}
                  className="text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200/60"
                >
                  {s.pnr_number} ({s.class})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 text-center space-y-3 shadow-soft border border-slate-100 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-blue-100 mx-auto" />
          <p className="text-xs font-bold text-slate-600">Retrieving PNR status from database...</p>
        </div>
      )}

      {/* PNR Result Display */}
      {pnrData && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden space-y-4 p-4 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-semibold text-slate-400">PNR NUMBER</span>
              <h2 className="text-lg font-black tracking-widest text-blue-700">
                {pnrData.pnr_number}
              </h2>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                {pnrData.train_number} • {pnrData.train_name}
              </span>
            </div>

            <div className="text-right">
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  pnrData.chart_status.includes('PREPARED') && !pnrData.chart_status.includes('NOT')
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {pnrData.chart_status}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                Class: {pnrData.travel_class} ({pnrData.quota})
              </span>
            </div>
          </div>

          {/* Journey Path */}
          <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="font-extrabold text-slate-900 block">{pnrData.from_station}</span>
              <span className="text-[10px] text-slate-400">Boarding: {pnrData.boarding_point}</span>
            </div>

            <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />

            <div className="text-right">
              <span className="font-extrabold text-slate-900 block">{pnrData.to_station}</span>
              <span className="text-[10px] text-slate-400">Date: {pnrData.journey_date}</span>
            </div>
          </div>

          {/* Passenger Status Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Passenger Allocation Status
            </span>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {pnrData.passengers.map((p, idx) => (
                <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800 block">
                      {p.passenger || `Passenger ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Booking: {p.booking_status}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black block ${
                        p.current_status.includes('CNF')
                          ? 'text-emerald-600'
                          : p.current_status.includes('RAC')
                          ? 'text-amber-600'
                          : p.current_status.includes('CANCELLED')
                          ? 'text-red-500'
                          : 'text-blue-600'
                      }`}
                    >
                      {p.current_status}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">Current Status</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-2.5 text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{pnrData.demo_notice}</span>
          </div>
        </div>
      )}
    </div>
  );
};
