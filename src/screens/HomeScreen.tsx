import React, { useState } from 'react';
import { 
  Sparkles, Play, CheckCircle2, Clock, ArrowRight, Plus, 
  Target, Layers, Lock, Bot, Send, Check
} from 'lucide-react';
import { UserProfile, Goal, Task, PersonalRoadmap, RoadmapStage, GroupWorkspace } from '../types';

interface HomeScreenProps {
  profile: UserProfile;
  activeGoal?: Goal;
  roadmap?: PersonalRoadmap | null;
  tasks: Task[];
  group?: GroupWorkspace;
  onOpenWhatNow: () => void;
  onStartFocus: (task: Task, durationMinutes: number) => void;
  onOpenGoalWizard: () => void;
  onNavigateTab: (tab: any) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onAskAIQuestion: (question: string) => void;
  onOpenPartnerPlan?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  activeGoal,
  roadmap,
  tasks,
  group,
  onOpenWhatNow,
  onStartFocus,
  onOpenGoalWizard,
  onNavigateTab,
  onToggleTaskComplete,
  onAskAIQuestion,
  onOpenPartnerPlan
}) => {
  const [askInput, setAskInput] = useState('');

  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const nextTask = pendingTasks[0];
  const partner = group?.members.find(m => !m.isCurrentUser);

  // Calculate active level from roadmap
  const currentStage: RoadmapStage | undefined = roadmap?.stages.find(
    s => s.status === 'current' || s.status === 'in_progress'
  ) || roadmap?.stages.find(s => s.status !== 'completed') || roadmap?.stages[0];

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;
    onAskAIQuestion(askInput.trim());
    setAskInput('');
  };

  // If NO GOAL is active: show the clean, calming empty state
  if (!activeGoal) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/10">
          <Target className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome, {profile.name || 'Learner'}
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You don't have an active goal roadmap yet. Tell the AI what you want to achieve, and we'll create your level-by-level study plan.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenGoalWizard}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 inline-flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Goal Roadmap</span>
          </button>
        </div>

        {/* Partner preview if in Duo mode */}
        {partner && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 text-left flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0 p-1 bg-slate-950 rounded-xl border border-slate-800">
                {partner.avatar}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white truncate">Focus Partner: {partner.name}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full font-bold">
                    {partner.currentStreak}d Streak 🔥
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-0.5">
                  Working on: <span className="text-indigo-300 font-semibold">{partner.goalTitle}</span> ({partner.progressPercentage}%)
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onOpenPartnerPlan) {
                  onOpenPartnerPlan();
                } else {
                  onNavigateTab('group');
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs shrink-0 flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <span>View Partner Plan & Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-left">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs font-bold text-indigo-400">1. State Your Goal</div>
            <p className="text-[11px] text-slate-400">Math exam, technical interview, or learning any subject.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs font-bold text-indigo-400">2. Upload Resources</div>
            <p className="text-[11px] text-slate-400">Optional PDF textbook or notes for custom curriculum.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs font-bold text-indigo-400">3. Level Progression</div>
            <p className="text-[11px] text-slate-400">Complete Level 1, pass assessment, unlock Level 2.</p>
          </div>
        </div>
      </div>
    );
  }

  // Active Goal Dashboard: Answers WHERE AM I? WHAT SHOULD I DO NOW? HOW AM I PROGRESSING?
  const overallProgress = roadmap?.progressPercentage ?? activeGoal.completionPercentage ?? 0;

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto animate-fade-in">
      
      {/* 1. WHERE AM I? (MY GOAL) */}
      <section className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>My Goal</span>
          </span>
          <span className="text-xs font-extrabold text-indigo-400 font-mono">
            {overallProgress}%
          </span>
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {activeGoal.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Target: <span className="text-slate-200 font-medium">{activeGoal.targetMetric}</span> • Deadline: <span className="text-slate-200 font-medium">{activeGoal.deadline}</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(overallProgress, 4)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>
              Current Stage: <strong className="text-white">{currentStage ? `Level ${currentStage.order} — ${currentStage.name}` : 'Level 1'}</strong>
            </span>
            <span>{roadmap?.completedTasks || completedTasks.length} / {roadmap?.totalTasks || tasks.length} tasks</span>
          </div>
        </div>
      </section>

      {/* Focus Partner Live Accountability Widget */}
      {partner && (
        <section className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              {partner.avatar}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-white truncate">Focus Partner: {partner.name}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full font-bold">
                  {partner.currentStreak}d Streak 🔥
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                Working on <strong className="text-indigo-300">{partner.goalTitle}</strong> • {partner.partnerPlan?.currentLevelName || 'Level 2'} ({partner.progressPercentage}% Pace)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenPartnerPlan) {
                onOpenPartnerPlan();
              } else {
                onNavigateTab('group');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <span>View Partner's Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* 2. WHAT SHOULD I DO NOW? (NEXT ACTION) */}
      <section className="p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next Action</span>
          </span>
          <button
            onClick={onOpenWhatNow}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
          >
            Ask AI: What should I do now?
          </button>
        </div>

        {nextTask ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-bold text-white truncate">
                {nextTask.title}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  Estimated: {nextTask.estimatedMinutes} minutes
                </span>
                <span>•</span>
                <span className={`capitalize font-semibold ${
                  nextTask.priority === 'high' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {nextTask.priority} priority
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggleTaskComplete(nextTask.id)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors"
                title="Mark Completed"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartFocus(nextTask, nextTask.estimatedMinutes)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>START ({nextTask.estimatedMinutes}m)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center py-6 text-xs text-slate-400">
            All planned tasks for this level are completed! Take the mini assessment on the Roadmap tab to unlock the next level.
          </div>
        )}
      </section>

      {/* 3. HOW AM I PROGRESSING? (ROADMAP LEVEL SUMMARY) */}
      {roadmap && roadmap.stages && roadmap.stages.length > 0 && (
        <section className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Roadmap Levels</span>
            </span>
            <button
              onClick={() => onNavigateTab('roadmap')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
            >
              <span>Open Roadmap</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {roadmap.stages.slice(0, 5).map((stage) => {
              const isDone = stage.status === 'completed';
              const isCur = stage.status === 'current' || stage.status === 'in_progress';
              const isLck = stage.status === 'locked';

              return (
                <div
                  key={stage.id}
                  onClick={() => onNavigateTab('roadmap')}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isCur
                      ? 'bg-indigo-950/30 border-indigo-500/50 text-white font-bold shadow-md'
                      : isDone
                      ? 'bg-slate-950/40 border-slate-850 text-slate-300'
                      : 'bg-slate-950/60 border-slate-850 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center font-mono text-xs">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                      ) : isCur ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block animate-pulse" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-600 inline" />
                      )}
                    </span>
                    <span className="text-xs truncate">
                      Level {stage.order} — {stage.name}
                    </span>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isDone 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : isCur 
                      ? 'bg-indigo-500/20 text-indigo-300' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isDone ? 'COMPLETE' : isCur ? 'CURRENT' : 'LOCKED'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. ASK AI QUICK ENTRY */}
      <section className="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-white">Ask AI</span>
        </div>

        <form onSubmit={handleAskSubmit} className="flex gap-2">
          <input
            type="text"
            value={askInput}
            onChange={e => setAskInput(e.target.value)}
            placeholder='Ask: "What should I focus on today?" or "Why am I behind?"'
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!askInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            'What should I focus on today?',
            'I only have 30 minutes today',
            'Explain my current level',
            'Am I on track?'
          ].map((quick, qIdx) => (
            <button
              key={qIdx}
              type="button"
              onClick={() => onAskAIQuestion(quick)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              {quick}
            </button>
          ))}
        </div>
      </section>

    </div>
  );
};
