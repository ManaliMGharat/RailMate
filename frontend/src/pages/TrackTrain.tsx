import React, { useState, useEffect } from 'react';
import {
  Radio,
  Search,
  Train,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  Compass,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { RunningStatus } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const TrackTrain: React.FC = () => {
  const [trainInput, setTrainInput] = useState('12951');
  const [status, setStatus] = useState<RunningStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickTrains = [
    { number: '12951', name: 'Mumbai Rajdhani' },
    { number: '20901', name: 'Vande Bharat' },
    { number: '12123', name: 'Deccan Queen' },
    { number: '12859', name: 'Gitanjali Exp' },
  ];

  const fetchStatus = async (trainNum: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<RunningStatus>(`/trains/${trainNum}/running-status`);
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Could not fetch train running status.');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus('12951');
  }, []);

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          Track Your Train (Live GPS)
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Simulated real-time train running status & journey timeline
        </p>
      </div>

      {/* Train Query Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
          Train Number or Name
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Train className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={trainInput}
              onChange={(e) => setTrainInput(e.target.value)}
              placeholder="e.g. 12951 or Rajdhani"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={() => fetchStatus(trainInput)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </div>

        {/* Quick Suggestions */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {quickTrains.map((qt) => (
            <button
              key={qt.number}
              type="button"
              onClick={() => {
                setTrainInput(qt.number);
                fetchStatus(qt.number);
              }}
              className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold px-2.5 py-1 rounded-lg shrink-0 border border-slate-200/60 transition-colors"
            >
              {qt.number} ({qt.name})
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl font-medium">
            {error}
          </p>
        )}
      </div>

      {status && (
        <div className="space-y-4 animate-in fade-in">
          {/* Live Progress Card */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-4 text-white shadow-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full inline-block">
                  Live Simulated Tracking
                </span>
                <h2 className="text-base font-black mt-1">
                  {status.train_number} • {status.train_name}
                </h2>
              </div>
              <span
                className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  status.delay_minutes > 0 ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'
                }`}
              >
                {status.delay_minutes > 0 ? `+${status.delay_minutes}m Late` : 'On Time'}
              </span>
            </div>

            {/* Current vs Next Station */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-blue-200 block font-semibold">PASSED STATION</span>
                <span className="font-extrabold text-sm block">{status.current_station_name}</span>
                <span className="text-[10px] opacity-80">Code: {status.current_station}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-200 block font-semibold">NEXT STATION</span>
                <span className="font-extrabold text-sm block">{status.next_station_name}</span>
                <span className="text-[10px] opacity-80">Code: {status.next_station}</span>
              </div>
            </div>

            {/* Distance & Progress bar */}
            <div>
              <div className="flex justify-between text-[11px] text-blue-100 mb-1 font-semibold">
                <span>{status.distance_covered_km} km covered</span>
                <span>{status.progress_percentage}% completed</span>
              </div>
              <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(10, status.progress_percentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Safe Demo Route Schematic Map */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" />
                Schematic Journey Map
              </span>
              <span className="text-[10px] font-bold text-slate-400">Demo Visualizer</span>
            </div>

            {/* Animated SVG Track Line */}
            <div className="relative h-24 bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden p-2 flex items-center justify-between px-6">
              {/* Train Track representation */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-300">
                <div
                  className="h-full bg-blue-600 transition-all duration-1000"
                  style={{ width: `${status.progress_percentage}%` }}
                />
              </div>

              {/* Station nodes */}
              {status.timeline.slice(0, 4).map((stop, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      stop.is_passed
                        ? 'bg-blue-600 border-white shadow-sm'
                        : stop.is_current
                        ? 'bg-amber-500 border-white ring-4 ring-amber-400/30 shadow-md scale-125'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                  <span className="text-[10px] font-bold text-slate-700 mt-1 block">
                    {stop.station_code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Route Sequence & Halts
            </span>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {status.timeline.map((stop, i) => (
                <div key={i} className="relative text-xs">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                      stop.is_current
                        ? 'bg-amber-500 ring-2 ring-amber-400/40'
                        : stop.is_passed
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}
                  />

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900">{stop.station_name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                          {stop.station_code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Platform {stop.platform} • {stop.distance_km} km
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 block">
                        {stop.scheduled_arrival}
                      </span>
                      {stop.delay_minutes > 0 && (
                        <span className="text-[10px] font-bold text-amber-600">
                          +{stop.delay_minutes}m Late
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
