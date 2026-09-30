// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type Branding = {
  organizationId: string | null;
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  subdomain: string | null;
  isBranded: boolean;
};

const DEFAULT_BRANDING: Branding = {
  organizationId: null,
  displayName: null,
  logoUrl: null,
  primaryColor: '#ff7a2e',
  subdomain: null,
  isBranded: false,
};

type BrandingContextType = {
  branding: Branding;
  loading: boolean;
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

function getHostname(): string {
  return window.location.hostname;
}

function isAppBanksman(hostname: string): boolean {
  return hostname === 'app.banksman.app' || hostname === 'localhost' || hostname === '127.0.0.1';
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBranding() {
      const hostname = getHostname();

      if (isAppBanksman(hostname)) {
        setBranding(DEFAULT_BRANDING);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_org_by_hostname', {
        host_name: hostname,
      });

      if (error || !data || data.length === 0) {
        setBranding(DEFAULT_BRANDING);
        setLoading(false);
        return;
      }

      const org = data[0];
      const color = org.primary_color || '#ff7a2e';

      setBranding({
        organizationId: org.id,
        displayName: org.display_name || org.name,
        logoUrl: org.logo_url,
        primaryColor: color,
        subdomain: org.subdomain,
        isBranded: true,
      });

      applyAccentColor(color);
      setLoading(false);
    }

    loadBranding();
  }, []);

  function applyAccentColor(color: string) {
    const root = document.documentElement;
    root.style.setProperty('--brand-300', lightenColor(color, 20));
    root.style.setProperty('--brand-400', lightenColor(color, 10));
    root.style.setProperty('--brand-500', color);
    root.style.setProperty('--brand-600', darkenColor(color, 10));
    root.style.setProperty('--brand-700', darkenColor(color, 20));
    root.style.setProperty('--brand-800', darkenColor(color, 30));
    root.style.setProperty('--brand-900', darkenColor(color, 40));
  }

  if (branding.isBranded && branding.displayName) {
    document.title = `${branding.displayName} — Site Management`;
  }

  if (branding.isBranded) {
    const favicon = document.querySelector("link[rel='icon'][type='image/svg+xml']") as HTMLLinkElement | null;
    if (favicon && branding.logoUrl) {
      favicon.href = branding.logoUrl;
    }
    const themeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null;
    if (themeColor) {
      themeColor.content = branding.primaryColor;
    }
  }

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within an BrandingProvider');
  }
  return context;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lightenColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = percent / 100;
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
}

function darkenColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - percent / 100;
  return rgbToHex(r * factor, g * factor, b * factor);
}
