import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/db';
import { RoomType } from '../../lib/types';
import {
  Sparkles,
  Send,
  User,
  Bot,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  UtensilsCrossed,
  Key,
  Wifi,
  PhoneCall,
  Loader2,
  Calendar,
  Bed,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Star,
  Info,
} from 'lucide-react';

export interface NiaAssistantProps {
  mode?: 'embedded' | 'drawer' | 'modal';
  onClose?: () => void;
  onSelectRoomForBooking?: (roomType: RoomType) => void;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'nia';
  text: string;
  timestamp: string;
  toolsExecuted?: Array<{ tool: string; args: any; result: any }>;
  ticketCreated?: {
    id: string;
    ticket_number: string;
    guest_name: string;
    room_number: string;
    category: string;
    issue_summary: string;
    details: string;
    priority: string;
    status: string;
    assigned_department: string;
    estimated_arrival_minutes: number;
    created_at: string;
  };
  availableRooms?: Array<{
    id: string;
    name: string;
    nightly_rate_usd: number;
    total_for_stay_usd: number;
    nights: number;
    max_occupancy: number;
    bed_type: string;
    size_sqm: number;
    amenities: string[];
    image_url: string;
    status: string;
  }>;
  menuItems?: Array<{
    name: string;
    category: string;
    price_inr: string;
    is_vegetarian: boolean;
    prep_time: string;
    description: string;
    tags: string[];
  }>;
}

const STORAGE_KEY = 'nivora_nia_chat_v1';

export const NiaAssistant: React.FC<NiaAssistantProps> = ({
  mode = 'embedded',
  onClose,
  onSelectRoomForBooking,
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages from sessionStorage or default welcome
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore sessionStorage errors
    }
    return [
      {
        id: 'welcome',
        sender: 'nia',
        text: `Welcome to **Nivora Sanctuary**. I am **Nia**, your personal AI concierge.

I am here to attend to your every convenience:
• **Resort Amenities & Wi-Fi** — Inquire about our infinity pool, Peninsula Spa, or Wi-Fi credentials.
• **Room Availability & Rates** — Explore our ocean horizon suites and secluded garden villas.
• **In-Suite Dining** — Browse gourmet menus and track room service deliveries.
• **Instant Staff Triage** — Report any concern or request, and I will dispatch our dedicated team immediately.

How may I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolNote, setActiveToolNote] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Save conversation in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const starterPrompts = [
    { label: 'Check Room Availability', prompt: 'What suites and villas are available for next weekend for 2 guests?' },
    { label: 'Wi-Fi & Check-Out Policy', prompt: 'What is the resort Wi-Fi network and what time is checkout?' },
    { label: 'Dining & Room Service Menu', prompt: 'Show me the signature mains and breakfast items available for in-suite dining.' },
    { label: 'Request Staff Assistance', prompt: 'I would like extra plush bath towels and a tea replenishment sent to my room.' },
    { label: 'Check My Reservation', prompt: 'Could you verify the status of my current booking and room assignment?' },
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setApiError(null);
    setInputQuery('');

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);
    setActiveToolNote('Connecting with Nivora concierge intelligence...');

    try {
      // Pass guest context from active auth session
      const guestContext = {
        user_id: user?.id,
        email: user?.email,
        full_name: user?.full_name || 'Sanctuary Guest',
        current_room: '301',
      };

      const response = await fetch('/api/ai/nia-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          guestContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setActiveToolNote(null);

      // If a support ticket was generated, also record it in local client database so Staff & Front Desk see it live
      if (data.actionableData?.ticketCreated) {
        const t = data.actionableData.ticketCreated;
        try {
          db.createTicketFromAI({
            ticketId: t.ticket_number || t.id,
            userId: user?.id || 'guest',
            guestName: user?.full_name || t.guest_name,
            roomNumber: t.room_number || '301',
            category: t.category as any,
            title: t.issue_summary || 'Guest Assistance Request',
            details: t.details || '',
            priority: (t.priority as any) || 'medium',
          });
        } catch {
          // Ignore local duplicate errors
        }
      }

      const niaMessage: ChatMessage = {
        id: `nia_${Date.now()}`,
        sender: 'nia',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsExecuted: data.toolCallsExecuted,
        ticketCreated: data.actionableData?.ticketCreated,
        availableRooms: data.actionableData?.availableRooms,
        menuItems: data.actionableData?.menuItems,
      };

      setMessages(prev => [...prev, niaMessage]);
    } catch (err: any) {
      console.error('Nia chat error:', err);
      setActiveToolNote(null);
      setApiError(err.message || 'Connection interrupted.');

      const errorMessage: ChatMessage = {
        id: `nia_err_${Date.now()}`,
        sender: 'nia',
        text: `I apologize for the momentary interruption. I am temporarily unable to reach the resort intelligence service (${err.message}).

For immediate assistance, please dial **0** from your suite phone or speak directly with our Front Desk concierge team.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setActiveToolNote(null);
    }
  };

  const handleClearChat = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'nia',
        text: `Conversation cleared. I am **Nia**, your personal concierge. How may I be of service to you right now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Format markdown helper (bolding, headers, lists)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            const clean = line.trim().replace(/^[•-]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[#C7A36A] mt-1 shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(clean) }} />
              </div>
            );
          }

          // Headers
          if (line.trim().startsWith('###') || line.trim().startsWith('##')) {
            const clean = line.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="font-serif font-medium text-sm text-[#12382D] dark:text-[#C7A36A] pt-2">
                {clean}
              </h4>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    // Replace **bold** with <strong>
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#12382D] dark:text-[#F7F3EA]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-[#1A1F1A] border border-[#C7A36A]/25 rounded-2xl shadow-sm overflow-hidden ${
      mode === 'drawer' ? 'h-full' : 'h-[650px]'
    }`}>
      {/* Header */}
      <div className="px-5 py-4 bg-[#12382D] text-white flex items-center justify-between border-b border-[#C7A36A]/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0D2820] to-[#1E4B3D] border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#C7A36A]" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#12382D] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base tracking-wide font-normal text-white">Nia AI</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#C7A36A]/20 text-[#C7A36A] text-[10px] tracking-widest font-mono uppercase border border-[#C7A36A]/30">
                Concierge
              </span>
            </div>
            <p className="text-[11px] text-[#A9B8A4]">Nivora Intelligent Assistant · 24/7 Guest Care</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            title="Reset conversation"
            className="p-2 text-[#A9B8A4] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[#A9B8A4] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-xs"
              title="Close concierge"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FBF9F5] dark:bg-[#141714]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[#A9B8A4]">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-[#C7A36A]" />
                  <span className="font-medium text-[#12382D] dark:text-[#C7A36A]">Nia AI</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-[#12382D] text-white rounded-tr-none'
                  : 'bg-white dark:bg-[#1E231E] border border-[#C7A36A]/20 text-[#242722] dark:text-[#E2DED4] rounded-tl-none'
              }`}
            >
              {renderFormattedText(msg.text)}

              {/* Actionable Card: Support Ticket Dispatched */}
              {msg.ticketCreated && (
                <div className="mt-3.5 p-3.5 rounded-xl bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/40 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#C7A36A]/20">
                    <div className="flex items-center gap-1.5 text-[#12382D] dark:text-[#C7A36A] font-semibold">
                      <ShieldCheck className="w-4 h-4 text-[#C7A36A]" />
                      <span>Staff Dispatch Ticket</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#12382D] dark:text-[#F7F3EA] px-2 py-0.5 bg-white dark:bg-[#1E231E] rounded-md border border-[#C7A36A]/30">
                      #{msg.ticketCreated.ticket_number}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#A9B8A4] block">Department</span>
                      <span className="font-medium text-[#12382D] dark:text-[#F7F3EA]">
                        {msg.ticketCreated.assigned_department}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A9B8A4] block">Priority / Room</span>
                      <span className="capitalize font-semibold text-[#C7A36A]">
                        {msg.ticketCreated.priority} · Room {msg.ticketCreated.room_number}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/40 rounded-lg text-emerald-800 dark:text-emerald-200 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Transmitted to Floor Staff · Est. Arrival: ~{msg.ticketCreated.estimated_arrival_minutes} mins</span>
                  </div>
                </div>
              )}

              {/* Actionable Card: Available Rooms */}
              {msg.availableRooms && msg.availableRooms.length > 0 && (
                <div className="mt-3.5 space-y-2.5">
                  <div className="text-[11px] uppercase tracking-wider text-[#C7A36A] font-semibold flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5" />
                    <span>Live Available Accommodations</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {msg.availableRooms.map((room) => (
                      <div
                        key={room.id}
                        className="p-3 bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-serif text-sm font-medium text-[#12382D] dark:text-[#F7F3EA]">
                            {room.name}
                          </p>
                          <p className="text-[11px] text-[#A9B8A4]">
                            {room.size_sqm} m² · Up to {room.max_occupancy} Guests · {room.bed_type}
                          </p>
                          <p className="text-xs font-semibold text-[#C7A36A] mt-0.5">
                            ${room.nightly_rate_usd} / night (${room.total_for_stay_usd} total)
                          </p>
                        </div>
                        {onSelectRoomForBooking && (
                          <button
                            onClick={() => {
                              const found = db.getRoomTypes().find(r => r.id === room.id);
                              if (found) onSelectRoomForBooking(found);
                            }}
                            className="px-3 py-1.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-lg text-[11px] font-medium transition-colors shrink-0 cursor-pointer shadow-2xs"
                          >
                            Reserve Now
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Card: Menu Items */}
              {msg.menuItems && msg.menuItems.length > 0 && (
                <div className="mt-3.5 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-[#C7A36A] font-semibold flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Chef's Selected Offerings</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.menuItems.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/20 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#12382D] dark:text-[#F7F3EA]">{item.name}</span>
                            {item.is_vegetarian && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800">Veg</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#A9B8A4] line-clamp-1">{item.description}</p>
                        </div>
                        <span className="font-semibold text-[#C7A36A] shrink-0 ml-2">{item.price_inr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool Execution Activity Badge */}
              {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#C7A36A]/15 flex flex-wrap gap-1.5">
                  {msg.toolsExecuted.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#C7A36A]/10 text-[#C7A36A] text-[10px] border border-[#C7A36A]/20 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                      <span>
                        Verified: {t.tool.replace(/_/g, ' ')}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center gap-1.5 px-1 text-[10px] text-[#A9B8A4]">
              <Sparkles className="w-3 h-3 text-[#C7A36A] animate-spin" />
              <span className="font-medium text-[#C7A36A]">Nia is inquiring...</span>
            </div>
            <div className="px-4 py-3 bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-2xl rounded-tl-none shadow-xs text-xs text-[#A9B8A4] flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#C7A36A]" />
              <span>{activeToolNote || 'Synthesizing sanctuary concierge response...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Prompts (if chat is fresh or idle) */}
      <div className="px-4 py-2 bg-[#F7F3EA] dark:bg-[#1A1F1A] border-t border-[#C7A36A]/15 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] shrink-0 font-medium">Inquire:</span>
        {starterPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p.prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-[#141714] border border-[#C7A36A]/25 text-[11px] text-[#12382D] dark:text-[#C7A36A] hover:bg-[#12382D] hover:text-white dark:hover:bg-[#C7A36A] dark:hover:text-[#12382D] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Query Input Bar */}
      <div className="p-3 bg-white dark:bg-[#1E231E] border-t border-[#C7A36A]/25">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Nia about suites, Wi-Fi, dining, or request staff assistance..."
            disabled={isLoading}
            className="flex-1 bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 focus:border-[#C7A36A] rounded-xl px-4 py-2.5 text-xs text-[#242722] dark:text-[#F7F3EA] placeholder:text-[#A9B8A4] focus:outline-hidden transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#C7A36A]" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-[#C7A36A]" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
