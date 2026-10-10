import React, { useState } from 'react';
import { 
  CheckSquare, Plus, Search, Filter, Play, Clock, CheckCircle2, 
  Trash2, Edit3, Tag, AlertCircle, ChevronDown, Check, Sparkles, Target, Layers, ArrowRight
} from 'lucide-react';
import { Task, Goal, TaskStatus, TaskPriority, PersonalRoadmap, RoadmapStage } from '../types';

interface TasksScreenProps {
  tasks: Task[];
  goals: Goal[];
  roadmap?: PersonalRoadmap | null;
  onOpenNewTaskModal: (task?: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocus: (task: Task, durationMinutes: number) => void;
  onOpenWhatNow?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  goals,
  roadmap,
  onOpenNewTaskModal,
  onToggleComplete,
  onUpdateTaskStatus,
  onDeleteTask,
  onStartFocus,
  onOpenWhatNow
}) => {
  const [activeView, setActiveView] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'delayed'>('active');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');

  const activeGoal = goals[0];
  const currentStage: RoadmapStage | undefined = roadmap?.stages.find(
    s => s.status === 'current' || s.status === 'in_progress'
  ) || roadmap?.stages.find(s => s.status !== 'completed') || roadmap?.stages[0];

  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const todayTasks = pendingTasks.slice(0, 5);
  const totalEstimatedMinutes = todayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const nextTask = todayTasks[0];

  const filteredTasks = tasks.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTag = t.tags.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }

    if (statusFilter === 'active' && t.status === 'Completed') return false;
    if (statusFilter === 'completed' && t.status !== 'Completed') return false;
    if (statusFilter === 'delayed' && t.status !== 'Delayed' && t.status !== 'Blocked') return false;

    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (goalFilter !== 'all' && t.goalId !== goalFilter) return false;

    return true;
  });

  const statuses: TaskStatus[] = ['Not Started', 'In Progress', 'Completed', 'Skipped', 'Delayed', 'Blocked'];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-fade-in">
      {/* 1. DAILY EXECUTION: WHAT SHOULD I DO TODAY? */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>TODAY</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              WHAT SHOULD I DO TODAY?
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWhatNow && (
              <button
                onClick={onOpenWhatNow}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Guidance</span>
              </button>
            )}
            <button
              onClick={() => onOpenNewTaskModal()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Goal & Current Level Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-indigo-400" />
              <span>Goal</span>
            </span>
            <div className="font-extrabold text-white text-sm truncate">
              {activeGoal?.title || 'No Active Goal Defined'}
            </div>
            {activeGoal?.targetMetric ? (
              <p className="text-[11px] text-slate-400">Target: {activeGoal.targetMetric}</p>
            ) : (
              <p className="text-[11px] text-slate-500">Create a goal to generate milestone tasks</p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Current Level</span>
            </span>
            <div className="font-extrabold text-white text-sm truncate">
              {currentStage ? `Level ${currentStage.order} — ${currentStage.name}` : 'No Active Level'}
            </div>
            <p className="text-[11px] text-slate-400">
              Estimated: <strong className="text-emerald-400">{totalEstimatedMinutes} minutes</strong> across {todayTasks.length} tasks
            </p>
          </div>
        </div>

        {/* Today's Tasks List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Today's Actionable Tasks</span>
            <span className="text-slate-400 font-mono text-[11px]">
              {todayTasks.filter(t => t.status === 'Completed').length} / {todayTasks.length} Completed
            </span>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <CheckSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">
                {tasks.length === 0 ? 'No tasks scheduled yet' : 'All today’s tasks completed!'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                {tasks.length === 0
                  ? 'Add your first task using the button above or create a goal roadmap with AI.'
                  : 'Great job! You can review tomorrow’s tasks or take a level assessment on the Roadmap tab.'}
              </p>
            </div>
          ) : (
            todayTasks.map((t, index) => {
              const isDone = t.status === 'Completed';

              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone 
                      ? 'bg-slate-950/40 border-slate-800 opacity-60' 
                      : 'bg-slate-950/90 border-slate-800/90 hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => onToggleComplete(t.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'border border-slate-700 hover:border-emerald-400 bg-slate-900 text-transparent hover:text-slate-500'
                      }`}
                      title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-400">
                          {index + 1}.
                        </span>
                        <h3 className={`text-xs sm:text-sm font-bold text-white truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {t.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {t.estimatedMinutes || 25} min
                        </span>
                        <span>•</span>
                        <span className={`capitalize font-semibold ${
                          t.priority === 'high' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {t.priority}
                        </span>
                        {t.status === 'Skipped' && (
                          <span className="text-amber-400 font-bold bg-amber-400/10 px-1 rounded">Skipped</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {!isDone && (
                      <button
                        onClick={() => onStartFocus(t, t.estimatedMinutes || 25)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start Task</span>
                      </button>
                    )}

                    <select
                      value={t.status}
                      onChange={e => onUpdateTaskStatus(t.id, e.target.value as TaskStatus)}
                      className="text-[10px] font-semibold bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Prominent Next Task Action Banner */}
        {nextTask && (
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Recommended Next Step
              </span>
              <div className="text-sm font-extrabold text-white">
                {nextTask.title}
              </div>
            </div>

            <button
              onClick={() => onStartFocus(nextTask, nextTask.estimatedMinutes || 25)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START TASK ({nextTask.estimatedMinutes || 25} MIN)</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. FULL TASK REPOSITORY (TOGGLEABLE FILTER / BACKLOG) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'today'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today's View ({todayTasks.length})
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Roadmap Tasks ({tasks.length})
            </button>
          </div>
        </div>

        {activeView === 'all' && (
          <div className="space-y-3 pt-2">
            {/* Filter Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search tasks, topics, tags..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'active', label: 'Active & In-Flight' },
                  { id: 'all', label: 'All Tasks' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'delayed', label: 'Delayed / Rescheduled' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      statusFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Backlog Tasks List */}
            <div className="space-y-2">
              {filteredTasks.map(task => {
                const isDone = task.status === 'Completed';

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-slate-950/40 border-slate-800 opacity-60'
                        : 'bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onToggleComplete(task.id)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'border border-slate-700 hover:border-indigo-400 bg-slate-950'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <h3 className={`text-xs sm:text-sm font-semibold text-white truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-slate-400">
                        {task.estimatedMinutes}m
                      </span>
                      {!isDone && (
                        <button
                          onClick={() => onStartFocus(task, task.estimatedMinutes)}
                          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                          title="Start Focus"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                        </button>
                      )}
                      <button
                        onClick={() => onOpenNewTaskModal(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

