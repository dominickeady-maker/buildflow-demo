import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNav } from '../contexts/NavContext';
import { getNotificationsState } from '../contexts/NotificationsContext';
import { Bell, X, CheckCheck, MessageCircle, ListTodo, Clock, Package } from 'lucide-react';
import { formatDateUK } from '../utils/dateFormat';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function getIcon(type: string) {
  switch (type) {
    case 'message': return <MessageCircle className="w-4 h-4 text-blue-400" />;
    case 'task_assigned':
    case 'task_updated': return <ListTodo className="w-4 h-4 text-green-400" />;
    case 'timesheet_submitted': return <Clock className="w-4 h-4 text-amber-400" />;
    case 'materials_status':
    case 'materials_submitted': return <Package className="w-4 h-4 text-purple-400" />;
    default: return <Bell className="w-4 h-4 text-slate-400" />;
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { setActiveTab, pushView } = useNav();
  const { unreadCount, refreshUnread } = getNotificationsState();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, link, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    refreshUnread();
  }

  function handleNotificationClick(n: NotificationItem) {
    if (!n.read_at) {
      supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', n.id);
    }
    setNotifications(prev => prev.map(n2 => n2.id === n.id ? { ...n2, read_at: n2.read_at || new Date().toISOString() } : n2));
    refreshUnread();

    if (n.link) {
      const parts = n.link.split(':');
      const prefix = parts[0];
      const entityId = parts[1];

      if (prefix === 'task' && entityId) {
        setActiveTab('tasks');
        pushView({ type: 'task', id: entityId, label: 'Task' });
      } else {
        setActiveTab(prefix);
      }
    }
    setOpen(false);
  }

  function formatTime(createdAt: string) {
    const d = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDateUK(createdAt);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!open) loadNotifications();
          setOpen(!open);
        }}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full p-3 text-left hover:bg-slate-700/50 transition-colors flex gap-3 ${!n.read_at ? 'bg-brand-900/10' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{n.title}</p>
                        {!n.read_at && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                      </div>
                      {n.body && <p className="text-xs text-slate-400 truncate mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-slate-500 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
