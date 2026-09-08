import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ViewType = 'site' | 'worker' | 'task' | 'worker_task';

export interface NavView {
  type: ViewType;
  id: string;
  label: string;
  subTab?: string;
}

interface NavContextType {
  views: NavView[];
  activeView: NavView | null;
  pushView: (view: NavView) => void;
  popView: () => void;
  setSubTab: (subTab: string) => void;
  goToLevel: (index: number) => void;
  resetToRoot: () => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [views, setViews] = useState<NavView[]>([]);

  const activeView = views.length > 0 ? views[views.length - 1] : null;

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

  useEffect(() => {
    function handlePopState() {
      setViews(prev => {
        if (prev.length > 0) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (views.length > 0) {
      window.history.pushState({ navDepth: views.length }, '');
    }
  }, [views.length]);

  return (
    <NavContext.Provider value={{ views, activeView, pushView, popView, setSubTab, goToLevel, resetToRoot }}>
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
