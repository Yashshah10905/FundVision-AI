import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, TrendingUp, Loader2, Download, Plus, Sparkles, ShoppingCart, Fuel, Briefcase, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PlaidLink from '../components/PlaidLink';
import { useNotifications } from '../context/NotificationContext';
import { exportToCSV } from '../lib/csvExport';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const notifiedCategories = React.useRef<Set<string>>(new Set());
  const [stats, setStats] = useState({
    balance: 0,
    spending: 0,
    income: 0,
    budgetProgress: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>("Analyzing your financial ecosystem...");

  const [categoryProgress, setCategoryProgress] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);
      
      setRecentTransactions(txData || []);

      const { data: allTx } = await supabase
        .from('transactions')
        .select('amount, type, date, category')
        .order('date', { ascending: true });
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      let balance = 0;
      let spending = 0;
      let income = 0;
      const catSpending: Record<string, number> = {};
      
      // Prepare chart data (daily balance for last 30 days)
      const dailyData: Record<string, number> = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      allTx?.forEach(tx => {
        const amt = Number(tx.amount);
        const txDate = new Date(tx.date);
        const isCurrentMonth = txDate.getMonth() + 1 === currentMonth && txDate.getFullYear() === currentYear;

        if (tx.type === 'income') {
          balance += amt;
          if (isCurrentMonth) income += amt;
        } else {
          balance -= amt;
          if (isCurrentMonth) {
            spending += amt;
            // Map legacy categories to new ones for consistent display
            let cat = tx.category;
            if (cat === 'Food') cat = 'Dining';
            if (cat === 'Entertainment') cat = 'Lifestyle';
            catSpending[cat] = (catSpending[cat] || 0) + amt;
          }
        }

        if (txDate >= thirtyDaysAgo) {
          const dateStr = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyData[dateStr] = balance;
        }
      });

      const formattedChartData = Object.entries(dailyData).map(([date, value]) => ({
        date,
        value
      }));

      setChartData(formattedChartData);

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      const totalGoal = budgetData?.total_goal || 0;
      const budgetProgress = totalGoal > 0 ? Math.min((spending / totalGoal) * 100, 100) : 0;

      // Calculate category progress
      const limits = budgetData?.category_limits || {};
      const progressItems = Object.entries(limits).map(([cat, limit]) => {
        const spent = catSpending[cat] || 0;
        const limitNum = Number(limit);
        const isOver = spent > limitNum && limitNum > 0;

        if (isOver && !notifiedCategories.current.has(cat)) {
          addNotification({
            type: 'overspend',
            title: 'Budget Alert',
            message: `You've exceeded your ${cat} budget by ${formatCurrency(spent - limitNum, profile?.currency)}.`,
          });
          notifiedCategories.current.add(cat);
        }

        return {
          name: cat,
          spent,
          limit: limitNum,
          percent: limitNum > 0 ? (spent / limitNum) * 100 : 0,
          isOver
        };
      }).sort((a, b) => b.percent - a.percent).slice(0, 3);

      setCategoryProgress(progressItems);
      setStats({
        balance,
        spending,
        income,
        budgetProgress
      });

      const { getFinancialAdvice } = await import('../services/aiService');
      const insight = await getFinancialAdvice(txData || [], budgetData || {}, profile?.currency);
      setAiInsight(insight);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      if (data) {
        exportToCSV(data, `fundvision_export_${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-surface-container-low transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Editorial Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary-container mb-3">Wealth Overview</h1>
            <p className="text-on-surface-variant font-medium text-lg opacity-80">Your financial ecosystem at a glance, meticulously curated.</p>
          </div>
          <div className="flex gap-3">
            <PlaidLink onSuccess={() => fetchDashboardData()} />
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
            <Link to="/transactions" className="flex items-center gap-2 px-6 py-3 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:-translate-y-0.5 transition-all active:scale-95">
              <Plus className="w-5 h-5" />
              <span>Manual Entry</span>
            </Link>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Hero Portfolio Card */}
          <div className="col-span-12 lg:col-span-8 rounded-3xl bg-primary-container p-10 text-white relative overflow-hidden hero-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-secondary font-black uppercase tracking-[0.2em] text-[10px]">Total Net Worth</h3>
                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Live Updates</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-10">
                <span className="text-6xl md:text-7xl font-black tracking-tighter">{formatCurrency(stats.balance, profile?.currency)}</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/20 text-secondary text-sm font-black rounded-lg border border-secondary/20">
                  <TrendingUp className="w-4 h-4" />
                  +4.2%
                </span>
              </div>
              
              {/* Growth Sparkline Visualization */}
              <div className="w-full h-48 mt-6 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }}
                      minTickGap={30}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#059669', fontWeight: 'bold' }}
                      formatter={(value: number) => [formatCurrency(value, profile?.currency), 'Net Worth']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#059669" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>
          </div>

          {/* Side Metric Cards */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="group flex-1 bg-white p-7 rounded-3xl border border-slate-100 hover:border-secondary/30 transition-all duration-300 editorial-shadow hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-500">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Income</span>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">Monthly Average</p>
              <p className="text-3xl font-black text-primary-container tracking-tight">{formatCurrency(stats.income, profile?.currency)}</p>
            </div>
            <div className="group flex-1 bg-white p-7 rounded-3xl border border-slate-100 hover:border-error/30 transition-all duration-300 editorial-shadow hover:-translate-y-1 cursor-pointer">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform duration-500">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Outflow</span>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">Monthly Spending</p>
              <p className="text-3xl font-black text-primary-container tracking-tight">{formatCurrency(stats.spending, profile?.currency)}</p>
            </div>
          </div>

          {/* Budget Performance Chart */}
          <div className="col-span-12 lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 editorial-shadow">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-primary-container tracking-tight">Budget Performance</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Allocation efficiency vs goals</p>
              </div>
              <div className="relative">
                <select className="appearance-none bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl focus:ring-secondary focus:border-secondary py-2.5 pl-4 pr-10 cursor-pointer text-slate-600">
                  <option>This Month</option>
                  <option>Last Quarter</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 rotate-90" />
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-sm font-bold mb-3 px-1">
                  <span className="text-slate-700">Monthly Budget Progress</span>
                  <span className="text-slate-500">{stats.budgetProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(5,150,105,0.2)]",
                      stats.budgetProgress > 100 ? "bg-error" : "bg-secondary"
                    )}
                    style={{ width: `${stats.budgetProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {categoryProgress.length > 0 ? (
                categoryProgress.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm font-bold mb-3 px-1">
                      <span className="text-slate-700">{item.name}</span>
                      <span className={cn(item.isOver ? "text-error font-black" : "text-slate-500")}>
                        {item.isOver ? "Over Budget" : `${item.percent.toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          item.isOver ? "bg-error shadow-[0_0_8px_rgba(186,26,26,0.2)]" : "bg-secondary/60 shadow-[0_0_8px_rgba(5,150,105,0.1)]"
                        )}
                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Departmental Limits Set</p>
                  <Link to="/budget" className="text-[10px] text-secondary font-black hover:underline mt-2 inline-block">Configure Strategy</Link>
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="col-span-12 lg:col-span-5 bg-primary-container p-8 rounded-3xl ai-glow text-white self-stretch flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-secondary/20 rounded-2xl ring-1 ring-secondary/30">
                <Sparkles className="text-secondary w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">AI Insights</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Neural Analysis Active</p>
              </div>
            </div>
            <div className="space-y-4 flex-1">
              <div className="group p-5 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/[0.08] hover:border-secondary/30 cursor-default">
                <p className="text-sm font-medium leading-relaxed text-slate-200">
                  {aiInsight}
                </p>
              </div>
            </div>
            <Link to="/chat" className="w-full mt-10 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 text-center">
              Expand All Recommendations
            </Link>
          </div>

          {/* Recent Transactions */}
          <div className="col-span-12 bg-white p-10 rounded-3xl border border-slate-100 editorial-shadow">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-primary-container tracking-tight">Recent Activity</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase tracking-wider">Last 7 Days</span>
              </div>
              <Link to="/transactions" className="text-secondary text-sm font-black hover:underline underline-offset-4 transition-all">View Ledger</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-6 hover:bg-slate-50/50 px-6 -mx-6 rounded-2xl transition-all group cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                      {tx.category === 'Dining' ? <ShoppingCart className="w-6 h-6" /> : 
                       tx.category === 'Transport' ? <Fuel className="w-6 h-6" /> : 
                       tx.category === 'Lifestyle' ? <Sparkles className="w-6 h-6" /> :
                       tx.type === 'income' ? <Briefcase className="w-6 h-6" /> : 
                       <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-black text-primary-container text-lg leading-none mb-1">{tx.description}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-black text-lg mb-1", tx.type === 'income' ? "text-secondary" : "text-slate-900")}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), profile?.currency)}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black rounded uppercase tracking-widest">Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
