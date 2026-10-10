import React, { useState } from 'react';
import { 
  Sparkles, Play, CheckCircle2, Clock, Calendar, ArrowRight, 
  Flame, Plus, AlertCircle, ChevronRight, ShieldCheck, 
  Lock, Unlock, Network, ListOrdered, GraduationCap, 
  Award, FileText, Check, Compass, ChevronDown, BookOpen, Link2, Globe, Bookmark, X, FolderPlus, Users
} from 'lucide-react';
import { 
  PersonalRoadmap, RoadmapStage, RoadmapTask, UserProfile, 
  GroupWorkspace, SubjectAttendanceRecord, TaskStatus, RoadmapReferenceLink,
  ResourceBankItem, Goal, TaskDifficulty 
} from '../types';
import { getRecommendedNextAction, recalculateRoadmap } from '../services/roadmapData';
import { RoadmapTaskDetailModal } from '../components/RoadmapTaskDetailModal';
import { TaskAIExplainModal } from '../components/TaskAIExplainModal';
import { RoadmapAIGeneratorModal } from '../components/RoadmapAIGeneratorModal';
import { RoadmapNotesAndLinksModal } from '../components/RoadmapNotesAndLinksModal';
import { ResourceBankModal } from '../components/ResourceBankModal';
import { RoadmapGraph } from '../components/roadmap/RoadmapGraph';
import { LevelEnvironmentModal } from '../components/LevelEnvironmentModal';

interface RoadmapScreenProps {
  roadmap: PersonalRoadmap;
  profile: UserProfile;
  group?: GroupWorkspace;
  attendanceRecords: SubjectAttendanceRecord[];
  onUpdateRoadmap: (updated: PersonalRoadmap) => void;
  onUpdateAttendance: (records: SubjectAttendanceRecord[]) => void;
  onStartFocus: (task: any, durationMinutes: number) => void;
  onOpenCoachWithQuestion: (q: string) => void;
  resources?: ResourceBankItem[];
  goals?: Goal[];
  onAddResource?: (item: Omit<ResourceBankItem, 'id' | 'createdAt'>) => void;
  onUpdateResource?: (id: string, updates: Partial<ResourceBankItem>) => void;
  onDeleteResource?: (id: string) => void;
  onNavigateToScreen?: (screen: any) => void;
  onOpenPartnerPlan?: () => void;
}

export const RoadmapScreen: React.FC<RoadmapScreenProps> = ({
  roadmap,
  profile,
  group,
  attendanceRecords,
  onUpdateRoadmap,
  onUpdateAttendance,
  onStartFocus,
  onOpenCoachWithQuestion,
  resources = [],
  goals = [],
  onAddResource = () => {},
  onUpdateResource = () => {},
  onDeleteResource = () => {},
  onNavigateToScreen,
  onOpenPartnerPlan
}) => {
  // View mode: 'graph' (default visual DAG), 'timeline' (list), 'attendance' (college attendance if enabled)
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'attendance'>('graph');

  // Modals state
  const [selectedStage, setSelectedStage] = useState<RoadmapStage | null>(null);
  const [levelEnvStage, setLevelEnvStage] = useState<RoadmapStage | null>(null);
  const [explainingTask, setExplainingTask] = useState<{ task: RoadmapTask; stageName: string } | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankFilterStageId, setBankFilterStageId] = useState<string | undefined>(undefined);

  // New Custom Module / Stage State
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDescription, setNewStageDescription] = useState('');
  const [newStageDifficulty, setNewStageDifficulty] = useState<TaskDifficulty>('Normal');
  const [newStagePrereqs, setNewStagePrereqs] = useState<string[]>([]);

  // Derived metrics
  const totalTasks = roadmap?.totalTasks || 0;
  const completedTasks = roadmap?.completedTasks || 0;
  const progressPercent = roadmap?.progressPercentage || 0;

  // Single recommended next action
  const recommendedNext = roadmap ? getRecommendedNextAction(roadmap) : null;

  // Current active level stage
  const currentOrFirstStage = roadmap?.stages?.find(s => s.status === 'in_progress' || s.status === 'current') || 
                              roadmap?.stages?.find(s => s.status !== 'completed' && s.status !== 'locked') || 
                              roadmap?.stages?.[0];

  // Level Completion Handler (Unlocks Next Level upon passing Mini Assessment)
  const handleLevelCompleted = (stageId: string, scorePercent: number) => {
    if (!roadmap) return;
    const currentIdx = (roadmap.stages || []).findIndex(s => s.id === stageId);
    if (currentIdx === -1) return;

    const currentStage = roadmap.stages[currentIdx];
    const nextStage = roadmap.stages.find(s => s.order === currentStage.order + 1);

    const updatedStages = roadmap.stages.map(st => {
      if (st.id === stageId) {
        return {
          ...st,
          status: 'completed' as const,
          tasks: st.tasks.map(t => ({
            ...t,
            status: 'Completed' as const,
            completedAt: new Date().toISOString()
          }))
        };
      }
      if (nextStage && st.id === nextStage.id && st.status === 'locked') {
        return {
          ...st,
          status: 'in_progress' as const
        };
      }
      return st;
    });

    const recalculated = recalculateRoadmap({
      ...roadmap,
      stages: updatedStages
    });

    onUpdateRoadmap(recalculated);

    const refreshed = recalculated.stages.find(s => s.id === stageId);
    if (refreshed) {
      setLevelEnvStage(refreshed);
    }
  };

  // Handlers for task completion and updates
  const handleToggleTaskComplete = (stageId: string, taskId: string) => {
    if (!roadmap) return;
    const updatedStages = roadmap.stages.map(stage => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        tasks: stage.tasks.map(t => {
          if (t.id !== taskId) return t;
          const nextStatus: TaskStatus = t.status === 'Completed' ? 'Not Started' : 'Completed';
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined
          };
        })
      };
    });

    const recalculated = recalculateRoadmap({
      ...roadmap,
      stages: updatedStages
    });

    onUpdateRoadmap(recalculated);

    if (selectedStage && selectedStage.id === stageId) {
      const refreshed = recalculated.stages.find(s => s.id === stageId);
      if (refreshed) setSelectedStage(refreshed);
    }

    if (levelEnvStage && levelEnvStage.id === stageId) {
      const refreshed = recalculated.stages.find(s => s.id === stageId);
      if (refreshed) setLevelEnvStage(refreshed);
    }
  };

  const handleAddNewTaskToStage = (stageId: string, taskPartial: Partial<RoadmapTask>) => {
    if (!roadmap) return;
    const newTask: RoadmapTask = {
      id: 't-cust-' + Date.now(),
      stageId,
      title: taskPartial.title || 'New Task',
      description: taskPartial.description,
      status: taskPartial.status || 'Not Started',
      priority: taskPartial.priority || 'medium',
      difficulty: taskPartial.difficulty || 'Normal',
      estimatedMinutes: taskPartial.estimatedMinutes || 35
    };

    const updatedStages = roadmap.stages.map(stage => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        tasks: [...stage.tasks, newTask]
      };
    });

    onUpdateRoadmap({
      ...roadmap,
      stages: updatedStages
    });

    if (selectedStage && selectedStage.id === stageId) {
      const refreshed = updatedStages.find(s => s.id === stageId);
      if (refreshed) setSelectedStage(refreshed);
    }
  };

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmap || !newStageName.trim()) return;

    const newStage: RoadmapStage = {
      id: 'st-' + Date.now(),
      roadmapId: roadmap.id,
      name: newStageName.trim(),
      order: roadmap.stages.length + 1,
      status: newStagePrereqs.length > 0 ? 'locked' : 'available',
      difficulty: newStageDifficulty,
      shortDescription: newStageDescription.trim() || 'Custom user learning stage',
      estimatedHours: 6,
      prerequisiteStageIds: newStagePrereqs,
      aiRecommendation: 'Execute foundation problem sets and summarize notes before continuing.',
      whyImportant: 'Core building block for downstream mastery and execution velocity.',
      whatUnlocksNext: 'Unlocks deeper specialized stages in the progression tree.',
      tasks: [
        {
          id: 't-' + Date.now() + '-1',
          stageId: 'st-' + Date.now(),
          title: `Initial Deep Dive: ${newStageName.trim()}`,
          description: 'Core concept mastery and foundation notes',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Normal',
          estimatedMinutes: 45
        }
      ]
    };

    const updatedStages = [...roadmap.stages, newStage];
    onUpdateRoadmap({
      ...roadmap,
      stages: updatedStages
    });

    setNewStageName('');
    setNewStageDescription('');
    setNewStagePrereqs([]);
    setShowAddStageModal(false);
  };

  const handleAttendanceChange = (subjectId: string, attendedDelta: number, totalDelta: number) => {
    const updated = attendanceRecords.map(rec => {
      if (rec.subjectId !== subjectId) return rec;
      const newAttended = Math.max(0, rec.attended + attendedDelta);
      const newTotal = Math.max(newAttended, rec.total + totalDelta);
      return {
        ...rec,
        attended: newAttended,
        total: newTotal
      };
    });
    onUpdateAttendance(updated);
  };

  return (
    <div className="space-y-4 pb-12 max-w-6xl mx-auto">
      
      {/* 1. SIMPLE, COMPACT TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
        
        {/* Left: Roadmap selector & progress pill */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Dynamic Active Roadmap Title */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-bold text-white max-w-[200px] sm:max-w-xs truncate">
              {roadmap.title || 'Learning Progression'}
            </span>
          </div>

          <button
            onClick={() => setGeneratorOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Generate or Rebalance Roadmap with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Roadmap Generator</span>
          </button>

          {/* Focus Partner Shortcut */}
          {group?.members.find(m => !m.isCurrentUser) && (
            <button
              onClick={() => {
                if (onOpenPartnerPlan) {
                  onOpenPartnerPlan();
                } else if (onNavigateToScreen) {
                  onNavigateToScreen('group');
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Inspect Partner's Roadmap, Milestones & Live Status"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Partner Plan ({group.members.find(m => !m.isCurrentUser)?.name})</span>
            </button>
          )}

          {/* Simple Progress pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="font-bold text-white font-mono">{progressPercent}%</span>
            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              ({completedTasks}/{totalTasks})
            </span>
            <span className="text-amber-400 font-bold flex items-center gap-0.5 text-[11px] ml-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              {roadmap.currentStreak}d
            </span>
          </div>
        </div>

        {/* Right: Actions & View Switcher */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* View Toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'graph'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>List</span>
            </button>

            {profile.studentModeEnabled && (
              <button
                onClick={() => setViewMode('attendance')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'attendance'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Attendance</span>
              </button>
            )}
          </div>

          {/* Add Stage / Module button */}
          <button
            onClick={() => setShowAddStageModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Add Custom Stage/Module Node to Roadmap"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Module Node</span>
          </button>

          {/* Notes & Links Manager Button */}
          <button
            onClick={() => setNotesModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors relative"
            title="View & Edit Notes, Reference Links & Google Search Grounding"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Notes & Links</span>
            {((roadmap.sourceNotes && roadmap.sourceNotes.trim().length > 0) || (roadmap.referenceLinks && roadmap.referenceLinks.length > 0)) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Resource Bank Button */}
          <button
            onClick={() => {
              setBankFilterStageId(undefined);
              setBankModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors relative"
            title="Open Resource Bank & Node Associations"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Resource Bank</span>
            {resources && resources.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                {resources.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setGeneratorOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Plan</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT "NEXT UP" ACTION BAR */}
      {recommendedNext && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-indigo-300 mr-2">Next Up:</span>
              <strong className="text-white font-semibold">{recommendedNext.task.title}</strong>
              <span className="text-slate-400 text-[11px] ml-2 hidden md:inline">
                ({recommendedNext.stage.name})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => onStartFocus(recommendedNext.task, recommendedNext.task.estimatedMinutes || 35)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Start ({recommendedNext.task.estimatedMinutes || 35}m)</span>
            </button>

            <button
              onClick={() => setExplainingTask({ task: recommendedNext.task, stageName: recommendedNext.stage.name })}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs font-semibold border border-slate-800 transition-colors"
              title="Explain Task with AI"
            >
              Ask AI
            </button>

            <button
              onClick={() => setSelectedStage(recommendedNext.stage)}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
            >
              Open Stage
            </button>
          </div>
        </div>
      )}

      {/* Empty State when no stages exist */}
      {(!roadmap || !roadmap.stages || roadmap.stages.length === 0) && (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-900/70 border border-dashed border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Your Roadmap is Fresh & Ready</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add custom modules/stages manually or generate a full learning progression from your syllabus using AI Plan.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setShowAddStageModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Stage Node</span>
            </button>
            <button
              onClick={() => setGeneratorOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CENTER STAGE: VISUAL DAG GRAPH (NeetCode Style) */}
      {viewMode === 'graph' && roadmap && roadmap.stages && roadmap.stages.length > 0 && (
        <div className="space-y-3">
          {(() => {
            const firstActive = roadmap.stages.find(s => s.status === 'in_progress' || s.status === 'available') || roadmap.stages[0];
            if (!firstActive) return null;
            return (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/50 border border-indigo-500/40 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-xs shadow-md shadow-indigo-600/30">
                    L{firstActive.order}
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                      Current Milestone • Level {firstActive.order}
                    </div>
                    <div className="text-xs font-bold text-white">
                      {firstActive.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setLevelEnvStage(firstActive)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Open Level {firstActive.order} (Learn & Practice)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })()}

          <RoadmapGraph
            roadmap={roadmap}
            onSelectStage={stage => setLevelEnvStage(stage)}
            activeStageId={recommendedNext?.stage.id}
          />
        </div>
      )}

      {/* 4. LIST VIEW */}
      {viewMode === 'timeline' && roadmap && roadmap.stages && roadmap.stages.length > 0 && (
        <div className="space-y-3">
          {roadmap.stages.map((stage, idx) => {
            const total = stage.tasks.length;
            const completed = stage.tasks.filter(t => t.status === 'Completed').length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isCompleted = stage.status === 'completed';
            const isLocked = stage.status === 'locked';

            return (
              <div 
                key={stage.id}
                onClick={() => setLevelEnvStage(stage)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isCompleted 
                    ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/60'
                    : stage.status === 'in_progress'
                    ? 'bg-indigo-950/30 border-indigo-500/50 hover:border-indigo-400'
                    : isLocked
                    ? 'bg-slate-950/60 border-slate-855 opacity-70'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : stage.status === 'in_progress'
                      ? 'bg-indigo-600 text-white'
                      : isLocked
                      ? 'bg-slate-800 text-slate-500'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isLocked ? <Lock className="w-3 h-3" /> : idx + 1}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{stage.name}</h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{stage.shortDescription}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-white">{completed}/{total}</span>
                    <div className="text-[10px] text-slate-400 font-mono">{progress}%</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State when no stages exist */}
      {(!roadmap || !roadmap.stages || roadmap.stages.length === 0) && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 space-y-4 max-w-xl mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/10">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">No Active Roadmap Stages</h3>
            <p className="text-xs text-slate-400">
              You haven't generated a skill roadmap yet. Click below to state your goal and generate your personalized level progression with AI.
            </p>
          </div>
          <button
            onClick={() => setGeneratorOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Roadmap with AI</span>
          </button>
        </div>
      )}
      {viewMode === 'attendance' && profile.studentModeEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attendanceRecords.length === 0 ? (
            <div className="col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
              No attendance records configured yet.
            </div>
          ) : (
            attendanceRecords.map(rec => {
              const percent = rec.total > 0 ? Math.round((rec.attended / rec.total) * 100) : 0;
              const isSafe = percent >= rec.targetPercent;

              return (
                <div key={rec.subjectId} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs">{rec.subjectName}</h3>
                    <span className={`font-mono font-bold text-xs ${isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isSafe ? 'bg-emerald-400' : 'bg-rose-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>{rec.attended}/{rec.total} attended (Target: {rec.targetPercent}%)</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAttendanceChange(rec.subjectId, 1, 1)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/30"
                      >
                        + Attend
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(rec.subjectId, 0, 1)}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold hover:bg-rose-500/30"
                      >
                        + Miss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Custom Stage / Module Modal */}
      {showAddStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleCreateStage}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Add Custom Module Node</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddStageModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Module / Stage Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & Raft Consensus"
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={newStageDifficulty}
                  onChange={e => setNewStageDifficulty(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Normal">Normal</option>
                  <option value="Hard">Hard</option>
                  <option value="Very Hard">Very Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Summary / Key Learning Goal
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Master leader election, log replication, and RPC handling."
                  value={newStageDescription}
                  onChange={e => setNewStageDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {roadmap.stages.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Prerequisite Stage (optional - connects DAG edge)
                  </label>
                  <select
                    value={newStagePrereqs[0] || ''}
                    onChange={e => setNewStagePrereqs(e.target.value ? [e.target.value] : [])}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None (Entry Node)</option>
                    {roadmap.stages.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddStageModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newStageName.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold shadow-md shadow-emerald-600/30"
              >
                Add Node to Tree
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Level Learning Environment Modal */}
      <LevelEnvironmentModal
        isOpen={Boolean(levelEnvStage)}
        onClose={() => setLevelEnvStage(null)}
        level={levelEnvStage}
        allLevels={roadmap.stages}
        goalTitle={goals[0]?.title || roadmap.title}
        onToggleTask={handleToggleTaskComplete}
        onLevelCompleted={handleLevelCompleted}
        onStartFocus={onStartFocus}
        onOpenTutorForTopic={onOpenCoachWithQuestion}
        onSelectLevel={(nextStage) => setLevelEnvStage(nextStage)}
        onNavigateToScreen={onNavigateToScreen}
      />

      {/* Stage Detail & Task Checklist Modal */}
      <RoadmapTaskDetailModal
        isOpen={Boolean(selectedStage)}
        onClose={() => setSelectedStage(null)}
        stage={selectedStage}
        allStages={roadmap.stages}
        onToggleTaskComplete={handleToggleTaskComplete}
        onStartFocus={onStartFocus}
        onAskAIAboutTask={(task, stageName) => setExplainingTask({ task, stageName })}
        onAddNewTask={handleAddNewTaskToStage}
        onSelectPrerequisiteStage={(stageId) => {
          const target = roadmap.stages.find(s => s.id === stageId);
          if (target) setSelectedStage(target);
        }}
        resourceBankItems={resources}
        onOpenResourceBank={(stageId) => {
          setBankFilterStageId(stageId);
          setBankModalOpen(true);
        }}
      />

      {/* Task AI Deconstruction & Concept Guidance Modal */}
      <TaskAIExplainModal
        isOpen={Boolean(explainingTask)}
        onClose={() => setExplainingTask(null)}
        task={explainingTask?.task || null}
        stageName={explainingTask?.stageName || ''}
        onStartFocus={onStartFocus}
      />

      {/* AI Roadmap Generator Modal */}
      <RoadmapAIGeneratorModal
        isOpen={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        onSaveRoadmap={(newRd) => onUpdateRoadmap(newRd)}
        userOccupation={profile.occupation}
        initialNotes={roadmap?.sourceNotes || ''}
        initialLinks={roadmap?.referenceLinks || []}
        resourceBank={resources}
      />

      {/* Roadmap Study Notes & Reference Links Modal */}
      {roadmap && (
        <RoadmapNotesAndLinksModal
          isOpen={notesModalOpen}
          onClose={() => setNotesModalOpen(false)}
          roadmap={roadmap}
          onUpdateNotesAndLinks={(newNotes, newLinks) => {
            onUpdateRoadmap({
              ...roadmap,
              sourceNotes: newNotes,
              referenceLinks: newLinks
            });
          }}
          onRefineWithAI={(newNotes, newLinks) => {
            setGeneratorOpen(true);
          }}
        />
      )}

      {/* Resource Bank Modal */}
      <ResourceBankModal
        isOpen={bankModalOpen}
        onClose={() => {
          setBankModalOpen(false);
          setBankFilterStageId(undefined);
        }}
        resources={resources}
        goals={goals}
        roadmap={roadmap}
        onAddResource={onAddResource}
        onUpdateResource={onUpdateResource}
        onDeleteResource={onDeleteResource}
        onOpenRoadmapGenerator={() => setGeneratorOpen(true)}
        initialFilterStageId={bankFilterStageId}
      />

    </div>
  );
};
