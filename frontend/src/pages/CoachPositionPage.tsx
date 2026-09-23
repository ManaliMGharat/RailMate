import React, { useState, useEffect } from 'react';
import { TrainTrack, Search, MapPin, Train, Info } from 'lucide-react';
import { apiRequest } from '../api/client';
import { CoachPosition, CoachPositionItem } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const CoachPositionPage: React.FC = () => {
  const [trainNumber, setTrainNumber] = useState('12951');
  const [stationCode, setStationCode] = useState('MMCT');
  const [coachData, setCoachData] = useState<CoachPosition | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachPositionItem | null>(null);
  const [loading, setLoading] = useState(false);

  const popularTrains = ['12951', '20901', '12123', '12859', '12627'];

  const fetchCoachPosition = async (num: string, st: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<CoachPosition>(`/trains/${num}/coach-position?station_code=${st}`);
      setCoachData(data);
      if (data.coaches.length > 0) {
        // default select an AC or Sleeper coach
        const target = data.coaches.find((c) => c.coach_code === 'B2') || data.coaches[4] || data.coaches[0];
        setSelectedCoach(target);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachPosition(trainNumber, stationCode);
  }, []);

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          Coach Position Finder
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Locate coach sequence and platform zones before boarding
        </p>
      </div>

      {/* Train & Station Selector */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Train Number
            </label>
            <input
              type="text"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              placeholder="e.g. 12951"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Station Code
            </label>
            <input
              type="text"
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value.toUpperCase())}
              placeholder="e.g. MMCT"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {popularTrains.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setTrainNumber(num);
                fetchCoachPosition(num, stationCode);
              }}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors border ${
                trainNumber === num
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchCoachPosition(trainNumber, stationCode)}
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          {loading ? 'Finding Layout...' : 'Display Platform Layout'}
        </button>
      </div>

      {coachData && (
        <div className="space-y-4 animate-in fade-in">
          {/* Selected Coach Platform Indicator */}
          {selectedCoach && (
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-4 shadow-card flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">
                  Target Coach
                </span>
                <h3 className="text-2xl font-black mt-0.5">
                  Coach {selectedCoach.coach_code}
                </h3>
                <span className="text-xs font-semibold text-blue-100 block">
                  {selectedCoach.coach_type} Class • Position #{selectedCoach.sequence_order}
                </span>
              </div>

              <div className="text-right">
                <span className="bg-amber-400 text-amber-950 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider block">
                  {selectedCoach.platform_zone}
                </span>
                <span className="text-[10px] text-blue-100 block mt-1.5">
                  Platform {coachData.platform_number}
                </span>
              </div>
            </div>
          )}

          {/* Visual Platform Diagram */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Platform Layout (Tap coach to inspect)
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Engine ➔ Guard Van
              </span>
            </div>

            {/* Scrollable coach rake */}
            <div className="overflow-x-auto no-scrollbar py-3 px-1">
              <div className="inline-flex items-center gap-1.5 min-w-max">
                {coachData.coaches.map((c, i) => {
                  const isSelected = selectedCoach?.coach_code === c.coach_code;
                  const isLoco = c.coach_type === 'LOCO';
                  const isAC = ['1A', '2A', '3A', '3E', 'CC', 'EC'].includes(c.coach_type);

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedCoach(c)}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 group active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-card scale-110 -translate-y-1'
                          : isLoco
                          ? 'bg-amber-600 text-white'
                          : isAC
                          ? 'bg-sky-100 text-sky-900 hover:bg-sky-200'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <div className="w-12 h-14 rounded-lg border border-black/10 flex flex-col items-center justify-center font-black text-xs">
                        {isLoco ? 'ENG' : c.coach_code}
                        <span className="text-[9px] font-bold opacity-75 mt-0.5">
                          {c.coach_type}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold mt-1 opacity-80">
                        #{c.sequence_order}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Parallel Platform Track Line */}
              <div className="w-full h-1.5 bg-slate-300 rounded-full mt-2 relative">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-amber-500 rounded-full" />
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-600" />
                <span>Locomotive</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-sky-100 border border-sky-300" />
                <span>Air-Conditioned</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-300" />
                <span>Sleeper / General</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
