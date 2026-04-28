import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 flex justify-between items-center px-4 md:px-8 py-4">
      <div className="flex items-center gap-4 md:gap-10">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-400 hover:text-primary-container transition-all rounded-xl active:scale-95 md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-2xl font-black tracking-tighter text-primary-container md:hidden">FundVision</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-primary-container transition-all rounded-xl active:scale-95 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-[12px] h-3 px-0.5 bg-secondary text-[8px] font-black text-white rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <NotificationDropdown 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />

          <Link to="/settings" className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-primary-container transition-all rounded-xl active:scale-95">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-slate-100 border-2 border-white overflow-hidden shadow-sm cursor-pointer hover:ring-4 hover:ring-secondary/10 hover:border-secondary transition-all active:scale-95">
          <img 
            alt="User profile" 
            src={`https://ui-avatars.com/api/?name=${user.email}&background=0F172A&color=fff&bold=true`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
