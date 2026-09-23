import React, { useState, useEffect } from 'react';
import { HeartHandshake, AlertCircle, CheckCircle2, Clock, ShieldCheck, FileText, Send } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Complaint } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const RailSupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'TRACK'>('FILE');

  // Complaint Form
  const [pnr, setPnr] = useState('8421098451');
  const [trainNumber, setTrainNumber] = useState('12951');
  const [stationCode, setStationCode] = useState('MMCT');
  const [category, setCategory] = useState('Cleanliness');
  const [description, setDescription] = useState('');

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Cleanliness',
    'Catering',
    'Staff assistance',
    'Medical assistance',
    'Security assistance',
    'Train complaint',
    'Station complaint',
    'Other',
  ];

  const fetchComplaints = async () => {
    try {
      const data = await apiRequest<Complaint[]>('/support/complaints');
      setComplaints(data);
    } catch {}
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a description for your complaint.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<Complaint>('/support/complaints', {
        method: 'POST',
        body: JSON.stringify({
          pnr,
          train_number: trainNumber,
          station_code: stationCode,
          category,
          description,
        }),
      });
      setCreatedRef(res.complaint_ref);
      setDescription('');
      fetchComplaints();
      setActiveTab('TRACK');
    } catch (err: any) {
      alert(err.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          Rail Support (Passenger Grievance)
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Prompt grievance assistance & resolution tracking
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex text-xs font-bold">
        <button
          onClick={() => setActiveTab('FILE')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'FILE'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lodge Complaint
        </button>
        <button
          onClick={() => setActiveTab('TRACK')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'TRACK'
              ? 'bg-white text-blue-700 shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Track Complaints ({complaints.length})
        </button>
      </div>

      {/* Lodge Form */}
      {activeTab === 'FILE' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Grievance Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">PNR</label>
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value)}
                placeholder="10-digit PNR"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Train #</label>
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="e.g. 12951"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Station</label>
              <input
                type="text"
                value={stationCode}
                onChange={(e) => setStationCode(e.target.value.toUpperCase())}
                placeholder="MMCT"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Description of Incident
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue with coach/berth details..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Photo attachment simulation */}
          <div className="p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
            <span className="text-[11px] font-bold text-slate-500">
              📸 Attachment (Simulated photo proof accepted)
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'Submit Support Request'}</span>
          </button>
        </form>
      )}

      {/* Track Complaints List */}
      {activeTab === 'TRACK' && (
        <div className="space-y-3">
          {createdRef && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Ticket registered successfully with ID {createdRef}!</span>
            </div>
          )}

          {complaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-soft">
              <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No support complaints lodged</p>
            </div>
          ) : (
            complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft space-y-3 text-xs"
              >
                <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest block">
                      {c.complaint_ref}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-xs mt-0.5">
                      {c.category}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      c.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : c.status === 'IN_REVIEW'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  "{c.description}"
                </p>

                {c.resolution_notes && (
                  <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-0.5">
                    <span className="font-bold text-slate-800 block">Staff Note:</span>
                    <span>{c.resolution_notes}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                  <span>PNR: {c.pnr || 'N/A'} • Train: {c.train_number || 'N/A'}</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
