import React, { useState } from 'react';
import { Sparkles, MessageSquare, X, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { NiaAssistant } from './NiaAssistant';
import { RoomType } from '../../lib/types';

interface NiaFloatingButtonProps {
  onSelectRoomForBooking?: (roomType: RoomType) => void;
}

export const NiaFloatingButton: React.FC<NiaFloatingButtonProps> = ({ onSelectRoomForBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Floating launcher trigger button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center gap-3 px-4 py-3 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-full shadow-2xl border border-[#C7A36A]/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
            aria-label="Open Nia AI Concierge"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0D2820] to-[#1E4B3D] border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] shadow-xs">
                <Sparkles className="w-4 h-4 text-[#C7A36A] group-hover:rotate-12 transition-transform" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#12382D] rounded-full animate-pulse" />
            </div>

            <div className="text-left hidden sm:block pr-1">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xs font-normal tracking-wide text-white">Nia AI Concierge</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#C7A36A]/20 text-[#C7A36A] rounded font-mono">LIVE</span>
              </div>
              <p className="text-[10px] text-[#A9B8A4]">Ask about rooms, dining, or request help</p>
            </div>
          </button>
        </div>
      )}

      {/* Floating Concierge Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[440px] max-w-[500px] shadow-2xl transition-all duration-300">
          {isMinimized ? (
            <div className="bg-[#12382D] border border-[#C7A36A] rounded-2xl p-3.5 flex items-center justify-between text-white shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#0D2820] border border-[#C7A36A] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-[#C7A36A]" />
                </div>
                <span className="font-serif text-xs text-white">Nia AI Concierge (Minimized)</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-1 hover:bg-white/10 rounded text-[#C7A36A] cursor-pointer"
                  title="Expand"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded text-[#A9B8A4] hover:text-white cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Header Action Controls */}
              <div className="absolute top-4 right-14 z-10 flex items-center gap-1 text-white">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-[#A9B8A4] hover:text-white transition-colors cursor-pointer text-xs"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <NiaAssistant
                mode="drawer"
                onClose={() => setIsOpen(false)}
                onSelectRoomForBooking={(room) => {
                  setIsOpen(false);
                  if (onSelectRoomForBooking) onSelectRoomForBooking(room);
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
