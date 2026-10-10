import React, { useState } from 'react';
import { Sparkles, Target, User, Clock, ArrowRight, Check, X, Shield, Calendar } from 'lucide-react';
import { Goal, UserProfile, Occupation, Task } from '../types';
import { aiService } from '../services/aiService';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserProfile, goal: Goal, generatedTasks: Task[]) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Step 1: Identity & Occupation
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState<Occupation>('student');
  const [desiredIdentity, setDesiredIdentity] = useState('');
  const [availableHours, setAvailableHours] = useState(3);
  const [energyPeak, setEnergyPeak] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  // Step 2: Goal & Current State
  const [goalTitle, setGoalTitle] = useState('');
  const [category, setCategory] = useState<Goal['category']>('Academics');
  const [currentSituation, setCurrentSituation] = useState('');
  const [targetMetric, setTargetMetric] = useState('');
  const [deadline, setDeadline] = useState('45 days from today');
  const [constraints, setConstraints] = useState('');

  // Step 3: Generated Plan Preview
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    setLoadingPlan(true);
    setStep(3);

    const plan = await aiService.generatePlan({
      goal: goalTitle || 'Excel in my mid-term examinations',
      currentSituation: currentSituation || 'Have 6 subjects and haven’t started systematic studying.',
      target: targetMetric || 'Score 9.0+ CGPA',
      constraints: constraints || `${availableHours} hours/day study window, weeknight classes`,
      desiredIdentity: desiredIdentity || 'Disciplined scholar who executes daily without panic',
      occupation
    });

    setGeneratedPlan(plan);
    setLoadingPlan(false);
  };

  const handleFinalize = () => {
    const newProfile: UserProfile = {
      id: 'user-' + Date.now(),
      name: name.trim() || 'My Journey',
      occupation,
      roleLabel: occupation === 'student' ? 'Student' : occupation === 'developer' ? 'Software Engineer' : occupation === 'fitness' ? 'Athlete' : 'Founder',
      desiredIdentity: desiredIdentity.trim() || 'Consistent high performer',
      behaviorRules: generatedPlan?.behaviorRules || [
        'Complete primary focus block before noon',
        'Review mistake log before starting new concepts',
        'Protect rest and buffer windows'
      ],
      availableHoursPerDay: availableHours,
      preferredHours: energyPeak === 'morning' ? '08:00 - 11:00' : '18:00 - 21:00',
      energyPeak,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      studentModeEnabled: occupation === 'student',
      privacy: {
        hideTaskDetailsFromSquad: false,
        shareMetricsWithSquad: true,
        allowAccountabilityPings: true
      }
    };

    const goalId = 'g-' + Date.now();
    const milestones = (generatedPlan?.milestones || []).map((m: any, idx: number) => ({
      id: `m-${goalId}-${idx + 1}`,
      goalId,
      title: m.title,
      timeframe: m.timeframe,
      order: idx + 1,
      status: (idx === 0 ? 'in_progress' : 'pending') as 'in_progress' | 'pending',
      completionPercentage: idx === 0 ? 15 : 0
    }));

    const newGoal: Goal = {
      id: goalId,
      title: goalTitle.trim() || 'Score 9.0+ CGPA',
      category,
      currentMetric: currentSituation || 'Baseline assessment',
      targetMetric: targetMetric || 'Target Outcome',
      deadline,
      why: `Become my desired self: ${desiredIdentity || 'disciplined executor'}`,
      completionPercentage: 10,
      status: 'active',
      isPrivate: false,
      milestones,
      aiInsight: generatedPlan?.summary || 'Plan generated with built-in buffers and adaptive milestones.'
    };

    // Flatten tasks
    const newTasks: Task[] = [];
    (generatedPlan?.milestones || []).forEach((m: any, mIdx: number) => {
      (m.tasks || []).forEach((t: any, tIdx: number) => {
        newTasks.push({
          id: `t-${goalId}-${mIdx}-${tIdx}`,
          title: t.title,
          goalId,
          milestoneId: `m-${goalId}-${mIdx + 1}`,
          priority: t.priority || 'medium',
          estimatedMinutes: t.estimatedMinutes || 45,
          status: (mIdx === 0 && tIdx === 0 ? 'In Progress' : 'Not Started') as any,
          tags: [t.category || 'Focus', category],
          scheduledTime: tIdx === 0 ? '09:00' : '11:00',
          deadline: mIdx === 0 ? 'This Week' : 'Next Phase'
        });
      });
    });

    onComplete(newProfile, newGoal, newTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white max-h-[92vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
            {step}/3
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {step === 1 && 'Who Do You Want to Become?'}
              {step === 2 && 'Define Your Goal, Current State & Target'}
              {step === 3 && 'Your AI-Generated Execution Roadmap'}
            </h2>
            <p className="text-xs text-slate-400">
              {step === 1 && 'Establish your core identity and time constraints.'}
              {step === 2 && 'Tell Kairon where you are now vs where you want to be.'}
              {step === 3 && 'Structured into milestones, daily work, and protected buffers.'}
            </p>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Tanmayi"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Occupation / Domain
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'student', label: 'Student', icon: '👨‍🎓' },
                  { id: 'developer', label: 'Developer', icon: '💻' },
                  { id: 'fitness', label: 'Fitness', icon: '🏃‍♂️' },
                  { id: 'entrepreneur', label: 'Founder', icon: '🚀' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOccupation(item.id as Occupation)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      occupation === item.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="font-semibold text-xs">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* "Become My Desired Self" (Requirement #15) */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-violet-950/40 border border-indigo-500/30">
              <label className="font-bold text-indigo-300 block mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                "Become My Desired Self" Identity
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Describe the person you want to become. The AI converts this identity into a behavior system.
              </p>
              <input
                type="text"
                placeholder="e.g. A disciplined student who achieves 9+ CGPA without last-minute stress"
                value={desiredIdentity}
                onChange={e => setDesiredIdentity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Hours & Energy Peak */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Realistic Available Hours/Day
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 6].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setAvailableHours(hrs)}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                        availableHours === hrs
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Peak Energy Window
                </label>
                <select
                  value={energyPeak}
                  onChange={e => setEnergyPeak(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="morning">Morning (08:00 - 12:00)</option>
                  <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                  <option value="evening">Evening (18:00 - 22:00)</option>
                  <option value="night">Night (22:00+)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <span>Next: Define Goal & Current Situation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                What do you want to achieve? *
              </label>
              <input
                type="text"
                placeholder="e.g. Increase CGPA from 7.4 to 9.0 in Mid-Terms"
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Goal Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Academics">Academics / Exams</option>
                  <option value="Career">Career & Skills</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Building & Startup">Building & Startup</option>
                  <option value="Personal Growth">Personal Growth</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Target Deadline
                </label>
                <input
                  type="text"
                  placeholder="e.g. In 45 days or Oct 24"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Where are you currently at? (Current Situation)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Current CGPA 7.4, 4 core subjects, haven't completed revision, 35 days remaining..."
                value={currentSituation}
                onChange={e => setCurrentSituation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Target Metric / Measurable Desired Outcome
              </label>
              <input
                type="text"
                placeholder="e.g. 9.0+ CGPA (90%+ marks in all subjects)"
                value={targetMetric}
                onChange={e => setTargetMetric(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Constraints & Commitments
              </label>
              <input
                type="text"
                placeholder="e.g. 2 hours/day on weekdays, lab on Thursdays, Sundays have 4 hours free"
                value={constraints}
                onChange={e => setConstraints(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleGeneratePlan}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Adaptive Plan with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            {loadingPlan ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                <div className="font-bold text-sm text-white">Synthesizing Phased Execution Roadmap...</div>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Calculating syllabus weights, spacing repetition intervals, and scheduling 20% protective buffers...
                </p>
              </div>
            ) : generatedPlan ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Summary */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                  <div className="text-[10px] uppercase font-bold text-indigo-300 mb-1">
                    AI Roadmap Strategy
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {generatedPlan.summary}
                  </p>
                </div>

                {/* Phased Milestones */}
                <div>
                  <div className="text-xs font-bold text-slate-300 mb-2">
                    Execution Milestones ({generatedPlan.milestones?.length || 3} Phases)
                  </div>
                  <div className="space-y-2">
                    {generatedPlan.milestones?.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-xs">{m.title}</span>
                          <span className="text-[10px] text-indigo-400 font-semibold">{m.timeframe}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">{m.focus}</p>

                        <div className="space-y-1">
                          {m.tasks?.map((t: any, tIdx: number) => (
                            <div key={tIdx} className="flex items-center justify-between text-[11px] bg-slate-900 px-2 py-1 rounded">
                              <span className="text-slate-300 truncate">{t.title}</span>
                              <span className="text-slate-500 font-mono text-[10px] shrink-0 ml-2">{t.estimatedMinutes}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buffer & Behavior System */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Protective Buffer Strategy:
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {generatedPlan.bufferStrategy}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Adjust Inputs
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalize}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Activate Plan & Enter Dashboard</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
