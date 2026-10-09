import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/db';
import { Room, Reservation, ActiveStay, RoomType, AuditLog, PaymentRecord } from '../../lib/types';
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard';
import { HotelAIAssistant } from '../../components/ai/HotelAIAssistant';
import {
  Users,
  Building,
  KeyRound,
  LogOut,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  CreditCard,
  Bed,
  Sparkles,
  ClipboardList,
  Clock,
  ArrowRight,
  X,
  FileText,
  BarChart3,
  Bot,
} from 'lucide-react';

export const FrontDeskPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'stays' | 'rooms' | 'audit' | 'analytics' | 'ai'>('overview');

  const [stats, setStats] = useState(db.getFrontDeskStats());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeStays, setActiveStays] = useState<ActiveStay[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  // Check-In Modal State
  const [checkInReservation, setCheckInReservation] = useState<Reservation | null>(null);
  const [checkInRoomId, setCheckInRoomId] = useState<string>('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccessStay, setCheckInSuccessStay] = useState<ActiveStay | null>(null);

  // Check-Out Modal State
  const [checkoutStay, setCheckoutStay] = useState<ActiveStay | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentRecord['payment_method']>('card');
  const [checkoutIncidentalsCents, setCheckoutIncidentalsCents] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Manual Room Assignment Modal
  const [assigningReservation, setAssigningReservation] = useState<Reservation | null>(null);
  const [selectedAssignmentRoomId, setSelectedAssignmentRoomId] = useState<string>('');

  const loadData = () => {
    setStats(db.getFrontDeskStats());
    setRooms(db.getRooms());
    setRoomTypes(db.getRoomTypes());
    setReservations(db.getReservations());
    setActiveStays(db.getActiveStays());
    setAuditLogs(db.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return unsub;
  }, []);

  // --- ACTIONS ---

  const handleOpenCheckIn = (res: Reservation) => {
    setCheckInReservation(res);
    setCheckInError(null);
    setCheckInSuccessStay(null);

    // If room already assigned, check its validity
    if (res.assigned_room_id) {
      setCheckInRoomId(res.assigned_room_id);
    } else {
      // Find first available and clean room of this type
      const suitableRooms = rooms.filter(
        r => r.room_type_id === res.room_type_id &&
             r.occupancy_status === 'vacant' &&
             (r.operational_status === 'clean' || r.operational_status === 'inspected')
      );
      setCheckInRoomId(suitableRooms.length > 0 ? suitableRooms[0].id : '');
    }
  };

  const handleExecuteCheckIn = () => {
    if (!checkInReservation) return;
    if (!checkInRoomId) {
      setCheckInError('Please select a verified ready room for check-in.');
      return;
    }

    try {
      const stay = db.checkInGuest(checkInReservation.id, checkInRoomId, {
        id: user?.id || 'fd_agent',
        email: user?.email || 'frontdesk@nivoraresort.com',
        role: 'front_desk',
      });
      setCheckInSuccessStay(stay);
      setCheckInError(null);
    } catch (err: any) {
      setCheckInError(err.message || 'Check-in failed.');
    }
  };

  const handleOpenCheckout = (stay: ActiveStay) => {
    setCheckoutStay(stay);
    setCheckoutPaymentMethod('card');
    setCheckoutIncidentalsCents(0);
    setCheckoutNotes('');
    setCheckoutError(null);
    setCheckoutSuccessMessage(null);
  };

  const handleExecuteCheckout = () => {
    if (!checkoutStay) return;

    try {
      const reservation = reservations.find(r => r.id === checkoutStay.reservation_id);
      const totalBalance = (reservation?.total_price_cents || 0) + checkoutIncidentalsCents;

      db.checkOutGuest(
        checkoutStay.id,
        {
          method: checkoutPaymentMethod,
          amountCents: totalBalance,
        },
        {
          id: user?.id || 'fd_agent',
          email: user?.email || 'frontdesk@nivoraresort.com',
          role: 'front_desk',
        }
      );

      setCheckoutSuccessMessage(`Room ${checkoutStay.room_number} checked out successfully. Housekeeping turnover initiated.`);
      setTimeout(() => {
        setCheckoutStay(null);
        setCheckoutSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed.');
    }
  };

  const handleExecuteAssignment = () => {
    if (!assigningReservation || !selectedAssignmentRoomId) return;

    try {
      db.assignRoomToReservation(assigningReservation.id, selectedAssignmentRoomId, {
        id: user?.id || 'fd_agent',
        email: user?.email || 'frontdesk@nivoraresort.com',
        role: 'front_desk',
      });
      setAssigningReservation(null);
      setSelectedAssignmentRoomId('');
    } catch (err: any) {
      alert(err.message || 'Room assignment failed');
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.booking_reference.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.customer_email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor.toString() !== floorFilter) return false;
    return true;
  });

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
                Control Center
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'reservations'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Reservations ({reservations.length})
              </button>
              <button
                onClick={() => setActiveTab('stays')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'stays'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                In-House Stays ({activeStays.filter(s => s.status === 'active').length})
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'rooms'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Room Inventory ({rooms.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Audit Records ({auditLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Analytics (20.2k Records)</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Intelligence</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Front Desk System Online</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Strip (Phase 5 Dashboard Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Arrivals Today</p>
            <p className="font-mono text-xl font-bold text-cyan-400 mt-1 tabular-nums">{stats.todayArrivals}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Departures</p>
            <p className="font-mono text-xl font-bold text-amber-400 mt-1 tabular-nums">{stats.todayDepartures}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Occupancy</p>
            <p className="font-mono text-xl font-bold text-white mt-1 tabular-nums">{stats.occupancyRate}%</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Ready Vacant</p>
            <p className="font-mono text-xl font-bold text-emerald-400 mt-1 tabular-nums">{stats.availableRooms}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Occupied</p>
            <p className="font-mono text-xl font-bold text-cyan-300 mt-1 tabular-nums">{stats.occupiedRooms}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Housekeeping</p>
            <p className="font-mono text-xl font-bold text-rose-400 mt-1 tabular-nums">{stats.dirtyRooms}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Bookings</p>
            <p className="font-mono text-xl font-bold text-slate-300 mt-1 tabular-nums">{stats.pendingReservations}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
            <p className="text-[11px] text-slate-400 font-medium">Guest Orders</p>
            <p className="font-mono text-xl font-bold text-purple-400 mt-1 tabular-nums">{stats.openServiceRequests}</p>
          </div>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Expected Arrivals */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-serif text-lg font-bold text-white">Expected Guest Arrivals</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Today</span>
                </div>

                <div className="divide-y divide-slate-800">
                  {reservations.filter(r => r.status === 'confirmed').slice(0, 4).map((r) => {
                    const roomType = roomTypes.find(rt => rt.id === r.room_type_id);
                    const assignedRoom = rooms.find(rm => rm.id === r.assigned_room_id);

                    return (
                      <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-white">{r.customer_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {roomType?.name} · {r.booking_reference}
                          </p>
                          <p className="text-[10px] text-cyan-400">
                            {assignedRoom ? `Assigned: Room ${assignedRoom.room_number} (${assignedRoom.operational_status})` : 'No room assigned yet'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenCheckIn(r)}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Check In
                        </button>
                      </div>
                    );
                  })}
                  {reservations.filter(r => r.status === 'confirmed').length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-500">No pending arrivals today.</p>
                  )}
                </div>
              </div>

              {/* Active In-House Guests / Departures */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-amber-400" />
                    <h3 className="font-serif text-lg font-bold text-white">In-House Stays & Checkout</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Active Stays</span>
                </div>

                <div className="divide-y divide-slate-800">
                  {activeStays.filter(s => s.status === 'active').slice(0, 4).map((stay) => {
                    return (
                      <div key={stay.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-white">
                            Room {stay.room_number} · {stay.guest_name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Expected Departure: <span className="font-mono text-slate-300">{stay.expected_check_out}</span>
                          </p>
                          <p className="text-[10px] font-mono text-cyan-400">Key: {stay.keycard_code}</p>
                        </div>

                        <button
                          onClick={() => handleOpenCheckout(stay)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Checkout Guest
                        </button>
                      </div>
                    );
                  })}
                  {activeStays.filter(s => s.status === 'active').length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-500">No active in-house stays currently.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Room Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Live Room Status Grid</h3>
                  <p className="text-xs text-slate-400">Instant visual status of resort rooms and occupancy</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Ready</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-600" /> Occupied</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-600" /> Dirty</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-600" /> Cleaning</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {rooms.map((rm) => {
                  const isOccupied = rm.occupancy_status === 'occupied';
                  const isClean = rm.operational_status === 'clean' || rm.operational_status === 'inspected';
                  const isCleaning = rm.operational_status === 'cleaning_in_progress';
                  const isDirty = rm.operational_status === 'dirty';

                  let statusBg = 'bg-slate-800 border-slate-700';
                  if (isOccupied) statusBg = 'bg-cyan-950/40 border-cyan-700/60 text-cyan-200';
                  else if (isClean) statusBg = 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200';
                  else if (isCleaning) statusBg = 'bg-amber-950/40 border-amber-700/60 text-amber-200';
                  else if (isDirty) statusBg = 'bg-rose-950/40 border-rose-700/60 text-rose-200';

                  return (
                    <div
                      key={rm.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between h-24 ${statusBg}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-base">{rm.room_number}</span>
                        <span className="text-[10px] uppercase font-semibold">F{rm.floor}</span>
                      </div>
                      <div className="text-[10px]">
                        <p className="font-medium truncate capitalize">{isOccupied ? 'Occupied' : rm.operational_status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. RESERVATIONS MANAGEMENT TAB */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Central Reservations</h2>
                <p className="text-xs text-slate-400">Search, verify, assign rooms, and complete guest check-in</p>
              </div>

              {/* Search & Status Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ref, guest, email..."
                    className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Reference</th>
                      <th className="py-3 px-4 font-semibold">Guest</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Dates</th>
                      <th className="py-3 px-4 font-semibold">Room Assigned</th>
                      <th className="py-3 px-4 font-semibold">Total</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                          No reservations match the query.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((res) => {
                        const roomType = roomTypes.find(rt => rt.id === res.room_type_id);
                        const assignedRoom = rooms.find(rm => rm.id === res.assigned_room_id);

                        return (
                          <tr key={res.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                              {res.booking_reference}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-white">{res.customer_name}</p>
                              <p className="text-[11px] text-slate-400">{res.customer_email}</p>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-medium">
                              {roomType?.name || res.room_type_id}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                              {res.check_in_date} → {res.check_out_date}
                            </td>
                            <td className="py-3 px-4">
                              {assignedRoom ? (
                                <span className="font-mono text-slate-200">
                                  Room {assignedRoom.room_number} ({assignedRoom.operational_status})
                                </span>
                              ) : (
                                <button
                                  onClick={() => setAssigningReservation(res)}
                                  className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium underline"
                                >
                                  Assign Room
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums font-semibold text-white">
                              {(res.total_price_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                res.status === 'checked_in'
                                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                                  : res.status === 'confirmed'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                  : res.status === 'checked_out'
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-rose-950/60 text-rose-300'
                              }`}>
                                {res.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {res.status === 'confirmed' && (
                                <button
                                  onClick={() => handleOpenCheckIn(res)}
                                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-[11px] transition-colors"
                                >
                                  Check In
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. IN-HOUSE STAYS TAB */}
        {activeTab === 'stays' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Active In-House Stays</h2>
              <p className="text-xs text-slate-400">Real-time room occupancy, issued digital keycards, and checkout settlement</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Room</th>
                      <th className="py-3 px-4 font-semibold">Guest</th>
                      <th className="py-3 px-4 font-semibold">Keycard Code</th>
                      <th className="py-3 px-4 font-semibold">Check-in Time</th>
                      <th className="py-3 px-4 font-semibold">Expected Departure</th>
                      <th className="py-3 px-4 font-semibold">Stay Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activeStays.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                          No active stays recorded.
                        </td>
                      </tr>
                    ) : (
                      activeStays.map((stay) => (
                        <tr key={stay.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white text-base">
                            Room {stay.room_number}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {stay.guest_name}
                          </td>
                          <td className="py-3 px-4 font-mono text-cyan-400">
                            {stay.keycard_code}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(stay.check_in_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {stay.expected_check_out}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                              stay.status === 'active'
                                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {stay.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {stay.status === 'active' ? (
                              <button
                                onClick={() => handleOpenCheckout(stay)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded text-[11px] transition-colors"
                              >
                                Checkout Guest
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. ROOM INVENTORY MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Room Inventory & Housekeeping Status</h2>
                <p className="text-xs text-slate-400">Master inventory control: inspect cleanliness, manage out-of-service status</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Floor Filter:</span>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Floors</option>
                  <option value="1">1st Floor (Villas & Pavilions)</option>
                  <option value="2">2nd Floor (Deluxe Horizon)</option>
                  <option value="3">3rd Floor (Penthouse Suites)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRooms.map((rm) => {
                const rt = roomTypes.find(t => t.id === rm.room_type_id);
                return (
                  <div key={rm.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-bold text-white">Room {rm.room_number}</span>
                      <span className="text-xs text-slate-400">Floor {rm.floor}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-200">{rt?.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Rate: <span className="font-mono text-cyan-400 font-medium">${((rt?.base_price_cents || 0) / 100).toFixed(0)}</span> / night
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Occupancy:</span>
                      <span className={`capitalize font-medium ${rm.occupancy_status === 'occupied' ? 'text-cyan-400' : 'text-slate-300'}`}>
                        {rm.occupancy_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Housekeeping:</span>
                      <span className={`capitalize font-medium ${
                        rm.operational_status === 'clean' || rm.operational_status === 'inspected'
                          ? 'text-emerald-400'
                          : rm.operational_status === 'dirty'
                          ? 'text-rose-400'
                          : rm.operational_status === 'cleaning_in_progress'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}>
                        {rm.operational_status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {rm.notes && (
                      <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                        {rm.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      {rm.operational_status === 'clean' && (
                        <button
                          onClick={() => db.updateRoomStatus(rm.id, 'inspected', undefined, { id: user?.id || 'fd', email: user?.email || 'fd@nivora.com', role: 'front_desk' })}
                          className="px-2.5 py-1 bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 rounded text-[11px]"
                        >
                          Approve Inspection
                        </button>
                      )}
                      {rm.operational_status !== 'out_of_service' ? (
                        <button
                          onClick={() => db.updateRoomStatus(rm.id, 'out_of_service', 'Maintenance taken out of inventory', { id: user?.id || 'fd', email: user?.email || 'fd@nivora.com', role: 'front_desk' })}
                          className="px-2.5 py-1 text-rose-400 hover:bg-rose-950/40 rounded text-[11px]"
                        >
                          Set Out of Service
                        </button>
                      ) : (
                        <button
                          onClick={() => db.updateRoomStatus(rm.id, 'clean', 'Restored to inventory', { id: user?.id || 'fd', email: user?.email || 'fd@nivora.com', role: 'front_desk' })}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-semibold rounded text-[11px]"
                        >
                          Restore to Service
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. AUDIT RECORDS TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">System Audit & Ledger</h2>
              <p className="text-xs text-slate-400">Immutable operational log of check-ins, checkouts, payments, and room mutations</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 shadow-xl">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{log.action}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 font-medium">{log.entity_type}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{log.actor_email} ({log.actor_role})</span>
                    </div>
                    {log.details && (
                      <p className="font-mono text-[11px] text-slate-400">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>

                  <span className="text-slate-500 font-mono text-[11px] shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ANALYTICS & DATASET INTELLIGENCE TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Dataset Analytics & Financial Intelligence</h2>
                <p className="text-xs text-slate-400">Real-time dynamic synthesis of 20,200 transaction records across 49 columns</p>
              </div>
            </div>
            <AnalyticsDashboard />
          </div>
        )}

        {/* 7. HOTEL AI INTELLIGENCE TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Front Desk AI Copilot & Query Engine</h2>
              <p className="text-xs text-slate-400">Grounded intelligence powered by actual Nivora dataset metrics and resort knowledge bases</p>
            </div>
            <HotelAIAssistant portalRole="front_desk" />
          </div>
        )}
      </main>

      {/* Check-In Modal */}
      {checkInReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-semibold text-cyan-400 tracking-wider">Arrival Processing</span>
                <h3 className="font-serif text-lg font-bold text-white">Guest Check-In</h3>
              </div>
              <button onClick={() => setCheckInReservation(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkInError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{checkInError}</span>
              </div>
            )}

            {checkInSuccessStay ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/50 border border-emerald-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>Check-In Completed!</span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    Guest <strong className="text-white">{checkInSuccessStay.guest_name}</strong> is checked into <strong className="text-white">Room {checkInSuccessStay.room_number}</strong>.
                  </p>
                  <p className="text-xs font-mono text-cyan-300 pt-1">
                    Issued Keycard: <strong className="text-white">{checkInSuccessStay.keycard_code}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setCheckInReservation(null)}
                  className="w-full py-2 bg-cyan-500 text-slate-950 font-semibold rounded-xl text-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <p className="text-slate-300"><strong className="text-white">Guest:</strong> {checkInReservation.customer_name}</p>
                  <p className="text-slate-300"><strong className="text-white">Reference:</strong> {checkInReservation.booking_reference}</p>
                  <p className="text-slate-300"><strong className="text-white">Stay Dates:</strong> {checkInReservation.check_in_date} to {checkInReservation.check_out_date}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assign Ready Room (Must be Clean & Vacant)
                  </label>
                  <select
                    value={checkInRoomId}
                    onChange={(e) => setCheckInRoomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Select Room --</option>
                    {rooms
                      .filter(r => r.room_type_id === checkInReservation.room_type_id)
                      .map((r) => {
                        const isReady = r.occupancy_status === 'vacant' && (r.operational_status === 'clean' || r.operational_status === 'inspected');
                        return (
                          <option key={r.id} value={r.id} disabled={!isReady}>
                            Room {r.room_number} (Floor {r.floor}) - {r.operational_status.toUpperCase()} [{r.occupancy_status}] {!isReady ? '(NOT READY)' : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setCheckInReservation(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteCheckIn}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Verify & Check In Guest
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal with Folio & Payment Settlement */}
      {checkoutStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">Departure Settlement</span>
                <h3 className="font-serif text-lg font-bold text-white">Guest Checkout & Folio</h3>
              </div>
              <button onClick={() => setCheckoutStay(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {checkoutError}
              </div>
            )}

            {checkoutSuccessMessage ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs space-y-2">
                <p className="font-semibold text-emerald-200">Departure Complete!</p>
                <p>{checkoutSuccessMessage}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <p className="text-slate-300"><strong className="text-white">Room:</strong> {checkoutStay.room_number}</p>
                  <p className="text-slate-300"><strong className="text-white">Guest:</strong> {checkoutStay.guest_name}</p>
                  <p className="text-slate-300"><strong className="text-white">Check-in:</strong> {new Date(checkoutStay.check_in_time).toLocaleDateString()}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Additional Incidentals / Room Service Balance ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={checkoutIncidentalsCents / 100}
                    onChange={(e) => setCheckoutIncidentalsCents(Math.max(0, Math.round(Number(e.target.value) * 100)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Settlement Payment Method</label>
                  <select
                    value={checkoutPaymentMethod}
                    onChange={(e) => setCheckoutPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="card">Verified Credit Card on File</option>
                    <option value="authorized_terminal">EMV Payment Terminal</option>
                    <option value="cash">Front Desk Cash Settlement</option>
                    <option value="folio_transfer">Corporate Direct Folio Billing</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                  <span className="text-slate-400">Operational Consequence:</span>
                  <span className="text-rose-400 font-semibold">Vacates Room & Creates Turnover Task</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setCheckoutStay(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteCheckout}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Settle Folio & Complete Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Room Assignment Modal */}
      {assigningReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white">Assign Physical Room</h3>
            <p className="text-xs text-slate-400">
              Assign a room for booking <span className="font-mono text-cyan-400">{assigningReservation.booking_reference}</span> ({assigningReservation.customer_name}).
            </p>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Select Available Room</label>
              <select
                value={selectedAssignmentRoomId}
                onChange={(e) => setSelectedAssignmentRoomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Choose Room --</option>
                {rooms
                  .filter(r => r.room_type_id === assigningReservation.room_type_id && r.occupancy_status === 'vacant')
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} (Floor {r.floor}) - {r.operational_status}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAssigningReservation(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAssignment}
                disabled={!selectedAssignmentRoomId}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Confirm Room Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
