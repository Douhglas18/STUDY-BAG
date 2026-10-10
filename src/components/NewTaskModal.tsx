import React, { useState } from 'react';
import { X, CheckSquare, Plus, Clock, Flag, Tag, Target } from 'lucide-react';
import { Task, Goal, TaskPriority, TaskDifficulty, TaskStatus } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  onSaveTask: (task: Partial<Task>) => void;
  editTask?: Task | null;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  goals,
  onSaveTask,
  editTask
}) => {
  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [goalId, setGoalId] = useState(editTask?.goalId || goals[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>(editTask?.priority || 'medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(editTask?.estimatedMinutes || 45);
  const [deadline, setDeadline] = useState(editTask?.deadline || 'Today, 20:00');
  const [tagInput, setTagInput] = useState((editTask?.tags || []).join(', '));
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(editTask?.difficulty || 'Normal');
  const [scheduledTime, setScheduledTime] = useState(editTask?.scheduledTime || '10:00');
  const [isPrivate, setIsPrivate] = useState(editTask?.isPrivate || false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSaveTask({
      ...(editTask || {}),
      id: editTask?.id || 't-' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      goalId,
      priority,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      deadline,
      scheduledTime,
      tags: tags.length ? tags : ['General'],
      difficulty,
      isPrivate,
      status: (editTask?.status || 'Not Started') as TaskStatus
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              {editTask ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Title */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mathematics: Practice Unit 3 Problems 1–10"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Goal Link */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Associated Goal
            </label>
            <select
              value={goalId}
              onChange={e => setGoalId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {goals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.completionPercentage}%)
                </option>
              ))}
            </select>
          </div>

          {/* Priority & Estimated Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Priority
              </label>
              <div className="flex gap-1">
                {(['low', 'medium', 'high'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg font-semibold uppercase text-[10px] transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500 text-white'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Estimated Focus Time
              </label>
              <div className="flex items-center gap-1">
                {[20, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedMinutes(mins)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      estimatedMinutes === mins
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled Slot & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Scheduled Slot
              </label>
              <input
                type="text"
                placeholder="e.g. 09:30 or Morning"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Deadline
              </label>
              <input
                type="text"
                placeholder="e.g. Today 20:00 or Friday"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description / Instructions */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Instructions or Checklist Notes
            </label>
            <textarea
              rows={2}
              placeholder="Key concepts to cover, question numbers, or prerequisites..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Tags & Privacy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="Math, Assignment, Revision"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Squad Privacy
              </label>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                  isPrivate
                    ? 'bg-slate-950 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {isPrivate ? '🔒 Private (hidden from squad)' : '👥 Visible in squad activity'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            {editTask ? 'Save Task Updates' : 'Add to Plan'}
          </button>
        </form>
      </div>
    </div>
  );
};
