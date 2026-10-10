import React from 'react';
import { Target, Plus, Sparkles, CheckCircle2, Clock, Calendar, ArrowRight, ShieldCheck, Flag, Compass, Bookmark, ExternalLink } from 'lucide-react';
import { Goal, Milestone, UserProfile, ResourceBankItem } from '../types';

interface GoalsScreenProps {
  goals: Goal[];
  profile: UserProfile;
  onOpenNewGoalModal: () => void;
  onUpdateGoal: (goal: Goal) => void;
  onOpenCoachWithQuestion: (q: string) => void;
  onNavigateToRoadmap?: () => void;
  resources?: ResourceBankItem[];
  onNavigateToResources?: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  profile,
  onOpenNewGoalModal,
  onUpdateGoal,
  onOpenCoachWithQuestion,
  onNavigateToRoadmap,
  resources = [],
  onNavigateToResources
}) => {
  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top banner with Desired Self Identity (Requirement #15) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>"Become My Desired Self" Operating Identity</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white">
            "{profile.desiredIdentity}"
          </h1>
          <p className="text-xs text-slate-300">
            Systems beat motivation. Your goals below are the concrete vehicles that forge this identity.
          </p>
        </div>

        <button
          onClick={onOpenNewGoalModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal Plan</span>
        </button>
      </div>

      {/* Goals Hierarchy List */}
      <div className="space-y-6">
        {goals.map(goal => (
          <div
            key={goal.id}
            className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4"
          >
            {/* Goal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {goal.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    Deadline: <strong className="text-slate-200">{goal.deadline}</strong>
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {goal.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current: <span className="text-slate-300 font-semibold">{goal.currentMetric}</span> → Target: <span className="text-indigo-300 font-semibold">{goal.targetMetric}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xl font-mono font-extrabold text-indigo-400 leading-none">
                    {goal.completionPercentage}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Overall Progress</div>
                </div>

                {onNavigateToRoadmap && (
                  <button
                    onClick={onNavigateToRoadmap}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>View Roadmap</span>
                  </button>
                )}

                {onNavigateToResources && (
                  <button
                    onClick={onNavigateToResources}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-xs font-semibold text-amber-300 border border-slate-850 transition-colors flex items-center gap-1.5"
                    title="View learning links in Resource Bank"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Resource Bank</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenCoachWithQuestion(`Evaluate my progress on "${goal.title}". Am I on track and what adjustments should we make?`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-xs font-semibold text-slate-200 border border-slate-850 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Coach Audit</span>
                </button>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-850">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${goal.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* AI Strategic Insight */}
            {goal.aiInsight && (
              <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-300">AI Pace Evaluation: </span>
                  {goal.aiInsight}
                </div>
              </div>
            )}

            {/* Associated Learning Resources from Resource Bank */}
            {resources.filter(r => r.associatedGoalId === goal.id || (r.associatedGoalTitle && r.associatedGoalTitle.toLowerCase() === goal.title.toLowerCase())).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Associated Learning Links ({resources.filter(r => r.associatedGoalId === goal.id || (r.associatedGoalTitle && r.associatedGoalTitle.toLowerCase() === goal.title.toLowerCase())).length})</span>
                  </div>
                  {onNavigateToResources && (
                    <button
                      onClick={onNavigateToResources}
                      className="text-[11px] text-indigo-400 hover:underline font-semibold"
                    >
                      Open Bank →
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {resources
                    .filter(r => r.associatedGoalId === goal.id || (r.associatedGoalTitle && r.associatedGoalTitle.toLowerCase() === goal.title.toLowerCase()))
                    .slice(0, 4)
                    .map(item => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center justify-between gap-2 group transition-colors"
                      >
                        <div className="truncate">
                          <div className="font-semibold text-white group-hover:text-amber-300 truncate">
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0" />
                      </a>
                    ))}
                </div>
              </div>
            )}

            {/* Phased Milestones Breakdown (Requirement #6, #29) */}
            <div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Structured Milestones ({goal.milestones.length} Phases)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {goal.milestones.map(m => {
                  const isDone = m.status === 'completed';
                  const isInProgress = m.status === 'in_progress';

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border text-xs transition-all ${
                        isDone
                          ? 'bg-slate-950/40 border-slate-850 opacity-75'
                          : isInProgress
                          ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          Phase {m.order} {m.timeframe ? `• ${m.timeframe}` : ''}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isInProgress
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-slate-850 text-slate-400'
                        }`}>
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="font-semibold text-white mb-2 leading-snug">
                        {m.title}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-850">
                        <span>Target: {m.deadline}</span>
                        <span className="font-mono text-slate-300 font-bold">{m.completionPercentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
