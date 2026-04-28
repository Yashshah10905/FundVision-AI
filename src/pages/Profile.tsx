import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, Calendar, Shield, Save, Loader2, CreditCard, Plus, ExternalLink, AlertCircle, Globe, Download, ChevronRight } from 'lucide-react';
import { CURRENCIES } from '../lib/currency';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import PlaidLink from '../components/PlaidLink';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Profile {
  name: string;
  email: string;
  currency: string;
}

interface BankConnection {
  id: string;
  bank_name: string;
  account_type: string;
  connection_status: string;
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', currency: 'USD' });
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBankConnections();
    }
  }, [user]);

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, email, currency')
      .eq('id', user?.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setProfile(data);
    } else {
      setProfile({ name: '', email: user?.email || '', currency: 'USD' });
    }
  }

  async function fetchBankConnections() {
    const { data, error } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error fetching bank connections:', error);
    } else {
      setBankConnections(data || []);
    }
    setLoading(false);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
      });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await refreshProfile();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-surface-container-low transition-all duration-300 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Editorial Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary-container mb-3">Account Identity</h1>
            <p className="text-on-surface-variant font-medium text-lg opacity-80">Manage your digital presence and fiscal connections.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Commit Changes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Profile Form Card */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white p-10 rounded-3xl border border-slate-100 editorial-shadow">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-container">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary-container tracking-tight">Personal Profile</h2>
                  <p className="text-sm font-medium text-slate-400">Core identity and preferences.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-secondary transition-colors" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-primary-container font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-secondary outline-none transition-all"
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input
                        type="email"
                        disabled
                        className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl text-slate-400 font-bold cursor-not-allowed"
                        value={profile.email}
                      />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Immutable Identity</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Preferred Currency</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-secondary transition-colors" />
                      <select
                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-primary-container font-bold focus:ring-2 focus:ring-secondary outline-none transition-all appearance-none cursor-pointer"
                        value={profile.currency}
                        onChange={e => setProfile({ ...profile, currency: e.target.value })}
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} — {curr.name} ({curr.symbol})
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-5 rounded-2xl text-sm font-bold flex items-center gap-3 border",
                      message.type === 'success' ? "bg-secondary/5 border-secondary/10 text-secondary" : "bg-error/5 border-error/10 text-error"
                    )}
                  >
                    {message.type === 'success' ? <Shield className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                  </motion.div>
                )}
              </form>
            </div>

            {/* Bank Connections Card */}
            <div className="bg-white p-10 rounded-3xl border border-slate-100 editorial-shadow">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-2xl font-black text-primary-container tracking-tight">Fiscal Nodes</h2>
                  <p className="text-sm font-medium text-slate-400">Connected financial institutions.</p>
                </div>
                <PlaidLink onSuccess={() => fetchBankConnections()} />
              </div>

              <div className="space-y-4">
                {bankConnections.length === 0 ? (
                  <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <CreditCard className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-primary-container font-black text-xl tracking-tight">No nodes detected</p>
                    <p className="text-slate-400 text-sm mt-2 font-medium max-w-xs mx-auto">
                      Connect your financial institutions to enable high-fidelity neural analysis.
                    </p>
                    <div className="mt-8 flex justify-center">
                      <PlaidLink onSuccess={() => fetchBankConnections()} />
                    </div>
                  </div>
                ) : (
                  bankConnections.map(conn => (
                    <div key={conn.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:editorial-shadow transition-all group cursor-pointer">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-secondary transition-colors shadow-sm">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-primary-container tracking-tight">{conn.bank_name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{conn.account_type} • {conn.connection_status}</p>
                        </div>
                      </div>
                      <button className="text-slate-300 hover:text-primary-container p-2 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-primary-container rounded-3xl p-10 text-white relative overflow-hidden">
              <div className="relative z-10">
                <Shield className="w-10 h-10 text-secondary mb-6" />
                <h3 className="text-2xl font-black tracking-tight mb-4">Neural Security</h3>
                <p className="text-slate-300 text-sm font-medium leading-relaxed mb-8">
                  FundVision utilizes bank-grade AES-256 encryption. Your credentials never traverse our neural core.
                </p>
                <div className="space-y-4">
                  {['AES-256 Protocol', 'SOC2 Compliant', 'Read-only Access'].map(item => (
                    <div key={item} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 editorial-shadow">
              <h3 className="text-xl font-black text-primary-container tracking-tight mb-6">Subscription</h3>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Current Tier</p>
                <p className="text-2xl font-black text-primary-container tracking-tight">Free Strategy</p>
              </div>
              <button className="w-full py-4 bg-secondary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-secondary/90 transition-all active:scale-95 shadow-lg shadow-secondary/20">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
