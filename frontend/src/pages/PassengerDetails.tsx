import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, Trash2, ArrowLeft, ChevronRight, UserCheck, Shield } from 'lucide-react';
import { Passenger } from '../types';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const PassengerDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { train, fromStation, toStation, journeyDate, quota, chosenClass } = location.state || {};

  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      name: user?.full_name || 'Manali Manish Gharat',
      age: 29,
      gender: 'Female',
      berth_preference: 'Lower',
      meal_preference: 'Veg',
    },
  ]);

  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>([]);

  useEffect(() => {
    if (!train) {
      navigate('/search');
      return;
    }
    // Fetch saved passengers
    apiRequest<Passenger[]>('/users/passengers')
      .then((data) => setSavedPassengers(data))
      .catch(() => {});
  }, [train]);

  const handleAddPassenger = () => {
    if (passengers.length >= 6) {
      alert('Maximum 6 passengers allowed per booking');
      return;
    }
    setPassengers([
      ...passengers,
      {
        name: '',
        age: 25,
        gender: 'Male',
        berth_preference: 'No Preference',
        meal_preference: 'Veg',
      },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length === 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const addFromSaved = (saved: Passenger) => {
    if (passengers.some((p) => p.name.toLowerCase() === saved.name.toLowerCase())) {
      return;
    }
    if (passengers.length >= 6) return;

    if (passengers.length === 1 && !passengers[0].name.trim()) {
      setPassengers([saved]);
    } else {
      setPassengers([...passengers, saved]);
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    for (const p of passengers) {
      if (!p.name.trim() || p.age <= 0) {
        alert('Please enter a valid name and age for all passengers.');
        return;
      }
    }

    navigate('/booking-review', {
      state: {
        train,
        fromStation,
        toStation,
        journeyDate,
        quota,
        chosenClass,
        passengers,
      },
    });
  };

  if (!train) return null;

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-slate-900">Passenger Details</h1>
          <span className="text-[11px] font-semibold text-slate-400">Step 2 of 4</span>
        </div>
      </div>

      {/* Train Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center justify-between text-xs">
        <div>
          <span className="font-extrabold text-blue-900 block">
            {train.number} • {train.name}
          </span>
          <span className="text-blue-700 text-[11px] font-medium">
            {fromStation.code} ➔ {toStation.code} | {journeyDate}
          </span>
        </div>
        <div className="text-right">
          <span className="bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-lg text-[11px]">
            {chosenClass.class_code} ({quota})
          </span>
          <span className="text-[10px] text-blue-600 font-bold block mt-1">
            ₹{chosenClass.fare} / pax
          </span>
        </div>
      </div>

      {/* Saved Passengers Selection */}
      {savedPassengers.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Quick Add Saved Passengers
          </span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {savedPassengers.map((saved, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addFromSaved(saved)}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-2.5 py-1.5 text-left shrink-0 shadow-soft transition-all active:scale-95 flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div className="text-[11px]">
                  <span className="font-bold text-slate-800 block leading-tight">{saved.name}</span>
                  <span className="text-[9px] text-slate-400">
                    {saved.age} yrs • {saved.gender}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Passenger Forms */}
      <form onSubmit={handleProceedToReview} className="space-y-3.5">
        {passengers.map((p, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-card space-y-3 relative"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-800">
                Passenger {idx + 1}
              </span>
              {passengers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePassenger(idx)}
                  className="text-red-500 hover:text-red-700 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Full Name (as per Govt ID)
                </label>
                <input
                  type="text"
                  required
                  value={p.name}
                  onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                  placeholder="Enter passenger name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={p.age}
                    onChange={(e) => updatePassenger(idx, 'age', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Gender
                  </label>
                  <select
                    value={p.gender}
                    onChange={(e) => updatePassenger(idx, 'gender', e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Berth Preference
                  </label>
                  <select
                    value={p.berth_preference}
                    onChange={(e) => updatePassenger(idx, 'berth_preference', e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="No Preference">No Preference</option>
                    <option value="Lower">Lower</option>
                    <option value="Middle">Middle</option>
                    <option value="Upper">Upper</option>
                    <option value="Side Lower">Side Lower</option>
                    <option value="Side Upper">Side Upper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Food Choice
                  </label>
                  <select
                    value={p.meal_preference}
                    onChange={(e) => updatePassenger(idx, 'meal_preference', e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="No Food">No Food</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Passenger Button */}
        {passengers.length < 6 && (
          <button
            type="button"
            onClick={handleAddPassenger}
            className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + Add Another Passenger (Up to 6)
          </button>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-card transition-all flex items-center justify-center gap-1.5"
          >
            <span>Review Booking ({passengers.length} Pax)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
