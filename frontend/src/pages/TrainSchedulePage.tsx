import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Train, ArrowLeft, Search, Clock, MapPin } from 'lucide-react';
import { apiRequest } from '../api/client';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const TrainSchedulePage: React.FC = () => {
  const { trainNumber: paramNumber } = useParams<{ trainNumber: string }>();
  const navigate = useNavigate();

  const [trainQuery, setTrainQuery] = useState(paramNumber || '12951');
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSchedule = async (num: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<any>(`/trains/${num}/schedule`);
      setScheduleData(data);
    } catch (err) {
      console.error(err);
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(trainQuery);
  }, []);

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
          <h1 className="text-base font-extrabold text-slate-900">Train Route Schedule</h1>
          <span className="text-[11px] font-semibold text-slate-400">Timetable & Halts</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card flex gap-2">
        <div className="relative flex-1">
          <Train className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={trainQuery}
            onChange={(e) => setTrainQuery(e.target.value)}
            placeholder="Enter train number (e.g. 12951)"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
          />
        </div>
        <button
          onClick={() => fetchSchedule(trainQuery)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          View Route
        </button>
      </div>

      {/* Schedule Table */}
      {scheduleData && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden animate-in fade-in">
          <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              {scheduleData.train_type}
            </span>
            <h2 className="text-base font-black">
              {scheduleData.train_number} • {scheduleData.train_name}
            </h2>
            <span className="text-[10px] text-blue-100 block mt-0.5">
              Runs on: M T W T F S S
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {scheduleData.stops.map((stop: any, idx: number) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {stop.stop_sequence + 1}
                  </span>
                  <div>
                    <span className="font-extrabold text-slate-900 block">{stop.station_name}</span>
                    <span className="text-[10px] text-slate-400">
                      Code: {stop.station_code} • Day {stop.day_number} • Platform {stop.platform_number}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 block">
                    {stop.arrival_time} / {stop.departure_time}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Halt: {stop.halt_minutes}m • {stop.distance_km} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
