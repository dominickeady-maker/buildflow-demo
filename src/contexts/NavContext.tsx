// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export type ViewType = 'site' | 'worker' | 'task' | 'worker_task';

export interface NavView {
  type: ViewType;
  id: string;
  label: string;
  subTab?: string;
}

interface NavContextType {
  activeTab: string;
  views: NavView[];
  activeView: NavView | null;
  setActiveTab: (tab: string) => void;
  pushView: (view: NavView) => void;
  popView: () => void;
  setSubTab: (subTab: string) => void;
  goToLevel: (index: number) => void;
  resetToRoot: () => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState('dashboard');
  const [views, setViews] = useState<NavView[]>([]);
  const isPopstateRef = useRef(false);
  const isFirstRender = useRef(true);

  const activeView = views.length > 0 ? views[views.length - 1] : null;

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    setViews([]);
  }, []);

  const pushView = useCallback((view: NavView) => {
    setViews(prev => [...prev, view]);
  }, []);

  const popView = useCallback(() => {
    setViews(prev => prev.slice(0, -1));
  }, []);

  const setSubTab = useCallback((subTab: string) => {
    setViews(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], subTab };
      return updated;
    });
  }, []);

  const goToLevel = useCallback((index: number) => {
    setViews(prev => prev.slice(0, index + 1));
  }, []);

  const resetToRoot = useCallback(() => {
    setViews([]);
  }, []);

  // Set initial history state on mount so popstate has something to restore
  useEffect(() => {
    window.history.replaceState({ tab: 'dashboard', views: [] }, '');
  }, []);

  // Push a history entry whenever the nav state changes (tab or view depth).
  // Skips: first render (replaceState handles it), popstate restores.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }
    window.history.pushState({ tab: activeTab, views }, '');
  }, [activeTab, views.length]);

  // Restore full nav state (tab + views) on browser back/forward
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      isPopstateRef.current = true;
      const state = event.state;
      if (state && typeof state.tab === 'string') {
        setActiveTabState(state.tab);
        setViews(state.views || []);
      } else {
        setActiveTabState('dashboard');
        setViews([]);
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <NavContext.Provider value={{ activeTab, views, activeView, setActiveTab, pushView, popView, setSubTab, goToLevel, resetToRoot }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const context = useContext(NavContext);
  if (context === undefined) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
}

export function useSiteLink() {
  const { pushView } = useNav();
  return useCallback((siteId: string, siteName: string) => {
    pushView({ type: 'site', id: siteId, label: siteName, subTab: 'overview' });
  }, [pushView]);
}

export function useWorkerLink() {
  const { pushView } = useNav();
  return useCallback((workerId: string, workerName: string) => {
    pushView({ type: 'worker', id: workerId, label: workerName });
  }, [pushView]);
}

export function useTaskLink() {
  const { pushView } = useNav();
  return useCallback((taskId: string, taskTitle: string) => {
    pushView({ type: 'task', id: taskId, label: taskTitle });
  }, [pushView]);
}

export function useWorkerTaskLink() {
  const { pushView } = useNav();
  return useCallback((taskId: string, taskTitle: string) => {
    pushView({ type: 'worker_task', id: taskId, label: taskTitle });
  }, [pushView]);
}
