import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@humahijabcollection.com');
  const [password, setPassword] = useState('HumaAdmin@2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid administrator credentials. Access restricted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-brand-surface border border-brand-border/80 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-gold/40 flex items-center justify-center text-brand-gold shadow-lg shadow-black/50 mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            HUMA HIJAB COLLECTION
          </h1>
          <p className="text-xs uppercase tracking-widest text-brand-gold font-medium mt-1">
            Executive Admin Portal
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Restricted access for authorized personnel only. All access is logged and audited.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/50 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@humahijabcollection.com"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-semibold text-sm rounded-xl transition-all shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-brand-border text-center">
          <p className="text-[11px] text-slate-400">
            Protected by enterprise-grade cryptographic authentication & audit telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};
