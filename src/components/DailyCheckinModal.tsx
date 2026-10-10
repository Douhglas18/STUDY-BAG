import React, { useState } from 'react';
import { Flame, X, Sparkles, CheckCircle2, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Task, DailyCheckInRecord } from '../types';
import { aiService } from '../services/aiService';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onApplyAdaptation: (record: DailyCheckInRecord, rescheduledTasks: Task[]) => void;
}

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onApplyAdaptation
}) => {
  const [status, setStatus] = useState<DailyCheckInRecord['status']>('partial');
  const [reflection, setReflection] = useState('');
  const [tomorrowHours, setTomorrowHours] = useState(2.5);
  const [loading, setLoading] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<any>(null);

  if (!isOpen) return null;

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const missedTasks = tasks.filter(t => t.status !== 'Completed');

  const statusOptions: { id: DailyCheckInRecord['status']; label: string; emoji: string; desc: string }[] = [
    { id: 'completed_all', label: 'Executed Everything', emoji: '🏆', desc: 'Crushed planned tasks on schedule' },
    { id: 'partial', label: 'Completed Some Work', emoji: '⚖️', desc: 'Made progress, but left a few items' },
    { id: 'unexpected_event', label: 'Unexpected Disruption', emoji: '🚨', desc: 'College/work emergencies intervened' },
    { id: 'distracted', label: 'Struggled with Focus', emoji: '🧠', desc: 'Energy low or got sidetracked' },
    { id: 'need_reschedule', label: 'Need Clean Reset', emoji: '🔄', desc: 'Workload was too heavy today' }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    const result = await aiService.submitCheckIn(status, reflection, missedTasks, tomorrowHours);
    setAdaptationResult(result);
    setLoading(false);
  };

  const handleFinish = () => {
    const record: DailyCheckInRecord = {
      id: 'checkin-' + Date.now(),
      date: new Date().toISOString(),
      status,
      reflection,
      tasksCompleted: completedCount,
      tasksMissed: missedTasks.length,
      aiCoachResponse: adaptationResult?.coachMessage
    };

    // Redistribute missed tasks
    const updated = missedTasks.map(t => ({
      ...t,
      status: 'Delayed' as const,
      deadline: 'Rebalanced to Buffer',
      notes: (t.notes ? t.notes + ' | ' : '') + 'Rebalanced during daily check-in'
    }));

    onApplyAdaptation(record, updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 overflow-hidden relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Daily Reflection & Plan Adaptation
            </h2>
            <p className="text-xs text-slate-400">
              Zero shaming. Tell Sara what happened so tomorrow's plan adapts realistically.
            </p>
          </div>
        </div>

        {!adaptationResult ? (
          <div className="space-y-4">
            {/* Status grid */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                How did today actually unfold?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setStatus(opt.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      status === opt.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs">
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 ml-6">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Note */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Context & Notes (optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Spent 2 extra hours on college lab report; exhausted by 7 PM..."
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Tomorrow's realistic hours */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-200">Tomorrow's Realistic Availability</div>
                <div className="text-[11px] text-slate-400">Do not overpromise; let the engine protect buffers</div>
              </div>
              <div className="flex items-center gap-1.5">
                {[1.5, 2.5, 3.5, 5].map(hrs => (
                  <button
                    key={hrs}
                    onClick={() => setTomorrowHours(hrs)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      tomorrowHours === hrs
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Unfinished tasks preview */}
            {missedTasks.length > 0 && (
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-slate-300">{missedTasks.length} pending task(s)</span> will be intelligently shifted to upcoming weekend buffer slots rather than piling onto tomorrow morning.
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                  <span>Sara is recalibrating your plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze & Adapt Tomorrow's Schedule</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* AI Feedback & Redistribution */
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                AI Coach Assessment
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {adaptationResult.coachMessage}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Workload Adjustment:</div>
                  <div className="text-slate-400 text-[11px]">{adaptationResult.planAdjustment}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Tomorrow's Anchor Focus:</div>
                  <div className="text-slate-400 text-[11px]">{adaptationResult.tomorrowPriority}</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Accept Adapted Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
