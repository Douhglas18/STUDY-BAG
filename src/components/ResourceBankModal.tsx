import React, { useState, useMemo } from 'react';
import { 
  X, Search, Plus, ExternalLink, Trash2, Edit3, Bookmark, 
  Sparkles, Link2, Target, Check, Copy, CheckCircle2, 
  FolderGit2, BookOpen, Video, FileText, Code2, Globe, Wrench, 
  Filter, Layers, ArrowUpRight, ShieldCheck, Tag
} from 'lucide-react';
import { ResourceBankItem, ResourceCategory, Goal, RoadmapStage, PersonalRoadmap } from '../types';

interface ResourceBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: ResourceBankItem[];
  goals: Goal[];
  roadmap: PersonalRoadmap;
  onAddResource: (item: Omit<ResourceBankItem, 'id' | 'createdAt'>) => void;
  onUpdateResource: (id: string, updates: Partial<ResourceBankItem>) => void;
  onDeleteResource: (id: string) => void;
  onOpenRoadmapGenerator?: (preloadedResources?: ResourceBankItem[]) => void;
  initialFilterStageId?: string;
  initialFilterGoalId?: string;
}

const CATEGORY_ICONS: Record<ResourceCategory, React.ReactNode> = {
  'Documentation': <Globe className="w-3.5 h-3.5 text-sky-400" />,
  'Video & Lecture': <Video className="w-3.5 h-3.5 text-rose-400" />,
  'Practice & Problems': <Code2 className="w-3.5 h-3.5 text-emerald-400" />,
  'Notes & Cheatsheet': <FileText className="w-3.5 h-3.5 text-amber-400" />,
  'Textbook & Paper': <BookOpen className="w-3.5 h-3.5 text-violet-400" />,
  'Tool & Platform': <Wrench className="w-3.5 h-3.5 text-indigo-400" />
};

export const ResourceBankModal: React.FC<ResourceBankModalProps> = ({
  isOpen,
  onClose,
  resources,
  goals,
  roadmap,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onOpenRoadmapGenerator,
  initialFilterStageId,
  initialFilterGoalId
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [associationFilter, setAssociationFilter] = useState<'all' | 'nodes' | 'goals' | 'unassigned'>(
    initialFilterStageId ? 'nodes' : initialFilterGoalId ? 'goals' : 'all'
  );
  const [stageFilter, setStageFilter] = useState<string>(initialFilterStageId || 'all');
  const [goalFilter, setGoalFilter] = useState<string>(initialFilterGoalId || 'all');

  // Form State for Adding New Resource
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceCategory>('Documentation');
  const [newDescription, setNewDescription] = useState('');
  const [newStageId, setNewStageId] = useState(initialFilterStageId || '');
  const [newGoalId, setNewGoalId] = useState(initialFilterGoalId || '');
  const [newTags, setNewTags] = useState('');
  const [newIncludeAI, setNewIncludeAI] = useState(true);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState<ResourceCategory>('Documentation');
  const [editDescription, setEditDescription] = useState('');
  const [editStageId, setEditStageId] = useState('');
  const [editGoalId, setEditGoalId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const allStages = roadmap.stages;

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesUrl = res.url.toLowerCase().includes(q);
        const matchesDesc = (res.description || '').toLowerCase().includes(q);
        const matchesTags = (res.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesStage = (res.associatedStageName || '').toLowerCase().includes(q);
        const matchesGoal = (res.associatedGoalTitle || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesUrl && !matchesDesc && !matchesTags && !matchesStage && !matchesGoal) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && res.category !== selectedCategory) {
        return false;
      }

      // Association filter
      if (associationFilter === 'nodes' && !res.associatedStageId) return false;
      if (associationFilter === 'goals' && !res.associatedGoalId) return false;
      if (associationFilter === 'unassigned' && (res.associatedStageId || res.associatedGoalId)) return false;

      // Specific stage filter
      if (stageFilter !== 'all' && res.associatedStageId !== stageFilter) {
        return false;
      }

      // Specific goal filter
      if (goalFilter !== 'all' && res.associatedGoalId !== goalFilter) {
        return false;
      }

      return true;
    });
  }, [resources, searchQuery, selectedCategory, associationFilter, stageFilter, goalFilter]);

  // Derived counts
  const totalCount = resources.length;
  const linkedToNodesCount = resources.filter(r => r.associatedStageId).length;
  const linkedToGoalsCount = resources.filter(r => r.associatedGoalId).length;
  const activeInAICount = resources.filter(r => r.includeInAIPrompts).length;

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    let cleanUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let title = newTitle.trim();
    if (!title) {
      try {
        title = new URL(cleanUrl).hostname;
      } catch (err) {
        title = cleanUrl;
      }
    }

    const matchedStage = allStages.find(s => s.id === newStageId);
    const matchedGoal = goals.find(g => g.id === newGoalId);

    const parsedTags = newTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onAddResource({
      title,
      url: cleanUrl,
      category: newCategory,
      description: newDescription.trim() || undefined,
      associatedStageId: newStageId || undefined,
      associatedStageName: matchedStage ? matchedStage.name : undefined,
      associatedGoalId: newGoalId || undefined,
      associatedGoalTitle: matchedGoal ? matchedGoal.title : undefined,
      tags: parsedTags,
      includeInAIPrompts: newIncludeAI
    });

    // Reset form
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setNewTags('');
    setIsAdding(false);
  };

  const handleStartEdit = (res: ResourceBankItem) => {
    setEditingId(res.id);
    setEditTitle(res.title);
    setEditUrl(res.url);
    setEditCategory(res.category);
    setEditDescription(res.description || '');
    setEditStageId(res.associatedStageId || '');
    setEditGoalId(res.associatedGoalId || '');
  };

  const handleSaveEdit = (id: string) => {
    let cleanUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const matchedStage = allStages.find(s => s.id === editStageId);
    const matchedGoal = goals.find(g => g.id === editGoalId);

    onUpdateResource(id, {
      title: editTitle.trim() || cleanUrl,
      url: cleanUrl,
      category: editCategory,
      description: editDescription.trim() || undefined,
      associatedStageId: editStageId || undefined,
      associatedStageName: matchedStage ? matchedStage.name : undefined,
      associatedGoalId: editGoalId || undefined,
      associatedGoalTitle: matchedGoal ? matchedGoal.title : undefined
    });

    setEditingId(null);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 transition-all flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-b border-slate-800 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3 h-3 text-indigo-400" />
              <span>Central Resource Bank</span>
            </span>

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>AI Context Pull Enabled</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            Resource Bank
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Save and associate learning URLs directly with specific <strong>Roadmap nodes</strong> or <strong>goals</strong>. 
            When generating future roadmaps, the AI automatically pulls curriculum context, video materials, and problem sets from these links.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-800/70">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Saved</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">{totalCount} links</div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-[10px] text-indigo-300 font-semibold uppercase flex items-center gap-1">
                <Link2 className="w-2.5 h-2.5 text-indigo-400" />
                <span>Linked to Nodes</span>
              </div>
              <div className="text-sm font-bold font-mono text-indigo-400 mt-0.5">{linkedToNodesCount} nodes</div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-[10px] text-emerald-300 font-semibold uppercase flex items-center gap-1">
                <Target className="w-2.5 h-2.5 text-emerald-400" />
                <span>Linked to Goals</span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{linkedToGoalsCount} goals</div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="text-[10px] text-amber-300 font-semibold uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>AI Prompt Context</span>
              </div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">{activeInAICount} active</div>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search links by title, url, tags, node, or concept..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAdding(!isAdding)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isAdding
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                }`}
              >
                {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isAdding ? 'Close Form' : 'Add Link'}</span>
              </button>

              {onOpenRoadmapGenerator && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRoadmapGenerator(resources.filter(r => r.includeInAIPrompts));
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition-colors"
                  title="Generate a new AI Roadmap pulling context from this Resource Bank"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Build Roadmap from Bank</span>
                  <span className="sm:hidden">AI Roadmap</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Show:</span>
            </span>

            <button
              onClick={() => {
                setAssociationFilter('all');
                setStageFilter('all');
                setGoalFilter('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                associationFilter === 'all' && stageFilter === 'all' && goalFilter === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All ({resources.length})
            </button>

            <button
              onClick={() => setAssociationFilter('nodes')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                associationFilter === 'nodes'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Link2 className="w-2.5 h-2.5" />
              <span>Linked to Nodes ({linkedToNodesCount})</span>
            </button>

            <button
              onClick={() => setAssociationFilter('goals')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                associationFilter === 'goals'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-2.5 h-2.5" />
              <span>Linked to Goals ({linkedToGoalsCount})</span>
            </button>

            {/* Specific Stage Filter Dropdown if stages exist */}
            {allStages.length > 0 && (
              <select
                value={stageFilter}
                onChange={e => {
                  setStageFilter(e.target.value);
                  if (e.target.value !== 'all') setAssociationFilter('nodes');
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Filter by Specific Node (All)</option>
                {allStages.map(s => (
                  <option key={s.id} value={s.id}>
                    Node: {s.name}
                  </option>
                ))}
              </select>
            )}

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="Documentation">Documentation</option>
              <option value="Video & Lecture">Video & Lecture</option>
              <option value="Practice & Problems">Practice & Problems</option>
              <option value="Notes & Cheatsheet">Notes & Cheatsheet</option>
              <option value="Textbook & Paper">Textbook & Paper</option>
              <option value="Tool & Platform">Tool & Platform</option>
            </select>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ADD NEW RESOURCE ACCORDION / FORM */}
          {isAdding && (
            <form 
              onSubmit={handleCreateResource}
              className="p-4 sm:p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3.5 text-xs animate-fade-in shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-bold text-white text-sm">Save & Associate New Learning Link</h3>
                </div>
                <span className="text-[11px] text-indigo-300">Will be available for AI future roadmap pulls</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Resource URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://ocw.mit.edu/courses/... or https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Title / Topic Name
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. MIT OCW 18.06 Linear Algebra Lecture 14"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as ResourceCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Documentation">Documentation</option>
                    <option value="Video & Lecture">Video & Lecture</option>
                    <option value="Practice & Problems">Practice & Problems</option>
                    <option value="Notes & Cheatsheet">Notes & Cheatsheet</option>
                    <option value="Textbook & Paper">Textbook & Paper</option>
                    <option value="Tool & Platform">Tool & Platform</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-indigo-400" />
                    <span>Associate with Roadmap Node</span>
                  </label>
                  <select
                    value={newStageId}
                    onChange={e => setNewStageId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-indigo-500/30 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None (General Resource)</option>
                    {allStages.map(s => (
                      <option key={s.id} value={s.id}>
                        Stage {s.order}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span>Associate with Goal</span>
                  </label>
                  <select
                    value={newGoalId}
                    onChange={e => setNewGoalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None (General Resource)</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Description, Notes & Key Formulas (AI extracts syllabus context from this)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="e.g. Covers eigenvalues, singular value decomposition, and practice set 4. Important for Mid-Term exam."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="e.g. Math, LinearAlgebra, MIT, Drill"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIncludeAI}
                      onChange={e => setNewIncludeAI(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold">Include in future AI Roadmap generation</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-indigo-500/20">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newUrl.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Bank</span>
                </button>
              </div>
            </form>
          )}

          {/* LIST OF SAVED RESOURCES */}
          {filteredResources.length > 0 ? (
            <div className="space-y-3">
              {filteredResources.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/50 space-y-3 text-xs animate-fade-in"
                    >
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit Resource</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="Title"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                        <input
                          type="text"
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          placeholder="URL"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value as any)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        >
                          <option value="Documentation">Documentation</option>
                          <option value="Video & Lecture">Video & Lecture</option>
                          <option value="Practice & Problems">Practice & Problems</option>
                          <option value="Notes & Cheatsheet">Notes & Cheatsheet</option>
                          <option value="Textbook & Paper">Textbook & Paper</option>
                          <option value="Tool & Platform">Tool & Platform</option>
                        </select>

                        <select
                          value={editStageId}
                          onChange={e => setEditStageId(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        >
                          <option value="">No Stage (General)</option>
                          {allStages.map(s => (
                            <option key={s.id} value={s.id}>
                              Stage {s.order}: {s.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={editGoalId}
                          onChange={e => setEditGoalId(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        >
                          <option value="">No Goal (General)</option>
                          {goals.map(g => (
                            <option key={g.id} value={g.id}>
                              Goal: {g.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <textarea
                        rows={2}
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Description / notes"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs group"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      
                      {/* Top Badges Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category Badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-semibold">
                          {CATEGORY_ICONS[item.category] || <Globe className="w-3 h-3" />}
                          <span>{item.category}</span>
                        </span>

                        {/* Node Association Badge */}
                        {item.associatedStageName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                            <Link2 className="w-3 h-3 text-indigo-400" />
                            <span>Node: {item.associatedStageName}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">
                            Unassigned Node
                          </span>
                        )}

                        {/* Goal Association Badge */}
                        {item.associatedGoalTitle && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                            <Target className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="truncate max-w-[180px]">{item.associatedGoalTitle}</span>
                          </span>
                        )}

                        {/* AI Active Context Toggle */}
                        <button
                          type="button"
                          onClick={() => onUpdateResource(item.id, { includeInAIPrompts: !item.includeInAIPrompts })}
                          className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            item.includeInAIPrompts
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-400'
                          }`}
                          title={item.includeInAIPrompts ? 'AI pulls context from this link during roadmap generation' : 'Excluded from AI prompts'}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>{item.includeInAIPrompts ? 'AI Context ON' : 'AI Context OFF'}</span>
                        </button>
                      </div>

                      {/* Title & External Launcher */}
                      <div className="flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm text-white hover:text-indigo-300 flex items-center gap-1.5 transition-colors group/link"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover/link:text-indigo-400 transition-colors" />
                        </a>
                      </div>

                      {/* URL Hostname / Full URL */}
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {item.url}
                      </div>

                      {/* Description & Study Notes */}
                      {item.description && (
                        <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                          {item.description}
                        </p>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {item.tags.map((tag, tIdx) => (
                            <span 
                              key={tIdx} 
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-850"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 self-end sm:self-auto pt-2 sm:pt-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(item.url, item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                          title="Copy Link URL"
                        >
                          {copiedId === item.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                          title="Edit Association"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteResource(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                          title="Delete from Resource Bank"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Fast Associate dropdown if not associated */}
                      {!item.associatedStageId && allStages.length > 0 && (
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value) {
                              const st = allStages.find(s => s.id === e.target.value);
                              onUpdateResource(item.id, {
                                associatedStageId: st?.id,
                                associatedStageName: st?.name
                              });
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-300 font-semibold focus:outline-none"
                        >
                          <option value="">+ Link to Node...</option>
                          {allStages.map(s => (
                            <option key={s.id} value={s.id}>
                              Stage {s.order}: {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
              <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">No resources match your filter</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'all' || associationFilter !== 'all'
                    ? 'Try clearing your search query or switching categories.'
                    : 'Your Resource Bank is empty. Save links to online courses, problem sets, and documentation above!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setAssociationFilter('all');
                  setStageFilter('all');
                  setGoalFilter('all');
                  setIsAdding(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Resource Link</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer info & close */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI pulls context from all links with "AI Context ON" when generating or adapting roadmaps.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Bank
          </button>
        </div>

      </div>
    </div>
  );
};
