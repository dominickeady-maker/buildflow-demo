// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBranding } from '../contexts/BrandingContext';
import { KeyRound, Check, Loader2 } from 'lucide-react';
import Footer from './Footer';

export default function SetPassword() {
  const { branding } = useBranding();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Check if we have a valid session from the invite/reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setVerifying(false);
      } else {
        // No session — the redirect from the email link should have set one
        // If not, check the URL hash for access_token (Supabase uses hash-based redirects)
        setVerifying(false);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const logo = branding.isBranded && branding.logoUrl
    ? branding.logoUrl
    : '/banksman-logo-full-dark-bg.png';
  const logoAlt = branding.isBranded && branding.displayName
    ? branding.displayName
    : 'Banksman';

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-4">
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
        <div className="flex items-center justify-center mb-8">
          <img src={logo} alt={logoAlt} className="max-w-[300px] w-full h-auto" />
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-500/20 rounded-full p-3">
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white">Password Set</h2>
            <p className="text-slate-400 text-sm">
              Your password has been set successfully. You can now sign in.
            </p>
            <a
              href="/"
              className="inline-block w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-lg transition-all text-center"
            >
              Go to Sign In
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white text-center">Set Your Password</h2>
              <p className="text-slate-400 text-sm text-center mt-2">
                Choose a password to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 transition-all"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 transition-all"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Set Password
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="relative z-10 mt-4 w-full max-w-md">
        <Footer />
      </div>
    </div>
  );
}
