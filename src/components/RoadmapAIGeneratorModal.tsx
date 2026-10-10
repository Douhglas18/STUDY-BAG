import React, { useState } from 'react';
import { 
  X, Sparkles, Target, Calendar, Clock, ArrowRight, CheckCircle2, 
  BookOpen, Link2, Plus, Trash2, Upload, Globe, Search, 
  FileText, ExternalLink, HelpCircle, AlertCircle, Layers, Bookmark, CheckSquare, Square
} from 'lucide-react';
import { PersonalRoadmap, RoadmapReferenceLink, GroundedWebSource, ResourceBankItem } from '../types';
import { aiService } from '../services/aiService';
import { recalculateRoadmap } from '../services/roadmapData';
import { storageService } from '../services/storage';

interface RoadmapAIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoadmap: (newRoadmap: PersonalRoadmap) => void;
  userOccupation: string;
  initialNotes?: string;
  initialLinks?: RoadmapReferenceLink[];
  resourceBank?: ResourceBankItem[];
}

export const RoadmapAIGeneratorModal: React.FC<RoadmapAIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSaveRoadmap,
  userOccupation,
  initialNotes = '',
  initialLinks = [],
  resourceBank
}) => {
  // Tab state: 'goal' | 'notes' | 'links' | 'bank'
  const [activeTab, setActiveTab] = useState<'goal' | 'notes' | 'links' | 'bank'>('goal');

  // Resource Bank items available
  const bankItems = resourceBank || storageService.loadResourceBank();
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(() => {
    return new Set(bankItems.filter(b => b.includeInAIPrompts).map(b => b.id));
  });

  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [timeframeWeeks, setTimeframeWeeks] = useState(6);

  // Notes & Reference links states
  const [notes, setNotes] = useState(initialNotes);
  const [referenceLinks, setReferenceLinks] = useState<RoadmapReferenceLink[]>(initialLinks);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkNote, setNewLinkNote] = useState('');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);

  // Async generation states
  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);

  if (!isOpen) return null;

  // Add a reference link
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const title = newLinkTitle.trim() || new URL(url).hostname;
    setReferenceLinks(prev => [
      ...prev,
      {
        id: 'link-' + Date.now(),
        title,
        url,
        note: newLinkNote.trim() || undefined
      }
    ]);

    setNewLinkUrl('');
    setNewLinkTitle('');
    setNewLinkNote('');
  };

  const handleRemoveLink = (index: number) => {
    setReferenceLinks(prev => prev.filter((_, idx) => idx !== index));
  };

  // Upload study notes text or markdown or PDF file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const result = evt.target?.result as string;
        const base64Data = result.split(',')[1] || result;
        try {
          const uploaded = await aiService.uploadDocument(file.name, file.type, base64Data);
          if (uploaded?.document?.summary) {
            setNotes(prev => prev ? `${prev}\n\n[Uploaded Syllabus PDF: ${file.name}]\n${uploaded.document.summary}` : `[Uploaded Syllabus PDF: ${file.name}]\n${uploaded.document.summary}`);
          }
        } catch (err) {
          console.warn('PDF upload notice:', err);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          setNotes(prev => prev ? `${prev}\n\n--- [Uploaded Notes: ${file.name}] ---\n${content}` : content);
        }
      };
      reader.readAsText(file);
    }
  };

  // Preset goals with pre-filled notes and reference links
  const sampleGoals = [
    {
      title: 'Increase Semester CGPA to 9.0',
      target: 'Score 90%+ in Mid-Terms • Top 5% Rank',
      weeks: 8,
      status: 'Completed 1 unit, behind on 2 assignments, 2 hours available daily.',
      notes: `Syllabus Breakdown:
- Unit 1: Linear Algebra & Matrix Eigenvalues (25% weightage)
- Unit 2: Data Structures - Binary Trees & Graph Traversal (30% weightage)
- Unit 3: Electromagnetic Field Theory & Maxwell Equations (25% weightage)
- Unit 4: Operating Systems - Concurrency & Deadlocks (20% weightage)
Notes: Must complete PYQs (previous year questions) from 2023-2025. Formula revision is weak on Unit 1.`,
      links: [
        { title: 'MIT OCW 18.06 Linear Algebra', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', note: 'Primary video lectures & problem sets' },
        { title: 'GeeksforGeeks DSA Graphs & Trees', url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/', note: 'Standard code examples and benchmark questions' }
      ]
    },
    {
      title: 'Master NeetCode 150 & Tech Interviews',
      target: 'Pass Tier-1 FAANG Technical Coding Rounds',
      weeks: 10,
      status: 'Solved 30 easy problems on LeetCode. Struggle with DFS/BFS and DP.',
      notes: `Study Checklist:
1. Arrays & Hashing: Two Sum, Group Anagrams, Top K Frequent
2. Two Pointers & Sliding Window: Trapping Rain Water, Longest Substring
3. Trees & Tries: Lowest Common Ancestor, Word Search II
4. Graphs: Clone Graph, Course Schedule, Number of Islands
5. 1D & 2D Dynamic Programming: Coin Change, Longest Increasing Subsequence
Goal: Practice 3 problems/day with 25-minute timer under zero distraction.`,
      links: [
        { title: 'NeetCode.io Interactive Roadmap', url: 'https://neetcode.io/roadmap', note: 'Authoritative pattern roadmap & problem tiering' },
        { title: 'LeetCode Problem Archive', url: 'https://leetcode.com/problemset/', note: 'Practice submissions & runtimes' }
      ]
    },
    {
      title: 'Build & Launch Full-Stack AI SaaS',
      target: 'Launch MVP to ProductHunt with $500 MRR',
      weeks: 6,
      status: 'Intermediate React & TypeScript knowledge. Need to master backend API integration and payments.',
      notes: `Architecture & Feature Requirements:
- Frontend: Next.js App Router, Tailwind CSS, Lucide icons, Framer Motion
- Backend & AI: Node.js/Express, Gemini 3 API, streaming responses, search grounding
- Persistence & Auth: Firebase / PostgreSQL with secure session tokens
- Monetization: Stripe checkout webhooks and usage-based quotas
Deliverable: Working production app with test user onboarding.`,
      links: [
        { title: 'Next.js App Router Documentation', url: 'https://nextjs.org/docs', note: 'Official docs for server components' },
        { title: 'Google GenAI TypeScript SDK Reference', url: 'https://github.com/googleapis/genai-js', note: 'Official SDK patterns' }
      ]
    }
  ];

  const handleApplyPreset = (sample: typeof sampleGoals[0]) => {
    setGoalTitle(sample.title);
    setTargetOutcome(sample.target);
    setTimeframeWeeks(sample.weeks);
    setCurrentStatus(sample.status);
    setNotes(sample.notes);
    setReferenceLinks(sample.links.map((l, i) => ({ id: `link-pre-${i}`, ...l })));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setLoading(true);
    setGenerationStep('Analyzing your study notes & reference materials...');

    try {
      const stepTimer1 = setTimeout(() => {
        if (useSearchGrounding) {
          setGenerationStep('Grounding with Google Search for latest curriculum standards & links...');
        } else {
          setGenerationStep('Structuring progressive stages & prerequisite dependency DAG...');
        }
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep('Synthesizing tasks, estimated hours & active recall checkpoints...');
      }, 2500);

      const activeBankResources = bankItems.filter(item => selectedBankIds.has(item.id));

      const res = await aiService.generateRoadmap({
        goalTitle,
        currentStatus,
        targetOutcome,
        timeframeWeeks,
        userContext: { occupation: userOccupation },
        notes,
        referenceLinks,
        resourceBank: activeBankResources,
        useSearchGrounding
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res && res.stages) {
        setGeneratedPreview(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setGenerationStep('');
    }
  };

  const handleApplyRoadmap = () => {
    if (!generatedPreview) return;

    const newRoadmap: PersonalRoadmap = {
      id: 'rd-custom-' + Date.now(),
      goalId: 'g-custom-' + Date.now(),
      title: generatedPreview.title || goalTitle,
      category: 'Personal Growth',
      targetGoal: targetOutcome || goalTitle,
      deadline: `In ${timeframeWeeks} Weeks`,
      currentStreak: 1,
      sourceNotes: notes,
      referenceLinks: referenceLinks,
      groundedSources: generatedPreview.groundedSources || [],
      searchQueries: generatedPreview.searchQueries || [],
      keyTopicsCovered: generatedPreview.keyTopicsCovered || [],
      stages: generatedPreview.stages.map((st: any, idx: number) => ({
        ...st,
        id: st.id || `st-gen-${idx + 1}`,
        roadmapId: 'rd-custom-' + Date.now(),
        order: idx + 1,
        status: idx === 0 ? 'available' : 'locked',
        difficulty: st.difficulty || 'Normal',
        estimatedHours: st.estimatedHours || 5,
        prerequisiteStageIds: st.prerequisiteStageIds || (idx > 0 ? [`st-gen-${idx}`] : []),
        stageNotes: st.stageNotes || undefined,
        resources: (st.resources || []).map((r: any, rIdx: number) => ({
          id: r.id || `res-${idx}-${rIdx}`,
          title: r.title || 'Reference Resource',
          url: r.url || '#',
          type: r.type || 'doc',
          description: r.description || ''
        })),
        tasks: (st.tasks || []).map((t: any, tIdx: number) => ({
          id: t.id || `t-gen-${idx}-${tIdx}`,
          stageId: st.id || `st-gen-${idx + 1}`,
          title: t.title || 'Action task',
          description: t.description || undefined,
          status: 'Not Started',
          priority: t.priority || 'medium',
          difficulty: t.difficulty || 'Normal',
          estimatedMinutes: t.estimatedMinutes || 40
        }))
      })),
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
      aiInsight: generatedPreview.summary || 'Custom adaptive roadmap generated with your notes and reference links.'
    };

    const calculated = recalculateRoadmap(newRoadmap);
    onSaveRoadmap(calculated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>AI Study Plan & Roadmap Architect</span>
            </span>
            {useSearchGrounding && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Google Search Grounded</span>
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Custom Study Plan from Your Notes & References
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Share your study notes, syllabus units, or reference links. The AI will ground real-world curriculum data with Google Search to engineer your personalized roadmap with prerequisite locks.
          </p>

          {/* Navigation Tabs (when not previewing) */}
          {!generatedPreview && (
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setActiveTab('goal')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'goal'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>1. Goal & Target</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>2. Study Notes & Syllabus</span>
                {notes.trim().length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('links')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'links'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>3. Reference Links ({referenceLinks.length})</span>
                {referenceLinks.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bank')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'bank'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Resource Bank Context ({selectedBankIds.size}/{bankItems.length})</span>
                {selectedBankIds.size > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[65vh] overflow-y-auto text-xs">
          {!generatedPreview ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              
              {/* TAB 1: GOAL & TARGET */}
              {activeTab === 'goal' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Quick Preset Templates (With Notes & Links)
                      </label>
                      <span className="text-[10px] text-slate-500">Click to autofill all tabs</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {sampleGoals.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(sample)}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
                        >
                          <div className="font-semibold text-white group-hover:text-indigo-300 truncate">
                            {sample.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                            {sample.target}
                          </div>
                          <div className="text-[10px] text-indigo-400 font-mono mt-1">
                            {sample.weeks} weeks • {sample.links.length} links
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal Title */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Primary Goal / Target Milestone *
                    </label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={e => setGoalTitle(e.target.value)}
                      placeholder="e.g. Master Mid-Semester Exam Syllabus & Algorithms"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Current Situation */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Current Baseline / Starting Point
                      </label>
                      <input
                        type="text"
                        value={currentStatus}
                        onChange={e => setCurrentStatus(e.target.value)}
                        placeholder="e.g. Completed 1 unit, behind on assignments"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>

                    {/* Target Outcome */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Target Measurable Outcome
                      </label>
                      <input
                        type="text"
                        value={targetOutcome}
                        onChange={e => setTargetOutcome(e.target.value)}
                        placeholder="e.g. 9.0 CGPA / Top 5% / Pass technical screen"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Timeframe */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        Execution Timeframe
                      </label>
                      <span className="font-mono text-indigo-400 font-bold">{timeframeWeeks} Weeks</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={24}
                      value={timeframeWeeks}
                      onChange={e => setTimeframeWeeks(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                      <span>2 weeks (Sprint)</span>
                      <span>8 weeks (Semester Mid-term)</span>
                      <span>24 weeks (Long-term)</span>
                    </div>
                  </div>

                  {/* Prompt to move to next tab */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('notes')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
                    >
                      <span>Next: Add Study Notes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: STUDY NOTES & SYLLABUS */}
              {activeTab === 'notes' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-xs">Share Your Study Notes & Materials</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Paste your lecture summaries, textbook modules, syllabus units, or weak areas.
                      </p>
                    </div>

                    {/* File upload */}
                    <label className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 cursor-pointer flex items-center gap-1.5 text-[11px] font-semibold transition-colors">
                      <Upload className="w-3 h-3 text-indigo-400" />
                      <span>Upload Notes File (.txt / .md)</span>
                      <input
                        type="file"
                        accept=".txt,.md,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Notes Textarea */}
                  <div>
                    <textarea
                      rows={8}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Paste your study notes, syllabus modules, or exam topics here...
Example:
- Unit 1: Foundations & Definitions (Need to review chapter 2 formulas)
- Unit 2: Advanced problem solving & proofs
- Weak areas: Struggling with timed problem 4 and derivation steps
- Exam weightage: Unit 2 is 40% of the grade"
                      className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans text-xs leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                      <span>{notes.length} characters • {notes.split('\n').filter(Boolean).length} lines</span>
                      {notes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setNotes('')}
                          className="text-rose-400 hover:underline"
                        >
                          Clear Notes
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Note Snippets */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Insert Quick Outline Template
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNotes(prev => (prev ? prev + '\n\n' : '') + `Syllabus Outline:\n1. Unit 1: Foundations & Core Concepts (High weight)\n2. Unit 2: Practice & Applied Exercises\n3. Unit 3: Advanced Numerical Problems\n4. Unit 4: Review, PYQs & Timed Mock Tests`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] transition-colors"
                      >
                        + 4-Unit College Syllabus
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotes(prev => (prev ? prev + '\n\n' : '') + `Tech Interview Topics:\n- Arrays & Strings: Two pointers, Sliding Window\n- Trees & Graphs: DFS, BFS, Topological sort\n- Dynamic Programming: Knapsack, Memoization\n- System Design: Caching, Rate limiting, Sharding`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] transition-colors"
                      >
                        + DSA & System Design
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('goal')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('links')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
                    >
                      <span>Next: Reference Links</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: REFERENCE LINKS */}
              {activeTab === 'links' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="font-bold text-white text-xs">Add Reference Links & Learning Resources</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Provide textbook URLs, course sites, GitHub repos, documentation, or YouTube playlists. The AI will weave these directly into relevant stage tasks.
                    </p>
                  </div>

                  {/* Add Link Input Group */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={e => setNewLinkUrl(e.target.value)}
                        placeholder="URL (e.g. https://ocw.mit.edu/courses/...)"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                      <input
                        type="text"
                        value={newLinkTitle}
                        onChange={e => setNewLinkTitle(e.target.value)}
                        placeholder="Title (e.g. MIT 6.006 Algorithms Lecture Notes)"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newLinkNote}
                        onChange={e => setNewLinkNote(e.target.value)}
                        placeholder="Optional Note (e.g. Focus on chapters 3 and 4 only)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddLink}
                        disabled={!newLinkUrl.trim()}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shrink-0 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>
                  </div>

                  {/* List of current links */}
                  {referenceLinks.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Included Reference Links ({referenceLinks.length})
                      </span>
                      <div className="space-y-2">
                        {referenceLinks.map((link, idx) => (
                          <div 
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded bg-indigo-600/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>{link.title || link.url}</span>
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-slate-500 hover:text-indigo-300"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {link.url}
                                </div>
                                {link.note && (
                                  <div className="text-[10px] text-indigo-300/80 mt-0.5 italic">
                                    Note: {link.note}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveLink(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                      No reference links added yet. You can add course materials, documentation, or let Google Search discover authoritative resources.
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('notes')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                    >
                      Back to Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bank')}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
                    >
                      <span>Next: Resource Bank</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: RESOURCE BANK CONTEXT */}
              {activeTab === 'bank' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                        <span>Saved Resource Bank Links ({selectedBankIds.size} Selected for AI Context)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Select which saved learning links and node associations the AI will ingest to calibrate your roadmap stages and tasks.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBankIds.size === bankItems.length) {
                            setSelectedBankIds(new Set());
                          } else {
                            setSelectedBankIds(new Set(bankItems.map(b => b.id)));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                      >
                        {selectedBankIds.size === bankItems.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>

                  {bankItems.length > 0 ? (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {bankItems.map((item) => {
                        const isSelected = selectedBankIds.has(item.id);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedBankIds(prev => {
                                const next = new Set(prev);
                                if (next.has(item.id)) {
                                  next.delete(item.id);
                                } else {
                                  next.add(item.id);
                                }
                                return next;
                              });
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                              isSelected
                                ? 'bg-indigo-950/40 border-indigo-500/50 hover:border-indigo-400'
                                : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-90'
                            }`}
                          >
                            <div className="pt-0.5 shrink-0 text-indigo-400">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                  {item.category}
                                </span>

                                {item.associatedStageName && (
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                                    <Link2 className="w-2.5 h-2.5" />
                                    <span>Node: {item.associatedStageName}</span>
                                  </span>
                                )}

                                {item.associatedGoalTitle && (
                                  <span className="text-[10px] font-medium px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                    <Target className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[160px]">{item.associatedGoalTitle}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs truncate">
                                  {item.title}
                                </span>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-slate-500 hover:text-indigo-400"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>

                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {item.url}
                              </div>

                              {item.description && (
                                <p className="text-[11px] text-slate-300/90 line-clamp-2 pt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400 text-xs space-y-2">
                      <Bookmark className="w-6 h-6 text-slate-600 mx-auto" />
                      <p>Your Resource Bank has no saved links yet.</p>
                      <p className="text-[11px] text-slate-500">
                        You can add reference links in Tab 3 or directly in the Resource Bank toolbar.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('links')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                    >
                      Back to Links
                    </button>
                    <span className="text-[11px] text-indigo-300 font-medium self-center">
                      ⚡ {selectedBankIds.size} links configured to provide AI prompt context
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Grounding Controls & Submit */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                {/* Google Search Grounding Checkbox */}
                <div 
                  onClick={() => setUseSearchGrounding(!useSearchGrounding)}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Google Search Grounding</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          Live Web Data
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Verifies real-world syllabi, checks up-to-date topic weights, and finds active reference links.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={useSearchGrounding}
                    onChange={e => setUseSearchGrounding(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                    onClick={e => e.stopPropagation()}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !goalTitle.trim()}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all text-xs"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{generationStep || 'Synthesizing Roadmap from Notes & References...'}</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Personalized Roadmap from Notes & Links</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* PREVIEW OF GENERATED ROADMAP */
            <div className="space-y-4 animate-fade-in">
              {/* Header Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Personalized Roadmap Generated</span>
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      {generatedPreview.stages?.length || 0} Stages
                    </span>
                    {generatedPreview.groundedSources?.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        <span>{generatedPreview.groundedSources.length} Grounded Sources</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-white">
                  {generatedPreview.title}
                </h3>
                <p className="text-xs text-slate-300">
                  {generatedPreview.summary}
                </p>

                {/* Key topics covered */}
                {generatedPreview.keyTopicsCovered?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Key Topics:</span>
                    {generatedPreview.keyTopicsCovered.map((topic: string, idx: number) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Grounded Web Sources (Google Search) */}
              {generatedPreview.groundedSources && generatedPreview.groundedSources.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Google Search Grounding Sources Verified:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {generatedPreview.groundedSources.slice(0, 6).map((src: GroundedWebSource, idx: number) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-[11px] text-slate-300 hover:text-white flex items-center justify-between gap-2 group transition-colors"
                      >
                        <span className="truncate">{src.title || src.uri}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Stages List Preview */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Stage Progression & Checklists
                </span>
                {generatedPreview.stages?.map((st: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-indigo-600/20 text-indigo-300 font-mono font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-xs">{st.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        ~{st.estimatedHours}h • {st.difficulty}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 pl-7">
                      {st.shortDescription}
                    </p>

                    {st.stageNotes && (
                      <div className="text-[10px] text-indigo-300/90 pl-7 italic">
                        Notes: {st.stageNotes}
                      </div>
                    )}

                    {/* Resources */}
                    {st.resources && st.resources.length > 0 && (
                      <div className="pl-7 pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-medium">Resources:</span>
                        {st.resources.map((res: any, rIdx: number) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-indigo-300 hover:text-white border border-slate-800 flex items-center gap-1"
                          >
                            <Link2 className="w-2.5 h-2.5" />
                            <span className="max-w-[140px] truncate">{res.title}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Sample tasks count */}
                    <div className="pl-7 pt-1 text-[10px] text-slate-500">
                      Includes {st.tasks?.length || 0} tasks: {st.tasks?.map((t: any) => t.title).slice(0, 2).join(' • ')}...
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedPreview(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Back to Edit Notes & Links
                </button>

                <button
                  type="button"
                  onClick={handleApplyRoadmap}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activate This Roadmap as Active Plan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
