import React, { useState } from 'react';
import { RoomType } from '../../lib/types';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import { X, Calendar, Users, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BookRoomModalProps {
  roomType: RoomType;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (bookingRef: string) => void;
}

export const BookRoomModal: React.FC<BookRoomModalProps> = ({
  roomType,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();

  // Tomorrow as default check-in, 3 days later as check-out
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);
  const [numGuests, setNumGuests] = useState(2);
  const [guestName, setGuestName] = useState(user?.full_name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState('+1 (555) 349-8802');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate nights and total
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  const nights = Math.max(1, Math.round((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24)));
  const totalCents = nights * roomType.base_price_cents;
  const totalFormatted = (totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const nightlyFormatted = (roomType.base_price_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Availability check
  const availability = db.checkAvailability(roomType.id, checkIn, checkOut);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (outD <= inD) {
      setErrorMessage('Check-out date must be after check-in date.');
      return;
    }

    if (!availability.available) {
      setErrorMessage('Sorry, no rooms in this category are available for the selected dates. Please adjust your stay.');
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage('Please provide complete guest contact information.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reservation = db.createReservation({
        userId: user?.id || 'guest_user',
        customerName: guestName,
        customerEmail: guestEmail,
        customerPhone: guestPhone,
        roomTypeId: roomType.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numGuests: Number(numGuests),
        specialRequests,
      });

      onBookingSuccess(reservation.booking_reference);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">Reserve Experience</span>
            <h3 className="font-serif text-lg font-bold text-white">{roomType.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Room Summary Preview */}
          <div className="flex gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 items-center">
            <img
              src={roomType.image_url}
              alt={roomType.name}
              referrerPolicy="no-referrer"
              className="w-20 h-16 rounded-lg object-cover shrink-0"
            />
            <div className="text-xs space-y-1">
              <p className="text-slate-300 font-medium">{roomType.bed_type} · Up to {roomType.max_occupancy} Guests · {roomType.size_sqm} m²</p>
              <p className="text-slate-400">Rate: <span className="text-cyan-300 font-semibold font-mono tabular-nums">{nightlyFormatted}</span> / night</p>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={availability.available ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {availability.available ? `✓ Available (${availability.availableRoomCount} suites available)` : '✕ Sold out for selected dates'}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Check-in Date
              </label>
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Guests
              </label>
              <select
                value={numGuests}
                onChange={(e) => setNumGuests(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {Array.from({ length: roomType.max_occupancy }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guest Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guest Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Sophia Laurent"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Special Preferences or Requests (Optional)</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={2}
                placeholder="High floor, late arrival time, hypoallergenic bedding, dining preferences..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{nightlyFormatted} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
              <span className="font-mono tabular-nums">{totalFormatted}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Resort Amenities & Concierge Fee</span>
              <span className="text-emerald-400 font-mono">Included</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-semibold text-white">
              <span>Total Guaranteed Amount</span>
              <span className="font-mono text-cyan-400 tabular-nums text-base">{totalFormatted}</span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Instant database confirmation</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !availability.available}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-950 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Confirming Reservation...' : `Confirm & Book (${totalFormatted})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
