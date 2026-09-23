import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, ArrowLeft, Filter, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { Notification } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await apiRequest<{ unread_count: number; notifications: Notification[] }>(
        '/notifications'
      );
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifs();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      fetchNotifs();
    } catch {}
  };

  const categories = ['all', 'booking', 'delay', 'refund', 'food', 'support', 'general'];

  const filtered = notifications.filter(
    (n) => categoryFilter === 'all' || n.category === categoryFilter
  );

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">Notifications</h1>
            <span className="text-[11px] font-semibold text-slate-400">
              {unreadCount} unread alerts
            </span>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-xl transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`text-xs px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider transition-all shrink-0 ${
              categoryFilter === c
                ? 'bg-blue-600 text-white shadow-soft'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-soft">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No notifications in this category</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) handleMarkRead(n.id);
                if (n.link_url) navigate(n.link_url);
              }}
              className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                n.is_read
                  ? 'bg-white border-slate-200/80 shadow-soft'
                  : 'bg-blue-50/70 border-blue-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                    <h3 className="font-extrabold text-xs text-slate-900">{n.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-2 mt-1 border-t border-black/5">
                <span className="capitalize">{n.category}</span>
                <span>{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
