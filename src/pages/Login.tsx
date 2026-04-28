import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, Shield, AlertCircle, ChevronLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setResetSent(true);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (error) throw error;
        setSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[40px] editorial-shadow border border-slate-100 text-center">
          <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h2 className="text-3xl font-black text-primary-container tracking-tight">Configuration Required</h2>
          <p className="mt-4 text-slate-500 font-medium">
            To use FundVision, you need to connect your Supabase project.
          </p>
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl text-sm text-slate-600 text-left border border-slate-100">
            <p className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-3">Missing Environment Variables</p>
            <ul className="space-y-2 font-bold">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                VITE_SUPABASE_URL
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                VITE_SUPABASE_ANON_KEY
              </li>
            </ul>
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Configure via the Secrets panel
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8 bg-white p-12 rounded-[40px] editorial-shadow border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-secondary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-secondary" />
          </div>
          <h2 className="text-4xl font-black text-primary-container tracking-tight">Check your inbox</h2>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed">
            We've sent a verification link to <span className="text-primary-container font-bold">{email}</span>. Please confirm your account to continue.
          </p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-10 w-full py-4 bg-slate-100 text-primary-container rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[120px] -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-[100px] -ml-20 -mb-20"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white p-10 md:p-12 rounded-[48px] editorial-shadow border border-slate-100">
          <div className="flex justify-center mb-10">
            <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center text-secondary ai-glow">
              <Sparkles className="w-8 h-8" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-primary-container tracking-tight mb-3">
              {isForgotPassword ? 'Neural Recovery' : isSignUp ? 'Create Identity' : 'Neural Access'}
            </h2>
            <p className="text-slate-400 font-medium">
              {isForgotPassword ? 'Restore your access key' : isSignUp ? 'Join the FundVision ecosystem' : 'Secure entry to your fiscal core'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {isSignUp && !isForgotPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-secondary transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="Alexander Hamilton"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-primary-container font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-secondary outline-none transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-secondary transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="name@nexus.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-primary-container font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-secondary outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-secondary transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-primary-container font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-secondary outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-error/5 border border-error/10 rounded-xl flex items-center gap-3 text-error text-xs font-bold"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {resetSent && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-secondary/5 border border-secondary/10 rounded-xl flex items-center gap-3 text-secondary text-xs font-bold"
              >
                <Shield className="w-4 h-4" />
                Reset link sent to your inbox!
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary-container text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-container/90 transition-all shadow-xl shadow-primary-container/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? 'Send Recovery Link' : isSignUp ? 'Initialize Account' : 'Authenticate'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                  setResetSent(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
              }}
              className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-secondary transition-colors"
            >
              {isForgotPassword ? 'Back to Neural Access' : isSignUp ? 'Already registered? Sign In' : 'New to FundVision? Create Identity'}
            </button>
          </div>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-4 bg-white text-slate-300 font-black uppercase tracking-[0.3em]">Sandbox Access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEmail('demo@fundvision.com');
              setPassword('password123');
            }}
            className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:text-primary-container transition-all flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Inject Demo Credentials
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-primary-container transition-colors text-xs font-bold">
            <ChevronLeft className="w-4 h-4" />
            Back to Landing
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
