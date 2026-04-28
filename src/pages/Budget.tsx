import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PieChart, Target, Save, Loader2, Sparkles, TrendingUp, AlertCircle, ChevronRight, Download } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Budget {
  id: string;
  month: number;
  year: number;
  total_goal: number;
  category_limits: Record<string, number>;
  saved_amount: number;
}

export default function Budget() {
  const { user, profile } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spendingByMonth, setSpendingByMonth] = useState(0);
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (user) {
      fetchBudgetData();
      fetchCurrentMonthSpending();
    }
  }, [user]);

  async function fetchBudgetData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching budget:', error);
    } else {
      setBudget(data || {
        month: currentMonth,
        year: currentYear,
        total_goal: 0,
        category_limits: {},
        saved_amount: 0
      });
    }
    setLoading(false);
  }

  async function fetchCurrentMonthSpending() {
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, category, type')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (error) {
      console.error('Error fetching spending:', error);
      return;
    }

    let total = 0;
    const catMap: Record<string, number> = {};

    data?.forEach(tx => {
      if (tx.type === 'expense') {
        const amt = Number(tx.amount);
        total += amt;
        
        // Map legacy categories to new ones
        let cat = tx.category;
        if (cat === 'Food') cat = 'Dining';
        if (cat === 'Entertainment') cat = 'Lifestyle';
        
        catMap[cat] = (catMap[cat] || 0) + amt;
      }
    });

    setSpendingByMonth(total);
    setCategorySpending(catMap);
  }

  async function handleSaveBudget() {
    if (!user || !budget) return;
    setSaving(true);

    const budgetData = {
      user_id: user.id,
      month: currentMonth,
      year: currentYear,
      total_goal: budget.total_goal,
      category_limits: budget.category_limits,
      saved_amount: budget.saved_amount
    };

    const { error } = await supabase
      .from('budgets')
      .upsert(budgetData, { onConflict: 'user_id, month, year' });

    if (error) {
      console.error('Error saving budget:', error);
    } else {
      fetchBudgetData();
    }
    setSaving(false);
  }

  const progress = budget?.total_goal ? (spendingByMonth / budget.total_goal) * 100 : 0;
  const isOverBudget = spendingByMonth > (budget?.total_goal || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-surface-container-low transition-all duration-300 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Editorial Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary-container mb-3">Budget Strategy</h1>
            <p className="text-on-surface-variant font-medium text-lg opacity-80">Strategic allocation and fiscal discipline.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveBudget}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Commit Strategy</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Budget Goal Card */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white p-10 rounded-3xl border border-slate-100 editorial-shadow">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <Target className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary-container tracking-tight">Monthly Allocation</h2>
                  <p className="text-sm font-medium text-slate-400">Define your total spending ceiling for {new Date().toLocaleString('default', { month: 'long' })}.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-end gap-8 mb-12">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Budget Goal</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">
                      {getCurrencySymbol(profile?.currency)}
                    </span>
                    <input
                      type="number"
                      className="w-full pl-10 pr-6 py-5 bg-slate-50 border-none rounded-2xl text-3xl font-black text-primary-container focus:ring-2 focus:ring-secondary outline-none transition-all"
                      value={budget?.total_goal || ''}
                      onChange={e => setBudget(prev => prev ? { ...prev, total_goal: parseFloat(e.target.value) || 0 } : null)}
                    />
                  </div>
                </div>
                <div className="text-right pb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Current Outflow</p>
                  <p className={cn("text-3xl font-black tracking-tight", isOverBudget ? "text-error" : "text-primary-container")}>
                    {formatCurrency(spendingByMonth, profile?.currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-500">Utilization Efficiency</span>
                  <span className={cn(isOverBudget ? "text-error" : "text-secondary")}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.05)]",
                      isOverBudget ? "bg-error" : "bg-secondary"
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                {isOverBudget && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mt-6 p-4 bg-error/5 border border-error/10 rounded-2xl text-error text-sm font-bold"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Alert: You have exceeded your strategic ceiling by {formatCurrency(spendingByMonth - (budget?.total_goal || 0), profile?.currency)}.</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Category Limits Bento */}
            <div className="bg-white p-10 rounded-3xl border border-slate-100 editorial-shadow">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-primary-container tracking-tight">Departmental Limits</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Granular Control</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['Dining', 'Transport', 'Utilities', 'Lifestyle', 'Shopping', 'Health'].map(cat => (
                  <div key={cat} className="group space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-sm font-black text-primary-container uppercase tracking-wider">{cat}</label>
                      <span className="text-[10px] font-bold text-slate-400">
                        Spent: {formatCurrency(categorySpending[cat] || 0, profile?.currency)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        {getCurrencySymbol(profile?.currency)}
                      </span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-primary-container focus:ring-2 focus:ring-secondary outline-none transition-all group-hover:bg-slate-100"
                        placeholder="No limit set"
                        value={budget?.category_limits[cat] || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setBudget(prev => prev ? {
                            ...prev,
                            category_limits: { ...prev.category_limits, [cat]: val }
                          } : null);
                        }}
                      />
                    </div>
                    {budget?.category_limits[cat] && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-700",
                            (categorySpending[cat] || 0) > budget.category_limits[cat] ? "bg-error" : "bg-secondary/60"
                          )}
                          style={{ width: `${Math.min(((categorySpending[cat] || 0) / budget.category_limits[cat]) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: AI Insights & Quick Stats */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-primary-container rounded-3xl p-8 text-white ai-glow relative overflow-hidden flex flex-col min-h-[320px]">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-secondary/20 rounded-xl ring-1 ring-secondary/30">
                    <Sparkles className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">AI Strategist</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary">Neural Optimization</p>
                  </div>
                </div>
                <p className="text-slate-200 text-sm font-medium leading-relaxed mb-8 flex-1">
                  "Based on your historical velocity, I recommend increasing your 'Utilities' allocation by 15% this month to prevent strategy breach. Your 'Entertainment' efficiency is currently optimal."
                </p>
                <button className="w-full py-4 bg-white/[0.05] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                  Optimize All Limits
                </button>
              </div>
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 editorial-shadow">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-black text-primary-container tracking-tight">Savings Target</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Target Accumulation</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {getCurrencySymbol(profile?.currency)}
                    </span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-xl text-lg font-black text-primary-container focus:ring-2 focus:ring-secondary outline-none transition-all"
                      value={budget?.saved_amount || ''}
                      onChange={e => setBudget(prev => prev ? { ...prev, saved_amount: parseFloat(e.target.value) || 0 } : null)}
                    />
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Projected Surplus</p>
                  <p className="text-3xl font-black text-primary-container tracking-tighter">
                    {formatCurrency(Math.max(0, (budget?.total_goal || 0) - spendingByMonth), profile?.currency)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-secondary text-[10px] font-black uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    Strategy Optimal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
