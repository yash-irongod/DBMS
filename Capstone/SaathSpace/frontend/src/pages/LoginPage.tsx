import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    api.getDemoUsers().then(res => setDemoUsers(res.demo_accounts || [])).catch(console.error);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
    setSubmitting(true);
    setError(null);
    try {
      await login(demoEmail, 'Demo@123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto shadow-sm">
          <Building2 className="w-6 h-6 text-forest-100" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal-900 font-serif">Welcome back to SaathSpace</h1>
        <p className="text-xs text-charcoal-500">Sign in to your member account or choose a Phase 1 demo persona</p>
      </div>

      {/* 1-Click Demo Personas Bar */}
      <div className="bg-forest-50/70 border border-forest-200 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
          <Sparkles className="w-4 h-4 text-forest-700" />
          <span>Quick 1-Click Demo Test Accounts</span>
        </div>
        <p className="text-[11px] text-charcoal-600 leading-tight">
          Select any seeded persona to log in instantly with their lifestyle profile and bookmarks:
        </p>

        <div className="grid grid-cols-2 gap-2">
          {demoUsers.map((u) => (
            <button
              key={u.user_id}
              type="button"
              onClick={() => handleQuickDemo(u.email)}
              className="p-2.5 bg-white hover:bg-forest-100/60 rounded-xl border border-forest-200 text-left transition-colors cursor-pointer group shadow-2xs"
            >
              <p className="font-bold text-xs text-charcoal-900 group-hover:text-forest-900">{u.full_name}</p>
              <p className="text-[10px] text-charcoal-500">{u.preferred_city || 'Delhi'} • {u.food_preference?.replace(/_/g, ' ')}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Standard Login Form */}
      <div className="bg-white rounded-3xl p-8 border border-cream-200 shadow-subtle space-y-6">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aarav.demo@example.test"
              required
              className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-charcoal-500 pt-2 border-t border-cream-200">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-forest-800 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

    </div>
  );
};
