// © 2026 Cornerstone Developments Ltd. All rights reserved. Unauthorised copying prohibited.
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const DEMO_EMAILS = [
  'manager@buildflowdemo.com',
  'worker@buildflowdemo.com',
];

type DemoModeContextType = {
  isDemoMode: boolean;
};

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const isDemoMode = useMemo(() => {
    if (user?.email && DEMO_EMAILS.includes(user.email)) return true;
    const params = new URLSearchParams(window.location.search);
    return params.has('demo');
  }, [user?.email]);

  return (
    <DemoModeContext.Provider value={{ isDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
