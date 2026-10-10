import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, CheckCircle, ArrowRight, Play, X, BatteryCharging, ShieldAlert } from 'lucide-react';
import { Task, Goal, UserProfile } from '../types';
import { aiService } from '../services/aiService';

interface WhatShouldIDoNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  activeGoal?: Goal;
  profile: UserProfile;
  onStartFocus: (task: Task, durationMinutes: number) => void;
  onOpenCoachWithQuestion: (q: string) => void;
}

export const WhatShouldIDoNowModal: React.FC<WhatShouldIDoNowModalProps> = ({
  isOpen,
  onClose,
  tasks,
  activeGoal,
  profile,
  onStartFocus,
  onOpenCoachWithQuestion
}) => {
  const [loading, setLoading] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState(45);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'normal' | 'high'>('normal');
  const [recommendation, setRecommendation] = useState<any>(null);

  const fetchRecommendation = async (availMins = availableMinutes, energy = energyLevel) => {
    setLoading(true);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const result = await aiService.getWhatShouldIDoNow({
      currentTime: now,
      availableMinutes: availMins,
      energyLevel: energy,
      tasks: tasks.filter(t => t.status !== 'Completed'),
      currentGoal: activeGoal
    });
    setRecommendation(result);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecommendation(availableMinutes, energyLevel);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const matchedTask = tasks.find(t => 
    t.title.toLowerCase() === recommendation?.recommendedTask?.title?.toLowerCase()
  ) || tasks.find(t => t.status !== 'Completed') || {
    id: 'temp-1',
    title: recommendation?.recommendedTask?.title || 'Core Priority Execution',
    priority: 'high',
    estimatedMinutes: recommendation?.recommendedTask?.durationMinutes || availableMinutes,
    status: 'In Progress',
    tags: ['Focus']
  } as Task;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 overflow-hidden relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              What Should I Do Now?
            </h2>
            <p className="text-xs text-slate-400">
              AI real-time triage based on deadlines, energy, and your goals
            </p>
          </div>
        </div>

        {/* Dynamic Controls: Available Time & Energy */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Time Available
            </label>
            <div className="flex items-center gap-1">
              {[25, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => {
                    setAvailableMinutes(mins);
                    fetchRecommendation(mins, energyLevel);
                  }}
                  className={`flex-1 py-1 text-xs rounded font-medium transition-all ${
                    availableMinutes === mins
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Energy Level
            </label>
            <div className="flex items-center gap-1">
              {(['low', 'normal', 'high'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => {
                    setEnergyLevel(lvl);
                    fetchRecommendation(availableMinutes, lvl);
                  }}
                  className={`flex-1 py-1 text-xs rounded capitalize font-medium transition-all ${
                    energyLevel === lvl
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-400">Evaluating deadlines, workload, and optimal cognitive load...</p>
          </div>
        ) : recommendation ? (
          <div className="space-y-4">
            {/* Primary Recommendation Card */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/40 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Optimal Next Action
                </span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {recommendation.recommendedTask.durationMinutes} minutes
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">
                {recommendation.recommendedTask.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {recommendation.recommendedTask.whyNow}
              </p>

              {/* Action Steps */}
              {recommendation.recommendedTask.actionSteps && (
                <div className="bg-slate-950/70 rounded-lg p-2.5 mb-3 border border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                    Execution Steps:
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {recommendation.recommendedTask.actionSteps.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onStartFocus(matchedTask, recommendation.recommendedTask.durationMinutes || 35);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Start Focus Mode ({recommendation.recommendedTask.durationMinutes}m)
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenCoachWithQuestion(`Why should I do "${recommendation.recommendedTask.title}" right now instead of other tasks?`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  title="Ask AI Why"
                >
                  Why this?
                </button>
              </div>
            </div>

            {/* Secondary Option (Alternative) */}
            {recommendation.secondaryOption && (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Alternative (Lower Friction)
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {recommendation.secondaryOption.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {recommendation.secondaryOption.why}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    const altTask = tasks.find(t => t.title.toLowerCase().includes(recommendation.secondaryOption.title.toLowerCase())) || matchedTask;
                    onStartFocus(altTask, recommendation.secondaryOption.durationMinutes || 20);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 shrink-0 transition-colors"
                >
                  Do this ({recommendation.secondaryOption.durationMinutes}m)
                </button>
              </div>
            )}

            {/* Coach Note */}
            <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-900 text-center">
              "{recommendation.coachNote}"
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
