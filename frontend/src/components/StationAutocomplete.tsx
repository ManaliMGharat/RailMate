import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Station } from '../types';
import { apiRequest } from '../api/client';

interface StationAutocompleteProps {
  label: string;
  placeholder?: string;
  selectedStation: Station | null;
  onSelect: (station: Station) => void;
  iconColor?: string;
}

export const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  label,
  placeholder = 'Search by station or city',
  selectedStation,
  onSelect,
  iconColor = 'text-blue-600',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedStation) {
      setQuery(`${selectedStation.name} (${selectedStation.code})`);
    }
  }, [selectedStation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStations = async (searchTerm: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<Station[]>(`/stations/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (val.length >= 1) {
      searchStations(val);
    } else {
      searchStations('');
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    searchStations(query.split('(')[0].trim());
  };

  const handleSelectStation = (st: Station) => {
    onSelect(st);
    setQuery(`${st.name} (${st.code})`);
    setIsOpen(false);
  };

  const popularStations = [
    { code: 'MMCT', name: 'Mumbai Central' },
    { code: 'CSMT', name: 'Mumbai CSMT' },
    { code: 'NDLS', name: 'New Delhi' },
    { code: 'PUNE', name: 'Pune Jn' },
    { code: 'ADI', name: 'Ahmedabad' },
  ];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <MapPin className={`absolute left-3 w-4 h-4 ${iconColor} shrink-0`} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(true);
              searchStations('');
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-card z-50 max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95">
          {/* Quick chips if query is short */}
          {query.length === 0 && (
            <div className="p-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Popular Stations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {popularStations.map((pop) => (
                  <button
                    key={pop.code}
                    type="button"
                    onClick={() => {
                      searchStations(pop.code);
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium px-2 py-1 rounded-lg transition-colors"
                  >
                    {pop.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading stations...</div>
          ) : results.length > 0 ? (
            results.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStation(st)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                    {st.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {st.city}, {st.state}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                  {st.code}
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">No stations found</div>
          )}
        </div>
      )}
    </div>
  );
};
