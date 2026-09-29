// © 2026 DM.AI 4U. All rights reserved. Unauthorised copying prohibited.
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ExternalLink } from 'lucide-react';
import Footer from './Footer';
import TermsOfService from './TermsOfService';

export default function Auth({ onTermsClick, showTerms, onCloseTerms }: { onTermsClick?: () => void; showTerms?: boolean; onCloseTerms?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, demoError } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-4">
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
        <div className="flex items-center justify-center mb-8">
          <img src="/banksman-logo-full-dark-bg.png" alt="Banksman" className="max-w-[300px] w-full h-auto" />
        </div>

        <div className="mb-6">
          <div className="flex border-b border-slate-600">
            <div className="flex-1 pb-3 text-center font-medium text-brand-500 border-b-2 border-brand-500">
              Sign In
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 transition-all"
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 transition-all"
              required
              autoComplete="current-password"
            />
          </div>

          {(error || demoError) && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error || demoError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Not got an account yet?</h2>
          <p className="text-sm text-slate-400 mb-3">Banksman accounts are set up when you subscribe.</p>
          <a
            href="https://banksman.app/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            See pricing
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="relative z-10 mt-4">
        <Footer onTermsClick={onTermsClick} />
      </div>
      {showTerms && <TermsOfService onClose={onCloseTerms!} />}
    </div>
  );
}
