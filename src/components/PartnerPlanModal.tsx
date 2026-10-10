import React, { useState } from 'react';
import { 
  X, Target, Flame, Clock, CheckCircle2, Shield, 
  Sparkles, Layers, Award, ArrowRight, Send, Heart,
  Zap, Calendar, BookOpen, AlertCircle
} from 'lucide-react';
import { GroupMember } from '../types';

interface PartnerPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: GroupMember | null;
  onSendEncouragement?: (partnerName: string, message: string) => void;
  onSendNudge?: (partnerName: string) => void;
}

export const PartnerPlanModal: React.FC<PartnerPlanModalProps> = ({
  isOpen,
  onClose,
  partner,
  onSendEncouragement,
  onSendNudge
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'tasks' | 'account'>('plan');
  const [cheerSent, setCheerSent] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);

  if (!isOpen || !partner) return null;

  // Real partner plan details (never insert fake hardcoded data)
  const rawPlan = partner.partnerPlan;
  const stages = rawPlan?.stages || [];
  const activeTasks = rawPlan?.activeTasks || [];
  const recentAchievements = rawPlan?.recentAchievements || [];
  const hasActiveGoal = Boolean(partner.goalTitle && partner.goalTitle !== 'Planning next goal' && partner.goalTitle !== 'No active goal set');
  const targetMetric = rawPlan?.targetMetric || (hasActiveGoal ? partner.goalTitle : 'No active goal configured yet');
  const deadline = rawPlan?.deadline || 'No target date set';
  const currentLevelName = rawPlan?.currentLevelName || (stages.length > 0 ? stages[0].name : 'No active level yet');
  const focusNotes = rawPlan?.focusNotes || partner.desiredIdentity || 'Consistent daily focus';

  const handleSendCheer = () => {
    setCheerSent(true);
    if (onSendEncouragement) {
      onSendEncouragement(partner.name, `Sent you a High-Five 🔥 Keep up the strong momentum!`);
    }
    setTimeout(() => setCheerSent(false), 3000);
  };

  const handleSendNudge = () => {
    setNudgeSent(true);
    if (onSendNudge) {
      onSendNudge(partner.name);
    }
    setTimeout(() => setNudgeSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0 p-1.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              {partner.avatar}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {partner.name}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Focus Partner
                </span>
                {partner.isOnline && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {partner.role} • Goal: <span className="text-indigo-300 font-medium">{partner.goalTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'plan'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Strategic Plan & Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasks & Schedule ({activeTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'account'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Account & Consistency Stats</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          {activeTab === 'plan' && (
            <div className="space-y-4">
              {/* Partner's Primary Goal Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 to-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Active Target Goal</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    {partner.progressPercentage}% Completed
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {partner.goalTitle}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    🎯 Target Metric: <span className="text-slate-100 font-semibold">{targetMetric}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📅 Target Deadline: <span className="text-slate-200 font-mono">{deadline}</span>
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${partner.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Active Level Spotlight */}
              {stages.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Current Focus Milestone</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-sm">
                      {currentLevelName}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      IN PROGRESS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {focusNotes}
                  </p>
                </div>
              )}

              {/* Sequential Roadmap Progression */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Partner's Skill-Tree Roadmap Stages</span>
                </div>

                {stages.length > 0 ? (
                  <div className="space-y-2">
                    {stages.map((stage, idx) => {
                      const isDone = stage.status === 'completed';
                      const isCurr = stage.status === 'in_progress';

                      return (
                        <div 
                          key={stage.id || idx}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                            isDone 
                              ? 'bg-slate-900/60 border-emerald-500/30'
                              : isCurr
                              ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                              : 'bg-slate-950/40 border-slate-850 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isDone 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isCurr 
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isDone ? '✓' : stage.order}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-white truncate">
                                Level {stage.order}: {stage.name}
                              </div>
                              {stage.description && (
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {stage.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isDone 
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isCurr 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {isDone ? 'COMPLETED' : isCurr ? 'IN PROGRESS' : 'LOCKED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white">No Roadmap Skill-Tree Yet</h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      {partner.name} has not generated a goal roadmap yet. Once they create a roadmap in their workspace, their levels will update here in real time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Partner's Active Task Backlog & Progress</span>
                <span className="font-semibold text-slate-300">
                  {activeTasks.filter(t => t.status === 'Completed').length} of {activeTasks.length} finished
                </span>
              </div>

              {activeTasks.length > 0 ? (
                <div className="space-y-2">
                  {activeTasks.map((task, idx) => {
                    const isDone = task.status === 'Completed';
                    const isInProg = task.status === 'In Progress';

                    return (
                      <div 
                        key={task.id || idx}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                          isDone 
                            ? 'bg-slate-900/40 border-emerald-500/20 opacity-80'
                            : isInProg
                            ? 'bg-indigo-950/20 border-indigo-500/40'
                            : 'bg-slate-950/60 border-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                            isDone 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'border border-slate-700 bg-slate-900 text-slate-400'
                          }`}>
                            {isDone ? '✓' : ''}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              {task.difficulty && <span>Difficulty: {task.difficulty}</span>}
                              {task.priority && <span>• Priority: <span className="text-amber-400">{task.priority}</span></span>}
                              {task.completedAt && <span>• Finished: {task.completedAt}</span>}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isDone 
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : isInProg 
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">No Tasks Scheduled Yet</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    {partner.name} does not have any tasks in their backlog right now. When they schedule or complete tasks, they will appear here live.
                  </p>
                </div>
              )}

              {/* Recent Achievements */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 mt-4">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recent Partner Achievements</span>
                </div>
                {recentAchievements.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-300">
                    {recentAchievements.map((ach, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-emerald-400 text-sm">✓</span>
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No achievements recorded yet. They will appear as {partner.name} completes milestones.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              {/* Account Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                    <Flame className="w-4 h-4" />
                    <span className="text-lg font-mono font-extrabold">{partner.currentStreak} Days</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Consistency Streak
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-indigo-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg font-mono font-extrabold">{partner.hoursInvested}h</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Deep Work Logged
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-lg font-mono font-extrabold">
                      {partner.weeklyTasksCompleted}/{partner.weeklyTargetTasks}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Weekly Tasks
                  </div>
                </div>
              </div>

              {/* Partner Identity / Bio */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Desired Operating Identity</span>
                </div>
                <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                  "{partner.desiredIdentity || 'Disciplined, high-performing practitioner who executes calmly and protects deep focus blocks without cramming.'}"
                </p>
              </div>

              {/* Non-Shaming Accountability Pact */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sara Mutual Accountability Pact</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Partner accountability tracks consistency, process habits, and scheduled focus hours. It is designed to inspire mutual momentum and friendly encouragement — never shame.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {cheerSent && <span className="text-emerald-400 font-bold">✓ High-five delivered to {partner.name}!</span>}
            {nudgeSent && <span className="text-indigo-400 font-bold">✓ Friendly nudge sent!</span>}
            {!cheerSent && !nudgeSent && <span>Support your partner's execution:</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendNudge}
              disabled={nudgeSent}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Friendly Nudge</span>
            </button>

            <button
              onClick={handleSendCheer}
              disabled={cheerSent}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Send High-Five 🔥</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
