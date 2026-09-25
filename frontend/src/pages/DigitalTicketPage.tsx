import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Printer,
  Ban,
  CheckCircle2,
  Train,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Booking } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const DigitalTicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchTicket = async () => {
    try {
      const data = await apiRequest<Booking>(`/bookings/${id}`);
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!booking) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `RailOne Ticket: ${booking.train_number}`,
          text: `PNR: ${booking.pnr_number} • ${booking.from_station_name} to ${booking.to_station_name} on ${booking.journey_date}`,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(
        `RailOne Ticket • PNR: ${booking.pnr_number} • Train: ${booking.train_number} ${booking.train_name} • ${booking.from_station_code} ➔ ${booking.to_station_code} (${booking.journey_date})`
      );
      alert('Ticket summary copied to clipboard!');
    }
  };

  const handleCancelTicket = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const res = await apiRequest<any>(`/bookings/${booking.id}/cancel`, {
        method: 'POST',
      });
      alert(res.message || 'Ticket cancelled successfully.');
      setShowCancelModal(false);
      fetchTicket();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel ticket.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">Loading digital ticket...</div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-sm font-bold text-slate-800">Ticket not found</p>
        <button
          onClick={() => navigate('/my-bookings')}
          className="text-xs text-blue-600 font-bold"
        >
          Go to My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-3 px-4 space-y-4 print:p-0 print:pb-0">
      <div className="print:hidden">
        <DemoNoticeBanner compact />
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/my-bookings')}
          className="p-1.5 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-extrabold text-slate-900">Digital Travel Ticket</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700"
            title="Share Ticket"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700"
            title="Print / Save PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Digital Boarding Pass Ticket */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        {/* Ticket Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-4 text-white relative">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                Official Demo E-Ticket
              </span>
              <h2 className="text-xl font-black tracking-tight">{booking.train_number}</h2>
              <span className="text-xs font-semibold text-blue-100 block">{booking.train_name}</span>
            </div>

            <div className="text-right">
              <span
                className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  booking.status === 'CONFIRMED'
                    ? 'bg-emerald-400 text-emerald-950'
                    : booking.status === 'CANCELLED'
                    ? 'bg-red-400 text-red-950'
                    : 'bg-amber-400 text-amber-950'
                }`}
              >
                {booking.status}
              </span>
              <span className="text-[10px] text-blue-200 block mt-1">Ref: {booking.booking_ref}</span>
            </div>
          </div>
        </div>

        {/* PNR Prominent Stripe */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">10-Digit PNR</span>
          <span className="text-base font-black tracking-widest text-amber-400">
            {booking.pnr_number}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Station Route Details */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-base font-black text-slate-900">{booking.from_station_code}</span>
              <span className="text-[11px] text-slate-500 font-semibold block">
                {booking.from_station_name}
              </span>
              <span className="text-[10px] text-blue-700 font-bold mt-0.5 block">
                Date: {booking.journey_date}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mb-1">
                {booking.travel_class} • {booking.quota}
              </span>
              <div className="w-16 h-0.5 bg-slate-300 relative">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute -top-0.5 right-0" />
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-black text-slate-900">{booking.to_station_code}</span>
              <span className="text-[11px] text-slate-500 font-semibold block">
                {booking.to_station_name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Next Day
              </span>
            </div>
          </div>

          {/* Passenger & Berth Allocation Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Passenger Allocation
            </span>
            <div className="bg-slate-50 rounded-2xl p-3 divide-y divide-slate-200/60">
              {booking.passengers.map((p, idx) => (
                <div key={p.id || idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {p.age} yrs • {p.gender}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-blue-700 block text-xs">
                      Coach {p.allocated_coach || 'B1'}, Seat {p.allocated_seat || '45'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {p.allocated_berth_type || 'Berth'} ({p.status})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code and Verification */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-800 block">TTE Digital QR Verification</span>
              <span className="text-[9px] text-slate-400 block max-w-[190px]">
                Show this QR to the Travelling Ticket Examiner on board during ticket verification.
              </span>
              <span className="text-[9px] font-bold text-emerald-600 block pt-1">
                ✓ Cryptographically Signed Mock Pass
              </span>
            </div>

            {/* Custom stylized QR Box */}
            <div className="w-16 h-16 bg-white border border-slate-300 rounded-xl p-1 flex items-center justify-center shadow-sm shrink-0">
              <QrCode className="w-12 h-12 text-slate-800" />
            </div>
          </div>

          {/* Total Fare Paid */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="font-semibold text-slate-500">Total Fare (Incl. GST)</span>
            <span className="text-base font-black text-slate-900">₹{booking.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Cancellation CTA */}
        {booking.status === 'CONFIRMED' && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 print:hidden">
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl shadow-soft transition-all flex items-center justify-center gap-1.5"
            >
              <Ban className="w-4 h-4" />
              Cancel Booking & Claim Refund
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">
                Cancel Ticket ({booking.pnr_number})?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to cancel this booking? Standard railway cancellation fees will apply, and the remaining refund of will be instantly credited to your <strong>R-Wallet</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                No, Keep Ticket
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelTicket}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
