import React, { useState } from 'react';
import { Sparkles, X, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';
import { Goal } from '../types';
import { aiService } from '../services/aiService';

interface PlanImproverModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal;
  onApplyImprovedPlan: (schedule: any[]) => void;
  onOpenCoachWithQuestion: (q: string) => void;
}

export const PlanImproverModal: React.FC<PlanImproverModalProps> = ({
  isOpen,
  onClose,
  goal,
  onApplyImprovedPlan,
  onOpenCoachWithQuestion
}) => {
  const [userPlanText, setUserPlanText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  if (!isOpen) return null;

  const handleAuditPlan = async () => {
    setLoading(true);
    const result = await aiService.improvePlan(userPlanText, goal);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 overflow-hidden relative text-white max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-3 shrink-0">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Plan Improver
            </h2>
            <p className="text-xs text-slate-400">
              Input any existing schedule; AI identifies spacing flaws, fatigue risks, and buffer gaps.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {!analysis ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Paste or Enter Your Current Routine / Schedule:
                </label>
                <textarea
                  rows={6}
                  value={userPlanText}
                  onChange={e => setUserPlanText(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="e.g. Monday: 2 hours focused study, Tuesday: Practice drills, Wednesday: Review errors..."
                />
              </div>

              <button
                onClick={handleAuditPlan}
                disabled={loading || !userPlanText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                    <span>Auditing schedule spacing & fatigue curve...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Audit & Improve Plan</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-3.5 animate-in fade-in">
              {/* Verdict */}
              <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/40">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-0.5">
                  AI Plan Audit Verdict
                </span>
                <p className="text-xs font-semibold text-white">
                  {analysis.overallVerdict}
                </p>
              </div>

              {/* Identified Flaws */}
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Identified Structural Weaknesses:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analysis.identifiedFlaws.map((flaw: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                      <span>{flaw}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Improved Schedule */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Optimized Spaced Schedule:
                </span>
                <div className="space-y-1.5">
                  {analysis.improvedSchedule?.map((dayObj: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{dayObj.day}:</span>
                      <div className="flex items-center gap-2">
                        {dayObj.sessions?.map((s: any, sIdx: number) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 text-[11px]">
                            {s.title} ({s.durationMin}m)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  "{analysis.reasoningWhyBetter}"
                </p>
              </div>

              {/* Action Buttons: Accept / Modify / Reject / Ask AI why (Requirement #7) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onApplyImprovedPlan(analysis.improvedSchedule);
                    onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept AI Plan
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenCoachWithQuestion(`Explain in detail why you changed my schedule from "${userPlanText}" to the improved schedule.`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask AI Why
                </button>

                <button
                  onClick={() => setAnalysis(null)}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs transition-colors"
                >
                  Modify Input
                </button>

                <button
                  onClick={onClose}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 text-xs transition-colors"
                >
                  Reject & Keep Original
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
