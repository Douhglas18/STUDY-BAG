import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Lock, Unlock, Play, Clock, Sparkles, 
  BookOpen, Code2, Award, ArrowRight, RefreshCw, AlertCircle, 
  HelpCircle, ChevronRight, Check, Send, Bot, FileText, BarChart3
} from 'lucide-react';
import { RoadmapStage, RoadmapTask, LevelAssessment, LevelQuestion } from '../types';
import { aiService } from '../services/aiService';

interface LevelEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: RoadmapStage | null;
  allLevels: RoadmapStage[];
  goalTitle: string;
  onToggleTask: (stageId: string, taskId: string) => void;
  onLevelCompleted: (stageId: string, scorePercent: number) => void;
  onStartFocus: (task: RoadmapTask, durationMinutes: number) => void;
  onOpenTutorForTopic: (topic: string) => void;
  onSelectLevel?: (level: RoadmapStage) => void;
  onNavigateToScreen?: (screen: 'progress' | 'tutor' | 'roadmap') => void;
}

export const LevelEnvironmentModal: React.FC<LevelEnvironmentModalProps> = ({
  isOpen,
  onClose,
  level,
  allLevels,
  goalTitle,
  onToggleTask,
  onLevelCompleted,
  onStartFocus,
  onOpenTutorForTopic,
  onSelectLevel,
  onNavigateToScreen
}) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'assessment'>('learn');

  // Interactive Tutor Q&A state inside Level
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<{ sender: 'user' | 'kairon'; text: string }[]>([]);

  // Assessment state
  const [assessment, setAssessment] = useState<LevelAssessment | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [grading, setGrading] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    if (level) {
      setActiveTab('learn');
      setTutorMessages([
        {
          sender: 'kairon',
          text: `Welcome to **Level ${level.order}: ${level.name}**. I'm your interactive tutor for this stage. You can study the core concepts, ask me any question about this topic, practice exercises, or take the mini assessment to complete this level.`
        }
      ]);
      setQuizResult(null);
      setUserAnswers({});

      // Load or generate initial assessment
      if (level.assessment) {
        setAssessment(level.assessment);
      } else {
        loadOrGenerateAssessment(level);
      }
    }
  }, [level?.id]);

  if (!isOpen || !level) return null;

  const isLocked = level.status === 'locked';
  const isCompleted = level.status === 'completed';
  const tasksCompleted = level.tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = level.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  const nextLevel = allLevels.find(s => s.order === level.order + 1) || 
                    allLevels[allLevels.findIndex(s => s.id === level.id) + 1] || null;

  async function loadOrGenerateAssessment(lvl: RoadmapStage) {
    setGeneratingQuiz(true);
    try {
      const generated = await aiService.generateAssessment({
        levelTitle: lvl.name,
        levelDescription: lvl.shortDescription,
        tasks: lvl.tasks
      });
      if (generated) {
        setAssessment(generated);
      }
    } catch (e) {
      console.error('Failed to generate assessment:', e);
    } finally {
      setGeneratingQuiz(false);
    }
  }

  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuery.trim() || tutorLoading) return;

    const userText = tutorQuery.trim();
    setTutorQuery('');
    setTutorMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setTutorLoading(true);

    try {
      const res = await aiService.askTutor({
        levelTitle: level.name,
        topicTitle: level.tasks[0]?.title || level.name,
        userMessage: userText,
        conversationHistory: tutorMessages,
        goalContext: goalTitle
      });

      setTutorMessages(prev => [
        ...prev, 
        { 
          sender: 'kairon', 
          text: res.reply || 'Let us review this concept step by step.' 
        }
      ]);
    } catch (err: any) {
      setTutorMessages(prev => [
        ...prev,
        { sender: 'kairon', text: 'I encountered an error connecting to the tutor. Please try asking again.' }
      ]);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionChar: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionChar }));
  };

  const handleSubmitAssessment = async () => {
    if (!assessment || grading) return;
    setGrading(true);

    try {
      const result = await aiService.gradeAssessment({
        questions: assessment.questions,
        userAnswers,
        levelTitle: level.name
      });

      if (result) {
        setQuizResult(result);
        if (result.passed) {
          onLevelCompleted(level.id, result.scorePercent);
        }
      }
    } catch (e) {
      console.error('Assessment grading error:', e);
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-sm shadow-md ${
              isCompleted 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isLocked
                ? 'bg-slate-800 text-slate-500 border border-slate-700'
                : 'bg-indigo-600 text-white shadow-indigo-600/30'
            }`}>
              {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : isLocked ? <Lock className="w-5 h-5" /> : level.order}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                  Level {level.order}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isCompleted 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : isLocked 
                    ? 'bg-slate-800 text-slate-400' 
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {isCompleted ? 'COMPLETED' : isLocked ? 'LOCKED' : 'CURRENT LEVEL'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white truncate mt-0.5">
                {level.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation: Learn | Practice | Mini Assessment */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 shrink-0">
          <button
            onClick={() => setActiveTab('learn')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'learn'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Learn</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'practice'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Practice ({tasksCompleted}/{totalTasks})</span>
          </button>

          <button
            onClick={() => setActiveTab('assessment')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'assessment'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>3. Mini Assessment</span>
            {isCompleted && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: LEARN */}
          {activeTab === 'learn' && (
            <div className="space-y-6 animate-fade-in">
              {/* Concept Overview Card */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Concept Foundations</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Est. {level.estimatedHours || 3} Hours Mastery
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {level.shortDescription}
                </p>
                {level.whyImportant && (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                    <span className="font-bold text-indigo-300">Why this matters: </span>
                    {level.whyImportant}
                  </div>
                )}
              </div>

              {/* Socratic Interactive Tutor Q&A */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-extrabold text-white">Interactive Level Tutor</h3>
                  </div>
                  <span className="text-[10px] font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/30">
                    AI Socratic Tutor
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {tutorMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-2.5 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'kairon' && (
                        <div className="w-6 h-6 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-300 text-[10px] font-bold">
                          AI
                        </div>
                      )}
                      <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {tutorLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
                      <span>Tutor is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Input prompt */}
                <form onSubmit={handleAskTutor} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={tutorQuery}
                    onChange={e => setTutorQuery(e.target.value)}
                    placeholder="Ask tutor to explain this, give an example, or explain carrying in addition..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!tutorQuery.trim() || tutorLoading}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </form>
              </div>

              {/* Verified Reference Resources */}
              {level.resources && level.resources.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Curated References & Guides
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {level.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-850/40 transition-all flex items-start justify-between gap-2 group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">
                            {res.title}
                          </div>
                          {res.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                              {res.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRACTICE */}
          {activeTab === 'practice' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Level Practice Tasks</h3>
                  <p className="text-xs text-slate-400">Complete each task to build automaticity before the assessment.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-indigo-400">{progressPercent}% Completed</div>
                  <div className="text-[10px] text-slate-500">{tasksCompleted} of {totalTasks} finished</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {level.tasks.map((task) => {
                  const isTaskDone = task.status === 'Completed';
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isTaskDone
                          ? 'bg-slate-950/40 border-slate-850 text-slate-400'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-white'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => onToggleTask(level.id, task.id)}
                          className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                            isTaskDone
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700 hover:border-indigo-400 bg-slate-900'
                          }`}
                        >
                          {isTaskDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0">
                          <div className={`text-xs font-bold ${isTaskDone ? 'line-through text-slate-500' : 'text-white'}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {task.estimatedMinutes} mins
                            </span>
                            <span>•</span>
                            <span className={`capitalize font-bold ${
                              task.priority === 'high' ? 'text-rose-400' : task.priority === 'medium' ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                              {task.priority} Priority
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isTaskDone && (
                        <button
                          onClick={() => onStartFocus(task, task.estimatedMinutes)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                        >
                          <Play className="w-3 h-3 fill-indigo-300" />
                          <span>Start (30m)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Callout to Take Assessment */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-500/30 flex items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-xs text-white">Ready to verify mastery?</div>
                  <div className="text-[11px] text-slate-400">Score 75%+ on the Mini Assessment to unlock Level {level.order + 1}.</div>
                </div>
                <button
                  onClick={() => setActiveTab('assessment')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0"
                >
                  <span>Take Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MINI ASSESSMENT */}
          {activeTab === 'assessment' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Level {level.order} Mini Assessment</span>
                  </h3>
                  <p className="text-xs text-slate-400">Pass with 75%+ to verify your knowledge and unlock the next level.</p>
                </div>
                {generatingQuiz && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating questions...</span>
                  </div>
                )}
              </div>

              {/* Assessment Questions */}
              {assessment && assessment.questions.length > 0 ? (
                <div className="space-y-5">
                  {assessment.questions.map((q, idx) => {
                    const selected = userAnswers[q.id];
                    const feedback = quizResult?.questionFeedback?.find((f: any) => f.questionId === q.id);

                    return (
                      <div 
                        key={q.id}
                        className={`p-5 rounded-2xl border transition-all space-y-3 ${
                          feedback 
                            ? feedback.isCorrect
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-extrabold text-xs text-white">
                            <span className="text-indigo-400 mr-2">Q{idx + 1}.</span>
                            {q.question}
                          </div>
                          {feedback && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              feedback.isCorrect 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {feedback.isCorrect ? 'Correct (+25%)' : 'Incorrect'}
                            </span>
                          )}
                        </div>

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const optChar = opt.charAt(0);
                              const isChecked = selected === optChar;

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectOption(q.id, optChar)}
                                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
                                    isChecked
                                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isChecked ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'
                                  }`}>
                                    {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Explanation feedback */}
                        {feedback && (
                          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed mt-2">
                            <span className="font-bold text-indigo-400">Explanation: </span>
                            {feedback.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Result & Submit Card */}
                  {quizResult ? (
                    <div className={`p-5 rounded-2xl border space-y-3 ${
                      quizResult.passed 
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-extrabold text-sm text-white">
                          {quizResult.passed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
                          <span>Score: {quizResult.scorePercent}% ({quizResult.correctCount} / {quizResult.totalQuestions} Correct)</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          quizResult.passed 
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-amber-500 text-slate-950'
                        }`}>
                          {quizResult.passed ? 'PASSED & LEVEL COMPLETED' : 'REVIEW & RETRY'}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {quizResult.feedback}
                      </p>

                      <div className="pt-2">
                        {!quizResult.passed ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setUserAnswers({});
                                setQuizResult(null);
                              }}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry Assessment</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/20">
                            <div className="flex items-center gap-2">
                              {onNavigateToScreen && (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onNavigateToScreen('progress');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-cyan-500/30 transition-colors"
                                >
                                  <BarChart3 className="w-3.5 h-3.5" />
                                  <span>View Progress</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenTutorForTopic(`Strategic guidance and learning tips for Level ${nextLevel?.order || level.order + 1}: ${nextLevel?.name || 'next stage'}`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-bold text-xs flex items-center gap-1.5 border border-violet-500/30 transition-colors"
                              >
                                <Bot className="w-3.5 h-3.5" />
                                <span>AI Guidance</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={onClose}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors"
                              >
                                <span>Roadmap</span>
                              </button>
                              {nextLevel && (
                                <button
                                  onClick={() => {
                                    if (onSelectLevel) {
                                      onSelectLevel(nextLevel);
                                    }
                                  }}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <span>Proceed to Next Level (Level {nextLevel.order})</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSubmitAssessment}
                        disabled={Object.keys(userAnswers).length === 0 || grading}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                      >
                        {grading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Submit for Evaluation</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  {generatingQuiz ? 'Generating tailored assessment questions...' : 'No quiz generated yet for this level.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
