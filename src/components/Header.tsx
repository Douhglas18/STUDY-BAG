import React from 'react';
import { Sparkles, Bell, Target, Users, Flame, ChevronDown, LogIn, LogOut, Cloud, CloudCheck, CheckCircle2, Trash2, RotateCcw, RefreshCw } from 'lucide-react';
import { UserProfile, Goal, GroupMember } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  profile: UserProfile;
  activeGoal?: Goal;
  goals?: Goal[];
  onSelectGoal?: (goalId: string) => void;
  onDeleteGoal?: (goalId: string) => void;
  partner?: GroupMember | null;
  onOpenPartnerPlan?: () => void;
  unreadCount: number;
  firebaseUser?: FirebaseUser | null;
  isSyncing?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSwitchAccount?: () => void;
  onOpenWhatNow: () => void;
  onOpenNotifications: () => void;
  onOpenCheckIn: () => void;
  onSwitchPersona?: (key: string) => void;
  onOpenOnboarding: () => void;
  onWipeAllDemoData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeGoal,
  goals = [],
  onSelectGoal,
  onDeleteGoal,
  partner,
  onOpenPartnerPlan,
  unreadCount,
  firebaseUser,
  isSyncing = false,
  onSignIn,
  onSignOut,
  onSwitchAccount,
  onOpenWhatNow,
  onOpenNotifications,
  onOpenCheckIn,
  onSwitchPersona,
  onOpenOnboarding,
  onWipeAllDemoData
}) => {
  const [personaOpen, setPersonaOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Goal Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              K
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Kairon
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI OS
                </span>
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setPersonaOpen(!personaOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors"
              title="Switch Goal or Manage Workspace"
            >
              <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">
                {activeGoal?.title || (goals && goals.length > 0 ? 'Select Goal' : 'Create Goal')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {personaOpen && (
              <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Your Planned Goals</span>
                  {goals.length > 0 && <span className="text-indigo-400 font-mono">{goals.length} Active</span>}
                </div>

                {goals.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {goals.map(g => {
                      const isCurrent = activeGoal?.id === g.id;
                      return (
                        <div key={g.id} className="flex items-center gap-1 group">
                          <button
                            onClick={() => {
                              if (onSelectGoal) onSelectGoal(g.id);
                              setPersonaOpen(false);
                            }}
                            className={`flex-1 text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                              isCurrent 
                                ? 'bg-indigo-600/20 border border-indigo-500/30 text-white' 
                                : 'hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold truncate">{g.title}</div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {g.category || 'General'} • {g.targetMetric || 'Active'}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-[11px] font-bold text-emerald-400">
                                {g.completionPercentage}%
                              </span>
                            </div>
                          </button>
                          {onDeleteGoal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteGoal(g.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete this unplanned or unwanted goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/80">
                    No custom goal plans created yet.
                  </div>
                )}

                {/* Partner Plan Spotlight in Dropdown */}
                {partner && onOpenPartnerPlan && (
                  <div className="pt-2 border-t border-slate-800 my-1">
                    <div className="px-2 py-0.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-sky-400" />
                        <span>Connected Partner Plan</span>
                      </span>
                      <span className="text-emerald-400 font-mono text-[10px]">{partner.currentStreak}d Streak 🔥</span>
                    </div>
                    <button
                      onClick={() => {
                        onOpenPartnerPlan();
                        setPersonaOpen(false);
                      }}
                      className="w-full mt-1 text-left p-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 text-sky-200 flex items-center justify-between gap-2 transition-all hover:scale-[1.01]"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                          <span>{partner.avatar}</span>
                          <span>{partner.name}:</span>
                          <span className="text-sky-300 font-medium truncate">{partner.goalTitle}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          Milestone: {partner.partnerPlan?.currentLevelName || 'Level 2'} ({partner.progressPercentage}%)
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-1 rounded-lg border border-sky-400/20 shrink-0">
                        View Plan →
                      </span>
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-800 my-1.5"></div>

                <button
                  onClick={() => { onOpenOnboarding(); setPersonaOpen(false); }}
                  className="w-full text-left px-2.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 flex items-center gap-2 transition-colors font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>+ Create New Goal Roadmap</span>
                </button>

                {onWipeAllDemoData && (
                  <button
                    onClick={() => {
                      onWipeAllDemoData();
                      setPersonaOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-300 border border-rose-500/20 hover:border-rose-500/40 flex items-center gap-2 transition-all font-semibold text-[11px] cursor-pointer mt-1"
                    title="Wipe mock examples and reset workspace to clean state"
                  >
                    <span className="shrink-0 text-xs">🗑️</span>
                    <span className="truncate">Clear Workspace (Clean Slate)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center / Goal Highlight (Desktop) */}
        {activeGoal && (
          <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
            <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-400">Primary Goal:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[240px]">{activeGoal.title}</span>
            <span className="text-indigo-400 font-bold ml-1">{activeGoal.completionPercentage}%</span>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Direct Partner Plan & Account launcher */}
          {partner && onOpenPartnerPlan && (
            <button
              onClick={onOpenPartnerPlan}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 hover:border-sky-500/70 text-xs font-semibold text-sky-200 transition-all hover:scale-[1.02] shadow-sm shadow-sky-950/50"
              title={`Inspect Partner's Live Plan & Account (${partner.name})`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline text-slate-300">Partner:</span>
              <span className="font-bold text-white truncate max-w-[85px]">{partner.name}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono font-bold border border-emerald-500/30">
                {partner.progressPercentage}%
              </span>
            </button>
          )}

          {/* High leverage trigger: "What should I do now?" */}
          <button
            onClick={onOpenWhatNow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>What now?</span>
          </button>

          {/* Daily Check-in trigger */}
          <button
            onClick={onOpenCheckIn}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            title="Daily Check-in & Adaptive Rescheduling"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Check-in</span>
          </button>

          {/* Clean 0-Data Demo Reset Button */}
          {onWipeAllDemoData && (
            <button
              onClick={onWipeAllDemoData}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all shadow-sm"
              title="Reset all demo data to clean 0 state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reset 0-Data</span>
            </button>
          )}

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Firebase Authentication & User Record */}
          <div className="relative pl-1 border-l border-slate-800">
            {firebaseUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all text-xs"
                >
                  {firebaseUser.photoURL ? (
                    <img 
                      src={firebaseUser.photoURL} 
                      alt={firebaseUser.displayName || 'User'} 
                      className="w-6 h-6 rounded-full object-cover border border-indigo-500/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
                      {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline font-semibold text-slate-200 max-w-[120px] truncate text-[11px]">
                    {firebaseUser.displayName || profile.name || 'User'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected to Firebase" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 space-y-2.5">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                      {firebaseUser.photoURL ? (
                        <img 
                          src={firebaseUser.photoURL} 
                          alt="avatar" 
                          className="w-8 h-8 rounded-full border border-indigo-500/40"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                          {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate">{firebaseUser.displayName || 'Kairon User'}</div>
                        <div className="text-[10px] text-slate-400 truncate">{firebaseUser.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                      <span className="text-slate-400">Database & Cloud Sync</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active (Firestore)
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      User record and activity history synced in real-time under <code className="text-indigo-300">users/{firebaseUser.uid.slice(0, 8)}...</code>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onSwitchAccount) onSwitchAccount();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold flex items-center justify-center gap-1.5 transition-colors border border-indigo-500/30"
                      title="Switch to another Google Account"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Switch Google Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onSignOut) onSignOut();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-500/20"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/40 hover:border-indigo-500 text-white font-semibold text-xs transition-all shadow-sm shadow-indigo-500/10"
                title="Sign in with Google to sync and keep your record"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
