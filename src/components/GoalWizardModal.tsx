import React, { useState } from 'react';
import { 
  X, Sparkles, Target, Calendar, Clock, ArrowRight, ArrowLeft, 
  Upload, CheckCircle2, FileText, Link2, BookOpen, RefreshCw, AlertCircle, Plus, Trash2
} from 'lucide-react';
import { Goal, PersonalRoadmap, RoadmapReferenceLink, RoadmapStage } from '../types';
import { aiService } from '../services/aiService';

interface GoalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoalAndRoadmap: (goal: Goal, roadmap: PersonalRoadmap) => void;
}

export const GoalWizardModal: React.FC<GoalWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveGoalAndRoadmap
}) => {
  const [step, setStep] = useState<number>(1);

  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [notes, setNotes] = useState('');
  const [referenceLinks, setReferenceLinks] = useState<{ title: string; url: string }[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  
  // PDF upload
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any>(null);

  if (!isOpen) return null;

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const title = newLinkTitle.trim() || new URL(url).hostname;
    setReferenceLinks(prev => [...prev, { title, url }]);
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const result = evt.target?.result as string;
        const base64Data = result.split(',')[1] || result;

        try {
          const uploaded = await aiService.uploadDocument(file.name, file.type, base64Data);
          if (uploaded?.document) {
            setUploadedDocName(file.name);
            setUploadedDocId(uploaded.document.id);
            if (uploaded.document.summary) {
              setNotes(prev => prev ? `${prev}\n\n[Uploaded Document: ${file.name}]\n${uploaded.document.summary}` : `[Uploaded Document: ${file.name}]\n${uploaded.document.summary}`);
            }
          }
        } catch (err: any) {
          console.error('File upload error:', err);
          setUploadedDocName(file.name);
        } finally {
          setUploadingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setUploadingDoc(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle,
          currentStatus: currentSituation,
          targetOutcome,
          timeframeWeeks: 6,
          notes,
          referenceLinks,
          useSearchGrounding: true
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.roadmap) {
        setGeneratedRoadmap(data.roadmap);
        setStep(7); // Review step
      } else {
        throw new Error('No roadmap returned');
      }
    } catch (err: any) {
      console.error('Roadmap generation failed:', err);
      setGenerationError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptRoadmap = () => {
    if (!generatedRoadmap) return;

    const goalId = 'goal-' + Date.now();
    const newGoal: Goal = {
      id: goalId,
      title: goalTitle.trim(),
      category: 'Academics',
      currentMetric: currentSituation.trim() || 'Starting level',
      targetMetric: targetOutcome.trim() || 'Mastery target',
      deadline: deadlineDate || '2026-12-31',
      why: 'Target personal mastery with structured levels',
      completionPercentage: 0,
      status: 'active',
      isPrivate: false,
      milestones: (generatedRoadmap.stages || []).slice(0, 5).map((s: any, i: number) => ({
        id: `m-${i + 1}`,
        goalId,
        title: s.name,
        deadline: deadlineDate || '2026-12-31',
        order: i + 1,
        status: i === 0 ? 'in_progress' : 'pending',
        completionPercentage: 0
      }))
    };

    const finalStages: RoadmapStage[] = (generatedRoadmap.stages || []).map((s: any, idx: number) => ({
      id: s.id || `st-${idx + 1}`,
      roadmapId: `rd-${goalId}`,
      name: s.name,
      shortDescription: s.shortDescription || 'Stage mastery',
      order: idx + 1,
      status: idx === 0 ? ('current' as const) : ('locked' as const),
      difficulty: s.difficulty || 'Normal',
      estimatedHours: s.estimatedHours || 4,
      prerequisiteStageIds: idx === 0 ? [] : [generatedRoadmap.stages[idx - 1]?.id || `st-${idx}`],
      aiRecommendation: s.aiRecommendation || 'Focus on foundational problem solving',
      whyImportant: s.whyImportant || 'Essential foundation for downstream topics',
      whatUnlocksNext: s.whatUnlocksNext || `Unlocks Level ${idx + 2}`,
      resources: s.resources || [],
      tasks: (s.tasks || []).map((t: any, tIdx: number) => ({
        id: t.id || `t-${idx + 1}-${tIdx + 1}`,
        stageId: s.id || `st-${idx + 1}`,
        title: t.title,
        description: t.description,
        status: 'Not Started',
        priority: t.priority || 'high',
        difficulty: t.difficulty || 'Normal',
        estimatedMinutes: t.estimatedMinutes || 30
      }))
    }));

    const finalRoadmap: PersonalRoadmap = {
      id: `rd-${goalId}`,
      goalId,
      title: `${goalTitle} Roadmap`,
      category: 'Academics',
      targetGoal: targetOutcome,
      deadline: deadlineDate || '2026-12-31',
      currentStreak: 1,
      stages: finalStages,
      sourceNotes: notes,
      referenceLinks,
      totalTasks: finalStages.reduce((acc, st) => acc + st.tasks.length, 0),
      completedTasks: 0,
      progressPercentage: 0
    };

    onSaveGoalAndRoadmap(newGoal, finalRoadmap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Create Goal Roadmap</h2>
              <p className="text-[11px] text-slate-400">Step {step} of {step === 7 ? '7 (Review)' : '6'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1">
          <div 
            className="bg-indigo-500 h-full transition-all duration-300" 
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* STEP 1: What do you want to achieve? */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Step 1: What is your primary goal?
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Be specific about the subject, skill, exam, or project you want to master.
                </p>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="e.g. Master Mathematics for upcoming exam, FAANG Tech Interview, Deep Learning..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300">
                <span className="font-bold">Example: </span>
                "Improve my Mathematics knowledge for my upcoming university examination."
              </div>
            </div>
          )}

          {/* STEP 2: Where are you currently? */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Step 2: Where are you currently? (Baseline Skill Level)
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Honest assessment of what you know well and what you struggle with.
                </p>
                <textarea
                  rows={3}
                  value={currentSituation}
                  onChange={e => setCurrentSituation(e.target.value)}
                  placeholder="e.g. I know basic arithmetic and fractions well, but I struggle with algebraic equations and derivatives..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 3: Where do you want to reach? */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Step 3: What is your target outcome?
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Define what success looks like upon completion.
                </p>
                <input
                  type="text"
                  value={targetOutcome}
                  onChange={e => setTargetOutcome(e.target.value)}
                  placeholder="e.g. Score 90%+ in exam, Solve Medium LeetCode problems in under 20 mins..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 4: When do you want to reach it? */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Step 4: Target deadline date
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  When is your exam or target completion milestone?
                </p>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={e => setDeadlineDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 5: How much time can you spend? */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Step 5: Available daily study time
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Realistic commitment you can sustain without burning out.
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {[1, 1.5, 2, 3].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDailyHours(h)}
                      className={`py-3 px-2 rounded-2xl border text-center text-xs font-bold transition-all ${
                        dailyHours === h
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {h} hr{h > 1 ? 's' : ''}/day
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Resources (PDF Upload, Notes, Links) */}
          {step === 6 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Step 6: Upload learning resources & notes (Optional)
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Upload textbook PDF, lecture notes, syllabus, or link references. The AI will extract key topics and structure your levels around them.
                </p>

                {/* PDF File Upload */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-indigo-500/50 transition-colors flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {uploadedDocName || 'Upload PDF Textbook / Notes'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {uploadingDoc ? 'Extracting text and chunking sections...' : 'Extracts text, chapters & formulas for the AI Tutor'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedDocName('CS6500_Distributed_Systems_Syllabus.pdf');
                        setNotes(`[Uploaded Syllabus: CS6500 Distributed Systems & Scalable Architecture]
Unit 1: Fundamentals of Scalable Architecture, Load Balancing & Consistent Hashing
Unit 2: Replication & Consensus Algorithms (Paxos, Raft, Byzantine Fault Tolerance)
Unit 3: Distributed Storage Systems, Key-Value Stores & LSM Trees
Unit 4: Microservices Observability, Distributed Tracing & High Availability Systems`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold"
                    >
                      Sample PDF
                    </button>
                    <label className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-indigo-600/20">
                      <span>{uploadedDocName ? 'Change File' : 'Browse PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf,.txt,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Additional Notes Textarea */}
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Or paste syllabus notes / topics:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Paste chapters, key formulas, or weak spots..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />

                {/* Reference Links */}
                <div className="mt-3 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Add Reference Links (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      placeholder="https://ocw.mit.edu/... or textbook URL"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Add Link
                    </button>
                  </div>

                  {referenceLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {referenceLinks.map((l, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                          <Link2 className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[150px]">{l.title}</span>
                          <button
                            type="button"
                            onClick={() => setReferenceLinks(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {generationError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: REVIEW GENERATED ROADMAP */}
          {step === 7 && generatedRoadmap && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Roadmap Synthesized Successfully</span>
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  {generatedRoadmap.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {generatedRoadmap.summary}
                </p>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Progression Levels:
                </div>
                {(generatedRoadmap.stages || []).map((stage: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-300">
                          Level {i + 1}
                        </span>
                        <div className="font-bold text-xs text-white">{stage.name}</div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{stage.shortDescription}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {stage.tasks?.length || 3} tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
          {step > 1 && step < 7 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 6 && (
            <button
              type="button"
              disabled={step === 1 && !goalTitle.trim()}
              onClick={() => setStep(prev => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              disabled={generating || !goalTitle.trim()}
              onClick={handleGenerateRoadmap}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Roadmap...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Roadmap</span>
                </>
              )}
            </button>
          )}

          {step === 7 && (
            <div className="flex gap-2 w-full justify-end">
              <button
                type="button"
                onClick={() => setStep(6)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Modify Inputs
              </button>
              <button
                type="button"
                onClick={handleAcceptRoadmap}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Begin Level 1</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
