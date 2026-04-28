import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, AlertCircle, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'feedback' | 'issue'>('feedback');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setStatus('idle');

    const { error } = await supabase
      .from('user_feedback')
      .insert([
        {
          user_id: user?.id || null,
          type: type,
          message: message,
          status: 'pending'
        }
      ]);

    if (error) {
      console.error('Feedback error:', error);
      setStatus('error');
    } else {
      setStatus('success');
      setMessage('');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    }
    setLoading(false);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary-container/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-primary-container tracking-tight">Transmission</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback & Support</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-primary-container hover:bg-white rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {status === 'success' ? (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-primary-container tracking-tight">Transmission Received</h4>
                  <p className="text-slate-500 font-medium">Thank you for your input. Our analysts will review the data.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setType('feedback')}
                      className={cn(
                        "flex-1 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all",
                        type === 'feedback' 
                          ? "bg-white text-secondary shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('issue')}
                      className={cn(
                        "flex-1 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all",
                        type === 'issue' 
                          ? "bg-white text-error shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Report Issue
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Message</label>
                    <textarea
                      required
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={type === 'feedback' ? "Share your thoughts on how to improve FundVision..." : "Please describe the issue in detail..."}
                      className="w-full p-5 bg-slate-50 border-none rounded-2xl text-primary-container font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-secondary/20 outline-none transition-all resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="p-4 bg-error/5 border border-error/10 rounded-2xl flex items-center gap-3 text-error text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      Failed to transmit. Please check your connection.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="w-full py-5 bg-primary-container text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:bg-primary-container/90 transition-all shadow-xl shadow-primary-container/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Initialize Transmission</span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
