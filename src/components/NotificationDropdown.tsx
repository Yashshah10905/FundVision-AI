import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, Receipt, TrendingUp, Info, Check, Trash2 } from 'lucide-react';
import { useNotifications, NotificationType } from '../context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function NotificationDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'overspend': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'transaction': return <Receipt className="w-4 h-4 text-blue-500" />;
      case 'income': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'system': return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div onClick={onClose} className="fixed inset-0 z-50 md:hidden" />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-16 w-80 md:w-96 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[60] overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-container" />
                <h3 className="font-black text-primary-container tracking-tighter">Notifications</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={markAllAsRead}
                  className="p-2 text-slate-400 hover:text-secondary transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={clearNotifications}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "p-4 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 relative group",
                        !notification.isRead && "bg-secondary/5"
                      )}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        notification.type === 'overspend' ? 'bg-red-50' : 
                        notification.type === 'transaction' ? 'bg-blue-50' :
                        notification.type === 'income' ? 'bg-green-50' : 'bg-slate-100'
                      )}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-black text-primary-container tracking-tight leading-none">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
