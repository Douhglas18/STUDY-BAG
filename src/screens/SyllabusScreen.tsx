import React, { useState } from 'react';
import { 
  BookOpen, Calendar, CheckCircle2, Clock, Sparkles, 
  AlertTriangle, ChevronDown, ChevronRight, Shield, Award,
  Plus, Trash2, X, Check, Edit2, Layers, FolderPlus
} from 'lucide-react';
import { Subject, Exam, SyllabusTopic, TopicStatus, SubjectUnit } from '../types';

interface SyllabusScreenProps {
  subjects: Subject[];
  exam: Exam | null;
  onUpdateTopicStatus: (subjectId: string, unitId: string, topicId: string, status: TopicStatus) => void;
  onOpenCoachWithQuestion: (q: string) => void;
  onAddSubject?: (subject: Subject) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onAddUnit?: (subjectId: string, unit: SubjectUnit) => void;
  onDeleteUnit?: (subjectId: string, unitId: string) => void;
  onAddTopic?: (subjectId: string, unitId: string, topic: SyllabusTopic) => void;
  onDeleteTopic?: (subjectId: string, unitId: string, topicId: string) => void;
}

export const SyllabusScreen: React.FC<SyllabusScreenProps> = ({
  subjects,
  exam,
  onUpdateTopicStatus,
  onOpenCoachWithQuestion,
  onAddSubject,
  onDeleteSubject,
  onAddUnit,
  onDeleteUnit,
  onAddTopic,
  onDeleteTopic
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({ 'u-m1': true, 'u-m2': true });

  // Add Subject Modal state
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubTarget, setNewSubTarget] = useState('A+ (90+)');
  const [newSubScore, setNewSubScore] = useState('0%');
  const [newSubExamDate, setNewSubExamDate] = useState('');

  // Add Unit / Module Modal state
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitNumber, setNewUnitNumber] = useState<number>(1);

  // Add Topic state (inline)
  const [activeAddingUnitId, setActiveAddingUnitId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicWeight, setNewTopicWeight] = useState<'high' | 'medium' | 'low'>('high');
  const [newTopicHours, setNewTopicHours] = useState<number>(3);

  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Calculate overall syllabus mastery
  let totalTopics = 0;
  let masteredOrRevised = 0;
  subjects.forEach(s => {
    s.units.forEach(u => {
      u.topics.forEach(t => {
        totalTopics++;
        if (t.status === 'Mastered' || t.status === 'Revised') masteredOrRevised++;
      });
    });
  });
  const overallMasteryPercent = totalTopics > 0 ? Math.round((masteredOrRevised / totalTopics) * 100) : 0;

  const topicStatuses: TopicStatus[] = ['Not Started', 'Learning', 'Practicing', 'Revised', 'Mastered'];

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSub: Subject = {
      id: 'sub-' + Date.now(),
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase() || 'MOD-' + Math.floor(100 + Math.random() * 900),
      targetScore: newSubTarget.trim() || 'A+ (90+)',
      currentScore: newSubScore.trim() || '0%',
      examDate: newSubExamDate.trim() || undefined,
      weight: 3,
      units: []
    };

    if (onAddSubject) {
      onAddSubject(newSub);
    }
    setSelectedSubjectId(newSub.id);
    setNewSubName('');
    setNewSubCode('');
    setShowAddSubjectModal(false);
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim() || !activeSubject) return;

    const nextUnitNum = activeSubject.units.length + 1;
    const newUnit: SubjectUnit = {
      id: 'u-' + Date.now(),
      unitNumber: newUnitNumber || nextUnitNum,
      title: newUnitTitle.trim(),
      topics: []
    };

    if (onAddUnit) {
      onAddUnit(activeSubject.id, newUnit);
    }
    setExpandedUnits(prev => ({ ...prev, [newUnit.id]: true }));
    setNewUnitTitle('');
    setShowAddUnitModal(false);
  };

  const handleCreateTopic = (unitId: string) => {
    if (!newTopicTitle.trim() || !activeSubject) return;

    const newTopic: SyllabusTopic = {
      id: 'tp-' + Date.now(),
      title: newTopicTitle.trim(),
      status: 'Not Started',
      weight: newTopicWeight,
      estimatedHours: newTopicHours || 3
    };

    if (onAddTopic) {
      onAddTopic(activeSubject.id, unitId, newTopic);
    }

    setNewTopicTitle('');
    setActiveAddingUnitId(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 5-Phase Exam Preparation Engine Banner (Requirement #18) */}
      {exam && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-950 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Exam Countdown & 5-Phase Preparation Engine</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                {exam.name}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Target Date: <strong className="text-white">{exam.date}</strong> ({exam.daysRemaining} days remaining)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-2xl font-mono font-extrabold text-indigo-400">{overallMasteryPercent}%</div>
                <div className="text-[10px] text-slate-400 font-semibold">Syllabus Mastered</div>
              </div>

              <button
                onClick={() => onOpenCoachWithQuestion(`Can I finish my syllabus for ${exam.name} in ${exam.daysRemaining} days at my current pace?`)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Feasibility Audit</span>
              </button>
            </div>
          </div>

          {/* 5-Phase Visual Timeline with Protected Buffer Days */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 text-xs">
            {exam.phases.map((ph, idx) => {
              const isCurrent = ph.status === 'current';
              const isDone = ph.status === 'completed';

              return (
                <div
                  key={ph.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : isDone
                      ? 'bg-slate-950/60 border-slate-800 opacity-75'
                      : 'bg-slate-950 border-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      Phase {idx + 1}
                    </span>
                    {ph.isBuffer && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        Buffer Days
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-white text-[11px] mb-1 leading-snug">
                    {ph.phaseName.split(':')[1] || ph.phaseName}
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {ph.duration}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subject Tabs & Add Subject Action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs flex-1">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(s.id)}
              className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedSubjectId === s.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{s.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/60 font-mono">
                {s.code}
              </span>
            </button>
          ))}

          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Empty State when no subjects exist */}
      {subjects.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-900/70 border border-dashed border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Subjects or Modules Configured</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add your university courses, exam syllabi, or self-directed learning modules to track topic mastery and exam readiness.
            </p>
          </div>
          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Subject</span>
          </button>
        </div>
      )}

      {/* Active Subject Units & Topics */}
      {activeSubject && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {activeSubject.name} ({activeSubject.code})
                </h2>
                {onDeleteSubject && (
                  <button
                    onClick={() => {
                      onDeleteSubject(activeSubject.id);
                      const remaining = subjects.filter(s => s.id !== activeSubject.id);
                      if (remaining.length > 0) setSelectedSubjectId(remaining[0].id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Target Score: <strong className="text-slate-200">{activeSubject.targetScore}</strong> • Current Baseline: <strong className="text-indigo-300">{activeSubject.currentScore}</strong>
                {activeSubject.examDate && (
                  <span> • Exam Date: <strong className="text-amber-400">{activeSubject.examDate}</strong></span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => {
                  setNewUnitNumber(activeSubject.units.length + 1);
                  setShowAddUnitModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add Module / Unit</span>
              </button>

              <button
                onClick={() => onOpenCoachWithQuestion(`Give me a prioritized study plan for ${activeSubject.name}. Which units have the highest return on investment?`)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Topic Audit</span>
              </button>
            </div>
          </div>

          {/* Units / Modules list */}
          <div className="space-y-3">
            {activeSubject.units.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">No units or chapters added to {activeSubject.name} yet.</p>
                <button
                  onClick={() => setShowAddUnitModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-indigo-300 text-xs font-semibold border border-indigo-500/20 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Module / Unit</span>
                </button>
              </div>
            ) : (
              activeSubject.units.map(unit => {
                const isExpanded = expandedUnits[unit.id] !== false;
                const isAddingTopic = activeAddingUnitId === unit.id;

                return (
                  <div key={unit.id} className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
                    {/* Unit Title Bar */}
                    <div className="flex items-center justify-between p-4 hover:bg-slate-850 transition-colors">
                      <button
                        onClick={() => toggleUnit(unit.id)}
                        className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-indigo-400 shrink-0">
                          {unit.unitNumber}
                        </span>
                        <span className="font-bold text-sm text-white truncate">{unit.title}</span>
                        <span className="text-xs text-slate-400 shrink-0">({unit.topics.length} topics)</span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button
                          onClick={() => {
                            setActiveAddingUnitId(isAddingTopic ? null : unit.id);
                            if (!isExpanded) toggleUnit(unit.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Add Topic to this Unit"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">Add Topic</span>
                        </button>

                        {onDeleteUnit && (
                          <button
                            onClick={() => {
                              onDeleteUnit(activeSubject.id, unit.id);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button onClick={() => toggleUnit(unit.id)} className="p-1 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Topics List */}
                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-2 border-t border-slate-800/60 bg-slate-950/40">
                        {/* Inline Add Topic Box */}
                        {isAddingTopic && (
                          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5 animate-fade-in text-xs">
                            <div className="font-semibold text-white flex items-center justify-between">
                              <span>Add Topic to {unit.title}</span>
                              <button onClick={() => setActiveAddingUnitId(null)} className="text-slate-400 hover:text-white">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  placeholder="Topic name (e.g., Matrix Diagonalization)"
                                  value={newTopicTitle}
                                  onChange={e => setNewTopicTitle(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <select
                                  value={newTopicWeight}
                                  onChange={e => setNewTopicWeight(e.target.value as any)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs flex-1"
                                >
                                  <option value="high">High Weight</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleCreateTopic(unit.id)}
                                  disabled={!newTopicTitle.trim()}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shrink-0"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {unit.topics.length === 0 && !isAddingTopic && (
                          <div className="py-2 text-center text-[11px] text-slate-500 italic">
                            No topics added yet. Click "+ Add Topic" above to populate this unit.
                          </div>
                        )}

                        {unit.topics.map(topic => (
                          <div
                            key={topic.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                topic.status === 'Mastered'
                                  ? 'bg-emerald-400'
                                  : topic.status === 'Revised'
                                  ? 'bg-indigo-400'
                                  : topic.status === 'Practicing'
                                  ? 'bg-amber-400'
                                  : 'bg-slate-600'
                              }`} />

                              <span className="font-semibold text-slate-200 truncate">
                                {topic.title}
                              </span>

                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                topic.weight === 'high'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {topic.weight} weight
                              </span>

                              {onDeleteTopic && (
                                <button
                                  onClick={() => onDeleteTopic(activeSubject.id, unit.id, topic.id)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition-opacity"
                                  title="Delete Topic"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Status Picker */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                              {topicStatuses.map(st => (
                                <button
                                  key={st}
                                  onClick={() => onUpdateTopicStatus(activeSubject.id, unit.id, topic.id, st)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                    topic.status === st
                                      ? st === 'Mastered'
                                        ? 'bg-emerald-600 text-white'
                                        : st === 'Revised'
                                        ? 'bg-indigo-600 text-white'
                                        : st === 'Practicing'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-800 text-slate-200'
                                      : 'bg-slate-900 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleCreateSubject}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Add New Subject</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Subject Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems & Concurrency"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS-301"
                    value={newSubCode}
                    onChange={e => setNewSubCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Target Score
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A+ (95+)"
                    value={newSubTarget}
                    onChange={e => setNewSubTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Exam Date (optional)
                </label>
                <input
                  type="date"
                  value={newSubExamDate}
                  onChange={e => setNewSubExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newSubName.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-600/30"
              >
                Create Subject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Module / Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleCreateUnit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                <span>Add Module / Unit to {activeSubject?.name}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddUnitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Module / Unit Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Management & Paging"
                  value={newUnitTitle}
                  onChange={e => setNewUnitTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Unit Number
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newUnitNumber}
                  onChange={e => setNewUnitNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddUnitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newUnitTitle.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-md shadow-indigo-600/30"
              >
                Add Unit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
