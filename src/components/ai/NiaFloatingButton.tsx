import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  ChevronUp,
  Maximize2,
  Minimize2,
  Bed,
  CheckCircle2,
} from 'lucide-react';
import { NiaAssistant } from './NiaAssistant';
import { RoomType } from '../../lib/types';
import { BookRoomModal } from '../../pages/customer/BookRoomModal';
import { db } from '../../lib/db';

interface NiaFloatingButtonProps {
  onSelectRoomForBooking?: (roomType: RoomType) => void;
}

export const NiaFloatingButton: React.FC<NiaFloatingButtonProps> = ({ onSelectRoomForBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [bookingRoomType, setBookingRoomType] = useState<RoomType | null>(null);
  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);

  // Show a gentle concierge teaser bubble after 3 seconds if not opened yet
  useEffect(() => {
    const hasSeenTeaser = sessionStorage.getItem('nivora_nia_teaser_dismissed');
    if (!hasSeenTeaser && !isOpen) {
      const timer = setTimeout(() => {
        setShowTeaser(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDismissTeaser = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTeaser(false);
    sessionStorage.setItem('nivora_nia_teaser_dismissed', 'true');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setShowTeaser(false);
    sessionStorage.setItem('nivora_nia_teaser_dismissed', 'true');
  };

  const handleSelectRoom = (roomType: RoomType) => {
    if (onSelectRoomForBooking) {
      onSelectRoomForBooking(roomType);
    } else {
      setBookingRoomType(roomType);
    }
  };

  return (
    <>
      {/* Floating Action Button (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {/* Subtle Welcome Teaser Callout */}
          {showTeaser && (
            <div className="mb-3 max-w-xs bg-white dark:bg-[#1E231E] border border-[#C7A36A] text-[#12382D] dark:text-[#F7F3EA] rounded-2xl p-3 shadow-xl text-xs relative animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button
                onClick={handleDismissTeaser}
                className="absolute top-2 right-2 text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-white p-0.5 cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
              <div className="flex items-start gap-2.5 pr-4">
                <div className="w-6 h-6 rounded-full bg-[#12382D] text-[#C7A36A] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-[11px] text-[#C7A36A]">Nia AI Sanctuary Concierge</p>
                  <p className="text-[11px] text-[#242722]/80 dark:text-[#E2DED4] mt-0.5 leading-snug">
                    Need extra towels, dining menus, or room availability? I am at your service 24/7.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Luxury Floating Trigger Pill */}
          <button
            onClick={handleOpen}
            className="group relative flex items-center gap-3 px-4 py-3 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-full shadow-2xl border border-[#C7A36A]/60 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#C7A36A]/60"
            aria-label="Open Nia AI Concierge"
          >
            {/* Glowing Avatar Ring */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0D2820] via-[#12382D] to-[#1E4B3D] border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] shadow-xs group-hover:border-white transition-colors">
                <Sparkles className="w-4 h-4 text-[#C7A36A] group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#12382D] rounded-full animate-pulse" />
            </div>

            {/* Label and Live Status */}
            <div className="text-left pr-1 select-none">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xs font-normal tracking-wide text-white">Nia AI Concierge</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#C7A36A]/20 text-[#C7A36A] rounded font-mono uppercase tracking-wider border border-[#C7A36A]/30">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-[#A9B8A4] hidden sm:block">Ask about rooms, dining, or request help</p>
            </div>
          </button>
        </div>
      )}

      {/* Floating Concierge Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300 ${
            isMinimized
              ? 'w-72 sm:w-80'
              : isExpanded
              ? 'w-[96vw] sm:w-[560px] max-w-[620px] h-[750px] max-h-[90vh]'
              : 'w-[94vw] sm:w-[440px] max-w-[480px] h-[640px] max-h-[85vh]'
          }`}
        >
          {isMinimized ? (
            /* Minimized Bar */
            <div className="bg-[#12382D] border border-[#C7A36A] rounded-2xl p-3.5 flex items-center justify-between text-white shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setIsMinimized(false)}>
                <div className="w-7 h-7 rounded-full bg-[#0D2820] border border-[#C7A36A] flex items-center justify-center text-[#C7A36A]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-serif text-xs text-white block">Nia AI Concierge</span>
                  <span className="text-[10px] text-[#A9B8A4]">Click to restore window</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-[#C7A36A] transition-colors cursor-pointer"
                  title="Restore window"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-[#A9B8A4] hover:text-white transition-colors cursor-pointer"
                  title="Close concierge"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Full Chat Interface Container */
            <div className="relative h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-[#C7A36A]/40 bg-white dark:bg-[#1A1F1A]">
              {/* Window Controls Overlay */}
              <div className="absolute top-4 right-14 z-20 flex items-center gap-1 text-white">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-[#A9B8A4] hover:text-white transition-colors cursor-pointer hidden sm:block"
                  title={isExpanded ? 'Standard width' : 'Expand width'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-[#A9B8A4] hover:text-white transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5 sm:hidden" />
                  <span className="hidden sm:inline text-xs text-[#A9B8A4] hover:text-white">—</span>
                </button>
              </div>

              {/* Core Nia AI Chat Assistant */}
              <NiaAssistant
                mode="drawer"
                onClose={() => setIsOpen(false)}
                onSelectRoomForBooking={handleSelectRoom}
              />
            </div>
          )}
        </div>
      )}

      {/* Built-in Booking Modal Triggered from Nia Chat */}
      {bookingRoomType && (
        <BookRoomModal
          roomType={bookingRoomType}
          isOpen={Boolean(bookingRoomType)}
          onClose={() => setBookingRoomType(null)}
          onBookingSuccess={(ref) => {
            setBookingSuccessRef(ref);
            setBookingRoomType(null);
          }}
        />
      )}

      {/* Booking Success Toast if booked via Nia */}
      {bookingSuccessRef && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-emerald-900 border border-emerald-400 text-white p-4 rounded-2xl shadow-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Residence Confirmed via Nia AI</p>
              <p className="text-[#A9B8A4]">Reference: <strong className="font-mono text-white">{bookingSuccessRef}</strong></p>
            </div>
          </div>
          <button
            onClick={() => setBookingSuccessRef(null)}
            className="text-white/70 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
