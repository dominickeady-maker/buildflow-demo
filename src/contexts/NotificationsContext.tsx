import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { formatTimeUK, formatDateUK } from '../utils/dateFormat';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotificationsContextValue {
  unreadCount: number;
  refreshUnread: () => void;
}

let contextRef: { unreadCount: number; refreshUnread: () => void } = {
  unreadCount: 0,
  refreshUnread: () => {},
};

export function getNotificationsState() {
  return contextRef;
}

export function useNotificationsState() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (!error && count !== null) {
      setUnreadCount(count);
    }
  }, [user]);

  useEffect(() => {
    refreshUnread();
    contextRef = { unreadCount, refreshUnread };

    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => refreshUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshUnread]);

  useEffect(() => {
    contextRef = { unreadCount, refreshUnread };
  }, [unreadCount, refreshUnread]);

  return { unreadCount, refreshUnread };
}
