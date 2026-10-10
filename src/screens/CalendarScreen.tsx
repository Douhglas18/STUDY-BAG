import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Task, UserProfile } from '../types';

interface CalendarScreenProps {
  tasks: Task[];
  profile: UserProfile;
  onStartFocus: (task: Task, durationMinutes: number) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  tasks,
  profile,
  onStartFocus
}) => {
  const [selectedDay, setSelectedDay] = useState('Today (Wednesday)');

  // Hourly schedule breakdown combining fixed commitments & AI optimal focus windows
  const scheduleSlots = [
    { time: '08:00 - 09:00', type: 'commitment', title: 'Deep Work / Morning Routine', category: 'Routine' },
    { time: '09:00 - 09:45', type: 'ai_focus', taskId: tasks[0]?.id || 'slot-1', title: tasks[0]?.title || 'Optimal Morning Focus Window (Open)', duration: tasks[0]?.estimatedMinutes || 45, reason: tasks[0] ? 'High energy window optimal for complex tasks' : 'Identified high-focus slot ready for your goal tasks', priority: tasks[0]?.priority || 'high' },
    { time: '10:00 - 12:00', type: 'commitment', title: 'Focused Study / Lab Session', category: 'Study' },
    { time: '12:00 - 13:00', type: 'commitment', title: 'Lunch & Cognitive Rest Window', category: 'Break' },
    { time: '13:00 - 14:00', type: 'commitment', title: 'Structured Review & Reading', category: 'Review' },
    { time: '14:30 - 15:30', type: 'ai_focus', taskId: tasks[1]?.id || 'slot-2', title: tasks[1]?.title || 'Afternoon Focus Window (Open)', duration: tasks[1]?.estimatedMinutes || 60, reason: tasks[1] ? 'Aligned with afternoon focus window' : 'Reserved cognitive window for deep work', priority: tasks[1]?.priority || 'high' },
    { time: '16:00 - 16:45', type: 'ai_focus', taskId: tasks[2]?.id || 'slot-3', title: tasks[2]?.title || 'Late Afternoon Practice Window (Open)', duration: tasks[2]?.estimatedMinutes || 45, reason: tasks[2] ? 'Targeted drill before evening wrap-up' : 'Targeted window before evening wrap-up', priority: tasks[2]?.priority || 'medium' },
    { time: '17:30 - 19:00', type: 'commitment', title: 'Workout / Dinner / Recovery', category: 'Life' },
    { time: '20:00 - 20:30', type: 'ai_focus', taskId: tasks[3]?.id || 'slot-4', title: tasks[3]?.title || 'Evening Review & Spaced Recall Window (Open)', duration: tasks[3]?.estimatedMinutes || 30, reason: tasks[3] ? 'Memory consolidation prior to rest' : 'Memory consolidation window before sleep', priority: tasks[3]?.priority || 'low' }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <span>Smart Adaptive Day Schedule</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automatically finds open windows between classes/work and slots high-impact focus blocks.
          </p>
        </div>

        {/* Day Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl text-xs font-semibold">
          <button className="p-1 rounded-lg text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white px-2">{selectedDay}</span>
          <button className="p-1 rounded-lg text-slate-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Schedule Overview */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-indigo-300">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            AI identified <strong>3 hours 00 minutes</strong> of optimal focus windows today, matched to your <strong>{profile.energyPeak}</strong> peak energy profile.
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0 font-mono">
          3 Protected Slots
        </span>
      </div>

      {/* Timeline slots */}
      <div className="space-y-3">
        {scheduleSlots.map((slot, idx) => {
          const isFocus = slot.type === 'ai_focus';
          const matchedTask = tasks.find(t => t.id === slot.taskId) || tasks[0];

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isFocus
                  ? 'bg-slate-900/90 border-indigo-500/40 shadow-sm'
                  : 'bg-slate-950/50 border-slate-850 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="font-mono text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5">
                  {slot.time}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isFocus ? (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Optimal Focus Slot ({slot.duration}m)
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {slot.category}
                      </span>
                    )}

                    {slot.priority && (
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        slot.priority === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {slot.priority}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {slot.title}
                  </h3>

                  {slot.reason && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      💡 {slot.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              {isFocus && matchedTask && (
                <button
                  onClick={() => onStartFocus(matchedTask, slot.duration || 45)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Start Slot</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
