import React, { useState, useEffect } from 'react';
import {
  Ticket,
  MapPin,
  QrCode,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { UnreservedTicket } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const UnreservedTicketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'JOURNEY' | 'PLATFORM' | 'SEASON'>('JOURNEY');

  // Journey Ticket Form
  const [fromStation, setFromStation] = useState('Mumbai CSMT (CSMT)');
  const [toStation, setToStation] = useState('Thane (TNA)');
  const [paxCount, setPaxCount] = useState(1);
  const [travelClass, setTravelClass] = useState('II');

  // Platform Ticket Form
  const [platformStation, setPlatformStation] = useState('Mumbai Central (MMCT)');
  const [platformPax, setPlatformPax] = useState(1);

  // Season Ticket Form
  const [seasonFrom, setSeasonFrom] = useState('Thane (TNA)');
  const [seasonTo, setSeasonTo] = useState('Mumbai CSMT (CSMT)');
  const [seasonDuration, setSeasonDuration] = useState('MONTHLY');
  const [seasonClass, setSeasonClass] = useState('II');

  const [createdTicket, setCreatedTicket] = useState<UnreservedTicket | null>(null);
  const [myTickets, setMyTickets] = useState<UnreservedTicket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyTickets = async () => {
    try {
      const data = await apiRequest<UnreservedTicket[]>('/tickets/my-tickets');
      setMyTickets(data);
    } catch {}
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleBookJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await apiRequest<UnreservedTicket>('/tickets/unreserved', {
        method: 'POST',
        body: JSON.stringify({
          from_station: fromStation,
          to_station: toStation,
          passenger_count: paxCount,
          travel_class: travelClass,
        }),
      });
      setCreatedTicket(ticket);
      fetchMyTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to book unreserved ticket.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await apiRequest<UnreservedTicket>('/tickets/platform', {
        method: 'POST',
        body: JSON.stringify({
          station: platformStation,
          passenger_count: platformPax,
        }),
      });
      setCreatedTicket(ticket);
      fetchMyTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to book platform ticket.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await apiRequest<UnreservedTicket>('/tickets/season', {
        method: 'POST',
        body: JSON.stringify({
          from_station: seasonFrom,
          to_station: seasonTo,
          travel_class: seasonClass,
          duration_type: seasonDuration,
        }),
      });
      setCreatedTicket(ticket);
      fetchMyTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to book season pass.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          Unreserved Ticketing (UTS)
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Paperless suburban journey, platform & season passes
        </p>
      </div>

      {/* Simulated Geofence Range Status */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 flex items-center justify-between text-[11px] text-emerald-800">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Simulated Geofencing: Station Radius In-Range</span>
        </div>
        <span className="text-[10px] bg-emerald-200/60 font-black px-2 py-0.5 rounded-full">
          GPS Active
        </span>
      </div>

      {/* UTS Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('JOURNEY');
            setCreatedTicket(null);
          }}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'JOURNEY'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Journey Ticket
        </button>
        <button
          onClick={() => {
            setActiveTab('PLATFORM');
            setCreatedTicket(null);
          }}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'PLATFORM'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Platform Ticket
        </button>
        <button
          onClick={() => {
            setActiveTab('SEASON');
            setCreatedTicket(null);
          }}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'SEASON'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Season Pass
        </button>
      </div>

      {/* 1. Journey Ticket Form */}
      {activeTab === 'JOURNEY' && (
        <form onSubmit={handleBookJourney} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                From Station
              </label>
              <select
                value={fromStation}
                onChange={(e) => setFromStation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="Mumbai CSMT (CSMT)">Mumbai CSMT (CSMT)</option>
                <option value="Mumbai Central (MMCT)">Mumbai Central (MMCT)</option>
                <option value="Thane (TNA)">Thane (TNA)</option>
                <option value="Pune Jn (PUNE)">Pune Jn (PUNE)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                To Station
              </label>
              <select
                value={toStation}
                onChange={(e) => setToStation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="Thane (TNA)">Thane (TNA)</option>
                <option value="Mumbai CSMT (CSMT)">Mumbai CSMT (CSMT)</option>
                <option value="Pune Jn (PUNE)">Pune Jn (PUNE)</option>
                <option value="Nashik Road (NK)">Nashik Road (NK)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Passengers
              </label>
              <select
                value={paxCount}
                onChange={(e) => setPaxCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value={1}>1 Adult</option>
                <option value={2}>2 Adults</option>
                <option value={3}>3 Adults</option>
                <option value={4}>4 Adults</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Class
              </label>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="II">Second Class (II)</option>
                <option value="FC">First Class (FC)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {loading ? 'Booking...' : `Book Journey Ticket (₹${(travelClass === 'II' ? 20 : 85) * paxCount})`}
            </button>
          </div>
        </form>
      )}

      {/* 2. Platform Ticket Form */}
      {activeTab === 'PLATFORM' && (
        <form onSubmit={handleBookPlatform} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Station
            </label>
            <select
              value={platformStation}
              onChange={(e) => setPlatformStation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="Mumbai Central (MMCT)">Mumbai Central (MMCT)</option>
              <option value="Mumbai CSMT (CSMT)">Mumbai CSMT (CSMT)</option>
              <option value="New Delhi (NDLS)">New Delhi (NDLS)</option>
              <option value="Pune Jn (PUNE)">Pune Jn (PUNE)</option>
              <option value="KSR Bengaluru (SBC)">KSR Bengaluru (SBC)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Persons (₹10 / person • Valid for 2 hours)
            </label>
            <select
              value={platformPax}
              onChange={(e) => setPlatformPax(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value={1}>1 Person (₹10)</option>
              <option value={2}>2 Persons (₹20)</option>
              <option value={3}>3 Persons (₹30)</option>
              <option value={4}>4 Persons (₹40)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {loading ? 'Booking...' : `Book Platform Ticket (₹${10 * platformPax})`}
            </button>
          </div>
        </form>
      )}

      {/* 3. Season Pass Form */}
      {activeTab === 'SEASON' && (
        <form onSubmit={handleBookSeason} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                From Station
              </label>
              <select
                value={seasonFrom}
                onChange={(e) => setSeasonFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="Thane (TNA)">Thane (TNA)</option>
                <option value="Mumbai CSMT (CSMT)">Mumbai CSMT (CSMT)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                To Station
              </label>
              <select
                value={seasonTo}
                onChange={(e) => setSeasonTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="Mumbai CSMT (CSMT)">Mumbai CSMT (CSMT)</option>
                <option value="Thane (TNA)">Thane (TNA)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Duration
              </label>
              <select
                value={seasonDuration}
                onChange={(e) => setSeasonDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="MONTHLY">Monthly (30 Days)</option>
                <option value="QUARTERLY">Quarterly (90 Days)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Class
              </label>
              <select
                value={seasonClass}
                onChange={(e) => setSeasonClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="II">Second Class (II)</option>
                <option value="FC">First Class (FC)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {loading ? 'Booking...' : `Issue Season Pass (₹${(seasonClass === 'II' ? 280 : 840) * (seasonDuration === 'MONTHLY' ? 1 : 3)})`}
            </button>
          </div>
        </form>
      )}

      {/* Generated Ticket Display */}
      {createdTicket && (
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-4 shadow-card space-y-3 animate-in zoom-in-95">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full inline-block">
                UTS DIGITAL PASS
              </span>
              <h3 className="text-base font-black mt-1">{createdTicket.ticket_ref}</h3>
            </div>
            <div className="w-14 h-14 bg-white p-1 rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="w-11 h-11 text-slate-900" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="opacity-80">Route:</span>
              <span className="font-extrabold">{createdTicket.from_station} {createdTicket.to_station ? `➔ ${createdTicket.to_station}` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Type:</span>
              <span className="font-bold">{createdTicket.ticket_type} ({createdTicket.travel_class})</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Passengers:</span>
              <span className="font-bold">{createdTicket.passenger_count} Pax</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">Fare Paid:</span>
              <span className="font-black text-sm">₹{createdTicket.fare.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/20 px-2.5 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            <span>Valid till: {new Date(createdTicket.validity_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}

      {/* Recent UTS Tickets */}
      {myTickets.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Your Active / Recent Passes ({myTickets.length})
          </span>

          <div className="space-y-2">
            {myTickets.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{t.ticket_ref}</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                      {t.ticket_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    {t.from_station} {t.to_station ? `➔ ${t.to_station}` : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900 block">₹{t.fare}</span>
                  <span className="text-[10px] font-bold text-emerald-600">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
