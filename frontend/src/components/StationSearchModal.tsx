import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Clock, Flame, Train, AlertCircle, ChevronRight } from 'lucide-react';
import { Station } from '../types';
import { apiRequest } from '../api/client';

interface StationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSelectStation: (station: Station) => void;
  selectedStation: Station | null;
  oppositeStation?: Station | null;
}

const RECENT_KEY = 'railone_recent_stations';

export const StationSearchModal: React.FC<StationSearchModalProps> = ({
  isOpen,
  onClose,
  title,
  onSelectStation,
  selectedStation,
  oppositeStation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [popularStations, setPopularStations] = useState<Station[]>([]);
  const [recentStations, setRecentStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent stations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentStations(JSON.parse(stored));
      }
    } catch {
      setRecentStations([]);
    }
  }, [isOpen]);

  // Load popular stations once
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const data = await apiRequest<any>('/stations/popular?limit=12');
        const list = Array.isArray(data) ? data : (data.stations || []);
        setPopularStations(list);
      } catch {
        // Fallback popular stations
        setPopularStations([
          { id: 1, code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', zone: 'CR', platform_count: 18, is_major: true, is_junction: true },
          { id: 2, code: 'NDLS', name: 'New Delhi', city: 'Delhi', state: 'Delhi', zone: 'NR', platform_count: 16, is_major: true, is_junction: false },
          { id: 3, code: 'KYN', name: 'Kalyan Junction', city: 'Thane', state: 'Maharashtra', zone: 'CR', platform_count: 8, is_major: true, is_junction: true },
          { id: 4, code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', zone: 'CR', platform_count: 6, is_major: true, is_junction: true },
          { id: 5, code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', zone: 'WR', platform_count: 8, is_major: true, is_junction: false },
          { id: 6, code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', zone: 'ER', platform_count: 23, is_major: true, is_junction: true },
          { id: 7, code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu', zone: 'SR', platform_count: 17, is_major: true, is_junction: false },
          { id: 8, code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', state: 'Karnataka', zone: 'SWR', platform_count: 10, is_major: true, is_junction: true },
          { id: 9, code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', zone: 'WR', platform_count: 12, is_major: true, is_junction: true },
        ]);
      }
    };
    if (isOpen) {
      fetchPopular();
    }
  }, [isOpen]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await apiRequest<any>(`/stations/search?q=${encodeURIComponent(query.trim())}&limit=25`);
        const list = Array.isArray(data) ? data : (data.stations || []);
        setResults(list);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching stations');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const saveToRecent = (st: Station) => {
    try {
      const filtered = recentStations.filter((s) => s.code !== st.code);
      const updated = [st, ...filtered].slice(0, 6);
      setRecentStations(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // localStorage error handled
    }
  };

  const handleSelect = (st: Station) => {
    if (oppositeStation && oppositeStation.code === st.code) {
      setErrorMsg(`Origin and Destination cannot be the same station (${st.code}).`);
      return;
    }
    saveToRecent(st);
    onSelectStation(st);
    onClose();
  };

  const clearRecent = () => {
    setRecentStations([]);
    localStorage.removeItem(RECENT_KEY);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Train className="w-4 h-4 text-blue-600" />
              {title}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Select from 150+ Indian Railway junctions</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search station or code (e.g. KYN, PUNE, CSMT, BCT)"
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all shadow-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {/* Live Search Results */}
          {query.trim() ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {loading ? 'Searching Stations...' : `Found ${results.length} Station(s)`}
                </span>
                {loading && (
                  <span className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                )}
              </div>

              {results.length > 0 ? (
                <div className="space-y-1.5">
                  {results.map((st) => {
                    const isSelected = selectedStation?.code === st.code;
                    const isOpposite = oppositeStation?.code === st.code;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelect(st)}
                        disabled={isOpposite}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                          isOpposite
                            ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-500/20'
                            : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 active:scale-[0.99]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                                {st.name}
                              </span>
                              {st.is_junction && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                                  Jn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-700 font-semibold flex items-center gap-1.5 mt-0.5">
                              <span className="font-extrabold text-blue-700 tracking-wide">{st.code}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 font-medium">{st.state}</span>
                            </div>
                            {(st.railway_zone || st.zone) && (
                              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {st.railway_zone || st.zone}
                              </div>
                            )}
                            {isOpposite && (
                              <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                                Already selected as {title.includes('Origin') ? 'Destination' : 'Origin'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-extrabold bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg">
                            {st.code}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                !loading && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No stations match "{query}"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try searching with common aliases like 'cst', 'vt', 'bombay', or code 'KYN'
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <>
              {/* Recent Stations */}
              {recentStations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Recent Stations
                    </span>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {recentStations.map((st) => (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => handleSelect(st)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-blue-700">{st.code}</span>
                          <Clock className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 block truncate mt-0.5">
                          {st.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {st.city}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Stations Chips */}
              <div>
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-amber-500" />
                    Popular Terminals & Junctions
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {popularStations.map((st) => (
                    <button
                      key={st.code}
                      type="button"
                      onClick={() => handleSelect(st)}
                      className="p-2.5 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-left transition-all hover:border-blue-300 group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-900 group-hover:text-blue-700">
                          {st.code}
                        </span>
                        {st.zone && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                            {st.zone}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 block truncate mt-1">
                        {st.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {st.city}, {st.state}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
