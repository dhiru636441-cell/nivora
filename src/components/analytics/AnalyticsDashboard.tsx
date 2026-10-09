import React, { useState, useEffect } from 'react';
import { datasetService } from '../../lib/dataset-service';
import { HotelAnalyticsMetrics } from '../../lib/types';
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
  Sparkles,
  Bed,
  Smile,
  ShieldAlert,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [metrics, setMetrics] = useState<HotelAnalyticsMetrics>(
    datasetService.calculateAnalytics()
  );

  const refreshData = () => {
    const updated = datasetService.calculateAnalytics({
      roomType: roomTypeFilter,
      bookingChannel: channelFilter,
      guestSegment: segmentFilter,
      transactionStatus: statusFilter,
    });
    setMetrics(updated);
  };

  useEffect(() => {
    refreshData();
    const unsub = datasetService.subscribe(refreshData);
    return unsub;
  }, [roomTypeFilter, channelFilter, segmentFilter, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Analytics Query Engine</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Room Type */}
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Room Types</option>
            <option value="Nivora Presidential Penthouse Suite">Presidential Penthouse</option>
            <option value="Deluxe Oceanfront Horizon Room">Deluxe Ocean Horizon</option>
            <option value="Executive Sanctuary Garden Villa">Executive Garden Villa</option>
            <option value="Royal Wellness Spa Pavilion">Wellness Spa Pavilion</option>
          </select>

          {/* Booking Channel */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Channels</option>
            <option value="Direct Website">Direct Website</option>
            <option value="Mobile App">Mobile App</option>
            <option value="Booking.com">Booking.com</option>
            <option value="Agoda">Agoda</option>
            <option value="Amex Centurion Concierge">Amex Centurion</option>
          </select>

          {/* Guest Segment */}
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Segments</option>
            <option value="Luxury Leisure">Luxury Leisure</option>
            <option value="Business Executive">Business Executive</option>
            <option value="Wellness & Spa">Wellness & Spa</option>
            <option value="Honeymoon">Honeymoon</option>
            <option value="Family Heritage">Family Heritage</option>
          </select>

          {/* Transaction Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Transactions</option>
            <option value="settled">Settled Only</option>
            <option value="failed">Failed Only</option>
          </select>

          <button
            onClick={() => {
              setRoomTypeFilter('all');
              setChannelFilter('all');
              setSegmentFilter('all');
              setStatusFilter('all');
            }}
            className="px-2.5 py-1.5 text-slate-400 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Realized Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Realized Revenue</p>
          <p className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
            ${(metrics.successful_transactions_amount).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 block">Excludes failed transactions</span>
        </div>

        {/* Total Transactions & Success Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Payment Success</p>
          <p className="font-mono text-xl font-bold text-cyan-300 tabular-nums">
            {metrics.success_rate_percent}%
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">
            {metrics.successful_transactions_count} / {metrics.total_transactions_count} settled
          </span>
        </div>

        {/* Average Booking Amount */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Avg Booking Total</p>
          <p className="font-mono text-xl font-bold text-white tabular-nums">
            ${metrics.average_booking_amount.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 block font-mono">Per unique reservation</span>
        </div>

        {/* Average Stay Duration */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Avg Stay Duration</p>
          <p className="font-mono text-xl font-bold text-white tabular-nums">
            {metrics.average_stay_duration_nights} <span className="text-xs font-sans text-slate-400 font-normal">nights</span>
          </p>
          <span className="text-[10px] text-slate-500 block font-mono">{metrics.total_room_nights_sold} room-nights</span>
        </div>

        {/* Repeat Guest Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Repeat Guest Rate</p>
          <p className="font-mono text-xl font-bold text-purple-400 tabular-nums">
            {metrics.repeat_guest_percentage}%
          </p>
          <span className="text-[10px] text-slate-500 block">Loyalty return rate</span>
        </div>

        {/* Satisfaction Score */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Avg Satisfaction</p>
          <p className="font-mono text-xl font-bold text-amber-400 tabular-nums">
            {metrics.average_satisfaction_score} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </p>
          <span className="text-[10px] text-slate-500 block">From verified feedback</span>
        </div>
      </div>

      {/* Grid: Financial Breakdown by Category, Channel, Room Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue by Transaction Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-serif text-base font-bold text-white">Revenue by Category</h4>
          <div className="space-y-3">
            {Object.entries(metrics.revenue_by_transaction_category).map(([cat, val]) => {
              const total = metrics.successful_transactions_amount || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                    <span className="font-mono tabular-nums text-white">${val.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Booking Channel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-serif text-base font-bold text-white">Revenue by Booking Channel</h4>
          <div className="space-y-3">
            {Object.entries(metrics.revenue_by_booking_channel).map(([chan, val]) => {
              const total = metrics.successful_transactions_amount || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={chan} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{chan}</span>
                    <span className="font-mono tabular-nums text-white">${val.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Room Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-serif text-base font-bold text-white">Revenue by Room Type</h4>
          <div className="space-y-3">
            {Object.entries(metrics.revenue_by_room_type).map(([rtype, val]) => {
              const total = metrics.successful_transactions_amount || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={rtype} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="truncate max-w-[170px]">{rtype}</span>
                    <span className="font-mono tabular-nums text-white">${val.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational SLA & Guest Sentiment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Operational Staff Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-serif text-base font-bold text-white">Staff Operational Metrics</h4>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Avg Staff Response Time:</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {metrics.average_staff_response_time_minutes} minutes
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Avg Request Resolution:</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {metrics.average_service_resolution_time_minutes} minutes
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">Mean Check-in Occupancy:</span>
              <span className="font-mono font-bold text-cyan-400 tabular-nums">
                {metrics.average_occupancy_percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Guest Feedback Sentiment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-serif text-base font-bold text-white">Guest Sentiment Distribution</h4>
          <div className="space-y-3">
            {Object.entries(metrics.sentiment_distribution).map(([s, count]) => {
              const total = metrics.total_records_analyzed || 1;
              const pct = Math.round((count / total) * 100);
              const color = s === 'Positive' ? 'bg-emerald-400' : s === 'Neutral' ? 'bg-amber-400' : 'bg-rose-400';
              return (
                <div key={s} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{s} Sentiment</span>
                    <span className="font-mono tabular-nums text-white">{count} reviews ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guest Segments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="font-serif text-base font-bold text-white">Guest Segment Distribution</h4>
          <div className="space-y-3">
            {Object.entries(metrics.guest_segment_distribution).map(([seg, count]) => {
              const total = metrics.total_records_analyzed || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={seg} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{seg}</span>
                    <span className="font-mono tabular-nums text-white">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
