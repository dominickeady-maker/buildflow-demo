// © 2026 Cornerstone Developments Ltd. All rights reserved. Unauthorised copying prohibited.
import { Shield } from 'lucide-react';

export default function Footer({ onTermsClick }: { onTermsClick?: () => void }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 mt-8 py-4 px-4 text-center">
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 flex-wrap">
        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
        <span>&copy; {year} Cornerstone Developments Ltd. All rights reserved.</span>
        {onTermsClick && (
          <>
            <span className="text-slate-600">|</span>
            <button
              onClick={onTermsClick}
              className="text-slate-400 hover:text-brand-400 transition-colors underline-offset-2 hover:underline"
            >
              Terms of Service
            </button>
          </>
        )}
      </div>
    </footer>
  );
}
