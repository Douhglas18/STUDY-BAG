import React, { useState } from 'react';
import { ShieldAlert, X, Sparkles, Check, ArrowRight, Sliders, Calendar, AlertTriangle } from 'lucide-react';
import { Goal, Task } from '../types';

interface AdaptPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal;
  tasks: Task[];
  onApplyAdjustment: (optionId: string, details: string) => void;
}

export const AdaptPlanModal: React.FC<AdaptPlanModalProps> = ({
  isOpen,
  onClose,
  goal,
  tasks,
  onApplyAdjustment
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('option-b');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const incompleteTasks = tasks.filter(t => t.status !== 'Completed');
  const remainingWorkloadHours = (incompleteTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60).toFixed(1);
  const availableTimeHours = '14.0';
  const shortfallHours = (Math.max(0, parseFloat(remainingWorkloadHours) - parseFloat(availableTimeHours))).toFixed(1);

  const options = [
    {
      id: 'option-a',
      letter: 'A',
      title: 'Increase Daily Density (+45m/day)',
      tradeoff: 'Eliminates gap without changing deadline, but increases fatigue risk.',
      recommendationTag: 'High Intensity',
      changes: 'Adds 45 minutes of evening focus for the next 5 days.'
    },
    {
      id: 'option-b',
      letter: 'B',
      title: 'Prioritize High-Yield 80/20 (Prune Backlog)',
      tradeoff: 'Protects deadline and daily energy; drops 2 low-priority revision topics.',
      recommendationTag: 'AI Recommended',
      changes: 'Flags 2 low-weight topics as optional, focusing strictly on high-yield exam/goal units.'
    },
    {
      id: 'option-c',
      letter: 'C',
      title: 'Adjust Timeline (+4 Days)',
      tradeoff: 'Maintains 100% syllabus/project completeness with zero stress, slightly extends target date.',
      recommendationTag: 'Highest Quality',
      changes: 'Extends target completion date by 4 days to maintain quality.'
    },
    {
      id: 'option-d',
      letter: 'D',
      title: 'Activate Protected Weekend Buffer',
      tradeoff: 'Keeps weekday workload unchanged; absorbs shortfall into Saturday morning.',
      recommendationTag: 'Balanced',
      changes: 'Schedules two 90-minute consolidation blocks this Saturday & Sunday.'
    }
  ];

  const handleApply = () => {
    const opt = options.find(o => o.id === selectedOption);
    onApplyAdjustment(selectedOption, opt?.changes || '');
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
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
          <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Adaptive Plan Recalibration
            </h2>
            <p className="text-xs text-slate-400">
              When life happens, mathematically adjust the variables rather than carrying stress.
            </p>
          </div>
        </div>

        {/* Current Shortfall Calculation Box */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 mb-4">
          <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
            Workload vs Time Calculation
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-base font-extrabold text-white">{remainingWorkloadHours}h</div>
              <div className="text-[10px] text-slate-400">Remaining Workload</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-base font-extrabold text-indigo-400">{availableTimeHours}h</div>
              <div className="text-[10px] text-slate-400">Scheduled Time</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-base font-extrabold text-amber-400">
                {parseFloat(shortfallHours) > 0 ? `+${shortfallHours}h` : 'Balanced'}
              </div>
              <div className="text-[10px] text-slate-400">Pace Shortfall</div>
            </div>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-semibold text-slate-300">
            Select Your Preferred Recalibration Strategy:
          </div>

          {options.map(opt => {
            const isSelected = selectedOption === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {opt.letter}
                    </span>
                    <span className="text-xs font-bold text-white">{opt.title}</span>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    opt.recommendationTag === 'AI Recommended'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {opt.recommendationTag}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 ml-7 leading-relaxed">
                  {opt.tradeoff}
                </p>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <button
          onClick={handleApply}
          disabled={isSuccess}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
        >
          {isSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Plan Recalibrated Successfully!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Selected Strategy & Rebalance Tasks</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
