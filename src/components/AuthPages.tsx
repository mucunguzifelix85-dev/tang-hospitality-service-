import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { User } from '../types.js';
import { LogIn, UserPlus, ShieldAlert, Coffee } from 'lucide-react';

interface AuthPagesProps {
  onAuthSuccess: (user: User) => void;
  defaultToRegister?: boolean;
}

export function AuthPages({ onAuthSuccess, defaultToRegister = false }: AuthPagesProps) {
  const [isRegister, setIsRegister] = useState(defaultToRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login attempt failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fully fill out all required register fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.register(name, email, password, role);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try registering another email.');
    } finally {
      setLoading(false);
    }
  }

  // Helper login bypassing manual typing for developers
  async function triggerQuickLogin(roleSelected: 'customer' | 'admin') {
    setError('');
    setLoading(true);
    const quickEmail = roleSelected === 'admin' ? 'admin@bistro.com' : 'customer@bistro.com';
    const quickPass = roleSelected === 'admin' ? 'admin123' : 'customer123';
    try {
      const res = await api.login(quickEmail, quickPass);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="auth-container" className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div id="brand-logo-badge" className="h-16 w-16 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3 animate-pulse">
          <Coffee className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-950 tracking-tight">Le Petit Bistro</h1>
        <p className="text-sm text-slate-500 mt-1">Gourmet Fare &amp; Fine Wine Booking Manager</p>
      </div>

      <div id="auth-card" className="w-full max-w-md bg-white border border-slate-100/80 rounded-2xl p-8 shadow-xl shadow-slate-100">
        <div className="flex justify-center space-x-1 p-1 bg-slate-50 rounded-xl mb-6">
          <button
            id="switch-to-login"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              !isRegister 
                ? 'bg-white shadow text-slate-900 border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            id="switch-to-register"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              isRegister 
                ? 'bg-white shadow text-slate-900 border border-slate-100' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div id="auth-error-banner" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isRegister ? (
          <form id="form-register" onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder=" Felix Diner"
                required
                className="w-full py-2.5 px-3.5 border border-slate-200/80 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="felix@diner.com"
                required
                className="w-full py-2.5 px-3.5 border border-slate-200/80 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                id="reg-pass"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full py-2.5 px-3.5 border border-slate-200/80 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Role</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <label className="relative border border-slate-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">Customer</span>
                    <span className="text-[10px] text-slate-500">Order &amp; book meals</span>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'customer'}
                    onChange={() => setRole('customer')}
                    className="accent-amber-500 h-4 w-4"
                  />
                </label>
                <label className="relative border border-slate-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900">Staff/Admin</span>
                    <span className="text-[10px] text-slate-500">Manage orders &amp; menu</span>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                    className="accent-amber-500 h-4 w-4"
                  />
                </label>
              </div>
            </div>
            <button
              id="submit-register"
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-amber-500/10 mt-2 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form id="form-login" onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="customer@bistro.com"
                required
                className="w-full py-2.5 px-3.5 border border-slate-200/80 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <input
                id="login-pass"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full py-2.5 px-3.5 border border-slate-200/80 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <button
              id="submit-login"
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-1 shadow-md shadow-amber-500/10 mt-3 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Quick Swapping Bypass panel for developer ease-of-use */}
        <div id="quick-swap-panel" className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Aesthetic Testing Port</span>
            <span className="px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded text-[9px] font-bold">Quick Auth</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="quick-customer-btn"
              onClick={() => triggerQuickLogin('customer')}
              disabled={loading}
              className="group border border-emerald-100/80 hover:border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/70 p-3 rounded-xl text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                Customer View
              </p>
              <p className="text-[10px] text-emerald-600/90 mt-0.5 font-normal">felix@diner.com</p>
              <span className="inline-block text-[9px] font-mono text-emerald-500 mt-1.5 group-hover:underline">Instant Launch &rarr;</span>
            </button>
            <button
              id="quick-admin-btn"
              onClick={() => triggerQuickLogin('admin')}
              disabled={loading}
              className="group border border-indigo-100/80 hover:border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50/70 p-3 rounded-xl text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-semibold text-indigo-800 flex items-center gap-1">
                Admin View
              </p>
              <p className="text-[10px] text-indigo-600/90 mt-0.5 font-normal">admin@bistro.com</p>
              <span className="inline-block text-[9px] font-mono text-indigo-500 mt-1.5 group-hover:underline">Instant Launch &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
