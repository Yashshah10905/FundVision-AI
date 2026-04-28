import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, MessageSquare, AlertCircle, Loader2, Save, Mail, Key, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Feedback & Issue Reporting
  const [feedback, setFeedback] = useState('');
  const [issueType, setIssueType] = useState<'feedback' | 'issue'>('feedback');
  const [submitting, setSubmitting] = useState(false);

  async function handleResetPassword() {
    if (!user?.email) return;
    setLoading(true);
    setMessage(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/profile`,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
    }
    setLoading(false);
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !feedback.trim()) return;
    setSubmitting(true);
    setMessage(null);

    const { error } = await supabase
      .from('user_feedback')
      .insert([
        {
          user_id: user.id,
          type: issueType,
          message: feedback,
          status: 'pending'
        }
      ]);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to submit. Please try again later.' });
    } else {
      setMessage({ type: 'success', text: 'Thank you! Your message has been received.' });
      setFeedback('');
    }
    setSubmitting(false);
  }

  return (
    <div className="p-8 bg-surface-container-low transition-all duration-300 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Editorial Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary-container mb-3">System Control</h1>
            <p className="text-on-surface-variant font-medium text-lg opacity-80">Configure your neural environment and report anomalies.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Security Section */}
          <div className="bg-white p-10 rounded-3xl border border-slate-100 editorial-shadow">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-container">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-primary-container tracking-tight">Security & Access</h2>
                <p className="text-sm font-medium text-slate-400">Manage your credentials and authentication protocols.</p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-primary-container tracking-tight">Password Reset</p>
                  <p className="text-xs font-medium text-slate-400">Request a secure link to update your access key.</p>
                </div>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="px-6 py-3 bg-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary-container/10 hover:bg-primary-container/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Reset Link</span>
              </button>
            </div>
          </div>

          {/* Feedback & Support Section */}
          <div className="bg-white p-10 rounded-3xl border border-slate-100 editorial-shadow">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-container">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-primary-container tracking-tight">Support & Feedback</h2>
                <p className="text-sm font-medium text-slate-400">Report issues or suggest neural optimizations.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIssueType('feedback')}
                  className={cn(
                    "flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                    issueType === 'feedback' 
                      ? "bg-secondary/5 border-secondary/20 text-secondary" 
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  General Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setIssueType('issue')}
                  className={cn(
                    "flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                    issueType === 'issue' 
                      ? "bg-error/5 border-error/20 text-error" 
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  Report an Issue
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Message Content</label>
                <textarea
                  required
                  rows={5}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={issueType === 'feedback' ? "How can we improve your experience?" : "Describe the anomaly you encountered..."}
                  className="w-full p-6 bg-slate-50 border-none rounded-2xl text-primary-container font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-secondary outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="w-full py-5 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>Submit Transmission</span>
              </button>
            </form>
          </div>

          {message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-6 rounded-3xl text-sm font-bold flex items-center gap-4 border editorial-shadow",
                message.type === 'success' ? "bg-secondary/5 border-secondary/10 text-secondary" : "bg-error/5 border-error/10 text-error"
              )}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              {message.text}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
