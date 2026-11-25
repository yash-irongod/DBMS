import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
        <h1 className="text-2xl font-bold text-charcoal-900 font-serif">Create your SaathSpace account</h1>
        <p className="text-xs text-charcoal-500">Join to discover verified rental rooms and match with compatible roommates</p>
      </div>

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
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
              className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya.sharma@example.com"
              required
              className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-charcoal-500 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              minLength={6}
              className="w-full p-3 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-charcoal-800 focus:outline-none focus:border-forest-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-charcoal-500 pt-2 border-t border-cream-200">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-forest-800 hover:underline">
            Log in
          </Link>
        </p>
      </div>

    </div>
  );
};
