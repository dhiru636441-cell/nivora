import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/db';
import { Room, HousekeepingTask, MaintenanceRequest, ServiceRequest } from '../../lib/types';
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
} from 'lucide-react';

export const StaffPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'housekeeping' | 'maintenance' | 'requests' | 'ai_ops'>('tasks');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

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

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Subnav Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'tasks'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Task Queue ({pendingCount + inProgressCount})
              </button>
              <button
                onClick={() => setActiveTab('housekeeping')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'housekeeping'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Room Operations
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'maintenance'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Maintenance Log ({maintenance.filter(m => m.status !== 'resolved').length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'requests'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Guest Orders ({serviceRequests.filter(s => s.status !== 'completed').length})
              </button>
              <button
                onClick={() => setActiveTab('ai_ops')}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ai_ops'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Operations AI</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
              <span>Shift: <strong className="text-slate-200">Morning (07:00 - 15:30)</strong></span>
              <span>·</span>
              <span>Staff ID: <strong className="text-cyan-400 font-mono">STF-8402</strong></span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Pending Tasks</p>
            <p className="font-mono text-2xl font-bold text-amber-400 mt-1 tabular-nums">{pendingCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">In Progress</p>
            <p className="font-mono text-2xl font-bold text-cyan-400 mt-1 tabular-nums">{inProgressCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Urgent Turnover</p>
            <p className="font-mono text-2xl font-bold text-rose-400 mt-1 tabular-nums">{urgentCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Completed Today</p>
            <p className="font-mono text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{completedCount}</p>
          </div>
        </div>

        {/* 1. TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Housekeeping & Floor Tasks</h2>
                <p className="text-xs text-slate-400">Turnover cleans, sanitization, and room preparation</p>
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                {(['all', 'pending', 'in_progress', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTaskStatusFilter(st)}
                    className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                      taskStatusFilter === st
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTasks.length === 0 ? (
                <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  No tasks matching the selected filter.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-lg font-bold text-white">
                          Room {task.room_number}
                        </span>
                        <span className={`text-[11px] font-medium capitalize px-2 py-0.5 rounded ${
                          task.priority === 'urgent'
                            ? 'text-rose-300 bg-rose-950/60 border border-rose-800/60'
                            : task.priority === 'priority'
                            ? 'text-amber-300 bg-amber-950/60 border border-amber-800/60'
                            : 'text-slate-300 bg-slate-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="capitalize text-slate-200 font-medium">{task.task_type.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>Assigned: {task.assigned_staff_name || 'Floor Crew'}</span>
                      </div>

                      {task.notes && (
                        <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          {task.notes}
                        </p>
                      )}

                      <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Created: {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {task.completed_at && (
                          <span>· Done: {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className={`text-xs font-semibold capitalize ${
                        task.status === 'completed'
                          ? 'text-emerald-400'
                          : task.status === 'in_progress'
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-2">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Start Work</span>
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Mark Cleaned</span>
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. HOUSEKEEPING ROOM STATUS MANAGEMENT */}
        {activeTab === 'housekeeping' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Physical Room State Management</h2>
              <p className="text-xs text-slate-400">
                Update operational status across all resort rooms. Occupancy constraints strictly preserved.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Room #</th>
                      <th className="py-3 px-4 font-semibold">Floor</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Occupancy</th>
                      <th className="py-3 px-4 font-semibold">Operational Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rooms.map((room) => {
                      const roomType = db.getRoomTypes().find(rt => rt.id === room.room_type_id);
                      return (
                        <tr key={room.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                            {room.room_number}
                          </td>
                          <td className="py-3 px-4 text-slate-400">Floor {room.floor}</td>
                          <td className="py-3 px-4 text-slate-300 font-medium">{roomType?.name || room.room_type_id}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                              room.occupancy_status === 'occupied'
                                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {room.occupancy_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                              room.operational_status === 'clean' || room.operational_status === 'inspected'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                : room.operational_status === 'dirty'
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                                : room.operational_status === 'cleaning_in_progress'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {room.operational_status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {room.operational_status === 'dirty' && (
                                <button
                                  onClick={() => handleUpdateRoomStatus(room.id, 'cleaning_in_progress')}
                                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] transition-colors"
                                >
                                  Begin Cleaning
                                </button>
                              )}
                              {room.operational_status === 'cleaning_in_progress' && (
                                <button
                                  onClick={() => handleUpdateRoomStatus(room.id, 'clean')}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[11px] transition-colors"
                                >
                                  Mark Clean
                                </button>
                              )}
                              {room.operational_status === 'clean' && (
                                <button
                                  onClick={() => handleUpdateRoomStatus(room.id, 'inspected')}
                                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-[11px] transition-colors"
                                >
                                  Inspect & Approve
                                </button>
                              )}
                              {room.operational_status !== 'dirty' && (
                                <button
                                  onClick={() => handleUpdateRoomStatus(room.id, 'dirty')}
                                  className="px-2 py-1 text-slate-400 hover:text-rose-400 text-[11px]"
                                >
                                  Flag Dirty
                                </button>
                              )}
                            </div>
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

        {/* 3. MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Maintenance Work Orders</h2>
                <p className="text-xs text-slate-400">HVAC, plumbing, electrical, and room fixture repairs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {maintenance.map((m) => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-base">Room {m.room_number}</span>
                        <span className={`text-[11px] font-medium capitalize px-2 py-0.5 rounded ${
                          m.urgency === 'high' || m.urgency === 'emergency'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                        }`}>
                          {m.urgency}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1">{m.issue_title}</h4>
                    </div>

                    <span className={`text-xs capitalize font-medium ${
                      m.status === 'resolved' ? 'text-emerald-400' : 'text-cyan-400'
                    }`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {m.description}
                  </p>

                  {m.resolution_notes && (
                    <div className="text-[11px] text-emerald-300/80 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg">
                      <p className="font-medium text-emerald-300">Resolution Record:</p>
                      <p>{m.resolution_notes}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Reported: {new Date(m.created_at).toLocaleDateString()}</span>

                    <div className="flex items-center gap-2">
                      {m.status === 'reported' && (
                        <button
                          onClick={() => handleStartMaintenance(m.id)}
                          className="px-3 py-1.5 bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs"
                        >
                          Begin Investigation
                        </button>
                      )}
                      {m.status !== 'resolved' && (
                        <button
                          onClick={() => setSelectedMaintId(m.id)}
                          className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-semibold rounded-lg text-xs cursor-pointer"
                        >
                          Resolve & Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. GUEST ORDERS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Guest Hospitality Dispatch</h2>
              <p className="text-xs text-slate-400">Incoming guest service orders, amenities, and room deliveries</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 shadow-xl">
              {serviceRequests.map((req) => (
                <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-white text-sm">Room {req.room_number}</span>
                      <span className="text-slate-500">·</span>
                      <span className="capitalize font-semibold text-cyan-300">{req.category.replace('_', ' ')}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{req.title}</p>
                    {req.details && <p className="text-xs text-slate-400">{req.details}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    {req.status !== 'completed' ? (
                      <button
                        onClick={() => handleCompleteServiceRequest(req.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Fulfill & Complete</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Fulfilled</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. OPERATIONS AI TAB */}
        {activeTab === 'ai_ops' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Hospitality SOP & Triage</span>
              <h2 className="font-serif text-3xl font-bold text-white mt-1">Staff Operations Intelligence AI</h2>
              <p className="text-xs text-slate-400 mt-1">
                Grounded in the 42-point luxury housekeeping protocol, complaint resolution SOPs, and response time metrics.
              </p>
            </div>
            <HotelAIAssistant portalRole="staff" />
          </div>
        )}
      </main>

      {/* Task Completion Modal */}
      {selectedTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white">Complete Housekeeping Task</h3>
            <p className="text-xs text-slate-400">
              Provide any optional inspection notes before updating the room to Clean in the central inventory.
            </p>
            <textarea
              value={taskWorkNotes}
              onChange={(e) => setTaskWorkNotes(e.target.value)}
              placeholder="e.g. Linens replaced, minibar restocked, terrace cleaned..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTaskId(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteTask(selectedTaskId, taskWorkNotes)}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Resolution Modal */}
      {selectedMaintId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white">Resolve Maintenance Work Order</h3>
            <p className="text-xs text-slate-400">
              Record repair notes. If the room was out-of-service, it will return to operational inventory.
            </p>
            <textarea
              value={maintResolutionNotes}
              onChange={(e) => setMaintResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced thermo sensor, tested HVAC unit under full load..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedMaintId(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveMaintenance(selectedMaintId)}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl"
              >
                Mark Resolved & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
