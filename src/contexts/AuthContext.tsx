// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useBranding } from './BrandingContext';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  demoError: string;
  orgMismatch: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const DEMO_ACCOUNTS: Record<string, { email: string; password: string }> = {
  manager: { email: 'manager@banksman.app', password: 'demo123' },
  worker: { email: 'worker@banksman.app', password: 'demo123' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { branding } = useBranding();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoError, setDemoError] = useState('');
  const [orgMismatch, setOrgMismatch] = useState(false);
  const demoLoggingIn = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoRole = params.get('demo');

    function stripDemoParam() {
      params.delete('demo');
      const remaining = params.toString();
      const newUrl = window.location.pathname + (remaining ? `?${remaining}` : '');
      window.history.replaceState({}, '', newUrl);
    }

    if (demoRole && DEMO_ACCOUNTS[demoRole]) {
      demoLoggingIn.current = true;
      (async () => {
        try {
          await supabase.auth.signOut();
          const { email, password } = DEMO_ACCOUNTS[demoRole];
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          stripDemoParam();
          demoLoggingIn.current = false;
        } catch (err: any) {
          console.error('Demo auto-login failed:', err);
          demoLoggingIn.current = false;
          setDemoError(err.message || 'Demo login failed. Please sign in manually.');
          stripDemoParam();
          setLoading(false);
        }
      })();
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session && demoLoggingIn.current) {
          return;
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
    } else if (data) {
      if (data.is_platform_admin) {
        setProfile(data);
        setLoading(false);
        return;
      }
      if (branding.organizationId && data.organization_id !== branding.organizationId) {
        setOrgMismatch(true);
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(data);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    setDemoError('');
    setOrgMismatch(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setProfile(null);
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.includes('auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, demoError, orgMismatch, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
