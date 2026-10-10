import React, { useState } from 'react';
import { 
  X, CheckCircle2, Clock, Sparkles, AlertCircle, Play, 
  Plus, Lock, Unlock, ArrowRight, ShieldCheck, HelpCircle,
  Flame, Award, Check, FileText, Link2, BookOpen, ExternalLink, Bookmark, Tag
} from 'lucide-react';
import { RoadmapStage, RoadmapTask, TaskStatus, TaskPriority, TaskDifficulty, ResourceBankItem } from '../types';

interface RoadmapTaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: RoadmapStage | null;
  allStages: RoadmapStage[];
  onToggleTaskComplete: (stageId: string, taskId: string) => void;
  onStartFocus: (task: RoadmapTask, durationMinutes: number) => void;
  onAskAIAboutTask: (task: RoadmapTask, stageName: string) => void;
  onAddNewTask: (stageId: string, task: Partial<RoadmapTask>) => void;
  onSelectPrerequisiteStage?: (stageId: string) => void;
  resourceBankItems?: ResourceBankItem[];
  onOpenResourceBank?: (stageId?: string) => void;
}

export const RoadmapTaskDetailModal: React.FC<RoadmapTaskDetailModalProps> = ({
  isOpen,
  onClose,
  stage,
  allStages,
  onToggleTaskComplete,
  onStartFocus,
  onAskAIAboutTask,
  onAddNewTask,
  onSelectPrerequisiteStage,
  resourceBankItems = [],
  onOpenResourceBank
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(35);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty>('Normal');
  const [isAddingTask, setIsAddingTask] = useState(false);

  if (!isOpen || !stage) return null;

  const totalTasks = stage.tasks.length;
  const completedTasks = stage.tasks.filter(t => t.status === 'Completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Prerequisite check
  const stageMap = new Map(allStages.map(s => [s.id, s]));
  const prereqObjects = (stage.prerequisiteStageIds || []).map(id => stageMap.get(id)).filter(Boolean) as RoadmapStage[];
  const incompletePrereqs = prereqObjects.filter(p => {
    const pTotal = p.tasks.length;
    const pCompleted = p.tasks.filter(t => t.status === 'Completed').length;
    return pCompleted < pTotal || pTotal === 0;
  });

  const isLocked = incompletePrereqs.length > 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddNewTask(stage.id, {
      title: newTaskTitle.trim(),
      estimatedMinutes: Number(newTaskMinutes) || 30,
      priority: newTaskPriority,
      difficulty: newTaskDifficulty,
      status: 'Not Started' as TaskStatus
    });

    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Stage {stage.order}
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
              stage.status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : stage.status === 'in_progress'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : isLocked
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {isLocked ? <Lock className="w-3 h-3" /> : stage.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isLocked ? 'Locked' : stage.status.replace('_', ' ')}</span>
            </span>

            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {stage.difficulty} Difficulty
            </span>

            {stage.deadline && (
              <span className="text-[10px] text-slate-400 font-mono ml-auto mr-8">
                Target: <strong className="text-slate-200">{stage.deadline}</strong>
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-white pr-8">
            {stage.name}
          </h2>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {stage.shortDescription}
          </p>

          {/* Mathematical Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-300">Stage Progress</span>
              <span className="font-mono text-indigo-400 font-bold">
                {completedTasks} / {totalTasks} tasks ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
              <span>⏱ {stage.estimatedHours} hours remaining</span>
              <span>Formula: completedTasks / totalTasks × 100</span>
            </div>
          </div>
        </div>

        {/* Lock Warning Banner if Prerequisite is incomplete */}
        {isLocked && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">Stage Locked: Unmet Prerequisites</p>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                To maintain mastery without skipping critical foundations, complete the prerequisite stage(s) first:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {incompletePrereqs.map(p => {
                  const pRemaining = p.tasks.filter(t => t.status !== 'Completed').length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPrerequisiteStage && onSelectPrerequisiteStage(p.id)}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-semibold flex items-center gap-1 border border-amber-500/30 transition-colors"
                    >
                      <span>{p.name} ({pRemaining} task{pRemaining > 1 ? 's' : ''} remaining)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AI Strategic Rationale & Downstream Value */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs space-y-2">
          <div className="flex items-start gap-2 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Why This Matters: </span>
              <span className="text-slate-300">{stage.whyImportant}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-emerald-300 text-[11px]">
            <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">What Unlocks Next: </span>
              <span className="text-slate-300">{stage.whatUnlocksNext}</span>
            </div>
          </div>

          {stage.stageNotes && (
            <div className="flex items-start gap-2 text-amber-300/90 text-[11px] pt-1 border-t border-slate-800/60">
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Study Notes Integrated: </span>
                <span className="text-slate-300">{stage.stageNotes}</span>
              </div>
            </div>
          )}

          {/* Stage Reference Resources */}
          {stage.resources && stage.resources.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reference Links & Curriculum Materials ({stage.resources.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {stage.resources.map((res, rIdx) => (
                  <a
                    key={res.id || rIdx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-[11px] text-slate-300 hover:text-white flex items-center justify-between gap-2 group transition-colors"
                  >
                    <div className="truncate">
                      <div className="font-medium text-white group-hover:text-indigo-300 truncate">
                        {res.title}
                      </div>
                      {res.description && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {res.description}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Associated Resource Bank Links for this Node */}
          <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Associated Resource Bank Items ({resourceBankItems.filter(r => r.associatedStageId === stage.id || (r.associatedStageName && r.associatedStageName.toLowerCase() === stage.name.toLowerCase())).length})</span>
              </div>
              {onOpenResourceBank && (
                <button
                  type="button"
                  onClick={() => onOpenResourceBank(stage.id)}
                  className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/50 border border-indigo-500/30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Manage / Link More</span>
                </button>
              )}
            </div>

            {resourceBankItems.filter(r => r.associatedStageId === stage.id || (r.associatedStageName && r.associatedStageName.toLowerCase() === stage.name.toLowerCase())).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {resourceBankItems
                  .filter(r => r.associatedStageId === stage.id || (r.associatedStageName && r.associatedStageName.toLowerCase() === stage.name.toLowerCase()))
                  .map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-amber-500/20 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-white flex items-center justify-between gap-2 group transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                            {item.category}
                          </span>
                          <span className="font-medium text-white group-hover:text-indigo-300 truncate">
                            {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </a>
                  ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                <span>No Resource Bank links linked specifically to this node yet.</span>
                {onOpenResourceBank && (
                  <button
                    type="button"
                    onClick={() => onOpenResourceBank(stage.id)}
                    className="text-[10px] text-indigo-400 font-semibold hover:underline"
                  >
                    + Link a URL to this node
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[48vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Stage Checklist ({completedTasks}/{totalTasks})</span>
            </h3>

            <button
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingTask ? 'Cancel' : 'Add Task'}</span>
            </button>
          </div>

          {/* Add New Task Form */}
          {isAddingTask && (
            <form onSubmit={handleCreateTask} className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fade-in text-xs">
              <div className="font-bold text-slate-200">Add New Milestone Task</div>
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Solve 10 questions on Dijkstra shortest path"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Time (mins)</label>
                  <input
                    type="number"
                    value={newTaskMinutes}
                    onChange={e => setNewTaskMinutes(Number(e.target.value))}
                    min={10}
                    max={240}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Difficulty</label>
                  <select
                    value={newTaskDifficulty}
                    onChange={e => setNewTaskDifficulty(e.target.value as TaskDifficulty)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Normal">Normal</option>
                    <option value="Hard">Hard</option>
                    <option value="Very Hard">Very Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Add Task
                </button>
              </div>
            </form>
          )}

          {/* Checklist items */}
          <div className="space-y-2.5">
            {stage.tasks.map(task => {
              const isCompleted = task.status === 'Completed';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-950/40 border-slate-850 opacity-75'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Checkbox button */}
                    <button
                      onClick={() => onToggleTaskComplete(stage.id, task.id)}
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'border border-slate-700 hover:border-indigo-400 bg-slate-900'
                      }`}
                      title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>

                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {task.difficulty || 'Normal'}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.actualMinutes ? `${task.actualMinutes}m logged` : `${task.estimatedMinutes}m est.`}
                        </span>

                        {task.deadline && (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            Due: {task.deadline}
                          </span>
                        )}
                      </div>

                      <div className={`text-xs sm:text-sm font-semibold text-white ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                          {task.description}
                        </p>
                      )}

                      {task.notes && (
                        <div className="text-[10px] text-indigo-300/90 bg-indigo-950/30 p-1.5 rounded-lg border border-indigo-500/20 mt-1 flex items-start gap-1">
                          <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{task.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Ask AI button */}
                    <button
                      onClick={() => onAskAIAboutTask(task, stage.name)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="AI Explanation & Micro-Step Guide"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px]">Ask AI</span>
                    </button>

                    {/* Start Focus timer */}
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          onStartFocus(task, task.estimatedMinutes || 35);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Focus</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {isLocked ? '🔒 Complete prerequisites to officially unlock.' : '⚡ Check off tasks to recalculate roadmap in real time.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Stage
          </button>
        </div>
      </div>
    </div>
  );
};
