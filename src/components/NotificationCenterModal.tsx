import React from 'react';
import { Bell, X, Sparkles, Clock, CheckCircle2, Flame, Users, ArrowRight } from 'lucide-react';
import { SmartNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onActionClick: (notif: SmartNotification) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onClearAll,
  onActionClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 text-white max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Smart Reminder Engine</h2>
              <p className="text-[11px] text-slate-400">Contextual, non-spam notifications</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No new alerts. Your schedule is clear.
            </div>
          ) : (
            notifications.map(notif => {
              const icon = notif.type === 'upcoming' ? (
                <Clock className="w-4 h-4 text-indigo-400" />
              ) : notif.type === 'squad' ? (
                <Users className="w-4 h-4 text-emerald-400" />
              ) : notif.type === 'coach' ? (
                <Sparkles className="w-4 h-4 text-violet-400" />
              ) : (
                <Flame className="w-4 h-4 text-amber-400" />
              );

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    notif.read
                      ? 'bg-slate-950/40 border-slate-850 opacity-75'
                      : 'bg-slate-950 border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-slate-200 truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                        {notif.message}
                      </p>

                      {notif.actionLabel && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onActionClick(notif);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <span>{notif.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
