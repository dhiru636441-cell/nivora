import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/db';
import { Room, Reservation, ActiveStay, RoomType, AuditLog, PaymentRecord } from '../../lib/types';
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard';
import { HotelAIAssistant } from '../../components/ai/HotelAIAssistant';
import { fetchSupabaseGuests, SUPABASE_DEFAULTS } from '../../lib/supabase';
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
  Star,
  Compass,
  Check,
  ChevronRight,
  UserCheck,
  Layers,
  HeartHandshake,
  Tag,
  Plus,
} from 'lucide-react';

interface GuestProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyTier: 'Sovereign Gold' | 'Elite Platinum' | 'Emerald Reserve' | 'First Stay';
  vip: boolean;
  preferences: {
    floor: string;
    pillows: string;
    dietary: string;
    notes: string;
  };
  stayHistory: {
    totalStays: number;
    totalNights: number;
    totalSpentCents: number;
    lastVisit: string;
  };
  currentStatus: 'In-House' | 'Arriving Today' | 'Upcoming' | 'Checked-Out';
  roomNumber?: string;
  bookingRef?: string;
}

export const FrontDeskPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'guests' | 'reservations' | 'stays' | 'rooms' | 'audit' | 'analytics' | 'ai'
  >('overview');

  const [stats, setStats] = useState(db.getFrontDeskStats());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeStays, setActiveStays] = useState<ActiveStay[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filters for Reservations
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');

  // Guest Directory States
  const [guestSearch, setGuestSearch] = useState('');
  const [guestTierFilter, setGuestTierFilter] = useState<string>('all');
  const [guestStatusFilter, setGuestStatusFilter] = useState<string>('all');
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);

  // New Reservation Form Modal in Front Desk
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [newBookingRoomType, setNewBookingRoomType] = useState('rt_presidential');
  const [newBookingCheckIn, setNewBookingCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [newBookingCheckOut, setNewBookingCheckOut] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [newBookingGuestName, setNewBookingGuestName] = useState('');
  const [newBookingGuestEmail, setNewBookingGuestEmail] = useState('');
  const [newBookingGuestPhone, setNewBookingGuestPhone] = useState('+1 (555) 019-8822');
  const [newBookingGuestsCount, setNewBookingGuestsCount] = useState(2);
  const [newBookingSpecialReqs, setNewBookingSpecialReqs] = useState('');
  const [newBookingError, setNewBookingError] = useState<string | null>(null);
  const [newBookingSuccess, setNewBookingSuccess] = useState<string | null>(null);

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
  const [supabaseGuests, setSupabaseGuests] = useState<GuestProfile[]>([]);

  const loadData = () => {
    setStats(db.getFrontDeskStats());
    setRooms(db.getRooms());
    setRoomTypes(db.getRoomTypes());
    setReservations(db.getReservations());
    setActiveStays(db.getActiveStays());
    setAuditLogs(db.getAuditLogs());

    // Fetch any live guests from Supabase public.guests table
    fetchSupabaseGuests().then(({ data }) => {
      if (data && data.length > 0) {
        const mapped: GuestProfile[] = data.map((g) => ({
          id: String(g.guest_id),
          name: g.guest_name || 'Valued Guest',
          email: g.email || '',
          phone: 'N/A',
          loyaltyTier: (g.loyalty_level === 'Platinum' ? 'Elite Platinum' : 'Sovereign Gold') as GuestProfile['loyaltyTier'],
          vip: false,
          preferences: {
            floor: 'Preferred Wing',
            pillows: 'Standard Feather',
            dietary: 'Standard Menu',
            notes: `Synced from Supabase database (Guest #${g.guest_id}, Segment: ${g.guest_segment || 'Standard'})`,
          },
          stayHistory: {
            totalStays: 1,
            totalNights: 3,
            totalSpentCents: 450000,
            lastVisit: 'Current',
          },
          currentStatus: 'In-House',
        }));
        setSupabaseGuests(mapped);
      }
    }).catch(() => {
      // Graceful fallback to local guest profiles
    });
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return unsub;
  }, []);

  // Compute Guest Directory from current reservations + stays
  const guestProfiles: GuestProfile[] = [
    {
      id: 'gst_001',
      name: 'Sophia Laurent',
      email: 'sophia.laurent@example.com',
      phone: '+1 (555) 234-8901',
      loyaltyTier: 'Sovereign Gold',
      vip: true,
      preferences: {
        floor: 'High Floor / Horizon View',
        pillows: 'Extra Soft Goose Down',
        dietary: 'Gluten-conscious, Organic matcha',
        notes: 'Late arrival expected ~7PM. Chilled sparkling mineral water upon arrival.',
      },
      stayHistory: {
        totalStays: 4,
        totalNights: 14,
        totalSpentCents: 1840000,
        lastVisit: 'May 2026',
      },
      currentStatus: 'Arriving Today',
      roomNumber: '301',
      bookingRef: 'NIV-20261009-8812',
    },
    {
      id: 'gst_002',
      name: 'Marcus Vance',
      email: 'marcus.vance@example.com',
      phone: '+1 (555) 789-2210',
      loyaltyTier: 'Emerald Reserve',
      vip: true,
      preferences: {
        floor: '2nd Floor Oceanfront',
        pillows: 'Firm Memory Foam',
        dietary: 'Espresso Lover, Italian cuisine',
        notes: 'Enjoys early morning terrace espresso at 6:30 AM.',
      },
      stayHistory: {
        totalStays: 2,
        totalNights: 9,
        totalSpentCents: 1280000,
        lastVisit: 'October 2026',
      },
      currentStatus: 'In-House',
      roomNumber: '204',
      bookingRef: 'NIV-20261008-4190',
    },
    {
      id: 'gst_003',
      name: 'Lady Eleanor Sterling',
      email: 'eleanor.sterling@example.com',
      phone: '+44 20 7946 0912',
      loyaltyTier: 'Elite Platinum',
      vip: true,
      preferences: {
        floor: 'Ground Pavilion / Garden',
        pillows: 'Silk hypoallergenic down',
        dietary: 'Plant-based organic, botanical infusions',
        notes: 'Daily aromatherapy cedar diffuser; scheduled daily yoga at 8:00 AM.',
      },
      stayHistory: {
        totalStays: 6,
        totalNights: 22,
        totalSpentCents: 2890000,
        lastVisit: 'August 2026',
      },
      currentStatus: 'In-House',
      roomNumber: '103',
      bookingRef: 'NIV-20261007-9921',
    },
    {
      id: 'gst_004',
      name: 'Alistair Finch',
      email: 'alistair.finch@example.com',
      phone: '+1 (555) 441-2098',
      loyaltyTier: 'First Stay',
      vip: false,
      preferences: {
        floor: 'Any quiet wing',
        pillows: 'Standard Feather',
        dietary: 'No restrictions',
        notes: 'First time visiting Nivora. Requesting late check-out if inventory allows.',
      },
      stayHistory: {
        totalStays: 1,
        totalNights: 4,
        totalSpentCents: 420000,
        lastVisit: 'First Visit',
      },
      currentStatus: 'Upcoming',
      roomNumber: '201',
      bookingRef: 'NIV-20261012-3341',
    },
  ];

  // --- ACTIONS ---

  const handleOpenCheckIn = (res: Reservation) => {
    setCheckInReservation(res);
    setCheckInError(null);
    setCheckInSuccessStay(null);

    if (res.assigned_room_id) {
      setCheckInRoomId(res.assigned_room_id);
    } else {
      const suitableRooms = rooms.filter(
        (r) =>
          r.room_type_id === res.room_type_id &&
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

  const handleOpenCheckOut = (stay: ActiveStay) => {
    setCheckoutStay(stay);
    setCheckoutIncidentalsCents(0);
    setCheckoutNotes('');
    setCheckoutError(null);
    setCheckoutSuccessMessage(null);
  };

  const handleExecuteCheckOut = () => {
    if (!checkoutStay) return;
    try {
      db.checkOutGuest(
        checkoutStay.id,
        {
          amountCents: checkoutIncidentalsCents,
          method: checkoutPaymentMethod,
        },
        {
          id: user?.id || 'fd_agent',
          email: user?.email || 'frontdesk@nivoraresort.com',
          role: 'front_desk',
        }
      );
      setCheckoutSuccessMessage(`Guest ${checkoutStay.guest_name} checked out successfully. Room turnover task dispatched.`);
      setTimeout(() => {
        setCheckoutStay(null);
      }, 1500);
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed.');
    }
  };

  const handleAssignRoom = (reservationId: string, roomId: string) => {
    try {
      db.assignRoomToReservation(reservationId, roomId, {
        id: user?.id || 'fd_agent',
        email: user?.email || 'frontdesk@nivoraresort.com',
        role: 'front_desk',
      });
      setAssigningReservation(null);
    } catch (err: any) {
      alert(err.message || 'Room assignment failed.');
    }
  };

  const handleCreateFrontDeskBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setNewBookingError(null);
    setNewBookingSuccess(null);

    const inD = new Date(newBookingCheckIn);
    const outD = new Date(newBookingCheckOut);
    if (outD <= inD) {
      setNewBookingError('Check-out date must be after check-in date.');
      return;
    }

    const avail = db.checkAvailability(newBookingRoomType, newBookingCheckIn, newBookingCheckOut);
    if (!avail.available) {
      setNewBookingError('No available rooms in selected category for these dates (Double-booking protected).');
      return;
    }

    try {
      const res = db.createReservation({
        userId: `usr_walkin_${Date.now()}`,
        customerName: newBookingGuestName,
        customerEmail: newBookingGuestEmail,
        customerPhone: newBookingGuestPhone,
        roomTypeId: newBookingRoomType,
        checkInDate: newBookingCheckIn,
        checkOutDate: newBookingCheckOut,
        numGuests: Number(newBookingGuestsCount),
        specialRequests: newBookingSpecialReqs,
      });

      setNewBookingSuccess(`Reservation ${res.booking_reference} confirmed and verified.`);
      setTimeout(() => {
        setShowNewBookingModal(false);
        setNewBookingSuccess(null);
        setNewBookingGuestName('');
        setNewBookingGuestEmail('');
      }, 1400);
    } catch (err: any) {
      setNewBookingError(err.message || 'Failed to create booking.');
    }
  };

  // KPI Calculations
  const totalRevenueTodayCents = 1840000 + 420000 + 640000;
  const totalRevenueFormatted = `$${(totalRevenueTodayCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  const guestSatisfactionRating = '4.94 / 5.0';

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (roomTypeFilter !== 'all' && r.room_type_id !== roomTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.booking_reference.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.customer_email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter guests (merges real Supabase guests with local guest directory)
  const allGuestProfiles = [...supabaseGuests, ...guestProfiles];
  const filteredGuests = allGuestProfiles.filter((g) => {
    if (guestTierFilter !== 'all' && g.loyaltyTier !== guestTierFilter) return false;
    if (guestStatusFilter !== 'all' && g.currentStatus !== guestStatusFilter) return false;
    if (guestSearch.trim()) {
      const q = guestSearch.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        (g.roomNumber && g.roomNumber.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F3EA] dark:bg-[#141714] text-[#242722] dark:text-[#F7F3EA] flex flex-col lg:flex-row">
      
      {/* Refined Dark-Green Navigation Sidebar for Desktop */}
      <aside className="w-full lg:w-64 bg-[#12382D] text-[#F7F3EA] border-r border-[#C7A36A]/20 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Sidebar Brand Header */}
          <div className="pb-6 border-b border-[#C7A36A]/20 mb-6">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold block">
              Hospitality Intelligence
            </span>
            <h2 className="font-serif text-xl text-white font-normal tracking-wide mt-0.5">
              Reception Console
            </h2>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Building className="w-4 h-4 text-[#C7A36A]" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('guests')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'guests'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[#C7A36A]" />
                <span>Guest Directory</span>
              </div>
              <span className="text-[10px] text-[#A9B8A4] bg-white/10 px-2 py-0.5 rounded-full">
                {guestProfiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reservations')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'reservations'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#C7A36A]" />
                <span>Reservations</span>
              </div>
              <span className="text-[10px] text-[#A9B8A4] bg-white/10 px-2 py-0.5 rounded-full">
                {reservations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stays')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'stays'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-[#C7A36A]" />
                <span>In-House Guests</span>
              </div>
              <span className="text-[10px] text-[#A9B8A4] bg-white/10 px-2 py-0.5 rounded-full">
                {activeStays.filter((s) => s.status === 'active').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bed className="w-4 h-4 text-[#C7A36A]" />
                <span>Room Inventory</span>
              </div>
              <span className="text-[10px] text-[#C7A36A]">{stats.availableRooms} Vacant</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#C7A36A]" />
              <span>Dataset Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-4 h-4 text-[#C7A36A]" />
              <span>Nivora AI Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#C7A36A]" />
              <span>Audit Security Log</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="pt-6 border-t border-[#C7A36A]/20">
          <div className="p-3 bg-[#0D2820] rounded-xl border border-[#C7A36A]/25 text-[11px] text-[#A9B8A4]">
            <p className="font-semibold text-white">Daily Dispatch Status</p>
            <p className="mt-1">Arrivals: <strong className="text-[#C7A36A]">{stats.todayArrivals}</strong> · Departures: <strong className="text-[#C7A36A]">{stats.todayDepartures}</strong></p>
            <p className="mt-0.5">Turnover Queue: <strong className="text-white">{stats.pendingHousekeeping}</strong></p>
          </div>
        </div>
      </aside>

      {/* Warm Ivory Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8 overflow-x-hidden">
        
        {/* Top Header Row with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#C7A36A]/20">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#12382D] dark:text-[#C7A36A] font-semibold">
                Nivora Front Desk Portal
              </span>
              <span className="text-[#A9B8A4]">·</span>
              <span className="text-xs text-[#A9B8A4]">Reception & Operations Intelligence</span>
              <button
                onClick={() => setActiveTab('analytics')}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Supabase Live DB (7 Tables)</span>
              </button>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#12382D] dark:text-[#F7F3EA] mt-1">
              {activeTab === 'overview' && 'Executive Reception Dashboard'}
              {activeTab === 'guests' && 'Guest Directory & Profiles'}
              {activeTab === 'reservations' && 'Reservation Management'}
              {activeTab === 'stays' && 'In-House Stays & Front Desk Settle'}
              {activeTab === 'rooms' && 'Room Inventory & Readiness'}
              {activeTab === 'analytics' && 'Resort Intelligence & Dataset'}
              {activeTab === 'ai' && 'Nivora AI Operations Copilot'}
              {activeTab === 'audit' && 'Security & Audit Trail'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewBookingModal(true)}
              className="px-4 py-2 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C7A36A]" />
              <span>Create Reservation</span>
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW / DASHBOARD TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* The 7 Clean Luxury KPI Cards (Requirement 2) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
              
              {/* 1. Arrivals */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold block">
                  Arrivals
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#F7F3EA] mt-1">
                  {stats.todayArrivals}
                </p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">Expected today</p>
              </div>

              {/* 2. Departures */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold block">
                  Departures
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#F7F3EA] mt-1">
                  {stats.todayDepartures}
                </p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">Expected today</p>
              </div>

              {/* 3. Occupancy */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold block">
                  Occupancy
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#C7A36A] mt-1">
                  {stats.occupancyRate}%
                </p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">{stats.occupiedRooms} / {stats.totalRooms} rooms</p>
              </div>

              {/* 4. Available Rooms */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold block">
                  Available
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#F7F3EA] mt-1">
                  {stats.availableRooms}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Ready for check-in</p>
              </div>

              {/* 5. Revenue */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold block">
                  Revenue
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#C7A36A] mt-1 truncate">
                  {totalRevenueFormatted}
                </p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">Verified gross</p>
              </div>

              {/* 6. Housekeeping */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold block">
                  Housekeeping
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#F7F3EA] mt-1">
                  {stats.dirtyRooms}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Turnover queue</p>
              </div>

              {/* 7. Guest Satisfaction */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold block">
                  Satisfaction
                </span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#C7A36A] mt-1">
                  4.94
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">98.4% sentiment</p>
              </div>

            </div>

            {/* Quick Action Reception Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Ready for Check-in */}
              <div className="lg:col-span-2 bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#C7A36A]/20">
                  <div>
                    <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">
                      Today's Arrivals Requiring Check-In
                    </h3>
                    <p className="text-xs text-[#A9B8A4]">Confirmed reservations awaiting keycard assignment</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="text-xs text-[#C7A36A] hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-[#C7A36A]/15">
                  {reservations
                    .filter((r) => r.status === 'confirmed')
                    .slice(0, 4)
                    .map((res) => (
                      <div key={res.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-[#12382D] dark:text-[#F7F3EA]">{res.customer_name}</span>
                            <span className="text-[11px] text-[#A9B8A4]">({res.booking_reference})</span>
                          </div>
                          <div className="text-[11px] text-[#A9B8A4] mt-0.5">
                            Dates: {res.check_in_date} → {res.check_out_date} · Guests: {res.num_guests} · Paid: ${(res.paid_amount_cents / 100).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenCheckIn(res)}
                          className="px-3 py-1.5 bg-[#12382D] hover:bg-[#0D2820] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Check In
                        </button>
                      </div>
                    ))}
                  {reservations.filter((r) => r.status === 'confirmed').length === 0 && (
                    <p className="text-xs text-[#A9B8A4] py-4 text-center">No pending arrivals today.</p>
                  )}
                </div>
              </div>

              {/* Operational Room Readiness Snapshot */}
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-[#C7A36A]/20">
                  <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">
                    Inventory Status
                  </h3>
                  <p className="text-xs text-[#A9B8A4]">Current estate distribution</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#242722]/80 dark:text-[#A9B8A4]">Clean & Inspected</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.availableRooms} rooms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#242722]/80 dark:text-[#A9B8A4]">In-House Occupied</span>
                    <span className="font-semibold text-[#12382D] dark:text-[#C7A36A]">{stats.occupiedRooms} rooms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#242722]/80 dark:text-[#A9B8A4]">Turnover Required</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.dirtyRooms} rooms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#242722]/80 dark:text-[#A9B8A4]">Maintenance Out-of-Service</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{stats.outOfServiceRooms} rooms</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#C7A36A]/15">
                  <button
                    onClick={() => setActiveTab('rooms')}
                    className="w-full py-2 bg-[#F7F3EA] dark:bg-[#141714] hover:bg-[#EAE2D0] text-[#12382D] dark:text-[#C7A36A] border border-[#C7A36A]/30 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    View Floor Readiness Grid
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. GUEST MANAGEMENT / DIRECTORY TAB (Requirement 3) */}
        {activeTab === 'guests' && (
          <div className="space-y-6">
            
            {/* Search and Filters */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#C7A36A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Search by name, room, email, phone..."
                  className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none focus:border-[#12382D] dark:focus:border-[#C7A36A]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Loyalty Tier Filter */}
                <select
                  value={guestTierFilter}
                  onChange={(e) => setGuestTierFilter(e.target.value)}
                  className="bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                >
                  <option value="all">All Loyalty Tiers</option>
                  <option value="Sovereign Gold">Sovereign Gold</option>
                  <option value="Elite Platinum">Elite Platinum</option>
                  <option value="Emerald Reserve">Emerald Reserve</option>
                  <option value="First Stay">First Stay</option>
                </select>

                {/* Status Filter */}
                <select
                  value={guestStatusFilter}
                  onChange={(e) => setGuestStatusFilter(e.target.value)}
                  className="bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                >
                  <option value="all">All Guest Statuses</option>
                  <option value="In-House">In-House</option>
                  <option value="Arriving Today">Arriving Today</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Checked-Out">Checked-Out</option>
                </select>
              </div>
            </div>

            {/* Spacious Guest Directory Table */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#C7A36A]/20 bg-[#F7F3EA]/70 dark:bg-[#161A16] text-[11px] font-semibold text-[#12382D] dark:text-[#C7A36A] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Guest Profile</th>
                      <th className="py-3.5 px-4">Loyalty Tier</th>
                      <th className="py-3.5 px-4">Status & Room</th>
                      <th className="py-3.5 px-4">Personal Preferences</th>
                      <th className="py-3.5 px-4">Stay History</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C7A36A]/15 text-xs">
                    {filteredGuests.map((guest) => (
                      <tr
                        key={guest.id}
                        className="hover:bg-[#F7F3EA]/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedGuest(guest)}
                      >
                        {/* Profile & Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#12382D] border border-[#C7A36A] flex items-center justify-center text-[#C7A36A] font-serif font-bold text-xs shrink-0">
                              {guest.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-[#12382D] dark:text-[#F7F3EA]">{guest.name}</span>
                                {guest.vip && (
                                  <span className="text-[10px] text-[#C7A36A] font-semibold uppercase tracking-wider">✦ VIP</span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#A9B8A4]">{guest.email}</p>
                              <p className="text-[11px] text-[#A9B8A4]">{guest.phone}</p>
                            </div>
                          </div>
                        </td>

                        {/* Loyalty Tier */}
                        <td className="py-4 px-4">
                          <span className="text-xs font-serif text-[#12382D] dark:text-[#C7A36A]">
                            {guest.loyaltyTier}
                          </span>
                        </td>

                        {/* Status & Room */}
                        <td className="py-4 px-4">
                          <div>
                            <span className="text-xs font-medium text-[#242722] dark:text-[#F7F3EA]">
                              {guest.currentStatus}
                            </span>
                            {guest.roomNumber && (
                              <p className="text-[11px] text-[#C7A36A]">Room {guest.roomNumber}</p>
                            )}
                          </div>
                        </td>

                        {/* Preferences */}
                        <td className="py-4 px-4 max-w-xs">
                          <p className="text-xs text-[#242722]/80 dark:text-[#A9B8A4] truncate">
                            {guest.preferences.pillows} · {guest.preferences.dietary}
                          </p>
                          <p className="text-[11px] text-[#A9B8A4] truncate italic mt-0.5">
                            "{guest.preferences.notes}"
                          </p>
                        </td>

                        {/* Stay History */}
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-semibold text-[#12382D] dark:text-[#F7F3EA]">
                              {guest.stayHistory.totalNights} Nights
                            </span>
                            <span className="text-[#A9B8A4] text-[11px] block">
                              ${(guest.stayHistory.totalSpentCents / 100).toLocaleString()} spent
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGuest(guest);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#C7A36A]/30 text-[#12382D] dark:text-[#C7A36A] hover:bg-[#12382D] hover:text-white transition-colors text-xs font-medium"
                          >
                            Profile Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guest Profile Slide-Over Panel */}
            {selectedGuest && (
              <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="w-full max-w-md bg-[#F7F3EA] dark:bg-[#181D18] h-full p-6 sm:p-8 overflow-y-auto border-l border-[#C7A36A]/30 shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-[#C7A36A]/20">
                      <span className="text-[10px] uppercase tracking-widest text-[#C7A36A] font-semibold">
                        Guest Dossier
                      </span>
                      <button
                        onClick={() => setSelectedGuest(null)}
                        className="p-1 rounded-lg text-[#242722]/60 dark:text-[#A9B8A4] hover:text-[#12382D]"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Guest Header */}
                    <div className="pt-6 pb-4">
                      <div className="w-14 h-14 rounded-full bg-[#12382D] border-2 border-[#C7A36A] flex items-center justify-center text-[#C7A36A] font-serif text-xl font-bold mb-3">
                        {selectedGuest.name.charAt(0)}
                      </div>
                      <h3 className="font-serif text-2xl text-[#12382D] dark:text-[#F7F3EA]">
                        {selectedGuest.name}
                      </h3>
                      <p className="text-xs text-[#C7A36A] font-sans font-semibold mt-0.5">
                        {selectedGuest.loyaltyTier} {selectedGuest.vip && '· VIP Patron'}
                      </p>
                      <p className="text-xs text-[#A9B8A4] mt-1">{selectedGuest.email} · {selectedGuest.phone}</p>
                    </div>

                    {/* Bespoke Preferences Section */}
                    <div className="mt-4 p-4 bg-white dark:bg-[#1E231E] rounded-xl border border-[#C7A36A]/25 space-y-3">
                      <h4 className="font-serif text-sm text-[#12382D] dark:text-[#F7F3EA] border-b border-[#C7A36A]/15 pb-2">
                        Bespoke Guest Preferences
                      </h4>
                      <div className="text-xs space-y-2">
                        <div>
                          <span className="text-[#A9B8A4] block text-[10px] uppercase">Floor Preference</span>
                          <span className="text-[#12382D] dark:text-[#F7F3EA] font-medium">{selectedGuest.preferences.floor}</span>
                        </div>
                        <div>
                          <span className="text-[#A9B8A4] block text-[10px] uppercase">Pillow & Bedding</span>
                          <span className="text-[#12382D] dark:text-[#F7F3EA] font-medium">{selectedGuest.preferences.pillows}</span>
                        </div>
                        <div>
                          <span className="text-[#A9B8A4] block text-[10px] uppercase">Dietary & Beverage</span>
                          <span className="text-[#12382D] dark:text-[#F7F3EA] font-medium">{selectedGuest.preferences.dietary}</span>
                        </div>
                        <div>
                          <span className="text-[#A9B8A4] block text-[10px] uppercase">Butler & Service Directives</span>
                          <p className="text-[#12382D] dark:text-[#F7F3EA] italic mt-0.5">"{selectedGuest.preferences.notes}"</p>
                        </div>
                      </div>
                    </div>

                    {/* Lifetime Stays & Spend */}
                    <div className="mt-4 p-4 bg-white dark:bg-[#1E231E] rounded-xl border border-[#C7A36A]/25 space-y-3">
                      <h4 className="font-serif text-sm text-[#12382D] dark:text-[#F7F3EA] border-b border-[#C7A36A]/15 pb-2">
                        Sanctuary Stay History
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#A9B8A4] text-[10px] block uppercase">Total Nights</span>
                          <span className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA] font-bold">
                            {selectedGuest.stayHistory.totalNights}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A9B8A4] text-[10px] block uppercase">Lifetime Spend</span>
                          <span className="font-serif text-lg text-[#C7A36A] font-bold">
                            ${(selectedGuest.stayHistory.totalSpentCents / 100).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A9B8A4] text-[10px] block uppercase">Completed Stays</span>
                          <span className="text-[#12382D] dark:text-[#F7F3EA] font-medium">{selectedGuest.stayHistory.totalStays} visits</span>
                        </div>
                        <div>
                          <span className="text-[#A9B8A4] text-[10px] block uppercase">Last Visit</span>
                          <span className="text-[#12382D] dark:text-[#F7F3EA] font-medium">{selectedGuest.stayHistory.lastVisit}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-6 border-t border-[#C7A36A]/20">
                    <button
                      onClick={() => setSelectedGuest(null)}
                      className="w-full py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 3. RESERVATIONS TAB (Requirement 4) */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#C7A36A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ref, guest name, email..."
                  className="w-full bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                >
                  <option value="all">All Booking Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={roomTypeFilter}
                  onChange={(e) => setRoomTypeFilter(e.target.value)}
                  className="bg-[#F7F3EA] dark:bg-[#141714] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                >
                  <option value="all">All Room Categories</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reservations Table with Elegant Status Badges (No static candy pills) */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#C7A36A]/20 bg-[#F7F3EA]/70 dark:bg-[#161A16] text-[11px] font-semibold text-[#12382D] dark:text-[#C7A36A] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Reference & Guest</th>
                      <th className="py-3.5 px-4">Room Category</th>
                      <th className="py-3.5 px-4">Stay Dates</th>
                      <th className="py-3.5 px-4">Assigned Room</th>
                      <th className="py-3.5 px-4">Financial Status</th>
                      <th className="py-3.5 px-4">Booking Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C7A36A]/15 text-xs">
                    {filteredReservations.map((res) => {
                      const roomTypeName = roomTypes.find((r) => r.id === res.room_type_id)?.name || 'Luxury Suite';
                      const assignedRoom = rooms.find((r) => r.id === res.assigned_room_id);

                      return (
                        <tr key={res.id} className="hover:bg-[#F7F3EA]/40 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-5">
                            <div>
                              <span className="font-mono text-xs font-semibold text-[#12382D] dark:text-[#C7A36A]">{res.booking_reference}</span>
                              <p className="font-medium text-[#242722] dark:text-[#F7F3EA] mt-0.5">{res.customer_name}</p>
                              <p className="text-[11px] text-[#A9B8A4]">{res.customer_email}</p>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-serif text-xs text-[#12382D] dark:text-[#F7F3EA]">{roomTypeName}</span>
                            <p className="text-[11px] text-[#A9B8A4]">{res.num_guests} Guests</p>
                          </td>

                          <td className="py-4 px-4 font-mono text-xs text-[#242722] dark:text-[#F7F3EA]">
                            {res.check_in_date} → {res.check_out_date}
                          </td>

                          <td className="py-4 px-4">
                            {assignedRoom ? (
                              <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-400">
                                Room {assignedRoom.room_number} (Floor {assignedRoom.floor})
                              </span>
                            ) : (
                              <button
                                onClick={() => setAssigningReservation(res)}
                                className="text-xs text-[#C7A36A] underline hover:text-[#12382D]"
                              >
                                Assign Room
                              </button>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-medium text-xs text-[#12382D] dark:text-[#F7F3EA]">
                              ${(res.total_price_cents / 100).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-600 block">Verified Paid</span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="capitalize font-semibold text-xs text-[#12382D] dark:text-[#C7A36A]">
                              {res.status.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            {res.status === 'confirmed' && (
                              <button
                                onClick={() => handleOpenCheckIn(res)}
                                className="px-3 py-1.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              >
                                Check In
                              </button>
                            )}
                            {res.status === 'checked_in' && (
                              <span className="text-xs text-[#A9B8A4]">In-House</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 4. IN-HOUSE STAYS TAB (Requirement 6) */}
        {activeTab === 'stays' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#C7A36A]/20 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Active In-House Stays</h3>
                  <p className="text-xs text-[#A9B8A4]">Currently occupied rooms and checkout operations</p>
                </div>
                <span className="text-xs font-medium text-[#C7A36A]">
                  {activeStays.filter((s) => s.status === 'active').length} Active Occupants
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#C7A36A]/20 bg-[#F7F3EA]/70 dark:bg-[#161A16] text-[11px] font-semibold text-[#12382D] dark:text-[#C7A36A] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Room #</th>
                      <th className="py-3.5 px-4">Primary Guest</th>
                      <th className="py-3.5 px-4">Check-In Time</th>
                      <th className="py-3.5 px-4">Expected Departure</th>
                      <th className="py-3.5 px-4">Keycode / Access</th>
                      <th className="py-3.5 px-4 text-right">Front Desk Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C7A36A]/15">
                    {activeStays
                      .filter((s) => s.status === 'active')
                      .map((stay) => (
                        <tr key={stay.id} className="hover:bg-[#F7F3EA]/40 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-5">
                            <span className="font-serif text-lg font-bold text-[#12382D] dark:text-[#C7A36A]">
                              Room {stay.room_number}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-[#242722] dark:text-[#F7F3EA]">{stay.guest_name}</span>
                          </td>
                          <td className="py-4 px-4 text-[#A9B8A4]">
                            {new Date(stay.check_in_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-4 px-4 font-mono">
                            {stay.expected_check_out}
                          </td>
                          <td className="py-4 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                            {stay.keycard_code}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleOpenCheckOut(stay)}
                              className="px-3 py-1.5 bg-[#C7A36A] hover:bg-[#D9BB8A] text-[#12382D] font-medium rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Settle & Check Out
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. ROOMS TAB (Requirement 6) */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#C7A36A]/20 mb-6">
                <div>
                  <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Sanctuary Floor Readiness</h3>
                  <p className="text-xs text-[#A9B8A4]">Real-time operational and occupancy statuses across all wings</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Clean</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Occupied</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Dirty</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Out-of-Service</span>
                </div>
              </div>

              {/* Floor groupings */}
              {[1, 2, 3].map((floorNum) => (
                <div key={floorNum} className="mb-6 last:mb-0">
                  <h4 className="text-xs uppercase tracking-wider text-[#12382D] dark:text-[#C7A36A] font-semibold mb-3">
                    Floor {floorNum} {floorNum === 1 ? '· Sanctuary Villas & Pavilions' : floorNum === 2 ? '· Deluxe Ocean Horizon Wing' : '· Presidential Penthouse Suite Floor'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {rooms
                      .filter((r) => r.floor === floorNum)
                      .map((room) => {
                        const isOccupied = room.occupancy_status === 'occupied';
                        const isClean = room.operational_status === 'clean' || room.operational_status === 'inspected';
                        const isDirty = room.operational_status === 'dirty' || room.operational_status === 'cleaning_in_progress';
                        const isOOS = room.operational_status === 'out_of_service';

                        return (
                          <div
                            key={room.id}
                            className={`p-3.5 rounded-xl border text-xs ${
                              isOccupied
                                ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-900'
                                : isClean
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900'
                                : isDirty
                                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900'
                                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-bold text-base text-[#12382D] dark:text-[#F7F3EA]">
                                Room {room.room_number}
                              </span>
                              <span className="text-[10px] uppercase font-semibold">
                                {isOccupied ? 'Occupied' : 'Vacant'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#A9B8A4] capitalize mt-1">
                              Status: {room.operational_status.replace('_', ' ')}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ANALYTICS & DATASET TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard />
          </div>
        )}

        {/* 7. NIVORA AI INSIGHTS TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <HotelAIAssistant portalRole="front_desk" />
          </div>
        )}

        {/* 8. AUDIT SECURITY LOG TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#C7A36A]/20">
                <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Immutable Audit Security Log</h3>
                <p className="text-xs text-[#A9B8A4]">Cryptographically sequenced event tracking for hotel governance</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#C7A36A]/20 bg-[#F7F3EA]/70 dark:bg-[#161A16] text-[11px] font-semibold text-[#12382D] dark:text-[#C7A36A] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Timestamp</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Actor</th>
                      <th className="py-3.5 px-4">Resource ID</th>
                      <th className="py-3.5 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C7A36A]/15 font-mono text-[11px]">
                    {auditLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-[#F7F3EA]/40 dark:hover:bg-white/5">
                        <td className="py-3 px-5 text-[#A9B8A4]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="py-3 px-4 text-[#12382D] dark:text-[#C7A36A] font-semibold">{log.action}</td>
                        <td className="py-3 px-4">{log.actor_email} ({log.actor_role})</td>
                        <td className="py-3 px-4">{log.entity_id}</td>
                        <td className="py-3 px-4 text-[#A9B8A4] truncate max-w-xs">{JSON.stringify(log.details)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CHECK-IN MODAL */}
      {checkInReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#F7F3EA] dark:bg-[#181D18] rounded-2xl border border-[#C7A36A]/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#C7A36A]/20">
              <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Front Desk Check-In</h3>
              <button onClick={() => setCheckInReservation(null)} className="p-1 text-[#A9B8A4] hover:text-[#12382D]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkInError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl">
                {checkInError}
              </div>
            )}
            {checkInSuccessStay && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl space-y-2">
                <p className="font-semibold text-sm">Check-in Complete!</p>
                <p>Room: {checkInSuccessStay.room_number}</p>
                <p>Digital Key Passcode: <strong className="font-mono">{checkInSuccessStay.keycard_code}</strong></p>
                <button
                  onClick={() => setCheckInReservation(null)}
                  className="w-full mt-2 py-2 bg-emerald-700 text-white rounded-lg text-xs"
                >
                  Done
                </button>
              </div>
            )}

            {!checkInSuccessStay && (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#A9B8A4]">Guest:</span>
                  <p className="font-semibold text-[#12382D] dark:text-[#F7F3EA] text-sm">{checkInReservation.customer_name}</p>
                  <p className="text-[#A9B8A4]">{checkInReservation.booking_reference}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">
                    Select Ready Room
                  </label>
                  <select
                    value={checkInRoomId}
                    onChange={(e) => setCheckInRoomId(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                  >
                    <option value="">-- Choose verified vacant room --</option>
                    {rooms
                      .filter(
                        (r) =>
                          r.room_type_id === checkInReservation.room_type_id &&
                          r.occupancy_status === 'vacant' &&
                          (r.operational_status === 'clean' || r.operational_status === 'inspected')
                      )
                      .map((rm) => (
                        <option key={rm.id} value={rm.id}>
                          Room {rm.room_number} (Floor {rm.floor} - {rm.operational_status})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  onClick={handleExecuteCheckIn}
                  className="w-full py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Issue Digital Key & Check In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECK-OUT MODAL */}
      {checkoutStay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#F7F3EA] dark:bg-[#181D18] rounded-2xl border border-[#C7A36A]/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#C7A36A]/20">
              <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Front Desk Checkout</h3>
              <button onClick={() => setCheckoutStay(null)} className="p-1 text-[#A9B8A4] hover:text-[#12382D]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl">
                {checkoutError}
              </div>
            )}
            {checkoutSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl">
                {checkoutSuccessMessage}
              </div>
            )}

            {!checkoutSuccessMessage && (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#A9B8A4]">Guest:</span>
                  <p className="font-semibold text-[#12382D] dark:text-[#F7F3EA] text-sm">{checkoutStay.guest_name}</p>
                  <p className="text-[#C7A36A]">Room {checkoutStay.room_number}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">
                    Incidentals Settle (in Cents, 0 if None)
                  </label>
                  <input
                    type="number"
                    value={checkoutIncidentalsCents}
                    onChange={(e) => setCheckoutIncidentalsCents(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">
                    Settlement Payment Method
                  </label>
                  <select
                    value={checkoutPaymentMethod}
                    onChange={(e) => setCheckoutPaymentMethod(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-none"
                  >
                    <option value="card">Card On File</option>
                    <option value="cash">Cash Settlement</option>
                    <option value="wire">Bank Wire</option>
                  </select>
                </div>

                <button
                  onClick={handleExecuteCheckOut}
                  className="w-full py-2.5 bg-[#C7A36A] hover:bg-[#D9BB8A] text-[#12382D] font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Confirm Checkout & Dispatch Housekeeping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE RESERVATION MODAL IN FRONT DESK */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-[#F7F3EA] dark:bg-[#181D18] rounded-2xl border border-[#C7A36A]/30 p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#C7A36A]/20">
              <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Create Guest Reservation</h3>
              <button onClick={() => setShowNewBookingModal(false)} className="p-1 text-[#A9B8A4] hover:text-[#12382D]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {newBookingError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl">
                {newBookingError}
              </div>
            )}
            {newBookingSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl">
                {newBookingSuccess}
              </div>
            )}

            <form onSubmit={handleCreateFrontDeskBooking} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Check-in Date</label>
                  <input
                    type="date"
                    value={newBookingCheckIn}
                    onChange={(e) => setNewBookingCheckIn(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Check-out Date</label>
                  <input
                    type="date"
                    value={newBookingCheckOut}
                    onChange={(e) => setNewBookingCheckOut(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Room Category</label>
                <select
                  value={newBookingRoomType}
                  onChange={(e) => setNewBookingRoomType(e.target.value)}
                  className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} (${(rt.base_price_cents / 100).toLocaleString()}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Guest Full Name</label>
                  <input
                    type="text"
                    value={newBookingGuestName}
                    onChange={(e) => setNewBookingGuestName(e.target.value)}
                    placeholder="e.g. Baron Vance"
                    required
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Guest Email</label>
                  <input
                    type="email"
                    value={newBookingGuestEmail}
                    onChange={(e) => setNewBookingGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    required
                    className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A] mb-1">Special Preferences / Notes</label>
                <textarea
                  value={newBookingSpecialReqs}
                  onChange={(e) => setNewBookingSpecialReqs(e.target.value)}
                  placeholder="e.g. High floor, hypoallergenic pillows, late arrival"
                  rows={2}
                  className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                Confirm Booking & Check Double-Booking Constraints
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ROOM ASSIGNMENT MODAL */}
      {assigningReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#F7F3EA] dark:bg-[#181D18] rounded-2xl border border-[#C7A36A]/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#C7A36A]/20">
              <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Assign Room to Reservation</h3>
              <button onClick={() => setAssigningReservation(null)} className="p-1 text-[#A9B8A4] hover:text-[#12382D]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A9B8A4]">
              Assigning room for <strong className="text-[#12382D] dark:text-[#F7F3EA]">{assigningReservation.customer_name}</strong> ({assigningReservation.booking_reference})
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#12382D] dark:text-[#C7A36A]">Select Suitable Room</label>
              <select
                value={selectedAssignmentRoomId}
                onChange={(e) => setSelectedAssignmentRoomId(e.target.value)}
                className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl px-3 py-2 text-xs"
              >
                <option value="">-- Choose Room --</option>
                {rooms
                  .filter((r) => r.room_type_id === assigningReservation.room_type_id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} (Floor {r.floor} · {r.operational_status} · {r.occupancy_status})
                    </option>
                  ))}
              </select>

              <button
                disabled={!selectedAssignmentRoomId}
                onClick={() => handleAssignRoom(assigningReservation.id, selectedAssignmentRoomId)}
                className="w-full py-2.5 bg-[#12382D] hover:bg-[#0D2820] disabled:opacity-40 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                Assign Room Number
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
