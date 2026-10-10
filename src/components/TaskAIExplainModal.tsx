import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Clock, AlertTriangle, ArrowRight, Play, 
  CheckCircle2, Lightbulb, ShieldAlert, Split 
} from 'lucide-react';
import { RoadmapTask } from '../types';
import { aiService } from '../services/aiService';

interface TaskAIExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: RoadmapTask | null;
  stageName: string;
  onStartFocus: (task: RoadmapTask, durationMinutes: number) => void;
  onSubdivideTask?: (task: RoadmapTask, subtasks: string[]) => void;
}

export const TaskAIExplainModal: React.FC<TaskAIExplainModalProps> = ({
  isOpen,
  onClose,
  task,
  stageName,
  onStartFocus,
  onSubdivideTask
}) => {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !task) {
      setBreakdown(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    aiService.explainTask(task.title, stageName, task.difficulty)
      .then(res => {
        if (isMounted) {
          setBreakdown(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, task, stageName]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>AI Task Deconstruction</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Stage: {stageName}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-extrabold text-white pr-6">
            {task.title}
          </h2>
          <div className="text-xs text-indigo-300 mt-1 flex items-center gap-2">
            <span>Estimated focus: <strong>{task.estimatedMinutes} mins</strong></span>
            <span>•</span>
            <span className="capitalize">{task.priority} Priority</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[55vh] overflow-y-auto text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-slate-400 font-medium">Deconstructing task into high-leverage steps...</p>
            </div>
          ) : breakdown ? (
            <>
              {/* Concept Plain Explanation */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>What This Actually Means</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-5">
                  {breakdown.explanation}
                </p>
              </div>

              {/* Why it Matters for the Goal */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Strategic Return on Investment</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-5">
                  {breakdown.whyItMatters}
                </p>
              </div>

              {/* 3 Concrete Action Steps */}
              <div className="space-y-2">
                <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3 Action Steps For Your Focus Session</span>
                </div>

                <div className="space-y-2">
                  {(breakdown.microSteps || []).map((step: string, idx: number) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 leading-snug pt-0.5">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Pitfall */}
              {breakdown.commonPitfall && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-300">Trap to Avoid: </span>
                    <span className="text-rose-200/90">{breakdown.commonPitfall}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center text-slate-400">
              Unable to load breakdown at this time.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onStartFocus(task, task.estimatedMinutes || 35);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch {task.estimatedMinutes || 35}m Focus Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
