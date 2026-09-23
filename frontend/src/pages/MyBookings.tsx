import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Train,
  ChevronRight,
  Clock,
  ArrowRight,
  Search
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Booking } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';
import { useLanguage } from '../context/LanguageContext';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Booking[]>(`/bookings?status_filter=${activeTab}`);
      setBookings(data);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          {t('nav_bookings')}
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          View digital tickets, status, and cancellation history
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex text-xs font-bold">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('upcoming')}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('completed')}
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'cancelled'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('cancelled')}
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-soft border border-slate-100 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-10 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-soft space-y-3">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-800">
                No {activeTab} bookings
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                You have no journeys in this category.
              </p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Plan a Journey Now
            </button>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/ticket/${b.id}`)}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-card transition-all p-3.5 space-y-3 cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400">PNR NUMBER</span>
                  <span className="text-xs font-black text-blue-700 tracking-wider block">
                    {b.pnr_number}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : b.status === 'CANCELLED'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              {/* Train and Stations */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 block">{b.from_station_code}</span>
                  <span className="text-[10px] text-slate-400">{b.from_station_name}</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md mb-1">
                    {b.travel_class}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900 block">{b.to_station_code}</span>
                  <span className="text-[10px] text-slate-400">{b.to_station_name}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{b.journey_date}</span>
                </div>

                <div className="flex items-center gap-1 font-bold text-blue-600 group-hover:text-blue-800">
                  <span>View Ticket</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
