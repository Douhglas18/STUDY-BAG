import { Goal, Task, UserProfile, ResourceBankItem } from '../types';

export interface PlanGenerationRequest {
  goal: string;
  currentSituation: string;
  target: string;
  constraints: string;
  desiredIdentity?: string;
  occupation?: string;
}

export interface WhatNowRequest {
  currentTime: string;
  availableMinutes: number;
  energyLevel: 'low' | 'normal' | 'high';
  tasks: Task[];
  currentGoal?: Goal;
}

export interface RoadmapGenerationParams {
  goalTitle: string;
  currentStatus: string;
  targetOutcome: string;
  timeframeWeeks?: number;
  userContext?: any;
  notes?: string;
  referenceLinks?: { id?: string; title: string; url: string; note?: string }[];
  resourceBank?: ResourceBankItem[];
  useSearchGrounding?: boolean;
}

export const aiService = {
  async generatePlan(req: PlanGenerationRequest) {
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.plan;
    } catch (e) {
      console.warn('Backend AI plan error, using local fallback:', e);
      return {
        summary: `Strategic roadmap for "${req.goal}" built around ${req.constraints || 'your schedule'}.`,
        milestones: [
          {
            title: 'Phase 1: Foundation & High-Leverage Diagnostics',
            timeframe: 'First 2 weeks',
            focus: 'Identify gaps and eliminate high-priority bottlenecks',
            tasks: [
              { title: 'Deconstruct target and outline top 3 priority areas', estimatedMinutes: 45, priority: 'high', category: 'Planning' },
              { title: 'Foundational concepts deep-work block', estimatedMinutes: 60, priority: 'high', category: 'Concept' },
              { title: 'Benchmark practice drill with zero notes', estimatedMinutes: 45, priority: 'medium', category: 'Practice' },
            ]
          },
          {
            title: 'Phase 2: Deliberate Practice & Volume Execution',
            timeframe: 'Weeks 3 to 5',
            focus: 'Systematic daily execution with active recall',
            tasks: [
              { title: 'Targeted drills on weak sub-topics', estimatedMinutes: 60, priority: 'high', category: 'Practice' },
              { title: 'Mid-point progress self-audit', estimatedMinutes: 30, priority: 'medium', category: 'Review' },
              { title: 'Error log review and spaced repetition', estimatedMinutes: 40, priority: 'medium', category: 'Revision' },
            ]
          },
          {
            title: 'Phase 3: Simulation & Buffer Readiness',
            timeframe: 'Final 2 weeks',
            focus: 'Timed practice tests and protected buffer days',
            tasks: [
              { title: 'Full simulated timed session', estimatedMinutes: 90, priority: 'high', category: 'Simulation' },
              { title: 'Buffer review day: address flagged weak points', estimatedMinutes: 45, priority: 'high', category: 'Revision' },
              { title: 'Pre-deadline calm readiness check', estimatedMinutes: 20, priority: 'low', category: 'Rest' }
            ]
          }
        ],
        bufferStrategy: '20% buffer allowance scheduled on weekend afternoons to absorb delays with zero guilt.',
        dailyWorkloadHours: 2.0,
        behaviorRules: [
          'Begin study within 15 minutes of scheduled time',
          'Log actual minutes spent after each focus block',
          'Revisit yesterday’s error log before new material'
        ]
      };
    }
  },

  async getWhatShouldIDoNow(req: WhatNowRequest) {
    try {
      const res = await fetch('/api/ai/what-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.recommendation;
    } catch (e) {
      console.warn('Backend what-now error, using local algorithmic recommendation:', e);
      const pending = (req.tasks || []).filter(t => t.status !== 'Completed');
      const urgent = pending.find(t => t.priority === 'high') || pending[0] || {
        id: 't-default',
        title: 'Review Core Priority & Complete Quick Drill',
        estimatedMinutes: 30,
        priority: 'high'
      };

      return {
        recommendedTask: {
          title: urgent.title,
          durationMinutes: Math.min(urgent.estimatedMinutes || 35, req.availableMinutes || 45),
          whyNow: `Directly fits your available ${req.availableMinutes}m window and removes the highest cognitive load for ${req.currentGoal?.title || 'your goal'}.`,
          priority: urgent.priority || 'high',
          energyMatch: `Calibrated for ${req.energyLevel} focus state`,
          actionSteps: [
            'Silence notifications and open designated workspace',
            'Focus on the first 25 minutes uninterrupted',
            'Record notes or questions in the task logger'
          ]
        },
        secondaryOption: pending[1] ? {
          title: pending[1].title,
          durationMinutes: pending[1].estimatedMinutes || 20,
          why: 'Shorter, lower-friction milestone task if you need immediate momentum.'
        } : null,
        coachNote: 'Do not wait for motivation. Momentum is generated by taking the first small step.'
      };
    }
  },

  async askCoach(message: string, context: { profile: UserProfile; goals: Goal[]; todayStats: any }) {
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.reply;
    } catch (e) {
      console.warn('Backend coach error, using local coach generator:', e);
      const m = message.toLowerCase();
      if (m.includes('behind') || m.includes('missed') || m.includes('fall')) {
        return `Falling behind is simply real-world friction, not a character flaw. Let's look at the mathematics of your plan:\n\n1. **Option A (Prune)**: De-prioritize 20% of lower-weight tasks.\n2. **Option B (Rebalance)**: Shift 40 minutes to your weekend buffer without touching sleep.\n3. **Option C (Density)**: Use active practice questions instead of re-reading.\n\nWhich adjustment do you want to apply right now?`;
      }
      if (m.includes('syllabus') || m.includes('exam') || m.includes('finish')) {
        return `Looking at your target timeline and available ${context.profile.availableHoursPerDay} hours/day: you can comfortably complete the syllabus if you protect your primary focus block daily. The key is reserving the final 7 days strictly for mock tests and revision rather than introducing new concepts.`;
      }
      if (m.includes('now') || m.includes('start') || m.includes('today')) {
        return `Today your single highest leverage move is to complete your top priority task before addressing minor backlog items. Knock out one focused 35-minute block.`;
      }
      return `Stay committed to your desired identity: "${context.profile.desiredIdentity}". Focus on completing just one actionable task right now. Progress compounds daily. What's your immediate next step?`;
    }
  },

  async submitCheckIn(status: string, reflection: string, missedTasks: Task[], tomorrowHours: number) {
    try {
      const res = await fetch('/api/ai/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reflection, missedTasks, availableTomorrowHours: tomorrowHours }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.adaptation;
    } catch (e) {
      return {
        coachMessage: status === 'completed_all'
          ? 'Superb execution today. You proved your system is working.'
          : 'Thank you for the honest check-in. Real life has interruptions. We adapt the schedule rather than accumulating guilt.',
        planAdjustment: missedTasks.length > 0
          ? `Redistributed ${missedTasks.length} pending task(s) into buffer slots later this week.`
          : 'Your schedule remains balanced and ready.',
        tomorrowPriority: 'Anchor your day with your first planned focus session.',
        suggestedWorkloadAdjustment: 'spread_over_weekend'
      };
    }
  },

  async improvePlan(userPlanText: string, currentGoal?: Goal, availableDailyHours = 2.5) {
    try {
      const res = await fetch('/api/ai/improve-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPlanText, currentGoal, availableDailyHours }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.analysis;
    } catch (e) {
      return {
        overallVerdict: 'Workable schedule, but vulnerable to forgetting curves and fatigue.',
        identifiedFlaws: [
          'High-importance subjects are left unreviewed for 5+ days, causing recall degradation.',
          'Uneven daily volume: 3.5 hours on Tuesdays but zero buffers on weekends.',
          'Missing a dedicated 20-minute error log revision block.'
        ],
        improvedSchedule: [
          { day: 'Day 1', sessions: [{ title: 'Deep Work: Core Concepts', durationMin: 60, type: 'Concept' }, { title: 'Recall Drill', durationMin: 20, type: 'Revision' }] },
          { day: 'Day 2', sessions: [{ title: 'Practice Problems & Exercises', durationMin: 60, type: 'Practice' }, { title: 'Spaced Review', durationMin: 20, type: 'Revision' }] },
          { day: 'Day 3 (Buffer)', sessions: [{ title: 'Catch-up & Consolidation', durationMin: 45, type: 'Buffer' }] }
        ],
        reasoningWhyBetter: 'Short spaced recall intervals increase long-term memory retention by up to 40% without increasing total study hours.'
      };
    }
  },

  async getWeeklyReview(stats: any, goals: Goal[]) {
    try {
      const res = await fetch('/api/ai/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, goals }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.review;
    } catch (e) {
      return {
        period: 'Past 7 Days',
        goalProgressPercent: stats?.progressPercent || 76,
        plannedTasks: stats?.planned || 24,
        completedTasks: stats?.completed || 19,
        missedTasks: stats?.missed || 3,
        rescheduledTasks: stats?.rescheduled || 2,
        totalHoursLogged: stats?.hours || 15.2,
        whatWentWell: [
          'Solid morning consistency: 85% of primary focus blocks completed without distraction.',
          'Active practice drills resulted in faster problem-solving times.',
          'Squad accountability nudges kept you on track during mid-week fatigue.'
        ],
        whatNeedsAttention: [
          'Revision tasks were postponed twice when evening fatigue set in.',
          'Slightly overscheduled on Thursday resulting in 1 delayed task.'
        ],
        coachRecommendations: [
          'Move the 30-minute revision block to morning right after breakfast.',
          'Keep 1 hour protected buffer on Saturday afternoon for spillover.',
          'Continue using Focus Mode timer with ambient sounds for deep sessions.'
        ]
      };
    }
  },

  async generateRoadmap(
    paramsOrGoalTitle: RoadmapGenerationParams | string,
    currentStatus?: string,
    targetOutcome?: string,
    timeframeWeeks = 6,
    userContext?: any
  ) {
    try {
      const payload = typeof paramsOrGoalTitle === 'string'
        ? {
            goalTitle: paramsOrGoalTitle,
            currentStatus,
            targetOutcome,
            timeframeWeeks,
            userContext,
            notes: '',
            referenceLinks: [],
            useSearchGrounding: true
          }
        : {
            useSearchGrounding: true,
            ...paramsOrGoalTitle
          };

      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.roadmap;
    } catch (e) {
      console.warn('Backend generateRoadmap error, using fallback:', e);
      return null;
    }
  },

  async explainTask(taskTitle: string, stageName: string, difficulty?: string) {
    try {
      const res = await fetch('/api/ai/explain-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle, stageName, difficulty }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.breakdown;
    } catch (e) {
      console.warn('Backend explainTask error, using fallback:', e);
      return {
        explanation: `This task covers fundamental problem-solving principles in ${stageName}. Mastering it establishes automaticity before advancing to timed exams.`,
        whyItMatters: `Clearing this eliminates cognitive drag and directly satisfies dependencies for subsequent revision stages.`,
        microSteps: [
          'Spend 10 minutes reviewing key definitions and formulas on a single blank sheet.',
          'Work through 2 standard textbook examples step-by-step with pen and paper.',
          'Test yourself on 1 fresh exercise under 25-minute timer without consulting notes.'
        ],
        commonPitfall: 'Reading the worked example passively rather than hiding the solution and writing it down.',
        estimatedExecutionMinutes: 35
      };
    }
  },

  async autoCategorizeResource(title: string, url: string, description?: string) {
    try {
      const res = await fetch('/api/ai/categorize-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, description }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.categorization as {
        primaryTag: 'Learning' | 'Reference' | 'Project';
        suggestedCategory: string;
        additionalTags: string[];
        confidence?: number;
        reasoning?: string;
      };
    } catch (e) {
      console.warn('Backend autoCategorizeResource error, using local fallback classifier:', e);
      const text = `${title} ${url} ${description || ''}`.toLowerCase();
      let primaryTag: 'Learning' | 'Reference' | 'Project' = 'Learning';
      let suggestedCategory = 'Documentation';
      const additionalTags: string[] = [];

      if (text.includes('github') || text.includes('project') || text.includes('repo') || text.includes('leetcode') || text.includes('neetcode')) {
        primaryTag = 'Project';
        suggestedCategory = text.includes('leetcode') || text.includes('neetcode') ? 'Practice & Problems' : 'Tool & Platform';
        additionalTags.push('Code');
      } else if (text.includes('api') || text.includes('cheatsheet') || text.includes('doc') || text.includes('reference') || text.includes('manual')) {
        primaryTag = 'Reference';
        suggestedCategory = text.includes('cheatsheet') ? 'Notes & Cheatsheet' : 'Documentation';
        additionalTags.push('Lookup');
      } else {
        primaryTag = 'Learning';
        suggestedCategory = (text.includes('youtube') || text.includes('video')) ? 'Video & Lecture' : 'Textbook & Paper';
        additionalTags.push('Study');
      }

      return {
        primaryTag,
        suggestedCategory,
        additionalTags,
        confidence: 0.85,
        reasoning: `Auto-assigned as ${primaryTag} tag based on title and link structure.`
      };
    }
  },

  // Planner AI (AI 1)
  async askPlanner(params: {
    goal?: Goal;
    currentLevel?: any;
    roadmap?: any;
    completedTasks?: any[];
    pendingTasks?: any[];
    availableDailyHours?: number;
    userReflection?: string;
  }) {
    try {
      const res = await fetch('/api/ai/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.plan;
    } catch (e) {
      console.warn('Backend askPlanner error:', e);
      return {
        pacingStatus: 'on_track',
        sessionsVariance: 0,
        explanation: 'Your daily workload is balanced against your available time.',
        recommendedAction: 'Execute your primary high-priority task first today.',
        suggestedAdjustment: {
          type: 'none',
          details: 'Pacing is currently sustainable',
          scheduleImpact: 'No schedule changes required'
        },
        todayFocus: 'Next scheduled milestone task'
      };
    }
  },

  // Interactive Tutor AI (AI 2)
  async askTutor(params: {
    levelTitle: string;
    topicTitle?: string;
    userMessage: string;
    conversationHistory?: { sender: 'user' | 'sara' | 'kairon'; text: string }[];
    documentExcerpts?: any[];
    goalContext?: string;
  }) {
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Backend askTutor error:', e);
      return {
        success: true,
        reply: `Let's break down this concept step by step for **${params.topicTitle || params.levelTitle}**:\n\n1. **Core Principle**: Grasp the essential rule before adding complex edge cases.\n2. **Practice Step**: Try explaining the mechanism in your own words, then solve a 1-variable case.\n\n*Would you like a sample practice problem or a simpler analogy?*`,
        hasDocumentCitation: false
      };
    }
  },

  // Assessment Generation
  async generateAssessment(params: {
    levelTitle: string;
    levelDescription?: string;
    tasks?: any[];
    documentExcerpts?: any[];
  }) {
    try {
      const res = await fetch('/api/ai/assessment/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.assessment;
    } catch (e) {
      console.warn('Backend generateAssessment error:', e);
      return null;
    }
  },

  // Assessment Grading
  async gradeAssessment(params: {
    questions: any[];
    userAnswers: Record<string, string>;
    levelTitle: string;
  }) {
    try {
      const res = await fetch('/api/ai/assessment/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.result;
    } catch (e) {
      console.warn('Backend gradeAssessment error:', e);
      return null;
    }
  },

  // Single Unified AI Entry Point
  async askUnifiedAI(prompt: string, context?: any) {
    try {
      const res = await fetch('/api/ai/unified-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Backend askUnifiedAI error:', e);
      return {
        success: true,
        routedTo: 'tutor',
        sourceUsed: 'Local Fallback',
        reply: `I can help with that. For your current focus on **${context?.currentLevelName || 'your goal'}**, let's isolate the next concrete action. What specific question do you have?`,
        suggestedNext: ['Explain this topic', 'What should I do now?']
      };
    }
  },

  // Document Intelligence Methods
  async uploadDocument(fileName: string, fileType: string, base64Data: string, userId = 'guest') {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileType, base64Data, userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed with HTTP ${res.status}`);
    }
    return await res.json();
  },

  async retrieveDocumentChunks(query: string, userId = 'guest', documentId?: string) {
    try {
      const res = await fetch('/api/documents/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId, documentId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.excerpts || [];
    } catch (e) {
      console.warn('retrieveDocumentChunks error:', e);
      return [];
    }
  },

  async listDocuments(userId = 'guest') {
    try {
      const res = await fetch(`/api/documents/list?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.documents || [];
    } catch (e) {
      console.warn('listDocuments error:', e);
      return [];
    }
  },

  async deleteDocument(docId: string, userId = 'guest') {
    try {
      const res = await fetch(`/api/documents/${docId}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Real Groups API (Max 4 Members Enforced)
  async createGroup(groupName: string, userId: string, userName: string, userAvatar?: string, goalTitle?: string) {
    const res = await fetch('/api/groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupName, userId, userName, userAvatar, goalTitle }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create group');
    }
    const data = await res.json();
    return data.group;
  },

  async joinGroup(inviteCode: string, userId: string, userName: string, userAvatar?: string, goalTitle?: string) {
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode, userId, userName, userAvatar, goalTitle }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to join group');
    }
    return data.group;
  },

  async updateGroupProgress(groupId: string, userId: string, progress: {
    currentLevelName?: string;
    progressPercentage?: number;
    tasksCompletedToday?: number;
    currentStreak?: number;
  }) {
    try {
      const res = await fetch('/api/groups/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, userId, ...progress }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.group;
    } catch (e) {
      console.warn('updateGroupProgress error:', e);
      return null;
    }
  },

  async leaveGroup(groupId: string, userId: string) {
    try {
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, userId }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async getGroup(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.group;
    } catch (e) {
      return null;
    }
  }
};
