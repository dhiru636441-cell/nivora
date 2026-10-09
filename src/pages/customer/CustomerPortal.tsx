import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/db';
import { RoomType, Reservation, ActiveStay, ServiceRequest } from '../../lib/types';
import { BookRoomModal } from './BookRoomModal';
import { HotelAIAssistant } from '../../components/ai/HotelAIAssistant';
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
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'accommodations' | 'services' | 'ai_concierge' | 'feedback' | 'profile'>('overview');
  
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
  const [profilePhone, setProfilePhone] = useState('+1 (555) 234-8901');
  const [profilePillows, setProfilePillows] = useState('Extra Soft Goose Down');
  const [profileFloor, setProfileFloor] = useState('High Floor / Horizon View');
  const [profileDiet, setProfileDiet] = useState('Gluten-conscious, Organic Coffee');
  const [profileSaved, setProfileSaved] = useState(false);

  // Guest Feedback form state
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Overall Experience');
  const [feedbackText, setFeedbackText] = useState('');
  const [returnIntent, setReturnIntent] = useState('Definitely');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    // Log feedback to audit and persist
    db.logAudit(
      { id: user?.id || 'guest', email: user?.email || 'guest@nivoraresort.com', role: 'customer' },
      'GUEST_FEEDBACK_SUBMITTED',
      'feedback',
      `fb_${Date.now()}`,
      { satisfaction_score: feedbackScore, category: feedbackCategory, return_intent: returnIntent, text: feedbackText }
    );

    setFeedbackSubmitted(true);
    setFeedbackText('');
    setTimeout(() => setFeedbackSubmitted(false), 4000);
  };

  const loadData = () => {
    setRoomTypes(db.getRoomTypes());
    // Get reservations for current user
    const userRes = db.getReservations().filter(
      r => r.user_id === user?.id || r.customer_email === user?.email || r.user_id === 'usr_customer_demo'
    );
    setReservations(userRes);

    // Get active stay
    const userStay = db.getActiveStays().find(
      s => (s.user_id === user?.id || s.guest_name === user?.full_name || s.user_id === 'usr_guest_arrived') && s.status === 'active'
    );
    setActiveStay(userStay);

    // Get service requests
    const userReqs = db.getServiceRequests();
    setServiceRequests(userReqs);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return unsub;
  }, [user]);

  const handleBookingSuccess = (bookingRef: string) => {
    setBookingSuccessRef(bookingRef);
    setActiveTab('overview');
  };

  const handleCreateServiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) return;

    const roomNum = activeStay ? activeStay.room_number : 'Resort Suite';
    db.createServiceRequest({
      userId: user?.id || 'guest_user',
      roomNumber: roomNum,
      category: newServiceCategory,
      title: newServiceTitle,
      details: newServiceDetails,
      priority: newServicePriority,
    });

    setNewServiceTitle('');
    setNewServiceDetails('');
    setServiceSubmittedMessage(true);
    setTimeout(() => setServiceSubmittedMessage(false), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Subnav Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Guest Dashboard
              </button>
              <button
                onClick={() => setActiveTab('accommodations')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'accommodations'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Browse & Reserve
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Resort Services
              </button>
              <button
                onClick={() => setActiveTab('ai_concierge')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ai_concierge'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Guest AI</span>
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'feedback'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Feedback
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Guest Profile
              </button>
            </div>

            <button
              onClick={() => setActiveTab('accommodations')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Book New Stay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Booking Success Banner */}
        {bookingSuccessRef && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-200">Reservation Confirmed!</h4>
                <p className="text-xs text-emerald-400/80">
                  Your reference is <span className="font-mono font-bold text-emerald-300">{bookingSuccessRef}</span>. A copy is saved in the database.
                </p>
              </div>
            </div>
            <button
              onClick={() => setBookingSuccessRef(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 px-3 py-1 rounded-lg hover:bg-emerald-900/40"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Active Stay Card (if checked in) */}
            {activeStay ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-800/40 p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold tracking-wider uppercase">
                      <Key className="w-4 h-4" />
                      <span>Active Stay in Residence</span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      Welcome to Room {activeStay.room_number}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                      Registered guest: {activeStay.guest_name} · Expected departure: <span className="font-mono text-slate-200">{activeStay.expected_check_out}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
                      <span className="font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-cyan-300">
                        Digital Key: {activeStay.keycard_code}
                      </span>
                      <span className="text-slate-400">
                        Check-in: {new Date(activeStay.check_in_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setActiveTab('services')}
                      className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ConciergeBell className="w-4 h-4" />
                      <span>Request In-Room Service</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Upcoming & Past Reservations Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">Your Reservations</h3>
                  <p className="text-xs text-slate-400">All stays booked directly with Nivora Resort</p>
                </div>
                <button
                  onClick={() => setActiveTab('accommodations')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Browse all suites →
                </button>
              </div>

              {reservations.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
                  <Bed className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm text-slate-300 font-medium">No reservations recorded yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Select one of our luxury suites or beachfront pavilions to start planning your stay.
                  </p>
                  <button
                    onClick={() => setActiveTab('accommodations')}
                    className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Explore Accommodations
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {reservations.map((res) => {
                    const roomType = roomTypes.find(rt => rt.id === res.room_type_id);
                    const isUpcoming = res.status === 'confirmed';
                    const isCurrent = res.status === 'checked_in';

                    return (
                      <div
                        key={res.id}
                        className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col shadow-lg"
                      >
                        {roomType && (
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={roomType.image_url}
                              alt={roomType.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                            <div className="absolute top-3 left-3 text-[11px] font-mono bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-cyan-300 border border-slate-800">
                              {res.booking_reference}
                            </div>
                            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-xs">
                              <span className="text-white font-serif font-bold truncate">{roomType.name}</span>
                            </div>
                          </div>
                        )}

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Dates:</span>
                              <span className="font-mono text-slate-200">
                                {res.check_in_date} → {res.check_out_date}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Party:</span>
                              <span className="text-slate-200">{res.num_guests} {res.num_guests === 1 ? 'Guest' : 'Guests'}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Status:</span>
                              <span className={`capitalize font-medium ${
                                isCurrent ? 'text-cyan-400' : isUpcoming ? 'text-emerald-400' : 'text-slate-400'
                              }`}>
                                {res.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800">
                              <span>Total Paid:</span>
                              <span className="font-mono text-sm font-semibold text-white tabular-nums">
                                {(res.total_price_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                              </span>
                            </div>
                          </div>

                          {res.special_requests && (
                            <div className="p-2.5 bg-slate-950 rounded-lg text-[11px] text-slate-400 border border-slate-800/80">
                              <p className="font-medium text-slate-300 mb-0.5">Special Requests:</p>
                              <p className="line-clamp-2">{res.special_requests}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Service Requests Tracker */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">Active Service Requests</h3>
                  <p className="text-xs text-slate-400">Real-time status of housekeeping, room service, and concierge</p>
                </div>
                <button
                  onClick={() => setActiveTab('services')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  New request →
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="divide-y divide-slate-800">
                  {serviceRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No active guest service requests.
                    </div>
                  ) : (
                    serviceRequests.slice(0, 4).map((req) => (
                      <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-white capitalize">{req.category.replace('_', ' ')}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400">Room {req.room_number}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-slate-300">{req.title}</p>
                          {req.details && <p className="text-[11px] text-slate-500 line-clamp-1">{req.details}</p>}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[11px] font-medium capitalize px-2 py-0.5 rounded ${
                            req.status === 'completed'
                              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                              : req.status === 'in_progress'
                              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-800/40'
                              : 'text-amber-300 bg-amber-950/40 border border-amber-800/40'
                          }`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ACCOMMODATIONS TAB (Browse & Book) */}
        {activeTab === 'accommodations' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Sanctuaries & Residences</span>
              <h2 className="font-serif text-3xl font-bold text-white mt-1">Accommodations</h2>
              <p className="text-xs text-slate-400 max-w-2xl mt-1">
                Every suite and pavilion at Nivora is architected with indigenous stone, sustainable hardwood, floor-to-ceiling panoramic glass, and secluded water features.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {roomTypes.map((rt) => {
                const availability = db.checkAvailability(rt.id, new Date().toISOString().split('T')[0], new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
                const nightlyRate = (rt.base_price_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

                return (
                  <div
                    key={rt.id}
                    className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col shadow-xl group hover:border-slate-700 transition-colors"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={rt.image_url}
                        alt={rt.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      
                      <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-white">
                        <span className="font-mono font-bold text-cyan-400 tabular-nums text-sm">{nightlyRate}</span>
                        <span className="text-slate-400 text-[10px]"> / night</span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">{rt.category}</span>
                        <h3 className="font-serif text-xl font-bold text-white leading-tight">{rt.name}</h3>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <p className="text-xs text-slate-300 leading-relaxed">{rt.description}</p>

                        {/* Room Specifications */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 py-2 border-y border-slate-800">
                          <span>{rt.bed_type}</span>
                          <span>·</span>
                          <span>Up to {rt.max_occupancy} Guests</span>
                          <span>·</span>
                          <span>{rt.size_sqm} m² ({(rt.size_sqm * 10.764).toFixed(0)} sq ft)</span>
                        </div>

                        {/* Amenities */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Curated Amenities</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                            {rt.amenities.map((amenity, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span className="truncate">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-xs">
                          <span className={availability.available ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                            {availability.available ? `● ${availability.availableRoomCount} suites vacant` : '● Fully booked'}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedRoomType(rt)}
                          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-md shadow-cyan-950/60 cursor-pointer"
                        >
                          Select & Reserve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. RESORT SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Personalized Hospitality</span>
              <h2 className="font-serif text-3xl font-bold text-white mt-1">Guest Services & In-Suite Dining</h2>
              <p className="text-xs text-slate-400 max-w-2xl mt-1">
                Submit requests directly to our 24/7 staff operations dispatch. Housekeeping, sommeliers, maintenance, and private experiences.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Submission Form */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <h3 className="font-serif text-lg font-bold text-white">Create Service Request</h3>

                {serviceSubmittedMessage && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Request submitted to hotel staff dispatch!</span>
                  </div>
                )}

                <form onSubmit={handleCreateServiceRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Service Department</label>
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="room_service">In-Suite Dining & Bar</option>
                      <option value="housekeeping">Housekeeping & Linens</option>
                      <option value="concierge">Concierge & Island Excursions</option>
                      <option value="maintenance">Maintenance & Comfort</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Request Title</label>
                    <input
                      type="text"
                      value={newServiceTitle}
                      onChange={(e) => setNewServiceTitle(e.target.value)}
                      placeholder="e.g. Afternoon Moroccan Mint Tea"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Specific Instructions / Timing</label>
                    <textarea
                      value={newServiceDetails}
                      onChange={(e) => setNewServiceDetails(e.target.value)}
                      rows={3}
                      placeholder="Please deliver to balcony table at 4:30 PM..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Urgency Level</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['low', 'medium', 'high', 'urgent'] as ServiceRequest['priority'][]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewServicePriority(p)}
                          className={`py-1.5 text-[11px] rounded capitalize transition-colors ${
                            newServicePriority === p
                              ? 'bg-cyan-500 text-slate-950 font-semibold'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request to Staff</span>
                  </button>
                </form>
              </div>

              {/* Service Requests Log */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-serif text-lg font-bold text-white">Service History & Live Tracking</h3>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 shadow-xl">
                  {serviceRequests.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500">
                      No service requests created yet.
                    </div>
                  ) : (
                    serviceRequests.map((req) => (
                      <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-white capitalize">{req.category.replace('_', ' ')}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400">Room {req.room_number}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400">{new Date(req.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-200">{req.title}</p>
                          {req.details && <p className="text-xs text-slate-400">{req.details}</p>}
                          {req.assigned_to_name && (
                            <p className="text-[11px] text-cyan-400/80">Assigned: {req.assigned_to_name}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded font-medium capitalize ${
                            req.status === 'completed'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : req.status === 'in_progress'
                              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          }`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. GUEST PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Guest Registry</span>
              <h2 className="font-serif text-3xl font-bold text-white mt-1">Profile & Preferences</h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage your stay preferences to ensure our butler, housekeeping, and concierge tailor your experience.
              </p>
            </div>

            {profileSaved && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Guest preferences updated and saved to your profile!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Primary Email</label>
                  <input
                    type="email"
                    value={user?.email || 'sophia.laurent@example.com'}
                    disabled
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Personalized Stay Preferences</h4>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Pillow & Bedding Preference</label>
                  <input
                    type="text"
                    value={profilePillows}
                    onChange={(e) => setProfilePillows(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Floor & Orientation Preference</label>
                  <input
                    type="text"
                    value={profileFloor}
                    onChange={(e) => setProfileFloor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Dietary & Beverage In-Room Notes</label>
                  <textarea
                    value={profileDiet}
                    onChange={(e) => setProfileDiet(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Save Profile Preferences
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. GUEST ASSISTANCE AI TAB */}
        {activeTab === 'ai_concierge' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">24/7 Intelligence</span>
              <h2 className="font-serif text-3xl font-bold text-white mt-1">Nivora Guest Concierge AI</h2>
              <p className="text-xs text-slate-400 mt-1">
                Grounded in official resort policies, suite specifications, dining menus, and personalized stay assistance.
              </p>
            </div>
            <HotelAIAssistant portalRole="customer" />
          </div>
        )}

        {/* 6. GUEST FEEDBACK & REVIEW TAB */}
        {activeTab === 'feedback' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Guest Voice</span>
              <h2 className="font-serif text-3xl font-bold text-white mt-1">Stay Feedback & Satisfaction</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your feedback directly influences our luxury operations, staff recognition, and culinary enhancements.
              </p>
            </div>

            {feedbackSubmitted && (
              <div className="p-4 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Thank you! Your feedback has been verified and recorded into hotel intelligence.</span>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <label className="block text-xs text-slate-300 mb-2">Overall Satisfaction Score</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackScore(star)}
                      className={`p-2 rounded-xl transition-colors ${
                        feedbackScore >= star
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-950 text-slate-600 border border-slate-800'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${feedbackScore >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-400 ml-2">
                    {feedbackScore} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Feedback Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Overall Experience">Overall Experience</option>
                  <option value="Culinary Excellence">Culinary Excellence</option>
                  <option value="Housekeeping Precision">Housekeeping Precision</option>
                  <option value="Staff Warmth">Staff Warmth & Butler Care</option>
                  <option value="Spa Serenity">Spa Serenity & Wellness</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Detailed Stay Comments</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Share highlights of your time with us, culinary favorites, or areas we could elevate..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Guest Return Intent</label>
                <select
                  value={returnIntent}
                  onChange={(e) => setReturnIntent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Definitely">Definitely (Will return next season)</option>
                  <option value="High">High (Very likely)</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Unlikely">Unlikely</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Submit Official Feedback
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedRoomType && (
        <BookRoomModal
          roomType={selectedRoomType}
          isOpen={true}
          onClose={() => setSelectedRoomType(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};
