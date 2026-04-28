import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { startFinancialChat, withRetry } from '../services/aiService';
import { Send, Bot, User, Loader2, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello. I am your professional Financial Analysis Assistant. I'm here to provide clear, actionable insights for your budgeting and financial planning. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<{ transactions: any[], budget: any }>({ transactions: [], budget: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchFinancialContext();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchFinancialContext() {
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);
    
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', new Date().getMonth() + 1)
      .eq('year', new Date().getFullYear())
      .single();

    setFinancialData({
      transactions: txData || [],
      budget: budgetData || null
    });
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const chat = await startFinancialChat(messages, financialData.transactions, financialData.budget, profile?.currency);
      const result = await withRetry(() => chat.sendMessage({ message: userMessage }));
      
      setMessages(prev => [...prev, { role: 'assistant', content: result.text || "I'm sorry, I don't have that specific information. Please contact our support team at support@fundvision.com." }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      if (error?.message?.includes('429') || error?.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: "The neural core is currently saturated with requests. Please allow a brief moment for synchronization before inquiring again." }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Connection to the neural core has been severed. Please verify your Gemini API configuration." }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 bg-surface-container-low transition-all duration-300 min-h-screen flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-8">
        {/* Editorial Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary-container rounded-3xl ai-glow flex items-center justify-center text-secondary">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary-container mb-2">Financial Analyst</h1>
              <p className="text-on-surface-variant font-medium text-lg opacity-80">Professional budgeting insights.</p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ role: 'assistant', content: "Session reset. How can I help you with your budget?" }])}
            className="p-3 text-slate-400 hover:text-error hover:bg-error/5 rounded-2xl transition-all"
            title="Purge Session"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Interface Container */}
        <div className="flex-1 bg-white rounded-[40px] border border-slate-100 editorial-shadow overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none"></div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 relative z-10">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex gap-6 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-slate-100 text-primary-container" : "bg-primary-container text-secondary ai-glow"
                  )}>
                    {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                  </div>
                  <div className={cn(
                    "p-6 rounded-3xl text-base font-medium leading-relaxed editorial-shadow",
                    msg.role === 'user' 
                      ? "bg-white text-primary-container rounded-tr-none border border-slate-100" 
                      : "bg-primary-container text-slate-100 rounded-tl-none border border-white/5"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="space-y-4">
                        {(() => {
                          try {
                            const data = JSON.parse(msg.content);
                            return (
                              <div className="space-y-6">
                                <p className="text-lg font-bold border-b border-white/20 pb-2">{data.summary}</p>
                                
                                {data.budgetData && data.budgetData.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-secondary opacity-70">Budget Breakdown</h4>
                                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                      <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5">
                                          <tr>
                                            <th className="px-4 py-2 font-bold">Category</th>
                                            <th className="px-4 py-2 font-bold text-right">Budget</th>
                                            <th className="px-4 py-2 font-bold text-right">Actual</th>
                                            <th className="px-4 py-2 font-bold text-center">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                          {data.budgetData.map((item: any, i: number) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                              <td className="px-4 py-2">{item.category}</td>
                                              <td className="px-4 py-2 text-right">{item.budgetLimit}</td>
                                              <td className="px-4 py-2 text-right">{item.actualSpending}</td>
                                              <td className={cn(
                                                "px-4 py-2 text-center font-bold text-[10px] uppercase",
                                                item.status === 'Over Budget' ? "text-red-400" : "text-green-400"
                                              )}>{item.status}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                                
                                {data.actionableTips && data.actionableTips.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-secondary opacity-70">Actionable Tips</h4>
                                    <ul className="space-y-2">
                                      {data.actionableTips.map((tip: string, i: number) => (
                                        <li key={i} className="flex gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/5 group">
                                          <ChevronRight className="w-4 h-4 mt-1 text-secondary transition-transform group-hover:translate-x-1" />
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          } catch (e) {
                            return <p>{msg.content}</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6 mr-auto"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-container text-secondary flex items-center justify-center ai-glow">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="bg-primary-container p-6 rounded-3xl rounded-tl-none border border-white/5 editorial-shadow">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-secondary rounded-full animate-bounce"></span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 relative z-10">
            <form onSubmit={handleSend} className="relative group">
              <input
                type="text"
                placeholder="Ask about your budget, spending analysis, or financial goals..."
                className="w-full pl-8 pr-20 py-6 bg-white border border-slate-200 rounded-[30px] text-primary-container font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all editorial-shadow"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-secondary text-white p-4 rounded-2xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 active:scale-95 group-hover:translate-x-1"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Financial Analyst Active • Budget Optimized
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
