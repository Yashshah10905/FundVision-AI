import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { categorizeTransaction } from '../services/aiService';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Loader2, CreditCard, ShoppingCart, Fuel, Briefcase, Download, X, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../context/NotificationContext';
import PlaidLink from '../components/PlaidLink';
import { exportToCSV } from '../lib/csvExport';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description: string;
}

export default function Transactions() {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTx, setNewTx] = useState({
    amount: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  });
  const [categorizing, setCategorizing] = useState(false);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) console.error('Error fetching transactions:', error);
    else setTransactions(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setCategorizing(true);
    
    try {
      if (editingTx) {
        // Update existing
        const { error } = await supabase
          .from('transactions')
          .update({
            amount: parseFloat(newTx.amount),
            description: newTx.description,
            type: newTx.type,
            date: newTx.date,
          })
          .eq('id', editingTx.id);

        if (error) throw error;
        setEditingTx(null);
      } else {
        // Create new
        const category = await categorizeTransaction(newTx.description);
        const { error } = await supabase.from('transactions').insert([
          {
            user_id: user.id,
            amount: parseFloat(newTx.amount),
            description: newTx.description,
            type: newTx.type,
            date: newTx.date,
            category: category
          }
        ]);
        if (error) throw error;

        addNotification({
          type: newTx.type === 'income' ? 'income' : 'transaction',
          title: newTx.type === 'income' ? 'Income Recorded' : 'Expense Recorded',
          message: `${newTx.description} for ${formatCurrency(parseFloat(newTx.amount), profile?.currency)} was successfully logged.`,
        });
      }

      setIsAdding(false);
      setNewTx({
        amount: '',
        description: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setCategorizing(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
    } else {
      setDeletingId(null);
      fetchTransactions();
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
        exportToCSV(data, `fundvision_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setNewTx({
      amount: tx.amount.toString(),
      description: tx.description,
      type: tx.type,
      date: tx.date
    });
    setIsAdding(true);
  };

  return (
    <div className="p-8 bg-surface-container-low transition-all duration-300 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Editorial Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary-container mb-3">Transaction Ledger</h1>
            <p className="text-on-surface-variant font-medium text-lg opacity-80">A meticulous record of your financial movements.</p>
          </div>
          <div className="flex gap-3">
            <PlaidLink onSuccess={() => fetchTransactions()} />
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setEditingTx(null);
                setNewTx({
                  amount: '',
                  description: '',
                  type: 'expense',
                  date: new Date().toISOString().split('T')[0]
                });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Transaction Modal */}
        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 bg-primary-container/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-primary-container tracking-tight">
                    {editingTx ? 'Edit Entry' : 'New Transaction'}
                  </h2>
                  <button onClick={() => { setIsAdding(false); setEditingTx(null); }} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Whole Foods Market"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-primary-container font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-secondary outline-none transition-all"
                      value={newTx.description}
                      onChange={e => setNewTx({...newTx, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Amount ({getCurrencySymbol(profile?.currency)})</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                          {getCurrencySymbol(profile?.currency)}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-xl text-primary-container font-bold focus:ring-2 focus:ring-secondary outline-none transition-all"
                          value={newTx.amount}
                          onChange={e => setNewTx({...newTx, amount: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-primary-container font-bold focus:ring-2 focus:ring-secondary outline-none transition-all appearance-none"
                        value={newTx.type}
                        onChange={e => setNewTx({...newTx, type: e.target.value as 'income' | 'expense'})}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-primary-container font-bold focus:ring-2 focus:ring-secondary outline-none transition-all"
                      value={newTx.date}
                      onChange={e => setNewTx({...newTx, date: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => { setIsAdding(false); setEditingTx(null); }}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categorizing}
                      className="flex-1 px-4 py-3 bg-secondary text-white rounded-xl hover:bg-secondary/90 font-bold shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    >
                      {categorizing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (editingTx ? 'Update Entry' : 'Record Entry')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingId && (
            <div className="fixed inset-0 bg-primary-container/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center"
              >
                <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-error" />
                </div>
                <h2 className="text-2xl font-black text-primary-container tracking-tight mb-3">Delete Entry?</h2>
                <p className="text-slate-500 font-medium mb-8">This action is permanent and will remove the transaction from your ledger indefinitely.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDelete(deletingId)}
                    className="flex-1 py-3 bg-error text-white rounded-xl font-bold hover:bg-error/90 shadow-lg shadow-error/20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Transactions Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm editorial-shadow overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/30">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ledger..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-secondary outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-xl border border-slate-200 transition-all">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-secondary" />
                      <p className="text-slate-400 mt-4 font-bold text-sm uppercase tracking-widest">Auditing Ledger...</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CreditCard className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-primary-container font-black text-xl tracking-tight">No entries found</p>
                      <p className="text-slate-400 text-sm mt-2 font-medium">Your financial ledger is currently empty.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-500">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                            {tx.category === 'Food' ? <ShoppingCart className="w-5 h-5" /> : 
                             tx.category === 'Transport' ? <Fuel className="w-5 h-5" /> : 
                             tx.type === 'income' ? <Briefcase className="w-5 h-5" /> : 
                             <CreditCard className="w-5 h-5" />}
                          </div>
                          <p className="text-base font-black text-primary-container tracking-tight">{tx.description}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className={cn(
                          "flex items-center justify-end gap-1 text-lg font-black tracking-tight",
                          tx.type === 'income' ? "text-secondary" : "text-primary-container"
                        )}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4 text-error" />}
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), profile?.currency)}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEdit(tx)}
                            className="p-2 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all"
                            title="Edit Entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeletingId(tx.id)}
                            className="p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
