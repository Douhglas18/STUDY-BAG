import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, CheckCircle2, X, Volume2, VolumeX, Sparkles, 
  HelpCircle, MessageSquare, Clock, ArrowRight, RotateCcw
} from 'lucide-react';
import { Task, TaskDifficulty } from '../types';
import { startAmbientSound, stopAmbientSound, playCompletionChime } from '../utils/audio';
import { aiService } from '../services/aiService';

interface FocusModeModalProps {
  isOpen: boolean;
  task: Task | null;
  targetDurationMinutes: number;
  onClose: () => void;
  onCompleteTask: (taskId: string, actualMinutes: number, difficulty: TaskDifficulty, notes?: string) => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  task,
  targetDurationMinutes = 35,
  onClose,
  onCompleteTask
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(targetDurationMinutes * 60);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [soundType, setSoundType] = useState<'none' | 'rain' | 'cafe' | 'binaural' | 'whitenoise'>('none');
  
  // Post completion dialog state
  const [isDone, setIsDone] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<TaskDifficulty>('Normal');
  const [completionNotes, setCompletionNotes] = useState('');

  // In-session AI assistance
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Initialize timer on open
  useEffect(() => {
    if (isOpen && task) {
      setSecondsRemaining(targetDurationMinutes * 60);
      setSecondsElapsed(0);
      setIsRunning(true);
      setIsDone(false);
      setAiAnswer(null);
    }
    return () => {
      stopAmbientSound();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, task, targetDurationMinutes]);

  // Tick timer
  useEffect(() => {
    if (!isOpen || !isRunning || isDone) return;

    timerRef.current = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Timer finished
          playCompletionChime();
          setIsDone(true);
          stopAmbientSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isRunning, isDone]);

  // Sound change
  const handleSoundChange = (type: typeof soundType) => {
    setSoundType(type);
    if (type === 'none') {
      stopAmbientSound();
    } else {
      startAmbientSound(type);
    }
  };

  const handleFinishEarly = () => {
    playCompletionChime();
    stopAmbientSound();
    setIsRunning(false);
    setIsDone(true);
  };

  const handleConfirmCompletion = () => {
    if (!task) return;
    const actualMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    onCompleteTask(task.id, actualMinutes, selectedDifficulty, completionNotes);
    onClose();
  };

  // Ask AI for hints or breakdown during task
  const handleAskAI = async (promptQuery: string) => {
    setAiLoading(true);
    setAiAssistantOpen(true);
    setAiAnswer(null);

    const question = promptQuery || aiQuestion;
    const res = await aiService.askCoach(
      `I am currently doing this task in Focus Mode: "${task?.title}". My question/blocker: ${question}`,
      { profile: {} as any, goals: [], todayStats: {} }
    );
    setAiAnswer(res);
    setAiLoading(false);
  };

  if (!isOpen || !task) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    Math.round((secondsElapsed / (targetDurationMinutes * 60)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-6 overflow-hidden relative text-white">
        
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
              Deep Work Focus
            </span>
          </div>
          <button
            onClick={() => {
              stopAmbientSound();
              onClose();
            }}
            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isDone ? (
          <>
            {/* Task Info */}
            <div className="text-center mb-6">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider inline-block mb-2">
                {task.priority} Priority Task
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white max-w-md mx-auto leading-snug">
                {task.title}
              </h2>
              {task.description && (
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 max-w-sm mx-auto">
                  {task.description}
                </p>
              )}
            </div>

            {/* Circular / Big Timer Display */}
            <div className="relative flex flex-col items-center justify-center my-6">
              <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tighter text-white drop-shadow-[0_0_25px_rgba(99,102,241,0.3)]">
                {formatTime(secondsRemaining)}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-mono flex items-center gap-2">
                <span>{formatTime(secondsElapsed)} elapsed</span>
                <span>•</span>
                <span>{progressPercent}% target</span>
              </div>

              {/* Minimalist Progress Line */}
              <div className="w-48 h-1.5 bg-slate-900 rounded-full mt-4 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-indigo-500 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                  isRunning
                    ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40'
                }`}
                title={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
              </button>

              <button
                onClick={handleFinishEarly}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Done (Log Session)
              </button>
            </div>

            {/* Ambient Audio Switcher */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Focus Ambience (Zero Distractions)
                </span>
                {soundType !== 'none' && (
                  <button
                    onClick={() => handleSoundChange('none')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Mute
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1 text-[11px]">
                {[
                  { id: 'none', label: 'Off' },
                  { id: 'rain', label: '🌧 Rain' },
                  { id: 'cafe', label: '☕ Cafe' },
                  { id: 'binaural', label: '🧠 Alpha 10Hz' },
                  { id: 'whitenoise', label: '💨 White' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSoundChange(s.id as any)}
                    className={`py-1.5 rounded-lg font-medium transition-all ${
                      soundType === s.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In-task AI Assistance chips */}
            <div className="border-t border-slate-800/80 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Stuck or need a hint?
                </span>
                <button
                  onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  {aiAssistantOpen ? 'Hide' : 'Ask AI'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Explain key concept',
                  'Break into 3 sub-steps',
                  'Give me a problem hint',
                  'I am losing focus'
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAI(q)}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/30 text-slate-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {aiAssistantOpen && (
                <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs text-slate-200">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-indigo-300">
                      <div className="w-3 h-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                      Analyzing task context...
                    </div>
                  ) : aiAnswer ? (
                    <div className="space-y-2">
                      <div className="font-semibold text-indigo-300 text-[11px]">Sara Assistant:</div>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed text-[11px]">{aiAnswer}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Post-Task Feedback Screen (Requirement #36) */
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Focus Session Complete!</h3>
              <p className="text-xs text-slate-400 mt-1">
                You logged ~{Math.max(1, Math.round(secondsElapsed / 60))} minutes of deliberate focus.
              </p>
            </div>

            {/* Difficulty rating question */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-left">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                How difficult was this task?
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Kairon uses this feedback to calibrate future time estimates and break down upcoming workloads.
              </p>

              <div className="grid grid-cols-4 gap-2">
                {(['Easy', 'Normal', 'Hard', 'Very Hard'] as TaskDifficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedDifficulty === diff
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              {/* Optional notes */}
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Key takeaway or blocker noted (optional)..."
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmCompletion}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Save & Update Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
