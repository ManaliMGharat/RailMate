import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Search, ChevronDown } from 'lucide-react';
import { Station } from '../types';
import { apiRequest } from '../api/client';
import { StationSearchModal } from './StationSearchModal';

interface StationAutocompleteProps {
  label: string;
  placeholder?: string;
  selectedStation: Station | null;
  onSelect: (station: Station) => void;
  oppositeStation?: Station | null;
  iconColor?: string;
}

export const StationAutocomplete: React.FC<StationAutocompleteProps> = ({
  label,
  placeholder = 'Search by station or code',
  selectedStation,
  onSelect,
  oppositeStation,
  iconColor = 'text-blue-600',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedStation) {
      setQuery(`${selectedStation.name} (${selectedStation.code})`);
    } else {
      setQuery('');
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
      const data = await apiRequest<Station[]>(
        `/stations/search?q=${encodeURIComponent(searchTerm)}&limit=15`
      );
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
    searchStations(val);
  };

  const handleSelectStation = (st: Station) => {
    onSelect(st);
    setQuery(`${st.name} (${st.code})`);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative w-full" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>Browse All</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {selectedStation && !isOpen ? (
          <div
            onClick={() => setModalOpen(true)}
            className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs ${iconColor}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-[#172A63] group-hover:text-blue-700 transition-colors leading-tight">
                  {selectedStation.name}
                </h4>
                <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                  <span className="text-blue-700 font-extrabold tracking-wide">{selectedStation.code}</span>
                  <span className="mx-1 text-slate-300">•</span>
                  <span>{selectedStation.state}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-600">
              <span className="text-[10px] font-bold">Change</span>
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          <div className="relative flex items-center">
            <MapPin className={`absolute left-3 w-4 h-4 ${iconColor} shrink-0`} />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                setIsOpen(true);
                searchStations(query.split('(')[0].trim());
              }}
              placeholder={placeholder}
              className="w-full pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setIsOpen(true);
                    searchStations('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  aria-label="Clear station"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="p-1 text-slate-400 hover:text-blue-600 rounded-full"
                aria-label="Open station search modal"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-card z-50 max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading stations...</div>
            ) : results.length > 0 ? (
              results.map((st) => {
                const isOpposite = oppositeStation?.code === st.code;
                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isOpposite}
                    onClick={() => handleSelectStation(st)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors group ${
                      isOpposite
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : 'hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                          {st.name}
                        </span>
                        {st.is_junction && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                            Jn
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {st.city}, {st.state} {st.zone ? `• ${st.zone}` : ''}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md shrink-0">
                      {st.code}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No stations found. Tap 'Browse All' for full list.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Station Search Modal */}
      <StationSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Select ${label} Station`}
        selectedStation={selectedStation}
        oppositeStation={oppositeStation}
        onSelectStation={(st) => {
          onSelect(st);
          setQuery(`${st.name} (${st.code})`);
        }}
      />
    </>
  );
};
