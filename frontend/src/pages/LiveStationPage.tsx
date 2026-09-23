import React, { useState, useEffect } from 'react';
import { Radio, Search, MapPin, Train, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { apiRequest } from '../api/client';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const LiveStationPage: React.FC = () => {
  const [stationCode, setStationCode] = useState('MMCT');
  const [filterType, setFilterType] = useState<'all' | 'arrivals' | 'departures'>('all');
  const [boardData, setBoardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const popularStations = ['MMCT', 'CSMT', 'NDLS', 'PUNE', 'ADI', 'SBC', 'MAS'];

  const fetchBoard = async (st: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<any>(`/stations/${st}/trains?filter_type=${filterType}`);
      setBoardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard(stationCode);
  }, [filterType]);

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          Live Station Board
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Real-time platform assignments, arrivals & departures
        </p>
      </div>

      {/* Station Selector */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
          Station Code
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
            <input
              type="text"
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value.toUpperCase())}
              placeholder="e.g. MMCT"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchBoard(stationCode)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            {loading ? 'Updating...' : 'Show Board'}
          </button>
        </div>

        {/* Quick Station Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {popularStations.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setStationCode(code);
                fetchBoard(code);
              }}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors border ${
                stationCode === code
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex text-xs font-bold">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            filterType === 'all'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Trains
        </button>
        <button
          onClick={() => setFilterType('arrivals')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            filterType === 'arrivals'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Arrivals
        </button>
        <button
          onClick={() => setFilterType('departures')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            filterType === 'departures'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Departures
        </button>
      </div>

      {/* Train Board Display */}
      {boardData && (
        <div className="space-y-2.5 animate-in fade-in">
          {filterType !== 'departures' && boardData.arrivals?.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                Upcoming Arrivals ({boardData.arrivals.length})
              </span>

              {boardData.arrivals.map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-700">{t.train_number}</span>
                      <span className="font-extrabold text-slate-900">{t.train_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      From: {t.source}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-lg text-[10px] block mb-0.5">
                      Platform {t.platform}
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs block">
                      {t.expected_time}
                    </span>
                    <span className={`text-[9px] font-bold ${t.delay_minutes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filterType !== 'arrivals' && boardData.departures?.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                Upcoming Departures ({boardData.departures.length})
              </span>

              {boardData.departures.map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-700">{t.train_number}</span>
                      <span className="font-extrabold text-slate-900">{t.train_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Destination: {t.destination}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-lg text-[10px] block mb-0.5">
                      Platform {t.platform}
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs block">
                      {t.expected_time}
                    </span>
                    <span className={`text-[9px] font-bold ${t.delay_minutes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
