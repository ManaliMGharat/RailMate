import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Train as TrainIcon,
  MapPin,
  Eye
} from 'lucide-react';
import { Station, Train, ClassAvailability } from '../types';
import { apiRequest } from '../api/client';
import { StationAutocomplete } from '../components/StationAutocomplete';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const ReservedBooking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fromStation, setFromStation] = useState<Station | null>({
    id: 1,
    code: 'MMCT',
    name: 'Mumbai Central',
    city: 'Mumbai',
    state: 'Maharashtra',
    platform_count: 8,
  });

  const [toStation, setToStation] = useState<Station | null>({
    id: 7,
    code: 'NDLS',
    name: 'New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    platform_count: 16,
  });

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  const [journeyDate, setJourneyDate] = useState(defaultDate.toISOString().split('T')[0]);

  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedQuota, setSelectedQuota] = useState<string>('General');
  const [sortBy, setSortBy] = useState<string>('departure');

  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [selectedClassMap, setSelectedClassMap] = useState<Record<number, ClassAvailability>>({});

  const quotas = ['General', 'Tatkal', 'Ladies', 'Senior Citizen', 'Divyang'];
  const classesList = ['ALL', '1A', '2A', '3A', '3E', 'SL', 'CC', 'EC', '2S'];

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const fetchTrains = async () => {
    if (!fromStation || !toStation) return;
    setLoading(true);
    try {
      const query = `/trains/search?from_station=${fromStation.code}&to_station=${toStation.code}&date=${journeyDate}&quota=${selectedQuota}&sort_by=${sortBy}${
        selectedClass !== 'ALL' ? `&class_type=${selectedClass}` : ''
      }`;
      const data = await apiRequest<{ trains: Train[] }>(query);
      setTrains(data.trains);

      // Pre-select first class for each train
      const classMap: Record<number, ClassAvailability> = {};
      data.trains.forEach((t) => {
        if (t.classes && t.classes.length > 0) {
          classMap[t.id] = t.classes[0];
        }
      });
      setSelectedClassMap(classMap);
    } catch (err) {
      console.error(err);
      setTrains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrains();
  }, [selectedQuota, sortBy, selectedClass]);

  const handleProceedToBooking = (train: Train) => {
    const chosenClass = selectedClassMap[train.id] || train.classes[0];
    if (!chosenClass) return;

    navigate('/passenger-details', {
      state: {
        train,
        fromStation,
        toStation,
        journeyDate,
        quota: selectedQuota,
        chosenClass,
      },
    });
  };

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      {/* Search Header Form Card */}
      <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-100 space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <TrainIcon className="w-4 h-4 text-blue-600" />
            Book Reserved Train
          </h2>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Step 1 of 4
          </span>
        </div>

        {/* Stations Pickers with Swap */}
        <div className="relative space-y-2">
          <StationAutocomplete
            label="From"
            selectedStation={fromStation}
            onSelect={setFromStation}
            iconColor="text-emerald-600"
          />

          <div className="absolute right-3 top-[38px] z-10">
            <button
              type="button"
              onClick={handleSwapStations}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-blue-600 active:scale-90 transition-all"
              aria-label="Swap Stations"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 rotate-90" />
            </button>
          </div>

          <StationAutocomplete
            label="To"
            selectedStation={toStation}
            onSelect={setToStation}
            iconColor="text-blue-600"
          />
        </div>

        {/* Date and Quota Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Journey Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={journeyDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full pl-3 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Quota
            </label>
            <select
              value={selectedQuota}
              onChange={(e) => setSelectedQuota(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {quotas.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Classes Horizontal Scroll */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Class Filter
          </label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {classesList.map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Search Action */}
        <button
          onClick={fetchTrains}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
        >
          <TrainIcon className="w-4 h-4" />
          Search Available Trains
        </button>
      </div>

      {/* Train Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700">
            {loading ? 'Searching trains...' : `${trains.length} Trains Found`}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-[11px] font-bold text-blue-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="departure">Departure Time</option>
              <option value="duration">Fastest Duration</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 animate-pulse space-y-3 shadow-soft border border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded" />
                <div className="h-10 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : trains.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center space-y-2 border border-slate-100 shadow-soft">
            <TrainIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No direct trains found</p>
            <p className="text-[11px] text-slate-400">
              Try searching with another date or station combination like MMCT to NDLS.
            </p>
          </div>
        ) : (
          trains.map((train) => {
            const currentSelectedClass = selectedClassMap[train.id] || train.classes[0];

            return (
              <div
                key={train.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-card transition-all p-3.5 space-y-3"
              >
                {/* Train Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-700 tracking-tight">
                        {train.number}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {train.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                      Runs: Daily (M T W T F S S) • {train.train_type}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/train-schedule/${train.number}`)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Route
                  </button>
                </div>

                {/* Timetable overview */}
                <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-center">
                  <div className="text-left">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {train.departure_time}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {fromStation?.code || train.source_station.code}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {train.duration_hours} hrs
                    </span>
                    <div className="w-20 h-0.5 bg-slate-300 relative my-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute -top-0.5 right-0" />
                    </div>
                    <span className="text-[9px] text-emerald-600 font-bold">Direct Express</span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {train.arrival_time}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {toStation?.code || train.destination_station.code}
                    </span>
                  </div>
                </div>

                {/* Class Availability Chips */}
                <div className="grid grid-cols-4 gap-1.5">
                  {train.classes.map((cls) => {
                    const isSelected = currentSelectedClass?.class_code === cls.class_code;
                    return (
                      <button
                        key={cls.class_code}
                        type="button"
                        onClick={() =>
                          setSelectedClassMap((prev) => ({ ...prev, [train.id]: cls }))
                        }
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">
                            {cls.class_code}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-700">
                            ₹{cls.fare}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold block mt-1 leading-tight ${
                            cls.status_type === 'AVAILABLE'
                              ? 'text-emerald-600'
                              : cls.status_type === 'RAC'
                              ? 'text-amber-600'
                              : 'text-red-500'
                          }`}
                        >
                          {cls.status}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Class Info & Book Action */}
                {currentSelectedClass && (
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Selected: {currentSelectedClass.class_name} ({currentSelectedClass.class_code})
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        Fare: ₹{currentSelectedClass.fare} + taxes
                      </span>
                    </div>

                    <button
                      onClick={() => handleProceedToBooking(train)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Book Now</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
