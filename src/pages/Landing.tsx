import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, TrendingUp, Shield, Zap, ArrowRight, CheckCircle2, MessageSquare, Target, Sparkles, ChevronRight, Globe, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Landing() {
  const features = [
    {
      title: "Transaction Sync",
      description: "Automatically track and categorize every fiscal movement with high-fidelity accuracy.",
      icon: Zap,
      color: "bg-secondary/10 text-secondary"
    },
    {
      title: "Budget Optimization",
      description: "Set actionable financial goals and get AI-driven suggestions on how to optimize your spending.",
      icon: Target,
      color: "bg-primary-container/10 text-primary-container"
    },
    {
      title: "Financial Analyst",
      description: "Your professional AI partner. Get clear insights and structured analysis of your fiscal landscape.",
      icon: MessageSquare,
      color: "bg-secondary/10 text-secondary"
    }
  ];

  return (
    <div className="min-h-screen bg-surface overflow-hidden selection:bg-secondary/30">
      {/* Editorial Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-2xl flex items-center justify-center text-secondary ai-glow">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-primary-container tracking-tighter">FundVision</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            {['Strategy', 'Security', 'Intelligence'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary-container transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-black uppercase tracking-widest text-primary-container hover:text-secondary transition-colors">
              Sign In
            </Link>
            <Link to="/login" className="px-6 py-3 bg-primary-container text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-container/90 transition-all active:scale-95 shadow-lg shadow-primary-container/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-[0.25em] mb-10 ring-1 ring-secondary/20">
                <Sparkles className="w-4 h-4" />
                Professional Financial Intelligence
              </span>
              <h1 className="text-6xl md:text-8xl font-black text-primary-container tracking-tighter mb-10 leading-[0.9] md:px-10">
                Master your budget with <span className="text-secondary">Neural Logic.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
                FundVision connects your bank nodes, tracks fiscal velocity, and provides professional AI coaching to optimize your financial trajectory.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-10 py-5 bg-primary-container text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-container/90 transition-all shadow-2xl shadow-primary-container/20 flex items-center justify-center gap-3 group"
                >
                  Initialize Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-primary-container border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all editorial-shadow">
                  Explore Ecosystem
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-secondary/5 rounded-full blur-[150px] -z-10 opacity-60"></div>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-primary-container/5 rounded-full blur-[120px] -z-10"></div>
      </header>

      {/* Bento Features Grid */}
      <section id="strategy" className="py-32 bg-slate-50/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-primary-container tracking-tight mb-6">Engineered for Analysis</h2>
            <p className="text-lg font-medium text-slate-400 max-w-2xl mx-auto">High-fidelity tools designed for the modern financial landscape.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="bg-white p-10 rounded-[40px] border border-slate-100 editorial-shadow group cursor-default"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110", feature.color)}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-primary-container mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary-container rounded-[60px] p-12 md:p-24 text-white flex flex-col lg:flex-row items-center gap-20 relative overflow-hidden ai-glow">
            <div className="flex-1 relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-black uppercase tracking-widest mb-8 border border-secondary/20">
                <Lock className="w-4 h-4" />
                Bank-Grade Security
              </span>
              <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter leading-none">Your wealth is a <span className="text-secondary">fortress.</span></h2>
              <p className="text-slate-400 text-xl mb-12 leading-relaxed font-medium">
                We utilize AES-256 encryption and multi-factor authentication to ensure your fiscal data remains strictly private and immutable.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  "AES-256 Encryption",
                  "Read-only Access",
                  "Zero Data Selling",
                  "SOC2 Type II Compliant"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="w-full aspect-square bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative">
                <Shield className="w-40 h-40 text-secondary drop-shadow-[0_0_30px_rgba(5,150,105,0.4)]" />
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-0 right-0 p-8 bg-white rounded-3xl shadow-2xl text-primary-container -rotate-6 border border-slate-100"
                >
                  <TrendingUp className="w-10 h-10 text-secondary mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Savings Rate</p>
                  <p className="text-3xl font-black tracking-tighter">+32.4%</p>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute bottom-10 left-0 p-6 bg-secondary text-white rounded-3xl shadow-2xl rotate-3"
                >
                  <Globe className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Global Access</p>
                </motion.div>
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          </div>
        </div>
      </section>

      {/* Strategic CTA */}
      <section className="py-32 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl font-black text-primary-container tracking-tighter mb-10">Ready to optimize your <span className="text-secondary">fiscal velocity?</span></h2>
          <Link
            to="/login"
            className="inline-flex items-center gap-3 px-12 py-6 bg-primary-container text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:bg-primary-container/90 transition-all shadow-2xl shadow-primary-container/30 active:scale-95 group"
          >
            Initialize Now
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-container rounded-2xl flex items-center justify-center text-secondary ai-glow">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-primary-container tracking-tighter">FundVision</span>
              </div>
              <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">
                The high-fidelity neural strategist for the modern financial landscape.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-container mb-6">Ecosystem</h4>
                <ul className="space-y-4 text-xs font-bold text-slate-400">
                  <li><a href="#" className="hover:text-secondary transition-colors">Neural Core</a></li>
                  <li><a href="#" className="hover:text-secondary transition-colors">Fiscal Nodes</a></li>
                  <li><a href="#" className="hover:text-secondary transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-container mb-6">Legal</h4>
                <ul className="space-y-4 text-xs font-bold text-slate-400">
                  <li><a href="#" className="hover:text-secondary transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-secondary transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-secondary transition-colors">Compliance</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              © 2026 FundVision Neural Systems. All rights reserved.
            </p>
            <div className="flex gap-8">
              {['Twitter', 'LinkedIn', 'GitHub'].map(item => (
                <a key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-primary-container transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
