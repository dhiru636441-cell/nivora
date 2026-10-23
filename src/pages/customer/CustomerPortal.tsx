import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/db';
import { supabase, isSupabaseConfigured, insertSupabaseFeedback } from '../../lib/supabase';
import { RoomType, Reservation, ActiveStay, ServiceRequest } from '../../lib/types';
import { BookRoomModal } from './BookRoomModal';
import { HotelAIAssistant } from '../../components/ai/HotelAIAssistant';
import { NiaAssistant } from '../../components/ai/NiaAssistant';
import { NiaFloatingButton } from '../../components/ai/NiaFloatingButton';
import { FoodAndBeveragePage } from './FoodAndBeveragePage';
import { RESORT_IMAGES } from '../../lib/assets';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import {
  Calendar,
  Sparkles,
  Key,
  Clock,
  Compass,
  CheckCircle,
  Plus,
  Send,
  Coffee,
  Wrench,
  ConciergeBell,
  Check,
  User,
  ShieldCheck,
  Bed,
  Star,
  MessageSquare,
  Bot,
  ChevronRight,
  Wifi,
  PhoneCall,
  HeartHandshake,
  UtensilsCrossed,
  AlertTriangle,
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { user, updateProfile, saveCustomerProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'accommodations' | 'dining' | 'services' | 'ai_concierge' | 'feedback' | 'profile'>('overview');
  
  // Local state synced from db
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeStay, setActiveStay] = useState<ActiveStay | undefined>(undefined);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  
  // Booking modal state
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);

  // New Service Request Form
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceRequest['category']>('room_service');
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDetails, setNewServiceDetails] = useState('');
  const [newServicePriority, setNewServicePriority] = useState<ServiceRequest['priority']>('medium');
  const [serviceSubmittedMessage, setServiceSubmittedMessage] = useState(false);

  // Profile preferences
  const [profileName, setProfileName] = useState(user?.full_name || 'Sophia Laurent');
  const [profilePhone, setProfilePhone] = useState(user?.mobile_number || user?.phone || '+91 98765 43210');
  const [profileAge, setProfileAge] = useState<string>(user?.age ? String(user.age) : '32');
  const [profileGender, setProfileGender] = useState<'Male' | 'Female' | 'Prefer not to say'>(
    (user?.gender as any) || 'Female'
  );
  const [profilePillows, setProfilePillows] = useState('Extra Soft Goose Down');
  const [profileFloor, setProfileFloor] = useState('High Floor / Horizon View');
  const [profileDiet, setProfileDiet] = useState('Gluten-conscious, Organic Coffee');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile values when auth user changes
  useEffect(() => {
    if (user?.full_name) setProfileName(user.full_name);
    if (user?.mobile_number || user?.phone) setProfilePhone(user.mobile_number || user.phone || '');
    if (user?.age) setProfileAge(String(user.age));
    if (user?.gender) setProfileGender(user.gender as any);
  }, [user]);

  // Guest Feedback form state
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Overall Experience');
  const [feedbackText, setFeedbackText] = useState('');
  const [returnIntent, setReturnIntent] = useState('Definitely');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackErrorMessage(null);
    setIsSubmittingFeedback(true);

    try {
      // Connect feedback form to public.feedback in Supabase
      if (isSupabaseConfigured && supabase) {
        const isAuthUuid = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        if (!isAuthUuid) {
          throw new Error('Supabase Row Level Security requires an authenticated user session. Please sign in or register to record your feedback in the database.');
        }

        const { error: fbError } = await insertSupabaseFeedback({
          guest_id: user!.id,
          rating: Number(feedbackScore),
          comments: feedbackText.trim(),
        });

        if (fbError) {
          // Requirement 7: Display real database errors instead of silently ignoring failed requests
          throw new Error(`Database Error [${(fbError as any).code || 'RLS'}]: ${fbError.message}`);
        }
      }

      // Preserve local audit logging and feedback UX
      db.logAudit(
        { id: user?.id || 'guest', email: user?.email || 'guest@nivoraresort.com', role: 'customer' },
        'GUEST_FEEDBACK_SUBMITTED',
        'feedback',
        `fb_${Date.now()}`,
        { satisfaction_score: feedbackScore, category: feedbackCategory, return_intent: returnIntent, text: feedbackText }
      );

      setFeedbackSubmitted(true);
      setFeedbackText('');
      setTimeout(() => setFeedbackSubmitted(false), 5000);
    } catch (err: any) {
      setFeedbackErrorMessage(err.message || 'Error transmitting feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaveError(null);
    setIsSavingProfile(true);
    try {
      const res = await saveCustomerProfile({
        full_name: profileName.trim(),
        age: parseInt(profileAge, 10),
        gender: profileGender,
        mobile_number: profilePhone.trim(),
      });
      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile.');
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileSaveError(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const loadData = async () => {
    setRoomTypes(db.getRoomTypes());
    const userRes = db.getReservations().filter(
      (r) => r.user_id === user?.id || r.customer_email === user?.email || r.user_id === 'usr_customer_demo'
    );
    setReservations(userRes);

    const userStay = db.getActiveStays().find(
      (s) => (s.user_id === user?.id || s.guest_name === user?.full_name || s.user_id === 'usr_guest_arrived') && s.status === 'active'
    );
    setActiveStay(userStay);

    const userReqs = db.getServiceRequests();
    setServiceRequests(userReqs);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return unsub;
  }, []);

  const handleCreateServiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) return;

    db.createServiceRequest({
      userId: user?.id || 'usr_customer_demo',
      roomNumber: activeStay?.room_number || '301',
      category: newServiceCategory,
      title: newServiceTitle,
      details: newServiceDetails,
      priority: newServicePriority,
    });

    setServiceSubmittedMessage(true);
    setNewServiceTitle('');
    setNewServiceDetails('');
    setTimeout(() => setServiceSubmittedMessage(false), 3500);
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* 1. Authentic Luxury Hero Section */}
      <section className="relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center text-white overflow-hidden">
        {/* Background authentic resort photograph */}
        <ImageWithFallback
          src={RESORT_IMAGES.hero}
          alt="Nivora Luxury Resort & Residences"
          loading="eager"
          containerClassName="absolute inset-0 w-full h-full"
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Luxury gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12382D] via-[#12382D]/60 to-[#12382D]/35" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F7F3EA] text-xs tracking-widest uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C7A36A]" />
            <span>Curated Sovereign Island Sanctuaries</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-wide text-white leading-tight">
            An Oasis of Timeless Serenity
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#F7F3EA]/90 max-w-2xl mx-auto leading-relaxed">
            Experience bespoke hospitality, private cantilever terraces, and thoughtful intelligence designed to anticipate your every desire.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('accommodations')}
              className="px-6 py-3 bg-[#C7A36A] hover:bg-[#D9BB8A] text-[#12382D] font-semibold text-xs tracking-wider uppercase rounded-xl transition-colors shadow-md cursor-pointer"
            >
              Explore Accommodations
            </button>
            <button
              onClick={() => setActiveTab('dining')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium text-xs tracking-wider uppercase rounded-xl backdrop-blur-md transition-colors cursor-pointer flex items-center gap-2"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#C7A36A]" />
              <span>Food &amp; Beverage</span>
            </button>
            <button
              onClick={() => setActiveTab('ai_concierge')}
              className="px-6 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-medium text-xs tracking-wider uppercase rounded-xl backdrop-blur-md transition-colors cursor-pointer"
            >
              Speak to Concierge AI
            </button>
          </div>
        </div>
      </section>

      {/* Guest Portal Sub-navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 p-1.5 bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl shadow-xs overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'My Sanctuary' },
            { id: 'accommodations', label: 'Accommodations' },
            { id: 'dining', label: 'Food & Beverage' },
            { id: 'services', label: 'In-Suite Amenities' },
            { id: 'ai_concierge', label: 'Nia AI Concierge' },
            { id: 'feedback', label: 'Guest Feedback' },
            { id: 'profile', label: 'Personal Preferences' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap font-medium cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#12382D] text-white shadow-xs font-semibold'
                  : 'text-[#242722]/70 dark:text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Success Booking Notice */}
      {bookingSuccessRef && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Sanctuary Reservation Confirmed</p>
                <p>Booking Reference: <strong className="font-mono">{bookingSuccessRef}</strong>. Our guest concierge awaits your arrival.</p>
              </div>
            </div>
            <button
              onClick={() => setBookingSuccessRef(null)}
              className="text-emerald-700 underline text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Overview & Active Stay */}
      {activeTab === 'overview' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Active Stay Digital Keycard (If Guest is checked in) */}
          {activeStay && (
            <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-[#C7A36A]/40 bg-gradient-to-br from-[#12382D] to-[#0A201A] text-white shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/15">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">
                    Current Stay Digital Key
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal mt-1">
                    Room {activeStay.room_number}
                  </h2>
                  <p className="text-xs text-[#A9B8A4] mt-1">
                    Welcome back, {activeStay.guest_name} · Departure: {activeStay.expected_check_out}
                  </p>
                </div>

                {/* Digital Key NFC Ring */}
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/20">
                  <div className="w-10 h-10 rounded-full border-2 border-[#C7A36A] flex items-center justify-center text-[#C7A36A]">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4]">Door Passcode</span>
                    <p className="font-mono text-xl font-bold tracking-widest text-white">{activeStay.keycard_code}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-[#A9B8A4]">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-[#C7A36A]" />
                  <span>Nivora-Residences-Ultra (500Mbps)</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#C7A36A]" />
                  <span>Dial 0 for Butler Assistance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C7A36A]" />
                  <span>Daily Turndown at 19:30</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#C7A36A]" />
                  <span>In-Suite Dining: Open 24/7</span>
                </div>
              </div>
            </div>
          )}

          {/* Nia AI Concierge Banner */}
          <div className="rounded-3xl p-6 sm:p-7 border border-[#C7A36A]/35 bg-gradient-to-r from-[#12382D] via-[#164336] to-[#0D2820] text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C7A36A]/20 via-transparent to-transparent pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#C7A36A]/20 border border-[#C7A36A] flex items-center justify-center text-[#C7A36A]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">
                    Nivora Intelligent Assistant
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-white font-normal">
                  Meet Nia AI — The Intelligence Behind Every Stay
                </h3>
                <p className="text-xs text-[#A9B8A4] leading-relaxed">
                  Looking for dining recommendations, pool hours, or immediate staff assistance? Nia can check live room availability, retrieve gourmet menus, and dispatch staff directly to your suite.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('ai_concierge')}
                className="px-5 py-3 bg-[#C7A36A] hover:bg-[#B39058] text-[#12382D] font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Consult Nia Concierge</span>
              </button>
            </div>
          </div>

          {/* Upcoming Reservations */}
          <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#C7A36A]/20">
              <div>
                <h3 className="font-serif text-xl text-[#12382D] dark:text-[#F7F3EA]">Your Confirmed Itineraries</h3>
                <p className="text-xs text-[#A9B8A4]">Upcoming resort reservations tied to your account</p>
              </div>
              <button
                onClick={() => setActiveTab('accommodations')}
                className="text-xs text-[#C7A36A] hover:underline flex items-center gap-1"
              >
                <span>Book another stay</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#C7A36A]/15">
              {reservations.map((res) => {
                const rt = roomTypes.find((r) => r.id === res.room_type_id);
                return (
                  <div key={res.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[#12382D] dark:text-[#F7F3EA]">{rt?.name || 'Sanctuary Suite'}</span>
                        <span className="text-[#A9B8A4]">({res.booking_reference})</span>
                      </div>
                      <p className="text-[#A9B8A4] text-[11px] mt-0.5">
                        Dates: {res.check_in_date} → {res.check_out_date} · {res.num_guests} Guests
                      </p>
                      {res.special_requests && (
                        <p className="text-[11px] text-[#A9B8A4] italic mt-0.5">"{res.special_requests}"</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-bold text-sm text-[#12382D] dark:text-[#C7A36A]">
                        ${(res.total_price_cents / 100).toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-medium">Confirmed & Verified</span>
                    </div>
                  </div>
                );
              })}

              {reservations.length === 0 && (
                <div className="py-8 text-center text-[#A9B8A4] text-xs">
                  You currently have no scheduled stays. Discover our luxury suites below.
                </div>
              )}
            </div>
          </div>

          {/* Quick Accommodations Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl text-[#12382D] dark:text-[#F7F3EA]">Signature Accommodations</h3>
                <p className="text-xs text-[#A9B8A4]">Handcrafted living spaces on the Sovereign Peninsula</p>
              </div>
              <button
                onClick={() => setActiveTab('accommodations')}
                className="text-xs text-[#C7A36A] hover:underline"
              >
                View all suites →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roomTypes.slice(0, 2).map((rt) => (
                <div
                  key={rt.id}
                  className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback
                      src={rt.image_url}
                      alt={rt.name}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 bg-[#12382D]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-serif">
                      ${(rt.base_price_cents / 100).toLocaleString()} / night
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h4 className="font-serif text-xl text-[#12382D] dark:text-[#F7F3EA]">{rt.name}</h4>
                    <p className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] leading-relaxed line-clamp-2">
                      {rt.description}
                    </p>

                    <div className="pt-3 border-t border-[#C7A36A]/15 flex items-center justify-between">
                      <span className="text-[11px] text-[#A9B8A4]">{rt.size_sqm} m² · {rt.bed_type}</span>
                      <button
                        onClick={() => setSelectedRoomType(rt)}
                        className="px-4 py-2 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        Reserve Suite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Accommodations Directory */}
      {activeTab === 'accommodations' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">
              The Collection
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#12382D] dark:text-[#F7F3EA]">
              Sanctuary Living Spaces
            </h2>
            <p className="text-xs text-[#A9B8A4] leading-relaxed">
              Every residence at Nivora is an architectural tribute to the island's natural contours, built with teak, raw stone, and expansive horizons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roomTypes.map((rt) => (
              <div
                key={rt.id}
                className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="relative h-72 overflow-hidden">
                  <ImageWithFallback
                    src={rt.image_url}
                    alt={rt.name}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-[#12382D]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[#C7A36A] text-xs font-serif font-bold">
                    ${(rt.base_price_cents / 100).toLocaleString()} <span className="font-sans font-normal text-white text-[10px]">/ night</span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <div>
                    <h3 className="font-serif text-2xl text-[#12382D] dark:text-[#F7F3EA]">{rt.name}</h3>
                    <p className="text-xs text-[#242722]/80 dark:text-[#A9B8A4] mt-2 leading-relaxed">
                      {rt.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-[#12382D] dark:text-[#C7A36A]">
                    {rt.amenities.map((am, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/25">
                        {am}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#C7A36A]/15 flex items-center justify-between text-xs">
                    <span className="text-[#A9B8A4]">{rt.size_sqm} m² · Up to {rt.max_occupancy} Guests</span>
                    <button
                      onClick={() => setSelectedRoomType(rt)}
                      className="px-5 py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      Reserve This Residence
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Dedicated Food & Beverage Page */}
      {activeTab === 'dining' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FoodAndBeveragePage activeStay={activeStay} />
        </div>
      )}

      {/* Tab 3: In-Suite Services & Spa */}
      {activeTab === 'services' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Request Service Form */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="pb-4 border-b border-[#C7A36A]/20">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">
                  Personalized Attention
                </span>
                <h3 className="font-serif text-2xl text-[#12382D] dark:text-[#F7F3EA] mt-1">
                  In-Suite Dining & Wellness Request
                </h3>
                <p className="text-xs text-[#A9B8A4] mt-1">Dispatched directly to your floor concierge</p>
              </div>

              {serviceSubmittedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs">
                  Request dispatched to your dedicated Butler. Anticipate delivery shortly.
                </div>
              )}

              <form onSubmit={handleCreateServiceRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Service Category</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="room_service">In-Suite Dining & Beverages</option>
                    <option value="housekeeping">Extra Towels / Turndown / Amenities</option>
                    <option value="concierge">Luggage / Peninsula Transport / Spa Booking</option>
                    <option value="maintenance">Technical / Climate Control Calibration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Item or Request Title</label>
                  <input
                    type="text"
                    value={newServiceTitle}
                    onChange={(e) => setNewServiceTitle(e.target.value)}
                    placeholder="e.g. Sparkling Mineral Water & Fresh Fruit Basket"
                    required
                    className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Special Instructions</label>
                  <textarea
                    value={newServiceDetails}
                    onChange={(e) => setNewServiceDetails(e.target.value)}
                    placeholder="e.g. Please deliver to balcony sun deck around 16:00."
                    rows={3}
                    className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl p-3 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Transmit Request to Concierge
                </button>
              </form>
            </div>

            {/* Current Requests Log */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="pb-4 border-b border-[#C7A36A]/20">
                <h3 className="font-serif text-xl text-[#12382D] dark:text-[#F7F3EA]">Recent Service Requests</h3>
                <p className="text-xs text-[#A9B8A4]">Live status of your requested hospitality amenities</p>
              </div>

              <div className="divide-y divide-[#C7A36A]/15 text-xs">
                {serviceRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-medium text-[#12382D] dark:text-[#F7F3EA]">{req.title}</span>
                      <p className="text-[11px] text-[#A9B8A4] capitalize mt-0.5">{req.category.replace('_', ' ')} · Room {req.room_number}</p>
                    </div>
                    <span className="capitalize text-[11px] font-semibold text-[#C7A36A] bg-[#F7F3EA] dark:bg-[#141714] px-2.5 py-1 rounded-lg border border-[#C7A36A]/20">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 4: Nia AI Concierge */}
      {activeTab === 'ai_concierge' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <NiaAssistant
            mode="embedded"
            onSelectRoomForBooking={(rt) => setSelectedRoomType(rt)}
          />
        </div>
      )}

      {/* Tab 5: Guest Feedback */}
      {activeTab === 'feedback' && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="text-center space-y-1 pb-4 border-b border-[#C7A36A]/20">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">Your Experience Matters</span>
              <h3 className="font-serif text-2xl text-[#12382D] dark:text-[#F7F3EA]">Sanctuary Guest Feedback</h3>
              <p className="text-xs text-[#A9B8A4]">Share your observations to help us refine your future stays</p>
            </div>

            {feedbackSubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs text-center">
                Thank you for your valuable feedback. Our general manager reviews each entry personally.
              </div>
            )}

            {feedbackErrorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{feedbackErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-2">Overall Satisfaction Rating</label>
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFeedbackScore(score)}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-serif font-bold transition-all ${
                        feedbackScore >= score
                          ? 'bg-[#12382D] border-[#C7A36A] text-[#C7A36A]'
                          : 'border-[#C7A36A]/30 text-[#A9B8A4]'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Primary Dimension</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Overall Experience">Overall Sanctuary Experience</option>
                  <option value="Dining & Culinary">Dining, Wine & Culinary</option>
                  <option value="Spa & Wellness">Peninsula Spa & Wellness</option>
                  <option value="Room Comfort">Suite Comfort & Cleanliness</option>
                  <option value="Staff Attentiveness">Butler & Staff Attentiveness</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Your Detailed Observations</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what delighted you or what we could elevate..."
                  rows={4}
                  required
                  className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl p-3 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                Submit Feedback to General Management
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 6: Profile & Preferences */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#C7A36A]/20">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold">Personalized Hospitality</span>
              <h3 className="font-serif text-2xl text-[#12382D] dark:text-[#F7F3EA] mt-1">Bespoke Guest Profile</h3>
              <p className="text-xs text-[#A9B8A4]">Saved preferences applied automatically to every stay</p>
            </div>

            {profileSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs">
                Your sanctuary preferences have been synchronized.
              </div>
            )}

            {profileSaveError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{profileSaveError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Mobile Contact String</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs font-mono text-[#242722] dark:text-[#F7F3EA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="18"
                    max="120"
                    value={profileAge}
                    onChange={(e) => setProfileAge(e.target.value)}
                    className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs font-mono text-[#242722] dark:text-[#F7F3EA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Gender</label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value as any)}
                    className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Pillow Menu Preference</label>
                <select
                  value={profilePillows}
                  onChange={(e) => setProfilePillows(e.target.value)}
                  className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA]"
                >
                  <option value="Extra Soft Goose Down">Extra Soft Goose Down (Default)</option>
                  <option value="Firm Memory Foam">Orthopedic Memory Foam</option>
                  <option value="Hypoallergenic Silk">Hypoallergenic Silk Fill</option>
                  <option value="Aromatic Lavender Infused">Aromatic Lavender Infused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Preferred Floor & Wing</label>
                <select
                  value={profileFloor}
                  onChange={(e) => setProfileFloor(e.target.value)}
                  className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA]"
                >
                  <option value="High Floor / Horizon View">High Floor / Ocean Horizon</option>
                  <option value="Ground Villa / Plunge Pool">Ground Level Garden Villa / Direct Plunge Pool</option>
                  <option value="Quiet Wing Away from Elevators">Quiet Wing Away from Elevators</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Dietary & Beverage Directives</label>
                <input
                  type="text"
                  value={profileDiet}
                  onChange={(e) => setProfileDiet(e.target.value)}
                  placeholder="e.g. Gluten-conscious, Oat milk, sparkling water"
                  className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA]"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="w-full py-2.5 bg-[#12382D] hover:bg-[#0D2820] disabled:opacity-60 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <span>Saving Sanctuary Folio...</span>
                ) : (
                  <span>Save Sanctuary Preferences</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Room Modal */}
      {selectedRoomType && (
        <BookRoomModal
          roomType={selectedRoomType}
          isOpen={Boolean(selectedRoomType)}
          onClose={() => setSelectedRoomType(null)}
          onBookingSuccess={(ref) => {
            setBookingSuccessRef(ref);
            loadData();
          }}
        />
      )}

      {/* Floating Nia AI Concierge Launcher */}
      <NiaFloatingButton
        onSelectRoomForBooking={(rt) => setSelectedRoomType(rt)}
      />

    </div>
  );
};
