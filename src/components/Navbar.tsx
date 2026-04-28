import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PieChart, MessageSquare, User, Settings, LogOut, X, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import FeedbackModal from './FeedbackModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Navbar({ isOpen, onClose }: NavbarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Budget', path: '/budget', icon: PieChart },
    { name: 'AI Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  if (!user) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-full p-5 gap-2">
      <div className="mb-8 px-2 pt-2 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-secondary">FundVision</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Wealth Atelier</p>
        </div>
        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-primary-container transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98] group",
                isActive 
                  ? "bg-secondary/5 text-secondary shadow-sm border border-secondary/10 font-bold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "fill-secondary/20")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
        
        <div className="h-px bg-slate-100 my-4" />

        <button
          onClick={() => {
            setIsFeedbackOpen(true);
            onClose();
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.98] group"
        >
          <LifeBuoy className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span>Help & Support</span>
        </button>

        <button
          onClick={() => {
            onClose();
            signOut();
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.98] group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span>Sign Out</span>
        </button>
      </nav>

      <div className="mt-auto p-5 bg-primary-container rounded-2xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black mb-1 text-secondary tracking-widest uppercase">PRO PLAN</p>
          <p className="text-sm font-semibold mb-4 leading-snug text-slate-200">Unlock advanced AI portfolio modeling.</p>
          <button className="w-full bg-white text-primary-container py-2.5 rounded-xl text-xs font-bold hover:bg-secondary hover:text-white transition-all shadow-lg active:scale-95">
            Upgrade Now
          </button>
        </div>
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-secondary/20 rounded-full blur-2xl"></div>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-100 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-primary-container/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[70] md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
