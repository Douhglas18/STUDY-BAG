import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, ExternalLink, Trash2, Edit3, Bookmark, 
  Sparkles, Link2, Target, Check, Copy, CheckCircle2, 
  FolderGit2, BookOpen, Video, FileText, Code2, Globe, Wrench, 
  Filter, Layers, ArrowUpRight, ShieldCheck, Tag, X, CheckSquare,
  Compass, Hash, Folder
} from 'lucide-react';
import { ResourceBankItem, ResourceCategory, Goal, PersonalRoadmap } from '../types';

interface ResourceBankScreenProps {
  resources: ResourceBankItem[];
  goals: Goal[];
  roadmap: PersonalRoadmap;
  onAddResource: (item: Omit<ResourceBankItem, 'id' | 'createdAt'>) => void;
  onUpdateResource: (id: string, updates: Partial<ResourceBankItem>) => void;
  onDeleteResource: (id: string) => void;
  onNavigateToRoadmap?: () => void;
  onOpenRoadmapGenerator?: (preloadedResources?: ResourceBankItem[]) => void;
}

export const PRIMARY_GROUP_TAGS = ['Learning', 'Reference', 'Project'] as const;
export type PrimaryGroupTag = typeof PRIMARY_GROUP_TAGS[number];

const PRIMARY_TAG_CONFIG: Record<PrimaryGroupTag, {
  color: string;
  badge: string;
  activeBadge: string;
  icon: React.ReactNode;
  description: string;
}> = {
  'Learning': {
    color: 'text-indigo-400',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25 hover:border-indigo-400',
    activeBadge: 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    description: 'Courses, textbooks, video lectures & concept tutorials'
  },
  'Reference': {
    color: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400',
    activeBadge: 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30',
    icon: <FileText className="w-3.5 h-3.5" />,
    description: 'Documentation, cheatsheets, formulas & API specs'
  },
  'Project': {
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400',
    activeBadge: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30',
    icon: <FolderGit2 className="w-3.5 h-3.5" />,
    description: 'Repositories, practice problem sets, apps & code templates'
  }
};

const CATEGORY_ICONS: Record<ResourceCategory, React.ReactNode> = {
  'Documentation': <Globe className="w-3.5 h-3.5 text-sky-400" />,
  'Video & Lecture': <Video className="w-3.5 h-3.5 text-rose-400" />,
  'Practice & Problems': <Code2 className="w-3.5 h-3.5 text-emerald-400" />,
  'Notes & Cheatsheet': <FileText className="w-3.5 h-3.5 text-amber-400" />,
  'Textbook & Paper': <BookOpen className="w-3.5 h-3.5 text-violet-400" />,
  'Tool & Platform': <Wrench className="w-3.5 h-3.5 text-indigo-400" />
};

export const ResourceBankScreen: React.FC<ResourceBankScreenProps> = ({
  resources,
  goals,
  roadmap,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onNavigateToRoadmap,
  onOpenRoadmapGenerator
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'all'>('all');
  const [associationFilter, setAssociationFilter] = useState<'all' | 'nodes' | 'goals' | 'unassigned'>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceCategory>('Documentation');
  const [newDescription, setNewDescription] = useState('');
  const [newStageId, setNewStageId] = useState('');
  const [newGoalId, setNewGoalId] = useState('');
  const [selectedNewGroupTags, setSelectedNewGroupTags] = useState<string[]>(['Learning']);
  const [newCustomTags, setNewCustomTags] = useState('');
  const [newIncludeAI, setNewIncludeAI] = useState(true);

  // Edit inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState<ResourceCategory>('Documentation');
  const [editDescription, setEditDescription] = useState('');
  const [editStageId, setEditStageId] = useState('');
  const [editGoalId, setEditGoalId] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCustomTagInput, setEditCustomTagInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allStages = roadmap.stages;

  // Tag Counts & Summaries
  const learningCount = useMemo(() => 
    resources.filter(r => (r.tags || []).some(t => t.toLowerCase() === 'learning')).length
  , [resources]);

  const referenceCount = useMemo(() => 
    resources.filter(r => (r.tags || []).some(t => t.toLowerCase() === 'reference')).length
  , [resources]);

  const projectCount = useMemo(() => 
    resources.filter(r => (r.tags || []).some(t => t.toLowerCase() === 'project')).length
  , [resources]);

  const otherUniqueTags = useMemo(() => {
    const set = new Set<string>();
    resources.forEach(r => {
      (r.tags || []).forEach(t => {
        const lower = t.toLowerCase();
        if (lower !== 'learning' && lower !== 'reference' && lower !== 'project') {
          set.add(t);
        }
      });
    });
    return Array.from(set).slice(0, 10);
  }, [resources]);

  // Filtered resources calculation
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      // 1. Tag filter (e.g. 'Learning', 'Reference', 'Project', or specific custom tag)
      if (selectedTagFilter !== 'all') {
        const hasTag = (res.tags || []).some(
          t => t.toLowerCase() === selectedTagFilter.toLowerCase()
        );
        if (!hasTag) return false;
      }

      // 2. Search query: filter by Title OR Tags (also checks description & URL)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesTags = (res.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesDesc = (res.description || '').toLowerCase().includes(q);
        const matchesUrl = res.url.toLowerCase().includes(q);
        const matchesStage = (res.associatedStageName || '').toLowerCase().includes(q);
        const matchesGoal = (res.associatedGoalTitle || '').toLowerCase().includes(q);

        if (!matchesTitle && !matchesTags && !matchesDesc && !matchesUrl && !matchesStage && !matchesGoal) {
          return false;
        }
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && res.category !== selectedCategory) {
        return false;
      }

      // 4. Association filter
      if (associationFilter === 'nodes' && !res.associatedStageId) return false;
      if (associationFilter === 'goals' && !res.associatedGoalId) return false;
      if (associationFilter === 'unassigned' && (res.associatedStageId || res.associatedGoalId)) return false;

      // 5. Stage & Goal specific filters
      if (stageFilter !== 'all' && res.associatedStageId !== stageFilter) return false;
      if (goalFilter !== 'all' && res.associatedGoalId !== goalFilter) return false;

      return true;
    });
  }, [resources, searchQuery, selectedTagFilter, selectedCategory, associationFilter, stageFilter, goalFilter]);

  const totalCount = resources.length;
  const linkedToNodesCount = resources.filter(r => r.associatedStageId).length;
  const linkedToGoalsCount = resources.filter(r => r.associatedGoalId).length;
  const activeInAICount = resources.filter(r => r.includeInAIPrompts).length;

  const toggleNewGroupTag = (tag: string) => {
    setSelectedNewGroupTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleEditGroupTag = (tag: string) => {
    setEditTags(prev => 
      prev.some(t => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    );
  };

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

    const parsedCustomTags = newCustomTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // Merge primary group tags and custom tags uniquely
    const finalTags = Array.from(new Set([...selectedNewGroupTags, ...parsedCustomTags]));

    onAddResource({
      title,
      url: cleanUrl,
      category: newCategory,
      description: newDescription.trim() || undefined,
      associatedStageId: newStageId || undefined,
      associatedStageName: matchedStage ? matchedStage.name : undefined,
      associatedGoalId: newGoalId || undefined,
      associatedGoalTitle: matchedGoal ? matchedGoal.title : undefined,
      tags: finalTags,
      includeInAIPrompts: newIncludeAI
    });

    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setSelectedNewGroupTags(['Learning']);
    setNewCustomTags('');
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
    setEditTags(res.tags || []);
    setEditCustomTagInput('');
  };

  const handleSaveEdit = (id: string) => {
    let cleanUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const matchedStage = allStages.find(s => s.id === editStageId);
    const matchedGoal = goals.find(g => g.id === editGoalId);

    const parsedCustom = editCustomTagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const finalTags = Array.from(new Set([...editTags, ...parsedCustom]));

    onUpdateResource(id, {
      title: editTitle.trim() || cleanUrl,
      url: cleanUrl,
      category: editCategory,
      description: editDescription.trim() || undefined,
      associatedStageId: editStageId || undefined,
      associatedStageName: matchedStage ? matchedStage.name : undefined,
      associatedGoalId: editGoalId || undefined,
      associatedGoalTitle: matchedGoal ? matchedGoal.title : undefined,
      tags: finalTags
    });

    setEditingId(null);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <span>Personal Knowledge & Resource Bank</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Curated Resources, Tags & Roadmap Associations
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Group and tag study materials by <strong className="text-indigo-300 font-semibold">Learning</strong> (courses/lectures), <strong className="text-amber-300 font-semibold">Reference</strong> (docs/cheatsheets), and <strong className="text-emerald-300 font-semibold">Project</strong> (code/practice). Filter by title or tags to access key resources instantly.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAdding ? 'Close Form' : 'Add Resource'}</span>
            </button>

            {onNavigateToRoadmap && (
              <button
                onClick={onNavigateToRoadmap}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>View Roadmap Tree</span>
              </button>
            )}
          </div>
        </div>

        {/* Tag Classification Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setSelectedTagFilter('all')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              selectedTagFilter === 'all'
                ? 'bg-indigo-950/60 border-indigo-500/60 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>All Resources</span>
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-base font-bold font-mono text-white mt-0.5">{totalCount} total</div>
          </button>

          <button
            onClick={() => setSelectedTagFilter(selectedTagFilter === 'Learning' ? 'all' : 'Learning')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              selectedTagFilter.toLowerCase() === 'learning'
                ? 'bg-indigo-950/70 border-indigo-500/80 ring-1 ring-indigo-500'
                : 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/40'
            }`}
          >
            <div className="text-[10px] text-indigo-300 font-semibold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-400" />
                <span>Learning</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">Tag</span>
            </div>
            <div className="text-base font-bold font-mono text-indigo-400 mt-0.5">{learningCount} items</div>
          </button>

          <button
            onClick={() => setSelectedTagFilter(selectedTagFilter === 'Reference' ? 'all' : 'Reference')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              selectedTagFilter.toLowerCase() === 'reference'
                ? 'bg-amber-950/70 border-amber-500/80 ring-1 ring-amber-500'
                : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/40'
            }`}
          >
            <div className="text-[10px] text-amber-300 font-semibold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-amber-400" />
                <span>Reference</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">Tag</span>
            </div>
            <div className="text-base font-bold font-mono text-amber-400 mt-0.5">{referenceCount} items</div>
          </button>

          <button
            onClick={() => setSelectedTagFilter(selectedTagFilter === 'Project' ? 'all' : 'Project')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              selectedTagFilter.toLowerCase() === 'project'
                ? 'bg-emerald-950/70 border-emerald-500/80 ring-1 ring-emerald-500'
                : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <div className="text-[10px] text-emerald-300 font-semibold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FolderGit2 className="w-3 h-3 text-emerald-400" />
                <span>Project</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Tag</span>
            </div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{projectCount} items</div>
          </button>
        </div>
      </div>

      {/* ADD RESOURCE FORM */}
      {isAdding && (
        <form 
          onSubmit={handleCreateResource}
          className="p-5 sm:p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/40 space-y-4 text-xs animate-fade-in shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-sm">Save & Tag New Learning Resource</h3>
            </div>
            <span className="text-[11px] text-indigo-300 font-mono">Synced to cloud & accessible across devices</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Resource URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Resource Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. MIT OCW 18.06 Linear Algebra"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Group Tagging System Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Primary Tag Group (Click to select/toggle)</span>
              </label>
              <span className="text-[10px] text-slate-400">Categorize under Learning, Reference, or Project</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRIMARY_GROUP_TAGS.map(groupTag => {
                const config = PRIMARY_TAG_CONFIG[groupTag];
                const isSelected = selectedNewGroupTags.includes(groupTag);
                return (
                  <button
                    key={groupTag}
                    type="button"
                    onClick={() => toggleNewGroupTag(groupTag)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? config.activeBadge
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
                        {config.icon}
                      </span>
                      <div>
                        <div className="font-bold text-xs">{groupTag}</div>
                        <div className="text-[9px] opacity-80 leading-tight">{config.description.split(',')[0]}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Category Type
              </label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as ResourceCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
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
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Associate with Roadmap Node</span>
              </label>
              <select
                value={newStageId}
                onChange={e => setNewStageId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-white text-xs focus:outline-none focus:border-indigo-500"
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
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Associate with Goal</span>
              </label>
              <select
                value={newGoalId}
                onChange={e => setNewGoalId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-500"
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
              Description & Concept Notes (AI draws context from this)
            </label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="e.g. Focus on Chapter 4 problem set 12-18. High-weight exam topics."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Additional Custom Tags (comma-separated)
              </label>
              <input
                type="text"
                value={newCustomTags}
                onChange={e => setNewCustomTags(e.target.value)}
                placeholder="e.g. Math, Calculus, Exam, Drill"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
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

          {/* Active Tags Preview */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500">Will be saved with tags:</span>
            {selectedNewGroupTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                {tag}
              </span>
            ))}
            {newCustomTags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
                #{t}
              </span>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-indigo-500/20">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newUrl.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save to Bank</span>
            </button>
          </div>
        </form>
      )}

      {/* FILTER & SEARCH TOOLBAR WITH TAG FILTERING */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search resources by title or tags ('Learning', 'Reference', 'Project')..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="Documentation">Documentation</option>
              <option value="Video & Lecture">Video & Lecture</option>
              <option value="Practice & Problems">Practice & Problems</option>
              <option value="Notes & Cheatsheet">Notes & Cheatsheet</option>
              <option value="Textbook & Paper">Textbook & Paper</option>
              <option value="Tool & Platform">Tool & Platform</option>
            </select>

            {allStages.length > 0 && (
              <select
                value={stageFilter}
                onChange={e => {
                  setStageFilter(e.target.value);
                  if (e.target.value !== 'all') setAssociationFilter('nodes');
                }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Filter by Node (All)</option>
                {allStages.map(s => (
                  <option key={s.id} value={s.id}>
                    Node: {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Dedicated Tag Filter Row */}
        <div className="pt-2 border-t border-slate-800/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter by Tag Group:</span>
            </span>

            {(selectedTagFilter !== 'all' || searchQuery.trim() !== '' || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSelectedTagFilter('all');
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setAssociationFilter('all');
                  setStageFilter('all');
                  setGoalFilter('all');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <X className="w-3 h-3" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* All Tags button */}
            <button
              onClick={() => setSelectedTagFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedTagFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Tags ({resources.length})
            </button>

            {/* Learning Tag button */}
            <button
              onClick={() => setSelectedTagFilter(selectedTagFilter === 'Learning' ? 'all' : 'Learning')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                selectedTagFilter.toLowerCase() === 'learning'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold'
                  : 'bg-slate-950 text-indigo-300 border-indigo-500/30 hover:border-indigo-400/60 hover:bg-indigo-950/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Learning</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedTagFilter.toLowerCase() === 'learning' ? 'bg-white/20' : 'bg-indigo-500/20'
              }`}>
                {learningCount}
              </span>
            </button>

            {/* Reference Tag button */}
            <button
              onClick={() => setSelectedTagFilter(selectedTagFilter === 'Reference' ? 'all' : 'Reference')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                selectedTagFilter.toLowerCase() === 'reference'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30 font-bold'
                  : 'bg-slate-950 text-amber-300 border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-950/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reference</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedTagFilter.toLowerCase() === 'reference' ? 'bg-white/20' : 'bg-amber-500/20'
              }`}>
                {referenceCount}
              </span>
            </button>

            {/* Project Tag button */}
            <button
              onClick={() => setSelectedTagFilter(selectedTagFilter === 'Project' ? 'all' : 'Project')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                selectedTagFilter.toLowerCase() === 'project'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 font-bold'
                  : 'bg-slate-950 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-950/40'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Project</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedTagFilter.toLowerCase() === 'project' ? 'bg-white/20' : 'bg-emerald-500/20'
              }`}>
                {projectCount}
              </span>
            </button>

            {/* Other discovered tags */}
            {otherUniqueTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? 'all' : tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                  selectedTagFilter.toLowerCase() === tag.toLowerCase()
                    ? 'bg-slate-200 text-slate-900 border-white font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Association Toggle Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Association:</span>
          </span>

          <button
            onClick={() => {
              setAssociationFilter('all');
              setStageFilter('all');
              setGoalFilter('all');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              associationFilter === 'all' && stageFilter === 'all' && goalFilter === 'all'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All Resources ({resources.length})
          </button>

          <button
            onClick={() => setAssociationFilter('nodes')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              associationFilter === 'nodes'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>Linked to Nodes ({linkedToNodesCount})</span>
          </button>

          <button
            onClick={() => setAssociationFilter('goals')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              associationFilter === 'goals'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3 h-3" />
            <span>Linked to Goals ({linkedToGoalsCount})</span>
          </button>
        </div>
      </div>

      {/* ACTIVE FILTER NOTICE */}
      {(selectedTagFilter !== 'all' || searchQuery.trim() !== '') && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">Filtering by:</span>
            {selectedTagFilter !== 'all' && (
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 font-bold flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Tag: {selectedTagFilter}</span>
                <button onClick={() => setSelectedTagFilter('all')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery.trim() !== '' && (
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                <Search className="w-3 h-3" />
                <span>Query: "{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <span className="text-slate-400">({filteredResources.length} matched)</span>
          </div>

          <button
            onClick={() => {
              setSelectedTagFilter('all');
              setSearchQuery('');
            }}
            className="text-[11px] underline hover:text-white shrink-0 ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* RESOURCE CARDS LIST */}
      <div className="space-y-3">
        {filteredResources.length > 0 ? (
          filteredResources.map(item => {
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <div 
                  key={item.id}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-indigo-500/50 space-y-4 text-xs shadow-2xl animate-fade-in"
                >
                  <div className="font-bold text-white text-sm flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-400" />
                      <span>Edit Resource & Tags</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {item.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">URL</label>
                      <input
                        type="text"
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        placeholder="URL"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Edit Tags & Group Classification */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Primary Tag Groups</span>
                    </label>

                    <div className="flex items-center gap-2 flex-wrap">
                      {PRIMARY_GROUP_TAGS.map(groupTag => {
                        const hasTag = editTags.some(t => t.toLowerCase() === groupTag.toLowerCase());
                        const config = PRIMARY_TAG_CONFIG[groupTag];
                        return (
                          <button
                            key={groupTag}
                            type="button"
                            onClick={() => toggleEditGroupTag(groupTag)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              hasTag ? config.activeBadge : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {config.icon}
                            <span>{groupTag}</span>
                            {hasTag && <Check className="w-3 h-3 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                        Add Custom Tags (comma-separated):
                      </label>
                      <input
                        type="text"
                        value={editCustomTagInput}
                        onChange={e => setEditCustomTagInput(e.target.value)}
                        placeholder="e.g. Calculus, Matrix, MIT"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value as any)}
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
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Roadmap Node</label>
                      <select
                        value={editStageId}
                        onChange={e => setEditStageId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">No Stage (General)</option>
                        {allStages.map(s => (
                          <option key={s.id} value={s.id}>
                            Stage {s.order}: {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Associated Goal</label>
                      <select
                        value={editGoalId}
                        onChange={e => setEditGoalId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">No Goal (General)</option>
                        {goals.map(g => (
                          <option key={g.id} value={g.id}>
                            Goal: {g.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Description / Notes</label>
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Description / concept summary"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item.id)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
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
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs group shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-2.5">
                  {/* Category, Association Badges & AI prompt context */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-semibold">
                      {CATEGORY_ICONS[item.category] || <Globe className="w-3.5 h-3.5" />}
                      <span>{item.category}</span>
                    </span>

                    {item.associatedStageName ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                        <Link2 className="w-3 h-3 text-indigo-400" />
                        <span>Node: {item.associatedStageName}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">
                        Unassigned Node
                      </span>
                    )}

                    {item.associatedGoalTitle && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                        <Target className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="truncate max-w-[200px]">{item.associatedGoalTitle}</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onUpdateResource(item.id, { includeInAIPrompts: !item.includeInAIPrompts })}
                      className={`ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        item.includeInAIPrompts
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-400'
                      }`}
                      title="Toggle inclusion in AI roadmap generation"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      <span>{item.includeInAIPrompts ? 'AI Context ON' : 'AI Context OFF'}</span>
                    </button>
                  </div>

                  {/* Title & URL */}
                  <div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-base text-white hover:text-indigo-300 flex items-center gap-2 transition-colors group/link"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover/link:text-indigo-400 shrink-0" />
                    </a>
                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                      {item.url}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                      {item.description}
                    </p>
                  )}

                  {/* Tagging System display with Interactive Group Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {item.tags.map((tag, tIdx) => {
                        const normalizedTag = tag.trim();
                        const isPrimary = PRIMARY_GROUP_TAGS.some(
                          p => p.toLowerCase() === normalizedTag.toLowerCase()
                        );
                        const primaryKey = PRIMARY_GROUP_TAGS.find(
                          p => p.toLowerCase() === normalizedTag.toLowerCase()
                        );
                        const isFilterActive = selectedTagFilter.toLowerCase() === normalizedTag.toLowerCase();

                        if (isPrimary && primaryKey) {
                          const config = PRIMARY_TAG_CONFIG[primaryKey];
                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => setSelectedTagFilter(isFilterActive ? 'all' : primaryKey)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                isFilterActive
                                  ? config.activeBadge
                                  : config.badge
                              }`}
                              title={`Group: ${primaryKey}. Click to filter by ${primaryKey}`}
                            >
                              {config.icon}
                              <span>{primaryKey}</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => setSelectedTagFilter(isFilterActive ? 'all' : normalizedTag)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all ${
                              isFilterActive
                                ? 'bg-slate-200 text-slate-900 border-white font-bold'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                            }`}
                            title={`Tag: #${normalizedTag}. Click to filter`}
                          >
                            <span>#{normalizedTag}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 self-end sm:self-auto pt-2 sm:pt-0">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.url, item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Resource & Tags"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteResource(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete from Bank"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

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
                      className="px-2.5 py-1 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-300 font-semibold focus:outline-none"
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
          })
        ) : (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-base">No matching resources found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery || selectedTagFilter !== 'all' || selectedCategory !== 'all' || associationFilter !== 'all'
                ? `No resources match "${searchQuery || selectedTagFilter}". Try broadening your search or resetting tag filters.`
                : 'Your Resource Bank is currently empty. Click "Add Resource" to start building your knowledge base!'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {(searchQuery || selectedTagFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTagFilter('all');
                    setSelectedCategory('all');
                    setAssociationFilter('all');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTagFilter('all');
                  setIsAdding(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Resource</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
