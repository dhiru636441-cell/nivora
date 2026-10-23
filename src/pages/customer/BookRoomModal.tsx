import React, { useState } from 'react';
import { RoomType } from '../../lib/types';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import { supabase, isSupabaseConfigured, insertSupabaseReservation } from '../../lib/supabase';
import { X, Calendar, Users, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Bed, Lock } from 'lucide-react';

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
  const [guestPhone, setGuestPhone] = useState(user?.phone || '+1 (555) 349-8802');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (outD <= inD) {
      setErrorMessage('Check-out date must be after check-in date.');
      return;
    }

    if (!availability.available) {
      setErrorMessage('Sorry, no rooms in this category are available for the selected dates. Double-booking prevention enforced.');
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMessage('Please provide complete guest contact information.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Connect booking submission to existing public.reservations table in Supabase
      if (isSupabaseConfigured && supabase) {
        // Requirement 6: Use authenticated user's UUID for guest_id
        const isAuthUuid = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

        if (!isAuthUuid) {
          throw new Error('Supabase Row Level Security requires an authenticated user session. Please sign in or register to record your reservation in the database.');
        }

        // Room UUID assignment for the selected room type
        const assignedRoomUuid = crypto.randomUUID();

        const { error: supabaseError } = await insertSupabaseReservation({
          guest_id: user!.id,
          room_id: assignedRoomUuid,
          check_in: checkIn,
          check_out: checkOut,
          booking_status: 'confirmed',
        });

        if (supabaseError) {
          // Requirement 7: Display real database errors instead of silently ignoring failed requests
          throw new Error(`Database Error [${(supabaseError as any).code || 'RLS'}]: ${supabaseError.message}`);
        }
      }

      // 2. Preserve existing local guest dataset, active stays, and dashboard state
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#F7F3EA] dark:bg-[#181D18] border border-[#C7A36A]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#C7A36A]/20 flex items-center justify-between bg-[#12382D] text-[#F7F3EA]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">
              Bespoke Sanctuary Reservation
            </span>
            <h3 className="font-serif text-xl font-normal text-white">{roomType.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A9B8A4] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-[#242722] dark:text-[#F7F3EA]">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pricing & Availability Card */}
          <div className="p-4 bg-white dark:bg-[#1E231E] rounded-xl border border-[#C7A36A]/25 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-[#A9B8A4]">Nightly Rate</p>
              <p className="font-serif text-xl font-bold text-[#12382D] dark:text-[#C7A36A]">{nightlyFormatted} <span className="text-xs font-normal text-[#A9B8A4]">/ night</span></p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] block">Availability</span>
              <span className={`font-semibold ${availability.available ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}`}>
                {availability.available ? `${availability.availableRoomCount} Rooms Available` : 'Sold Out for Dates'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Check-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#12382D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Check-out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#12382D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Guest Full Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Lady Victoria"
                  required
                  className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Contact Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="guest@example.com"
                  required
                  className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Number of Guests</label>
                <select
                  value={numGuests}
                  onChange={(e) => setNumGuests(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  {Array.from({ length: roomType.max_occupancy }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Bespoke Requests & Arrival Directives</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Late evening arrival, extra goose down pillows, chilled champagne in suite"
                rows={2}
                className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl p-3 text-xs focus:outline-none"
              />
            </div>

            {/* Total Calculation */}
            <div className="pt-4 border-t border-[#C7A36A]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#A9B8A4]">Duration of Sanctuary Stay:</span>
                <p className="font-medium text-xs text-[#12382D] dark:text-[#F7F3EA]">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#A9B8A4]">Total Amount:</span>
                <p className="font-serif text-2xl font-bold text-[#12382D] dark:text-[#C7A36A]">{totalFormatted}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !availability.available}
              className="w-full py-3 bg-[#12382D] hover:bg-[#0D2820] disabled:opacity-40 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Confirming Reservation...' : 'Complete Sanctuary Reservation'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
