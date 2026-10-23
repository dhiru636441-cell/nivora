import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/db';
import {
  Room,
  HousekeepingTask,
  MaintenanceRequest,
  ServiceRequest,
  MenuItem,
  FoodOrder,
  FoodOrderStatus,
  FoodPaymentStatus,
} from '../../lib/types';
import { HotelAIAssistant } from '../../components/ai/HotelAIAssistant';
import {
  CheckSquare,
  Sparkles,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  Filter,
  RefreshCw,
  Plus,
  Calendar,
  AlertTriangle,
  Bot,
  Bed,
  UtensilsCrossed,
  ShieldCheck,
  User,
  Coffee,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

export const StaffPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'housekeeping' | 'maintenance' | 'requests' | 'ai_ops'>('tasks');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [editPriceInr, setEditPriceInr] = useState<number>(0);

  // Task filter
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskWorkNotes, setTaskWorkNotes] = useState('');

  // Maintenance note modal/form
  const [selectedMaintId, setSelectedMaintId] = useState<string | null>(null);
  const [maintResolutionNotes, setMaintResolutionNotes] = useState('');

  const loadData = () => {
    setRooms(db.getRooms());
    setTasks(db.getHousekeepingTasks());
    setMaintenance(db.getMaintenanceRequests());
    setServiceRequests(db.getServiceRequests());
    setFoodOrders(db.getFoodOrders());
    setMenuItems(db.getMenuItems());
  };

  const handleUpdateFoodOrderStatus = (
    orderId: string,
    status: FoodOrderStatus,
    paymentStatus?: FoodPaymentStatus
  ) => {
    db.updateFoodOrderStatus(orderId, status, paymentStatus, undefined, {
      id: user?.id || 'staff_member',
      email: user?.email || 'staff@nivoraresort.com',
      role: 'staff',
    });
    loadData();
  };

  const handleToggleMenuItemAvailability = (item: MenuItem) => {
    db.updateMenuItem(
      { ...item, is_available: !item.is_available },
      { id: user?.id || 'staff_member', email: user?.email || 'staff@nivoraresort.com', role: 'staff' }
    );
    loadData();
  };

  const handleSaveItemPrice = (item: MenuItem) => {
    if (editPriceInr > 0) {
      db.updateMenuItem(
        { ...item, price_inr: editPriceInr },
        { id: user?.id || 'staff_member', email: user?.email || 'staff@nivoraresort.com', role: 'staff' }
      );
      setEditingMenuItemId(null);
      loadData();
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return unsub;
  }, []);

  const handleStartTask = (taskId: string) => {
    db.updateHousekeepingTaskStatus(taskId, 'in_progress', undefined, {
      id: user?.id || 'staff_member',
      email: user?.email || 'staff@nivoraresort.com',
      role: 'staff',
    });
  };

  const handleCompleteTask = (taskId: string, notes?: string) => {
    db.updateHousekeepingTaskStatus(taskId, 'completed', notes || 'Completed by staff', {
      id: user?.id || 'staff_member',
      email: user?.email || 'staff@nivoraresort.com',
      role: 'staff',
    });
    setSelectedTaskId(null);
    setTaskWorkNotes('');
  };

  const handleUpdateRoomStatus = (roomId: string, newStatus: Room['operational_status']) => {
    try {
      db.updateRoomStatus(roomId, newStatus, `Manual staff status update to ${newStatus}`, {
        id: user?.id || 'staff_member',
        email: user?.email || 'staff@nivoraresort.com',
        role: 'staff',
      });
    } catch (err: any) {
      alert(err.message || 'Error updating room status');
    }
  };

  const handleResolveMaintenance = (maintId: string) => {
    db.updateMaintenanceStatus(maintId, 'resolved', maintResolutionNotes || 'Issue addressed and inspected', {
      id: user?.id || 'staff_member',
      email: user?.email || 'staff@nivoraresort.com',
      role: 'staff',
    });
    setSelectedMaintId(null);
    setMaintResolutionNotes('');
  };

  const handleStartMaintenance = (maintId: string) => {
    db.updateMaintenanceStatus(maintId, 'in_progress', undefined, {
      id: user?.id || 'staff_member',
      email: user?.email || 'staff@nivoraresort.com',
      role: 'staff',
    });
  };

  const handleCompleteServiceRequest = (reqId: string) => {
    db.updateServiceRequestStatus(reqId, 'completed', 'Completed by floor staff', {
      id: user?.id || 'staff_member',
      email: user?.email || 'staff@nivoraresort.com',
      role: 'staff',
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskStatusFilter === 'all') return true;
    return t.status === taskStatusFilter;
  });

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-[#F7F3EA] dark:bg-[#141714] text-[#242722] dark:text-[#F7F3EA] flex flex-col lg:flex-row">
      
      {/* Dark Forest Green Sidebar for Staff */}
      <aside className="w-full lg:w-64 bg-[#12382D] text-[#F7F3EA] border-r border-[#C7A36A]/20 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="pb-6 border-b border-[#C7A36A]/20 mb-6">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A36A] font-semibold block">
              Hospitality Operations
            </span>
            <h2 className="font-serif text-xl text-white font-normal tracking-wide mt-0.5">
              Staff Workspace
            </h2>
            <p className="text-[11px] text-[#A9B8A4] mt-1 truncate">
              Signed in: {user?.full_name || 'Staff Specialist'}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4 text-[#C7A36A]" />
                <span>My Active Tasks</span>
              </div>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white">
                {pendingCount + inProgressCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('housekeeping')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'housekeeping'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#C7A36A]" />
                <span>Room Turnover Board</span>
              </div>
              <span className="text-[10px] text-[#C7A36A]">
                {rooms.filter((r) => r.operational_status === 'dirty').length} Dirty
              </span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4 text-[#C7A36A]" />
                <span>Maintenance Work Orders</span>
              </div>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white">
                {maintenance.filter((m) => m.status !== 'resolved').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Coffee className="w-4 h-4 text-[#C7A36A]" />
                <span>In-Suite Dining & Orders</span>
              </div>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white">
                {serviceRequests.filter((s) => s.status !== 'completed').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ai_ops')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                activeTab === 'ai_ops'
                  ? 'bg-[#0D2820] text-[#C7A36A] border border-[#C7A36A]/30 font-semibold'
                  : 'text-[#A9B8A4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-4 h-4 text-[#C7A36A]" />
              <span>Operations AI Protocols</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Operational Summary */}
        <div className="pt-6 border-t border-[#C7A36A]/20">
          <div className="p-3 bg-[#0D2820] rounded-xl border border-[#C7A36A]/25 text-[11px] text-[#A9B8A4]">
            <p className="font-semibold text-white">Shift Operational Brief</p>
            <p className="mt-1">Urgent Turnovers: <strong className="text-amber-400">{urgentCount}</strong></p>
            <p className="mt-0.5">Assigned Completed: <strong className="text-emerald-400">{completedCount}</strong></p>
          </div>
        </div>
      </aside>

      {/* Main Warm Ivory Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8 overflow-x-hidden">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#C7A36A]/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#12382D] dark:text-[#C7A36A] font-semibold">
                Nivora Staff Operations
              </span>
              <span className="text-[#A9B8A4]">·</span>
              <span className="text-xs text-[#A9B8A4]">Daily Execution Console</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#12382D] dark:text-[#F7F3EA] mt-1">
              {activeTab === 'tasks' && 'Assigned Staff Tasks'}
              {activeTab === 'housekeeping' && 'Housekeeping & Turnover Board'}
              {activeTab === 'maintenance' && 'Facility Maintenance Work Orders'}
              {activeTab === 'requests' && 'In-Suite Dining & Guest Requests'}
              {activeTab === 'ai_ops' && 'Operations AI Assistant'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 border border-[#C7A36A]/30 rounded-xl text-[#12382D] dark:text-[#C7A36A] hover:bg-[#12382D]/10 dark:hover:bg-white/5 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. ASSIGNED STAFF TASKS TAB (Requirement 5) */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            
            {/* Status KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold">Pending Queue</span>
                <p className="font-serif text-2xl sm:text-3xl text-[#12382D] dark:text-[#F7F3EA] mt-1">{pendingCount}</p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">Awaiting start</p>
              </div>

              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold">In Progress</span>
                <p className="font-serif text-2xl sm:text-3xl text-blue-600 dark:text-blue-400 mt-1">{inProgressCount}</p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">Underway on floor</p>
              </div>

              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold">Urgent Priority</span>
                <p className="font-serif text-2xl sm:text-3xl text-amber-600 dark:text-amber-400 mt-1">{urgentCount}</p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">Immediate turnover</p>
              </div>

              <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#A9B8A4] font-semibold">Completed Today</span>
                <p className="font-serif text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</p>
                <p className="text-[11px] text-[#A9B8A4] mt-1">Passed inspection</p>
              </div>
            </div>

            {/* Task Filter Segmented Controls */}
            <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#1E231E] border border-[#C7A36A]/20 rounded-xl w-fit text-xs">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTaskStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                    taskStatusFilter === st
                      ? 'bg-[#12382D] text-white font-medium shadow-xs'
                      : 'text-[#242722]/70 dark:text-[#A9B8A4] hover:text-[#12382D]'
                  }`}
                >
                  {st === 'all' ? 'All Tasks' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Clear Practical Task Cards (Requirement 5) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C7A36A] transition-colors"
                >
                  <div>
                    {/* Header: Room Number and Priority */}
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xl font-normal text-[#12382D] dark:text-[#F7F3EA]">
                        Room {task.room_number}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-semibold ${
                          task.priority === 'urgent'
                            ? 'text-amber-600 dark:text-amber-400'
                            : task.priority === 'priority'
                            ? 'text-[#C7A36A]'
                            : 'text-[#A9B8A4]'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>

                    <div className="mt-1 text-xs">
                      <span className="font-medium text-[#12382D] dark:text-[#F7F3EA] capitalize">
                        {task.task_type.replace('_', ' ')}
                      </span>
                      <p className="text-[#A9B8A4] text-[11px] mt-1 leading-relaxed">
                        {task.notes || 'Full turnover service, linen change, amenities restock, and ozone air purifiers.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#C7A36A]/15 flex items-center justify-between text-[11px] text-[#A9B8A4]">
                      <span>Status: <strong className="capitalize text-[#12382D] dark:text-[#F7F3EA]">{task.status.replace('_', ' ')}</strong></span>
                      <span>{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Task Control Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="w-full py-2 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-[#C7A36A]" />
                        <span>Start Cleaning</span>
                      </button>
                    )}

                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => setSelectedTaskId(task.id)}
                        className="w-full py-2 bg-[#C7A36A] hover:bg-[#D9BB8A] text-[#12382D] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as Inspected & Clean</span>
                      </button>
                    )}

                    {task.status === 'completed' && (
                      <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed & Ready</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#A9B8A4] text-xs">
                  No tasks matching the selected filter.
                </div>
              )}
            </div>

          </div>
        )}

        {/* 2. HOUSEKEEPING & ROOM TURNOVER TAB */}
        {activeTab === 'housekeeping' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Sanctuary Housekeeping Operations</h3>
                <p className="text-xs text-[#A9B8A4]">Manage individual room operational status directly</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl border border-[#C7A36A]/20 bg-[#F7F3EA]/50 dark:bg-[#141714] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-lg font-bold text-[#12382D] dark:text-[#F7F3EA]">
                        Room {room.room_number}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-[#A9B8A4]">
                        Floor {room.floor} · {room.occupancy_status}
                      </span>
                    </div>

                    <p className="text-xs text-[#242722]/80 dark:text-[#A9B8A4]">
                      Current Status: <strong className="capitalize text-[#12382D] dark:text-[#C7A36A]">{room.operational_status.replace('_', ' ')}</strong>
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#C7A36A]/15">
                      <button
                        onClick={() => handleUpdateRoomStatus(room.id, 'clean')}
                        className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
                          room.operational_status === 'clean'
                            ? 'bg-emerald-700 text-white font-medium'
                            : 'bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 text-[#12382D] dark:text-[#F7F3EA] hover:bg-emerald-50'
                        }`}
                      >
                        Clean
                      </button>
                      <button
                        onClick={() => handleUpdateRoomStatus(room.id, 'inspected')}
                        className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
                          room.operational_status === 'inspected'
                            ? 'bg-[#12382D] text-white font-medium'
                            : 'bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 text-[#12382D] dark:text-[#F7F3EA] hover:bg-emerald-50'
                        }`}
                      >
                        Inspected
                      </button>
                      <button
                        onClick={() => handleUpdateRoomStatus(room.id, 'dirty')}
                        className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
                          room.operational_status === 'dirty'
                            ? 'bg-amber-600 text-white font-medium'
                            : 'bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 text-[#12382D] dark:text-[#F7F3EA] hover:bg-amber-50'
                        }`}
                      >
                        Dirty
                      </button>
                      <button
                        onClick={() => handleUpdateRoomStatus(room.id, 'cleaning_in_progress')}
                        className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
                          room.operational_status === 'cleaning_in_progress'
                            ? 'bg-blue-600 text-white font-medium'
                            : 'bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 text-[#12382D] dark:text-[#F7F3EA] hover:bg-blue-50'
                        }`}
                      >
                        In Progress
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Engineering & Maintenance Orders</h3>
                <p className="text-xs text-[#A9B8A4]">Work orders and technical inspections</p>
              </div>

              <div className="space-y-3">
                {maintenance.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-[#C7A36A]/20 bg-[#F7F3EA]/50 dark:bg-[#141714] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[#12382D] dark:text-[#F7F3EA]">
                          Room {m.room_number}: {m.issue_title}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-amber-600">{m.urgency}</span>
                      </div>
                      <p className="text-[#A9B8A4] text-[11px] mt-0.5">{m.description}</p>
                      <p className="text-[10px] text-[#A9B8A4] mt-1">Status: <strong className="capitalize text-[#12382D] dark:text-[#C7A36A]">{m.status.replace('_', ' ')}</strong></p>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.status === 'reported' && (
                        <button
                          onClick={() => handleStartMaintenance(m.id)}
                          className="px-3 py-1.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-lg text-xs"
                        >
                          Begin Work
                        </button>
                      )}
                      {m.status === 'in_progress' && (
                        <button
                          onClick={() => setSelectedMaintId(m.id)}
                          className="px-3 py-1.5 bg-[#C7A36A] hover:bg-[#D9BB8A] text-[#12382D] font-semibold rounded-lg text-xs"
                        >
                          Resolve & Sign Off
                        </button>
                      )}
                      {m.status === 'resolved' && (
                        <span className="text-emerald-600 text-xs font-medium">✓ Resolved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. IN-SUITE DINING & F&B OPERATIONS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-8">
            
            {/* Live F&B Orders Dispatch Console */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#C7A36A]/20">
                <div>
                  <h3 className="font-serif text-xl text-[#12382D] dark:text-[#F7F3EA]">
                    Culinary &amp; In-Room Dining Orders
                  </h3>
                  <p className="text-xs text-[#A9B8A4]">
                    Live kitchen tickets and butler dispatch status
                  </p>
                </div>
                <div className="text-xs font-semibold px-3 py-1 bg-[#12382D]/10 dark:bg-white/10 rounded-lg text-[#12382D] dark:text-[#C7A36A]">
                  {foodOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length} Active Kitchen Tickets
                </div>
              </div>

              {foodOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#A9B8A4]">
                  No active culinary orders in queue.
                </div>
              ) : (
                <div className="space-y-4">
                  {foodOrders.map((ord) => {
                    const statusColors = {
                      received: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
                      preparing: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
                      out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300',
                      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
                      cancelled: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300',
                    };

                    return (
                      <div
                        key={ord.id}
                        className="p-5 rounded-2xl border border-[#C7A36A]/25 bg-[#F7F3EA]/40 dark:bg-[#161916] shadow-xs space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C7A36A]/15 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-base text-[#12382D] dark:text-[#F7F3EA]">
                                #{ord.order_number}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[ord.status]}`}>
                                {ord.status.toUpperCase().replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-[#242722]/80 dark:text-[#A9B8A4] mt-0.5">
                              Guest: <strong>{ord.guest_name}</strong> · Location: <strong>{ord.delivery_location}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-serif text-base font-bold text-[#12382D] dark:text-[#C7A36A]">
                              ₹{ord.total_inr.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-[#A9B8A4] flex items-center justify-end gap-1.5 mt-0.5">
                              <span>Payment:</span>
                              <span className="font-semibold capitalize text-[#12382D] dark:text-white">
                                {ord.payment_method === 'room_charge' ? 'Room Folio' : ord.payment_method} ({ord.payment_status})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {ord.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white dark:bg-[#1E231E] border border-[#C7A36A]/15 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${it.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                <span className="font-medium text-[#12382D] dark:text-[#F7F3EA]">
                                  {it.quantity}x {it.name}
                                </span>
                              </div>
                              <span className="text-[#A9B8A4] font-serif">₹{it.subtotal_inr.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {ord.special_instructions && (
                          <div className="text-[11px] p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                            <strong>Chef Note:</strong> {ord.special_instructions}
                          </div>
                        )}

                        {/* Staff Action Controls */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#C7A36A]/15">
                          <div className="flex items-center gap-2 text-xs">
                            {ord.payment_method === 'cash' && ord.payment_status === 'pending' && (
                              <button
                                onClick={() => handleUpdateFoodOrderStatus(ord.id, ord.status, 'paid')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                Collect Cash (₹{ord.total_inr.toLocaleString()})
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {ord.status === 'received' && (
                              <button
                                onClick={() => handleUpdateFoodOrderStatus(ord.id, 'preparing')}
                                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                              >
                                Start Kitchen Prep
                              </button>
                            )}

                            {ord.status === 'preparing' && (
                              <button
                                onClick={() => handleUpdateFoodOrderStatus(ord.id, 'out_for_delivery')}
                                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                              >
                                Dispatch with Butler
                              </button>
                            )}

                            {ord.status === 'out_for_delivery' && (
                              <button
                                onClick={() => handleUpdateFoodOrderStatus(ord.id, 'delivered')}
                                className="px-3.5 py-1.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                              >
                                Mark Delivered
                              </button>
                            )}

                            {ord.status === 'delivered' && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                                <Check className="w-4 h-4" /> Delivered to Guest
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Menu Items Availability & Pricing Editor */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-[#C7A36A]/20">
                <h3 className="font-serif text-xl text-[#12382D] dark:text-[#F7F3EA]">
                  Culinary Menu Availability &amp; Price Controls
                </h3>
                <p className="text-xs text-[#A9B8A4]">
                  Staff can toggle availability and adjust INR pricing in real time
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-[#C7A36A]/20 bg-[#F7F3EA]/30 dark:bg-[#141714] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        <h4 className="font-serif font-medium text-[#12382D] dark:text-[#F7F3EA] truncate">
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-[#A9B8A4] capitalize">
                        {item.category.replace('_', ' ')} · Prep: {item.preparation_time_minutes}m
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {editingMenuItemId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editPriceInr}
                            onChange={(e) => setEditPriceInr(Number(e.target.value))}
                            className="w-18 p-1 text-xs border border-[#C7A36A] rounded bg-white dark:bg-black text-[#12382D] dark:text-white"
                          />
                          <button
                            onClick={() => handleSaveItemPrice(item)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px]"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMenuItemId(item.id);
                            setEditPriceInr(item.price_inr);
                          }}
                          className="font-serif font-bold text-[#12382D] dark:text-[#C7A36A] hover:underline"
                          title="Click to edit price"
                        >
                          ₹{item.price_inr.toLocaleString()}
                        </button>
                      )}

                      {/* Availability toggle */}
                      <button
                        onClick={() => handleToggleMenuItemAvailability(item)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                          item.is_available
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                        }`}
                      >
                        {item.is_available ? 'In Stock' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traditional In-Suite Service Requests */}
            <div className="bg-white dark:bg-[#1E231E] border border-[#C7A36A]/25 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="pb-4 border-b border-[#C7A36A]/20">
                <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">General Floor Service Requests</h3>
                <p className="text-xs text-[#A9B8A4]">Linens, pillows, turn-down, and floor concierge assistance</p>
              </div>

              <div className="space-y-3">
                {serviceRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-[#C7A36A]/20 bg-[#F7F3EA]/50 dark:bg-[#141714] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[#12382D] dark:text-[#F7F3EA]">
                          Room {req.room_number}: {req.title}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-[#C7A36A] capitalize">
                          {req.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[#A9B8A4] text-[11px] mt-0.5">{req.details}</p>
                      <p className="text-[10px] text-[#A9B8A4] mt-1">Status: <strong className="capitalize text-[#12382D] dark:text-[#F7F3EA]">{req.status}</strong></p>
                    </div>

                    <div>
                      {req.status !== 'completed' ? (
                        <button
                          onClick={() => handleCompleteServiceRequest(req.id)}
                          className="px-3 py-1.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-lg text-xs"
                        >
                          Mark Delivered
                        </button>
                      ) : (
                        <span className="text-emerald-600 text-xs font-medium">✓ Delivered</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 5. OPERATIONS AI TAB */}
        {activeTab === 'ai_ops' && (
          <div className="space-y-6">
            <HotelAIAssistant portalRole="staff" />
          </div>
        )}

      </main>

      {/* TASK COMPLETION SIGN OFF MODAL */}
      {selectedTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#F7F3EA] dark:bg-[#181D18] rounded-2xl border border-[#C7A36A]/30 p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Sign Off Turnover Completion</h3>
            <p className="text-xs text-[#A9B8A4]">Confirm room readiness inspection and amenities restock.</p>
            <textarea
              value={taskWorkNotes}
              onChange={(e) => setTaskWorkNotes(e.target.value)}
              placeholder="e.g. All linens changed, balcony cleaned, Bvlgari toiletries replenished."
              rows={3}
              className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl p-3 text-xs"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTaskId(null)}
                className="flex-1 py-2 text-xs border border-[#C7A36A]/30 rounded-xl text-[#A9B8A4]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteTask(selectedTaskId, taskWorkNotes)}
                className="flex-1 py-2 text-xs bg-[#12382D] text-white rounded-xl font-medium"
              >
                Confirm Clean
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE RESOLUTION SIGN OFF MODAL */}
      {selectedMaintId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#F7F3EA] dark:bg-[#181D18] rounded-2xl border border-[#C7A36A]/30 p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">Resolve Maintenance Order</h3>
            <p className="text-xs text-[#A9B8A4]">Document technical resolution details for audit history.</p>
            <textarea
              value={maintResolutionNotes}
              onChange={(e) => setMaintResolutionNotes(e.target.value)}
              placeholder="e.g. Balcony vent filter calibrated, airflow nominal."
              rows={3}
              className="w-full bg-white dark:bg-[#1E231E] border border-[#C7A36A]/30 rounded-xl p-3 text-xs"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMaintId(null)}
                className="flex-1 py-2 text-xs border border-[#C7A36A]/30 rounded-xl text-[#A9B8A4]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveMaintenance(selectedMaintId)}
                className="flex-1 py-2 text-xs bg-[#12382D] text-white rounded-xl font-medium"
              >
                Sign Off & Clear Room
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
