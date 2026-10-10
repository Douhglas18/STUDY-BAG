import { 
  UserProfile, Goal, Task, Subject, Exam, GroupWorkspace, GroupMember,
  DailyCheckInRecord, SmartNotification, ChatMessage, FocusSession,
  PersonalRoadmap, SubjectAttendanceRecord, ResourceBankItem 
} from '../types';
import { 
  ALEX_ACADEMIC_ROADMAP, RAHUL_DEV_ROADMAP, INITIAL_COLLEGE_ATTENDANCE, recalculateRoadmap 
} from './roadmapData';

const STORAGE_KEYS = {
  PROFILE: 'kairon_profile',
  GOALS: 'kairon_goals',
  TASKS: 'kairon_tasks',
  SUBJECTS: 'kairon_subjects',
  EXAM: 'kairon_exam',
  GROUP: 'kairon_group',
  CHECKINS: 'kairon_checkins',
  NOTIFICATIONS: 'kairon_notifications',
  CHAT: 'kairon_chat',
  FOCUS_SESSIONS: 'kairon_focus_sessions',
  ROADMAP: 'kairon_roadmap',
  ATTENDANCE: 'kairon_attendance',
  RESOURCE_BANK: 'kairon_resource_bank'
};

// Automatically purge any legacy mock data (Alex Rivera, Rahul Sharma, Sam Miller, David Chen, or unwanted sample math goals)
export function sanitizeLegacyStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const legacyMarkers = [
    'alex rivera', 'rahul sharma', 'sam miller', 'david chen',
    'alex', 'rahul', 'david chen',
    'user-alex', 'user-rahul', 'user-sam', 'user-david',
    'g-alex', 't-alex', 'g-david', 't-david',
    'the grind squad',
    'g-initial-math', 'rd-default-initial', 't-math-',
    'improve mathematics for examination', 'addition & carrying mechanics',
    'mathematics examination roadmap', 'linear algebra & eigenvalues',
    'applied physics & electromagnetics'
  ];

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (raw) {
        const lower = raw.toLowerCase();
        if (legacyMarkers.some(m => lower.includes(m))) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    // Specifically inspect goals, tasks, and roadmap keys
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (rawGoals && (rawGoals.includes('g-initial-math') || rawGoals.toLowerCase().includes('improve mathematics'))) {
      localStorage.removeItem(STORAGE_KEYS.GOALS);
    }
    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (rawTasks && (rawTasks.includes('t-math-') || rawTasks.toLowerCase().includes('addition & carrying'))) {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
    }
    const rawRoadmap = localStorage.getItem(STORAGE_KEYS.ROADMAP);
    if (rawRoadmap && (rawRoadmap.includes('rd-default-initial') || rawRoadmap.toLowerCase().includes('mathematics examination roadmap'))) {
      localStorage.removeItem(STORAGE_KEYS.ROADMAP);
    }
  } catch (e) {}
}
sanitizeLegacyStorage();

// Preset tracks / templates
export const PERSONA_PRESETS: Record<string, { profile: UserProfile; goals: Goal[]; tasks: Task[]; subjects?: Subject[]; exam?: Exam }> = {
  alex: {
    profile: {
      id: 'user-primary',
      name: 'Tanmayi',
      occupation: 'student',
      roleLabel: 'Computer Science & Academic Scholar',
      desiredIdentity: 'Disciplined, high-performing student who executes calmly without cramming',
      behaviorRules: [
        'Complete high-priority study block before 12:00 PM',
        'Spend 20 mins reviewing previous mistakes before tackling new concepts',
        'Maintain 85% attendance across all core subjects',
        'Protect 7+ hours of sleep every night'
      ],
      availableHoursPerDay: 3,
      preferredHours: '08:00 - 11:00, 18:00 - 20:00',
      energyPeak: 'morning',
      timezone: 'America/New_York',
      studentModeEnabled: true,
      privacy: {
        hideTaskDetailsFromSquad: false,
        shareMetricsWithSquad: true,
        allowAccountabilityPings: true
      }
    },
    goals: [
      {
        id: 'g-alex-1',
        title: 'Increase CGPA from 7.4 to 9.0',
        category: 'Academics',
        currentMetric: '7.4 CGPA',
        targetMetric: '9.0 CGPA',
        deadline: '2026-11-15',
        why: 'Secure graduate research assistantship and master foundational computer systems.',
        completionPercentage: 72,
        status: 'active',
        isPrivate: false,
        aiInsight: 'On track for 8.8-9.0. Physics practice problem completion velocity needs a 15-minute boost.',
        milestones: [
          { id: 'm-1', goalId: 'g-alex-1', title: 'Complete first-pass syllabus for all 4 subjects', deadline: '2026-10-05', timeframe: 'Days 1-18', order: 1, status: 'completed', completionPercentage: 100 },
          { id: 'm-2', goalId: 'g-alex-1', title: 'Finish high-weight question banks & assignments', deadline: '2026-10-18', timeframe: 'Days 19-30', order: 2, status: 'in_progress', completionPercentage: 65 },
          { id: 'm-3', goalId: 'g-alex-1', title: 'Comprehensive Revision & Formula Mastery', deadline: '2026-10-28', timeframe: 'Days 31-40', order: 3, status: 'pending', completionPercentage: 20 },
          { id: 'm-4', goalId: 'g-alex-1', title: 'Timed Mock Exams & Error Log Blitz', deadline: '2026-11-08', timeframe: 'Days 41-50', order: 4, status: 'pending', completionPercentage: 0 },
          { id: 'm-5', goalId: 'g-alex-1', title: 'Final Buffer & Exam Readiness State', deadline: '2026-11-14', timeframe: 'Final 4 Days', order: 5, status: 'pending', completionPercentage: 0 }
        ]
      }
    ],
    tasks: [
      {
        id: 't-alex-1',
        title: 'Mathematics: Solve Unit 3 Multivariable Derivatives',
        description: 'Focus on directional derivatives and gradient vector exercises 1-12.',
        goalId: 'g-alex-1',
        milestoneId: 'm-2',
        subjectId: 'sub-math',
        priority: 'high',
        deadline: 'Today, 20:00',
        scheduledTime: '09:00',
        estimatedMinutes: 45,
        status: 'In Progress',
        difficulty: 'Hard',
        tags: ['Math', 'Calculus', 'Drill'],
        notes: 'Review chain rule edge cases before problem #8.'
      },
      {
        id: 't-alex-2',
        title: 'Complete Java / DSA Tree Traversal Assignment',
        description: 'Implement AVL tree rebalancing and level-order traversal with BFS.',
        goalId: 'g-alex-1',
        milestoneId: 'm-2',
        subjectId: 'sub-dsa',
        priority: 'high',
        deadline: 'Tomorrow, 14:00',
        scheduledTime: '11:00',
        estimatedMinutes: 60,
        status: 'Not Started',
        difficulty: 'Normal',
        tags: ['DSA', 'Coding', 'Assignment']
      },
      {
        id: 't-alex-3',
        title: 'Physics Numerical Practice: Electromagnetic Induction',
        description: "Faraday's Law numerical exercises from Chapter 6.",
        goalId: 'g-alex-1',
        milestoneId: 'm-2',
        subjectId: 'sub-phys',
        priority: 'medium',
        deadline: 'Today, 22:00',
        scheduledTime: '16:30',
        estimatedMinutes: 40,
        status: 'Not Started',
        tags: ['Physics', 'Revision']
      },
      {
        id: 't-alex-4',
        title: 'Computer Architecture: Cache Mapping Recall Drill',
        description: 'Direct mapped vs set associative cache tag/index/offset calculations.',
        goalId: 'g-alex-1',
        milestoneId: 'm-2',
        subjectId: 'sub-arch',
        priority: 'medium',
        deadline: 'Tomorrow, 18:00',
        scheduledTime: '19:00',
        estimatedMinutes: 30,
        status: 'Not Started',
        tags: ['Hardware', 'Active Recall']
      },
      {
        id: 't-alex-5',
        title: 'Quick 15-min Math Flashcard Review',
        description: 'Review key differentiation and integration identities.',
        goalId: 'g-alex-1',
        milestoneId: 'm-2',
        subjectId: 'sub-math',
        priority: 'low',
        estimatedMinutes: 15,
        status: 'Completed',
        tags: ['Math', 'Spaced Repetition'],
        actualMinutes: 14,
        completedAt: '2026-09-23T08:30:00Z'
      }
    ],
    subjects: [
      {
        id: 'sub-math',
        name: 'Higher Mathematics III',
        code: 'MATH-301',
        targetScore: 'A+ (95+)',
        currentScore: '84%',
        examDate: '2026-10-24',
        weight: 4,
        units: [
          {
            id: 'u-m1',
            unitNumber: 1,
            title: 'Linear Algebra & Eigenvalues',
            topics: [
              { id: 'tp-1', title: 'Matrices & Gaussian Elimination', status: 'Mastered', weight: 'medium', estimatedHours: 3 },
              { id: 'tp-2', title: 'Eigenvectors and Diagonalization', status: 'Mastered', weight: 'high', estimatedHours: 4 },
              { id: 'tp-3', title: 'Cayley-Hamilton Theorem', status: 'Revised', weight: 'high', estimatedHours: 3 }
            ]
          },
          {
            id: 'u-m2',
            unitNumber: 2,
            title: 'Multivariable Calculus',
            topics: [
              { id: 'tp-4', title: 'Partial Differentiation', status: 'Revised', weight: 'medium', estimatedHours: 3 },
              { id: 'tp-5', title: 'Gradient, Divergence & Curl', status: 'Practicing', weight: 'high', estimatedHours: 4 },
              { id: 'tp-6', title: "Green's & Stokes' Theorems", status: 'Learning', weight: 'high', estimatedHours: 5 }
            ]
          },
          {
            id: 'u-m3',
            unitNumber: 3,
            title: 'Differential Equations & Laplace',
            topics: [
              { id: 'tp-7', title: 'Second-order linear ODEs', status: 'Practicing', weight: 'high', estimatedHours: 4 },
              { id: 'tp-8', title: 'Laplace Transform identities', status: 'Not Started', weight: 'high', estimatedHours: 5 },
              { id: 'tp-9', title: 'Inverse Laplace & Convolution', status: 'Not Started', weight: 'medium', estimatedHours: 4 }
            ]
          }
        ]
      },
      {
        id: 'sub-dsa',
        name: 'Data Structures & Algorithms',
        code: 'CS-202',
        targetScore: 'A+ (95+)',
        currentScore: '88%',
        examDate: '2026-10-27',
        weight: 4,
        units: [
          {
            id: 'u-d1',
            unitNumber: 1,
            title: 'Trees & Balanced Search Trees',
            topics: [
              { id: 'tp-d1', title: 'Binary Search Trees & Traversals', status: 'Mastered', weight: 'medium', estimatedHours: 3 },
              { id: 'tp-d2', title: 'AVL Trees & Rotations', status: 'Practicing', weight: 'high', estimatedHours: 4 },
              { id: 'tp-d3', title: 'Red-Black Tree Properties', status: 'Learning', weight: 'high', estimatedHours: 4 }
            ]
          },
          {
            id: 'u-d2',
            unitNumber: 2,
            title: 'Graphs & Shortest Paths',
            topics: [
              { id: 'tp-d4', title: 'BFS, DFS & Topological Sort', status: 'Mastered', weight: 'high', estimatedHours: 4 },
              { id: 'tp-d5', title: "Dijkstra's & Bellman-Ford", status: 'Practicing', weight: 'high', estimatedHours: 5 },
              { id: 'tp-d6', title: 'Minimum Spanning Trees (Kruskal/Prim)', status: 'Revised', weight: 'medium', estimatedHours: 3 }
            ]
          }
        ]
      },
      {
        id: 'sub-phys',
        name: 'Applied Physics & Electromagnetics',
        code: 'PHYS-201',
        targetScore: 'A (90+)',
        currentScore: '78%',
        examDate: '2026-10-30',
        weight: 3,
        units: [
          {
            id: 'u-p1',
            unitNumber: 1,
            title: 'Electromagnetic Induction',
            topics: [
              { id: 'tp-p1', title: "Faraday's Law & Lenz Law", status: 'Revised', weight: 'medium', estimatedHours: 3 },
              { id: 'tp-p2', title: "Maxwell's Equations in Free Space", status: 'Learning', weight: 'high', estimatedHours: 5 },
              { id: 'tp-p3', title: 'Poynting Vector & Energy Flow', status: 'Not Started', weight: 'medium', estimatedHours: 4 }
            ]
          }
        ]
      }
    ],
    exam: {
      id: 'ex-midsem',
      name: 'Fall Mid-Semester Examinations',
      date: '2026-10-24',
      daysRemaining: 31,
      subjects: ['Higher Mathematics III', 'Data Structures & Algorithms', 'Applied Physics', 'Computer Architecture'],
      phases: [
        { id: 'ph-1', phaseName: 'Phase 1: Core Concept Mastery', duration: 'Days 1–12', focus: 'Ensure 100% of high-weight theory is understood', status: 'completed' },
        { id: 'ph-2', phaseName: 'Phase 2: Question Banks & Numerical Drills', duration: 'Days 13–22', focus: 'Active problem solving without open books', status: 'current' },
        { id: 'ph-3', phaseName: 'Phase 3: Spaced Revision & Formula Sheets', duration: 'Days 23–27', focus: 'Consolidate memory and fix recurring errors', status: 'upcoming' },
        { id: 'ph-4', phaseName: 'Phase 4: Timed Mock Exams', duration: 'Days 28–30', focus: 'Full 3-hour exam simulation under test conditions', status: 'upcoming' },
        { id: 'ph-5', phaseName: 'Phase 5: Buffer & Calm Readiness', duration: 'Final 2 Days', focus: 'Zero cramming. Rest, light review, equipment check', isBuffer: true, status: 'upcoming' }
      ]
    }
  },

  rahul: {
    profile: {
      id: 'user-primary',
      name: 'Tanmayi',
      occupation: 'developer',
      roleLabel: 'Aspiring Full-Stack Software Engineer',
      desiredIdentity: 'Elite problem solver and shipped-code creator ready for top tech roles',
      behaviorRules: [
        'Solve 1 LeetCode medium problem every morning',
        'Ship a commit to GitHub before ending work',
        'Write clean modular code with TypeScript',
        'Read 1 architecture paper or design doc weekly'
      ],
      availableHoursPerDay: 3.5,
      preferredHours: '07:00 - 09:30, 20:30 - 22:00',
      energyPeak: 'evening',
      timezone: 'Asia/Kolkata',
      studentModeEnabled: false,
      privacy: {
        hideTaskDetailsFromSquad: false,
        shareMetricsWithSquad: true,
        allowAccountabilityPings: true
      }
    },
    goals: [
      {
        id: 'g-rahul-1',
        title: 'Become Industry Job-Ready in 6 Months',
        category: 'Career',
        currentMetric: 'Foundations (2 projects, 60 DSA solved)',
        targetMetric: 'Full Portfolio (4 flagship apps, 200 DSA, 5 mock interviews)',
        deadline: '2026-12-31',
        why: 'Secure a high-impact SWE role at a product-led company.',
        completionPercentage: 64,
        status: 'active',
        isPrivate: false,
        aiInsight: 'DSA consistency is great (18-day streak). Portfolio backend deployment is the key bottleneck.',
        milestones: [
          { id: 'm-r1', goalId: 'g-rahul-1', title: 'Master Core Java, Concurrency & Spring Boot', deadline: '2026-08-30', order: 1, status: 'completed', completionPercentage: 100 },
          { id: 'm-r2', goalId: 'g-rahul-1', title: 'Solve 150 NeetCode / LeetCode Problems', deadline: '2026-10-15', order: 2, status: 'in_progress', completionPercentage: 70 },
          { id: 'm-r3', goalId: 'g-rahul-1', title: 'Build & Deploy Flagship Full-Stack System', deadline: '2026-11-15', order: 3, status: 'in_progress', completionPercentage: 40 },
          { id: 'm-r4', goalId: 'g-rahul-1', title: 'System Design Drills & Mock Behavioral Rounds', deadline: '2026-12-15', order: 4, status: 'pending', completionPercentage: 0 }
        ]
      }
    ],
    tasks: [
      {
        id: 't-rahul-1',
        title: 'Solve LRU Cache implementation in Java',
        description: 'Double-linked list + HashMap structure with O(1) get & put.',
        goalId: 'g-rahul-1',
        priority: 'high',
        scheduledTime: '08:00',
        estimatedMinutes: 45,
        status: 'In Progress',
        difficulty: 'Hard',
        tags: ['DSA', 'Java', 'LeetCode']
      },
      {
        id: 't-rahul-2',
        title: 'Build Kafka event publisher in microservice project',
        description: 'Implement transactional producer and error handling dead-letter queue.',
        goalId: 'g-rahul-1',
        priority: 'high',
        scheduledTime: '20:30',
        estimatedMinutes: 75,
        status: 'Not Started',
        difficulty: 'Normal',
        tags: ['Backend', 'Kafka', 'Project']
      }
    ]
  },

  sam: {
    profile: {
      id: 'user-primary',
      name: 'Tanmayi',
      occupation: 'fitness',
      roleLabel: 'Athletic Transformation & Marathoner',
      desiredIdentity: 'Resilient, high-energy athlete who prioritizes metabolic health',
      behaviorRules: [
        'Hit 10,000 steps daily before dinner',
        'Drink 3.5L of water and log whole-food meals',
        'Complete strength workout 4x per week',
        'Sleep minimum 7.5 hours with consistent wake up'
      ],
      availableHoursPerDay: 2,
      preferredHours: '06:00 - 07:30',
      energyPeak: 'morning',
      timezone: 'Europe/London',
      studentModeEnabled: false,
      privacy: {
        hideTaskDetailsFromSquad: false,
        shareMetricsWithSquad: true,
        allowAccountabilityPings: true
      }
    },
    goals: [
      {
        id: 'g-sam-1',
        title: 'Lose 8 kg & Complete 10km under 50 mins',
        category: 'Health & Fitness',
        currentMetric: 'Weight: 84kg, 5km time: 27m',
        targetMetric: 'Weight: 76kg, 10km time: 49m',
        deadline: '2026-11-20',
        why: 'Achieve peak cardiovascular fitness and long-term vitality.',
        completionPercentage: 58,
        status: 'active',
        isPrivate: false,
        aiInsight: 'Weight loss trajectory is steady (-0.6kg/week). Zone 2 running volume on track.',
        milestones: [
          { id: 'm-s1', goalId: 'g-sam-1', title: 'Establish 4x gym + 2x run baseline habit', deadline: '2026-08-31', order: 1, status: 'completed', completionPercentage: 100 },
          { id: 'm-s2', goalId: 'g-sam-1', title: 'Drop first 4kg & run continuous 7km', deadline: '2026-10-01', order: 2, status: 'in_progress', completionPercentage: 75 },
          { id: 'm-s3', goalId: 'g-sam-1', title: 'Reach 78kg & break 25m 5km split', deadline: '2026-10-30', order: 3, status: 'pending', completionPercentage: 20 },
          { id: 'm-s4', goalId: 'g-sam-1', title: 'Race-day peak: sub-50m 10k & 76kg', deadline: '2026-11-20', order: 4, status: 'pending', completionPercentage: 0 }
        ]
      }
    ],
    tasks: [
      {
        id: 't-sam-1',
        title: 'Morning 6km Zone-2 Aerobic Run',
        description: 'Maintain heart rate between 135-145 bpm for optimal mitochondrial adaptation.',
        goalId: 'g-sam-1',
        priority: 'high',
        scheduledTime: '06:30',
        estimatedMinutes: 40,
        status: 'In Progress',
        tags: ['Running', 'Cardio']
      },
      {
        id: 't-sam-2',
        title: 'Upper Body Hypertrophy & Core Routine',
        description: 'Dumbbell bench press, pullups, shoulder press, hollow-body holds.',
        goalId: 'g-sam-1',
        priority: 'medium',
        scheduledTime: '17:30',
        estimatedMinutes: 50,
        status: 'Not Started',
        tags: ['Strength', 'Gym']
      }
    ]
  },

  david: {
    profile: {
      id: 'user-primary',
      name: 'Tanmayi',
      occupation: 'entrepreneur',
      roleLabel: 'Solo Tech Founder',
      desiredIdentity: 'Relentless product builder who talks to customers and ships fast',
      behaviorRules: [
        'Speak to at least 1 potential customer daily',
        'Do not spend more than 2 hours without customer validation',
        'Ship weekly update to early waitlist'
      ],
      availableHoursPerDay: 5,
      preferredHours: '09:00 - 18:00',
      energyPeak: 'afternoon',
      timezone: 'America/Los_Angeles',
      studentModeEnabled: false,
      privacy: {
        hideTaskDetailsFromSquad: false,
        shareMetricsWithSquad: true,
        allowAccountabilityPings: true
      }
    },
    goals: [
      {
        id: 'g-david-1',
        title: 'Launch SaaS MVP in 90 Days & Acquire 50 Paying Users',
        category: 'Building & Startup',
        currentMetric: '35 waitlist signups, Core Engine 60% built',
        targetMetric: '50 paying customers ($1,500 MRR)',
        deadline: '2026-11-01',
        why: 'Validate financial independence and build an enduring micro-SaaS.',
        completionPercentage: 52,
        status: 'active',
        isPrivate: false,
        aiInsight: 'Landing page conversion is strong (11%). Prioritize Stripe billing integration before extra features.',
        milestones: [
          { id: 'm-d1', goalId: 'g-david-1', title: 'Problem Discovery & 30 Customer Interviews', deadline: '2026-08-20', order: 1, status: 'completed', completionPercentage: 100 },
          { id: 'm-d2', goalId: 'g-david-1', title: 'Core CRUD & AI Automation MVP', deadline: '2026-09-30', order: 2, status: 'in_progress', completionPercentage: 70 },
          { id: 'm-d3', goalId: 'g-david-1', title: 'Beta Launch to 100 Waitlist Users', deadline: '2026-10-15', order: 3, status: 'pending', completionPercentage: 10 },
          { id: 'm-d4', goalId: 'g-david-1', title: 'Public Product Hunt Launch & Onboarding Funnel', deadline: '2026-11-01', order: 4, status: 'pending', completionPercentage: 0 }
        ]
      }
    ],
    tasks: [
      {
        id: 't-david-1',
        title: 'Implement Stripe Checkout webhook handler',
        description: 'Provision team workspaces on subscription checkout.session.completed.',
        goalId: 'g-david-1',
        priority: 'high',
        scheduledTime: '10:00',
        estimatedMinutes: 60,
        status: 'Not Started',
        tags: ['Stripe', 'Billing', 'MVP']
      }
    ]
  }
};

// Demo Focus & Accountability Partner (For simulated single-user presentation only)
export const DEMO_FOCUS_PARTNER: GroupMember = {
  id: 'partner-demo',
  name: 'Demo Partner (Presentation Mode)',
  avatar: '👩‍💻',
  role: 'Focus & Accountability Partner',
  email: 'demo.partner@kairon.app',
  goalTitle: 'Cloud Architecture & Systems Certification',
  progressPercentage: 65,
  weeklyTasksCompleted: 11,
  weeklyTargetTasks: 14,
  hoursInvested: 14.5,
  currentStreak: 7,
  isOnline: true,
  isCurrentUser: false,
  desiredIdentity: 'Disciplined cloud architect executing consistent daily deep-work blocks',
  partnerPlan: {
    targetMetric: 'Deploy 5 multi-region services & complete AWS Solutions Architect',
    deadline: '2026-11-28',
    currentLevelName: 'Level 2: Containerization & Kubernetes Clusters',
    currentLevelOrder: 2,
    totalLevels: 4,
    stages: [
      {
        id: 'pst-1',
        order: 1,
        name: 'Linux Systems & Network Foundations',
        status: 'completed',
        description: 'Core POSIX tools, sockets, and TCP/IP stack mastered.'
      },
      {
        id: 'pst-2',
        order: 2,
        name: 'Containerization & Kubernetes Clusters',
        status: 'in_progress',
        description: 'Active level: Deploying manifests, ingress controllers, and services.'
      },
      {
        id: 'pst-3',
        order: 3,
        name: 'Distributed Consensus & Replication',
        status: 'locked',
        description: 'Raft consensus, etcd quorum, and state-machine replication.'
      },
      {
        id: 'pst-4',
        order: 4,
        name: 'Production Observability & SRE Benchmark',
        status: 'locked',
        description: 'Prometheus metrics, distributed tracing, and chaos testing.'
      }
    ],
    activeTasks: [
      {
        id: 'pt-1',
        title: 'Review etcd Cluster Consensus & Quorum Math',
        status: 'Completed',
        priority: 'high',
        difficulty: 'Normal',
        completedAt: 'Today, 10:45'
      },
      {
        id: 'pt-2',
        title: 'Write Kubernetes Ingress Helm Chart & Custom Controller',
        status: 'In Progress',
        priority: 'high',
        difficulty: 'Hard'
      },
      {
        id: 'pt-3',
        title: 'Benchmarking Pod Failover & Readiness Health Checks',
        status: 'Not Started',
        priority: 'medium',
        difficulty: 'Normal'
      }
    ],
    recentAchievements: [
      'Passed Level 1 Linux Assessment with 94% score',
      'Completed 7 straight days of deep work',
      'Logged 14.5 hours of uninterrupted focus'
    ],
    focusNotes: 'Morning 9:00 - 11:30 AM deep-work session dedicated to systems coding.'
  }
};

export const DEFAULT_FOCUS_PARTNER = DEMO_FOCUS_PARTNER;

// Initial Focus Squad workspace in clean zero-data state
export const INITIAL_GROUP_WORKSPACE: GroupWorkspace = {
  id: 'group-clean-circle',
  name: 'Personal Focus Circle',
  type: 'single',
  groupGoal: {
    title: 'Monthly Deep Work Sessions',
    current: 0,
    target: 20,
    unit: 'focus blocks'
  },
  members: [
    {
      id: 'user-primary',
      name: 'Tanmayi',
      avatar: '🎯',
      role: 'Focus Member',
      goalTitle: 'No Active Goal Yet',
      progressPercentage: 0,
      weeklyTasksCompleted: 0,
      weeklyTargetTasks: 10,
      hoursInvested: 0,
      currentStreak: 0,
      isOnline: true,
      isCurrentUser: true
    }
  ],
  challenges: [
    {
      id: 'c-1',
      title: 'Consistency Sprint: 5 Days of Deep Focus',
      description: 'Log at least 1 completed focus session every weekday.',
      progress: 0,
      target: 5,
      unit: 'days',
      deadline: 'This Week',
      completed: false
    }
  ],
  activityFeed: []
};

// Initial Smart Notifications (Clean Zero-Data State)
export const INITIAL_NOTIFICATIONS: SmartNotification[] = [
  {
    id: 'notif-welcome',
    title: 'Clean Workspace Ready',
    message: 'Welcome! Your workspace is ready for your demo presentation. Create your first goal roadmap to begin.',
    type: 'daily_plan',
    timestamp: 'Just now',
    read: false,
    actionLabel: 'Create Goal',
    actionType: 'view_plan'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm-init',
    sender: 'sara',
    text: "Welcome! I'm Sara, your AI Goal and Accountability Coach. I'm ready to help you plan, adapt, and master your learning milestones with zero clutter. What would you like to achieve today?",
    timestamp: 'Now',
    quickReplies: [
      'Create a study plan for my exam',
      'What should I do now?',
      'How does adaptive rescheduling work?'
    ]
  }
];

export const INITIAL_RESOURCE_BANK: ResourceBankItem[] = [];

export const DEFAULT_CLEAN_PROFILE: UserProfile = {
  id: 'user-primary',
  name: 'Tanmayi',
  occupation: 'student',
  roleLabel: 'Independent Learner & Achiever',
  desiredIdentity: 'Disciplined achiever making steady daily progress',
  behaviorRules: [
    'Protect a daily deep work study session',
    'Review key concepts and mistakes regularly'
  ],
  availableHoursPerDay: 2,
  preferredHours: '09:00 - 11:00',
  energyPeak: 'morning',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  studentModeEnabled: false,
  privacy: {
    hideTaskDetailsFromSquad: false,
    shareMetricsWithSquad: true,
    allowAccountabilityPings: true
  }
};

// Default Realistic Initial Goal & Progression Matching Core Specifications
export const DEFAULT_INITIAL_GOAL: Goal = {
  id: 'g-initial-math',
  title: 'Improve Mathematics for Examination',
  category: 'Academics',
  currentMetric: 'Basic arithmetic mastered, struggle with algebra',
  targetMetric: 'Score 90%+',
  deadline: '2026-12-15',
  why: 'Build deep foundational competence and secure top examination placement',
  completionPercentage: 20,
  status: 'active',
  isPrivate: false,
  milestones: [
    { id: 'm-1', goalId: 'g-initial-math', title: 'Level 1: Arithmetic Foundations', deadline: '2026-11-01', order: 1, status: 'in_progress', completionPercentage: 25 },
    { id: 'm-2', goalId: 'g-initial-math', title: 'Level 2: Fractions & Decimals', deadline: '2026-11-15', order: 2, status: 'pending', completionPercentage: 0 },
    { id: 'm-3', goalId: 'g-initial-math', title: 'Level 3: Algebra Foundations', deadline: '2026-12-01', order: 3, status: 'pending', completionPercentage: 0 }
  ]
};

export const DEFAULT_INITIAL_TASKS: Task[] = [
  {
    id: 't-math-1',
    goalId: 'g-initial-math',
    title: 'Addition & Carrying Mechanics',
    description: 'Multi-digit addition with carry-over drills from uploaded textbook',
    status: 'In Progress',
    priority: 'high',
    difficulty: 'Easy',
    estimatedMinutes: 20,
    tags: ['Arithmetic', 'Math']
  },
  {
    id: 't-math-2',
    goalId: 'g-initial-math',
    title: 'Subtraction & Regrouping Across Zeros',
    description: 'Borrowing mechanics and speed check',
    status: 'Not Started',
    priority: 'high',
    difficulty: 'Easy',
    estimatedMinutes: 20,
    tags: ['Arithmetic', 'Math']
  },
  {
    id: 't-math-3',
    goalId: 'g-initial-math',
    title: 'Multiplication Tables & Long Multiplication',
    description: 'Speed drills and multi-digit partial products',
    status: 'Not Started',
    priority: 'medium',
    difficulty: 'Normal',
    estimatedMinutes: 25,
    tags: ['Arithmetic', 'Math']
  },
  {
    id: 't-math-4',
    goalId: 'g-initial-math',
    title: 'Long Division & Remainders',
    description: 'Standard division algorithm step-by-step',
    status: 'Not Started',
    priority: 'medium',
    difficulty: 'Normal',
    estimatedMinutes: 25,
    tags: ['Arithmetic', 'Math']
  }
];

export const DEFAULT_INITIAL_ROADMAP: PersonalRoadmap = {
  id: 'rd-default-initial',
  goalId: 'g-initial-math',
  title: 'Mathematics Examination Roadmap',
  category: 'Academics',
  targetGoal: 'Score 90%+ in Upcoming Examination',
  deadline: '2026-11-20',
  currentStreak: 1,
  totalTasks: 9,
  completedTasks: 1,
  progressPercentage: 11,
  stages: [
    {
      id: 'lvl-1-arithmetic',
      roadmapId: 'rd-default-initial',
      name: 'Arithmetic Foundations',
      order: 1,
      status: 'in_progress',
      difficulty: 'Easy',
      shortDescription: 'Core arithmetic mechanics, carrying, and rapid operations.',
      estimatedHours: 4,
      prerequisiteStageIds: [],
      aiRecommendation: 'Review basic operations and verify with quick practice problems.',
      whyImportant: 'Mastering basic arithmetic ensures error-free downstream algebra.',
      whatUnlocksNext: 'Unlocks Level 2: Fractions & Decimals.',
      tasks: [
        {
          id: 't-math-1',
          stageId: 'lvl-1-arithmetic',
          title: 'Addition & Carrying Mechanics',
          description: 'Multi-digit addition with carry-over drills',
          status: 'In Progress',
          priority: 'high',
          difficulty: 'Easy',
          estimatedMinutes: 20
        },
        {
          id: 't-math-2',
          stageId: 'lvl-1-arithmetic',
          title: 'Subtraction & Borrowing',
          description: 'Regrouping across zeros and borrow checks',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Easy',
          estimatedMinutes: 20
        },
        {
          id: 't-math-3',
          stageId: 'lvl-1-arithmetic',
          title: 'Multiplication Tables & Multi-digit Products',
          description: 'Speed drills and partial products',
          status: 'Not Started',
          priority: 'medium',
          difficulty: 'Normal',
          estimatedMinutes: 25
        },
        {
          id: 't-math-4',
          stageId: 'lvl-1-arithmetic',
          title: 'Long Division & Remainders',
          description: 'Step-by-step division algorithm',
          status: 'Not Started',
          priority: 'medium',
          difficulty: 'Normal',
          estimatedMinutes: 25
        }
      ]
    },
    {
      id: 'lvl-2-fractions',
      roadmapId: 'rd-default-initial',
      name: 'Fractions & Decimals',
      order: 2,
      status: 'available',
      difficulty: 'Normal',
      shortDescription: 'Fractions, decimals, percentages, and unit conversions.',
      estimatedHours: 5,
      prerequisiteStageIds: ['lvl-1-arithmetic'],
      aiRecommendation: 'Practice finding common denominators before proceeding to decimals.',
      whyImportant: 'Foundational bridge to variable manipulation and equations.',
      whatUnlocksNext: 'Unlocks Level 3: Algebra Foundations.',
      tasks: [
        {
          id: 't-math-5',
          stageId: 'lvl-2-fractions',
          title: 'Adding and Subtracting Fractions',
          description: 'Common denominators and simplified forms',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Normal',
          estimatedMinutes: 30
        },
        {
          id: 't-math-6',
          stageId: 'lvl-2-fractions',
          title: 'Decimals and Percentages Conversion',
          description: 'Converting between fractions, decimals, and percent',
          status: 'Not Started',
          priority: 'medium',
          difficulty: 'Normal',
          estimatedMinutes: 25
        }
      ]
    },
    {
      id: 'lvl-3-algebra',
      roadmapId: 'rd-default-initial',
      name: 'Algebra Foundations',
      order: 3,
      status: 'locked',
      difficulty: 'Hard',
      shortDescription: 'Variables, single-variable expressions, and linear equations.',
      estimatedHours: 6,
      prerequisiteStageIds: ['lvl-2-fractions'],
      aiRecommendation: 'Unlock by completing Level 2 mini assessment.',
      whyImportant: 'Core requirement for exam syllabus mastery.',
      whatUnlocksNext: 'Unlocks Level 4: Linear Equations.',
      tasks: [
        {
          id: 't-math-7',
          stageId: 'lvl-3-algebra',
          title: 'Single-Variable Equations',
          description: 'Isolating variables with balance method',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 35
        }
      ]
    },
    {
      id: 'lvl-4-linear',
      roadmapId: 'rd-default-initial',
      name: 'Linear Equations & Graphing',
      order: 4,
      status: 'locked',
      difficulty: 'Hard',
      shortDescription: 'Slope-intercept form, Cartesian coordinates, and systems.',
      estimatedHours: 6,
      prerequisiteStageIds: ['lvl-3-algebra'],
      aiRecommendation: 'Unlock after Level 3.',
      whyImportant: 'High exam weight questions.',
      whatUnlocksNext: 'Unlocks Level 5: Advanced Problem Solving.',
      tasks: [
        {
          id: 't-math-8',
          stageId: 'lvl-4-linear',
          title: 'Systems of Equations',
          description: 'Substitution and elimination techniques',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 40
        }
      ]
    },
    {
      id: 'lvl-5-advanced',
      roadmapId: 'rd-default-initial',
      name: 'Advanced Problem Solving',
      order: 5,
      status: 'locked',
      difficulty: 'Very Hard',
      shortDescription: 'Full question paper simulations, past papers, and error diagnostics.',
      estimatedHours: 8,
      prerequisiteStageIds: ['lvl-4-linear'],
      aiRecommendation: 'Final capstone milestone to lock in 90%+ score.',
      whyImportant: 'Target outcome realization.',
      whatUnlocksNext: 'Goal Complete: 90%+ Mastery Achieved.',
      tasks: [
        {
          id: 't-math-9',
          stageId: 'lvl-5-advanced',
          title: 'Timed Previous Question Paper Simulation',
          description: 'Full mock examination under exam conditions',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Very Hard',
          estimatedMinutes: 90
        }
      ]
    }
  ]
};

// Local storage management helpers
export const storageService = {
  isDevTestModeEnabled(): boolean {
    return localStorage.getItem('kairon_enable_test_data') === 'true';
  },

  setDevTestMode(enabled: boolean) {
    if (enabled) {
      localStorage.setItem('kairon_enable_test_data', 'true');
    } else {
      localStorage.removeItem('kairon_enable_test_data');
    }
  },

  loadProfile(): UserProfile {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      try { 
        const p = JSON.parse(saved);
        if (p && p.name) {
          const lower = p.name.toLowerCase();
          if (!lower.includes('alex') && !lower.includes('rahul') && !lower.includes('sam') && !lower.includes('david')) {
            return p;
          }
        }
      } catch (e) {}
    }
    return { ...DEFAULT_CLEAN_PROFILE };
  },

  saveProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  loadGoals(): Goal[] {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (saved !== null) {
      try { 
        const g = JSON.parse(saved);
        if (Array.isArray(g)) {
          const raw = JSON.stringify(g).toLowerCase();
          const hasLegacy = ['alex', 'rahul', 'david', 'g-alex', 'g-david', 'g-initial-math', 'improve mathematics for examination'].some(m => raw.includes(m));
          if (!hasLegacy) return g;
        }
      } catch (e) {}
    }
    return [];
  },

  saveGoals(goals: Goal[]) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  loadTasks(): Task[] {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved !== null) {
      try { 
        const t = JSON.parse(saved);
        if (Array.isArray(t)) {
          const raw = JSON.stringify(t).toLowerCase();
          const hasLegacy = ['alex', 'rahul', 'david', 't-alex', 't-david', 't-math-', 'addition & carrying'].some(m => raw.includes(m));
          if (!hasLegacy) return t;
        }
      } catch (e) {}
    }
    return [];
  },

  saveTasks(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  loadSubjects(): Subject[] {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  },

  saveSubjects(subjects: Subject[]) {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  loadExam(): Exam | null {
    const saved = localStorage.getItem(STORAGE_KEYS.EXAM);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  },

  saveExam(exam: Exam | null) {
    if (!exam) {
      localStorage.removeItem(STORAGE_KEYS.EXAM);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.EXAM, JSON.stringify(exam));
  },

  loadGroup(): GroupWorkspace {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUP);
    if (saved) {
      try { 
        const grp = JSON.parse(saved);
        if (grp && grp.id) {
          const raw = JSON.stringify(grp).toLowerCase();
          const hasLegacy = ['alex', 'rahul', 'sam miller', 'david chen', 'the grind squad', 'user-alex', 'user-rahul', 'user-sam', 'user-david'].some(m => raw.includes(m));
          // Purge stale mock workspace with hardcoded stats
          if (!hasLegacy && grp.id !== 'group-focus-squad' && grp.members?.length > 0) {
            return grp;
          }
          localStorage.removeItem(STORAGE_KEYS.GROUP);
        }
      } catch (e) {}
    }
    return { ...INITIAL_GROUP_WORKSPACE };
  },

  saveGroup(group: GroupWorkspace) {
    localStorage.setItem(STORAGE_KEYS.GROUP, JSON.stringify(group));
  },

  loadNotifications(): SmartNotification[] {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try { 
        const n = JSON.parse(saved);
        if (Array.isArray(n) && n.length > 0) {
          const raw = JSON.stringify(n).toLowerCase();
          const hasLegacy = ['alex', 'david', 'rahul', 'sam', 'mathematics unit 3'].some(m => raw.includes(m));
          if (!hasLegacy) return n;
          // Clear legacy notifications
          localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
        }
      } catch (e) {}
    }
    return INITIAL_NOTIFICATIONS;
  },

  saveNotifications(notifs: SmartNotification[]) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  loadChat(): ChatMessage[] {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (saved) {
      try { 
        const c = JSON.parse(saved);
        if (Array.isArray(c) && c.length > 0) {
          const raw = JSON.stringify(c).toLowerCase();
          const hasLegacy = ['alex', 'david', 'rahul', 'sam'].some(m => raw.includes(m));
          if (!hasLegacy) {
            const seen = new Set<string>();
            const unique = c.filter(item => {
              if (!item.id || seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
            return unique;
          }
          localStorage.removeItem(STORAGE_KEYS.CHAT);
        }
      } catch (e) {}
    }
    return INITIAL_CHAT_MESSAGES;
  },

  saveChat(chat: ChatMessage[]) {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chat));
  },

  loadRoadmap(): PersonalRoadmap {
    const saved = localStorage.getItem(STORAGE_KEYS.ROADMAP);
    if (saved !== null) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || Array.isArray(parsed.stages))) {
          const raw = JSON.stringify(parsed).toLowerCase();
          const hasLegacy = ['alex', 'rahul', 'david', 'rd-default-initial', 'mathematics examination', 'arithmetic foundations', 'improve mathematics for examination'].some(m => raw.includes(m));
          if (!hasLegacy && parsed.stages && parsed.stages.length > 0) {
            return recalculateRoadmap(parsed);
          }
          if (hasLegacy) {
            localStorage.removeItem(STORAGE_KEYS.ROADMAP);
          }
        }
      } catch (e) {}
    }
    return recalculateRoadmap({
      id: 'rd-clean-empty',
      goalId: '',
      title: '',
      category: 'General',
      targetGoal: '',
      deadline: '',
      currentStreak: 0,
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
      stages: []
    });
  },

  saveRoadmap(roadmap: PersonalRoadmap) {
    const updated = recalculateRoadmap(roadmap);
    localStorage.setItem(STORAGE_KEYS.ROADMAP, JSON.stringify(updated));
  },

  loadAttendance(): SubjectAttendanceRecord[] {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  },

  saveAttendance(records: SubjectAttendanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  loadResourceBank(): ResourceBankItem[] {
    const saved = localStorage.getItem(STORAGE_KEYS.RESOURCE_BANK);
    if (saved) {
      try {
        const rb = JSON.parse(saved);
        if (Array.isArray(rb)) {
          const filtered = rb.filter(item => {
            const raw = JSON.stringify(item).toLowerCase();
            return !['g-alex', 'alex', 'rahul', 'st-alex', 'increase cgpa from 7.4'].some(m => raw.includes(m));
          });
          return filtered;
        }
      } catch (e) {}
    }
    return [];
  },

  saveResourceBank(resources: ResourceBankItem[]) {
    localStorage.setItem(STORAGE_KEYS.RESOURCE_BANK, JSON.stringify(resources));
  },

  addResourceToBank(item: Omit<ResourceBankItem, 'id' | 'createdAt'>): ResourceBankItem {
    const newItem: ResourceBankItem = {
      ...item,
      id: 'rb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    const current = this.loadResourceBank();
    const updated = [newItem, ...current];
    this.saveResourceBank(updated);
    return newItem;
  },

  updateResourceInBank(id: string, updates: Partial<ResourceBankItem>) {
    const current = this.loadResourceBank();
    const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
    this.saveResourceBank(updated);
  },

  deleteResourceFromBank(id: string) {
    const current = this.loadResourceBank();
    const updated = current.filter(item => item.id !== id);
    this.saveResourceBank(updated);
  },

  resetApplicationData() {
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.ROADMAP);
    localStorage.removeItem(STORAGE_KEYS.GROUP);
    localStorage.removeItem(STORAGE_KEYS.RESOURCE_BANK);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    localStorage.removeItem(STORAGE_KEYS.FOCUS_SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.EXAM);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem('kairon_documents');
    localStorage.removeItem('kairon_assessments');
  },

  wipeAllAccountData() {
    localStorage.clear();
  },

  // Explicit seed function ONLY for development test mode
  seedDevTestData(): { profile: UserProfile; goals: Goal[]; tasks: Task[]; roadmap: PersonalRoadmap } {
    const preset = PERSONA_PRESETS.alex;
    this.saveProfile(preset.profile);
    this.saveGoals(preset.goals);
    this.saveTasks(preset.tasks);
    const rm = recalculateRoadmap(ALEX_ACADEMIC_ROADMAP);
    this.saveRoadmap(rm);
    this.saveResourceBank(INITIAL_RESOURCE_BANK);
    this.saveGroup(INITIAL_GROUP_WORKSPACE);
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    this.saveChat(INITIAL_CHAT_MESSAGES);
    return {
      profile: preset.profile,
      goals: preset.goals,
      tasks: preset.tasks,
      roadmap: rm
    };
  },

  switchPersona(personaKey: string) {
    const preset = PERSONA_PRESETS[personaKey] || PERSONA_PRESETS.alex;
    const currentProfile = this.loadProfile();
    const targetProfile: UserProfile = {
      ...preset.profile,
      id: currentProfile.id || preset.profile.id,
      name: currentProfile.name || 'Tanmayi'
    };
    storageService.saveProfile(targetProfile);
    storageService.saveGoals(preset.goals);
    storageService.saveTasks(preset.tasks);
    if (preset.subjects) storageService.saveSubjects(preset.subjects);
    if (preset.exam) storageService.saveExam(preset.exam);

    if (personaKey === 'rahul') {
      storageService.saveRoadmap(RAHUL_DEV_ROADMAP);
    } else {
      storageService.saveRoadmap(ALEX_ACADEMIC_ROADMAP);
    }
    storageService.saveAttendance(INITIAL_COLLEGE_ATTENDANCE);
    return {
      ...preset,
      profile: targetProfile
    };
  },

  resetAllData() {
    localStorage.clear();
  },

  clearAllData(cleanProfile?: Partial<UserProfile>) {
    this.resetApplicationData();
    const emptyProfile: UserProfile = {
      ...DEFAULT_CLEAN_PROFILE,
      id: cleanProfile?.id || DEFAULT_CLEAN_PROFILE.id,
      name: cleanProfile?.name || DEFAULT_CLEAN_PROFILE.name || 'Tanmayi',
      occupation: cleanProfile?.occupation || 'student',
      desiredIdentity: cleanProfile?.desiredIdentity || 'Disciplined achiever making steady daily progress'
    };
    const cleanRoadmap: PersonalRoadmap = recalculateRoadmap({
      id: 'rd-clean-' + Date.now(),
      goalId: '',
      title: 'My Custom Goal Roadmap',
      category: 'General',
      targetGoal: 'Define your first goal to create a roadmap',
      deadline: '2026-12-31',
      currentStreak: 0,
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
      stages: []
    });
    const cleanGroup: GroupWorkspace = {
      ...INITIAL_GROUP_WORKSPACE,
      id: 'grp-clean-' + Date.now(),
      name: 'Personal Focus Circle',
      type: 'single',
      members: [
        {
          id: emptyProfile.id,
          name: emptyProfile.name,
          avatar: '🎯',
          role: 'Focus Member',
          goalTitle: 'No Active Goal Yet',
          progressPercentage: 0,
          weeklyTasksCompleted: 0,
          weeklyTargetTasks: 10,
          hoursInvested: 0,
          currentStreak: 0,
          isOnline: true,
          isCurrentUser: true
        }
      ],
      activityFeed: []
    };
    this.saveProfile(emptyProfile);
    this.saveGoals([]);
    this.saveTasks([]);
    this.saveRoadmap(cleanRoadmap);
    this.saveGroup(cleanGroup);
    this.saveSubjects([]);
    this.saveNotifications([
      {
        id: 'notif-' + Date.now(),
        title: 'Clean Slate Activated',
        message: 'Your workspace has been completely cleared. Click "Create New Custom Goal Plan" to start fresh!',
        timestamp: 'Just now',
        type: 'daily_plan',
        read: false
      }
    ]);
    this.saveChat([]);
    this.saveResourceBank([]);
    return {
      profile: emptyProfile,
      goals: [] as Goal[],
      tasks: [] as Task[],
      roadmap: cleanRoadmap,
      group: cleanGroup,
      resourceBank: [] as ResourceBankItem[]
    };
  }
};
