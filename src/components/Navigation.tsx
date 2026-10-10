import React from 'react';
import { 
  Home, CheckSquare, Bot, Users, 
  BookOpen, User, Flame, Layers, BarChart3
} from 'lucide-react';

export type NavTab = 'home' | 'roadmap' | 'progress' | 'today' | 'tutor' | 'resources' | 'group' | 'profile';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  studentMode?: boolean;
  activeStreak: number;
  partnerName?: string;
  onOpenPartnerPlan?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeStreak,
  partnerName,
  onOpenPartnerPlan
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-4 h-4 text-cyan-400" /> },
    { id: 'today', label: 'Today', icon: <CheckSquare className="w-4 h-4 text-emerald-400" /> },
    { id: 'tutor', label: 'AI Tutor', icon: <Bot className="w-4 h-4 text-violet-400" />, badge: 'AI' },
    { id: 'resources', label: 'Resources', icon: <BookOpen className="w-4 h-4 text-amber-400" /> },
    { id: 'group', label: 'Partner & Squad', icon: <Users className="w-4 h-4 text-sky-400" />, badge: partnerName ? 'Live' : undefined },
    { id: 'profile', label: 'Settings', icon: <User className="w-4 h-4 text-slate-400" /> }
  ];

  // Mobile bottom bar items
  const mobileItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Layers className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-5 h-5 text-cyan-400" /> },
    { id: 'today', label: 'Today', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'tutor', label: 'AI Tutor', icon: <Bot className="w-5 h-5" /> },
    { id: 'group', label: 'Partners', icon: <Users className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-56 border-r border-slate-800/80 bg-slate-950/60 shrink-0 p-3 h-[calc(100vh-53px)] sticky top-[53px]">
        {/* Streak & Consistency pill */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Streak</div>
              <div className="text-sm font-bold text-white mt-0.5">{activeStreak > 0 ? `${activeStreak} Days` : 'Day 1'}</div>
            </div>
          </div>
          <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
            Active
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 flex-1">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span className="text-left flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Partner Quick-Action Launcher */}
        {partnerName && onOpenPartnerPlan && (
          <div className="mt-2 mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-sky-950/40 to-indigo-950/30 border border-sky-500/30">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Focus Partner</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button
              onClick={onOpenPartnerPlan}
              className="w-full py-1.5 px-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-200 text-xs font-bold flex items-center justify-between transition-colors text-left"
            >
              <span className="truncate">{partnerName}'s Plan</span>
              <span className="text-[10px] text-sky-300 font-mono">View →</span>
            </button>
          </div>
        )}

        {/* Footer philosophy */}
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-900 text-[11px] text-slate-400 leading-relaxed mt-auto">
          <p className="font-semibold text-slate-300 text-[11px] mb-0.5">Real Progress Engine</p>
          <p className="text-[10px] text-slate-500">Every task completed moves you up the level roadmap.</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (visible only on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around">
        {mobileItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={isActive ? 'scale-110 transition-transform' : ''}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
