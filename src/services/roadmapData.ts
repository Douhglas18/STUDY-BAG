import { PersonalRoadmap, RoadmapStage, RoadmapTask, SubjectAttendanceRecord } from '../types';

/**
 * Calculates deterministic, real-time progress for all stages and overall roadmap.
 * Adheres strictly to: progress = (completedTasks / totalTasks) * 100
 * Automatically evaluates stage lock/unlock states based on prerequisiteStageIds.
 */
export function recalculateRoadmap(roadmap: PersonalRoadmap): PersonalRoadmap {
  const stageMap = new Map<string, RoadmapStage>();
  roadmap.stages.forEach(s => stageMap.set(s.id, s));

  let totalTasksOverall = 0;
  let completedTasksOverall = 0;

  const updatedStages = roadmap.stages.map((stage) => {
    const total = stage.tasks.length;
    const completed = stage.tasks.filter(t => t.status === 'Completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalTasksOverall += total;
    completedTasksOverall += completed;

    // Check prerequisites
    const incompletePrereqs = (stage.prerequisiteStageIds || []).filter(prereqId => {
      const pStage = stageMap.get(prereqId);
      if (!pStage) return false;
      const pTotal = pStage.tasks.length;
      const pCompleted = pStage.tasks.filter(t => t.status === 'Completed').length;
      return pCompleted < pTotal || pTotal === 0;
    });

    let status = stage.status;
    if (incompletePrereqs.length > 0) {
      status = 'locked';
    } else if (completed === total && total > 0) {
      status = 'completed';
    } else if (stage.tasks.some(t => t.status === 'In Progress') || completed > 0) {
      status = 'in_progress';
    } else if (status === 'locked' && incompletePrereqs.length === 0) {
      status = 'available';
    } else if (!status || status === 'locked') {
      status = 'available';
    }

    // Calculate remaining estimated hours
    const remainingTasks = stage.tasks.filter(t => t.status !== 'Completed');
    const remainingMinutes = remainingTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
    const estimatedHours = Number((remainingMinutes / 60).toFixed(1));

    return {
      ...stage,
      status,
      estimatedHours,
      progress
    };
  });

  const overallProgress = totalTasksOverall > 0 
    ? Math.round((completedTasksOverall / totalTasksOverall) * 100) 
    : 0;

  return {
    ...roadmap,
    stages: updatedStages,
    totalTasks: totalTasksOverall,
    completedTasks: completedTasksOverall,
    progressPercentage: overallProgress
  };
}

/**
 * Finds the single highest-priority recommended next action from the roadmap.
 */
export function getRecommendedNextAction(roadmap: PersonalRoadmap) {
  // Find first unlocked stage that is in_progress or available
  const activeStage = roadmap.stages.find(s => s.status === 'in_progress') 
    || roadmap.stages.find(s => s.status === 'available')
    || roadmap.stages[0];

  if (!activeStage) return null;

  // Find task: first In Progress, then High priority, then first pending
  const pendingTasks = activeStage.tasks.filter(t => t.status !== 'Completed');
  const inProgressTask = pendingTasks.find(t => t.status === 'In Progress');
  const highPriorityTask = pendingTasks.find(t => t.priority === 'high');
  const targetTask = inProgressTask || highPriorityTask || pendingTasks[0];

  if (!targetTask) {
    // Stage complete! Find next unlocked stage
    const nextStage = roadmap.stages.find(s => s.status === 'available');
    if (nextStage && nextStage.tasks[0]) {
      return {
        task: nextStage.tasks[0],
        stage: nextStage,
        why: `Unlocks the new stage: "${nextStage.name}". You successfully finished the previous milestone!`,
        whatUnlocksNext: nextStage.whatUnlocksNext,
        isStageOpener: true
      };
    }
    return null;
  }

  // Reason why based on stage & dependencies
  let why = activeStage.aiRecommendation;
  if (!why) {
    why = `Crucial milestone in "${activeStage.name}". Completing this moves you toward unlocking: ${activeStage.whatUnlocksNext}`;
  }

  return {
    task: targetTask,
    stage: activeStage,
    why,
    whatUnlocksNext: activeStage.whatUnlocksNext,
    isStageOpener: false
  };
}

// Academic Examination Roadmap (Mid-Semester Exams & 9.0 CGPA)
export const ALEX_ACADEMIC_ROADMAP: PersonalRoadmap = recalculateRoadmap({
  id: 'rd-alex-academic',
  goalId: 'g-alex-1',
  title: 'Mid-Semester Exam Mastery & 9.0 CGPA',
  category: 'Academics',
  targetGoal: 'Increase CGPA to 9.0 • Score 90%+ in Mid-Terms',
  deadline: '2026-10-24',
  currentStreak: 6,
  totalTasks: 24,
  completedTasks: 16,
  progressPercentage: 67,
  aiInsight: 'Strong pace in Units 1 & 2. Unit 2 problem sets are the immediate prerequisite unlocking comprehensive revision.',
  sourceNotes: `Mid-Semester Syllabus Notes (4 Subjects):
1. Higher Engineering Mathematics:
   - Unit 1: Matrices, Eigenvalues & Eigenvectors, Cayley-Hamilton Theorem
   - Unit 2: Vector Calculus, Divergence & Curl, Green's & Stokes' Theorem
2. Data Structures & Algorithms:
   - Binary Search Trees, Balanced AVL Trees, Graph Representations
   - BFS & DFS traversals, Dijkstra's Shortest Path
3. Digital Logic & Microprocessors:
   - Karnaugh Maps, Combinational Circuits, Multiplexers
4. Object-Oriented Programming (Java/C++):
   - Polymorphism, Abstract classes, Exception Handling
Weak Spots: Stokes theorem numericals and graph adjacency list memory bounds. Target 90%+ in internal assessments.`,
  referenceLinks: [
    { id: 'link-alex-1', title: 'MIT OCW 18.06 Linear Algebra & Eigenvalues', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', note: 'Video lectures for diagonalizing matrices' },
    { id: 'link-alex-2', title: 'GeeksforGeeks Tree & Graph Traversal Guide', url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/', note: 'Standard algorithms & problem implementations' },
    { id: 'link-alex-3', title: 'NPTEL Discrete Mathematics & Proofs', url: 'https://nptel.ac.in/courses', note: 'Reference university exam past papers' }
  ],
  groundedSources: [
    { title: 'MIT OpenCourseWare: Linear Algebra & Matrix Theory', uri: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/' },
    { title: 'GeeksforGeeks: Graph Algorithms, Trees & Implementations', uri: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/' },
    { title: 'Khan Academy: Vector Calculus & Divergence Theorem', uri: 'https://www.khanacademy.org/math/multivariable-calculus' }
  ],
  keyTopicsCovered: ['Linear Algebra', 'Vector Calculus', 'Binary Search Trees', 'Graph Traversal', 'PYQ Practice', 'Timed Mock Exams'],
  stages: [
    {
      id: 'st-alex-1',
      roadmapId: 'rd-alex-academic',
      name: '1. Understand Academic Position',
      shortDescription: 'Audit previous semester grades, syllabus weightage, and current attendance baselines.',
      order: 1,
      status: 'completed',
      difficulty: 'Easy',
      deadline: '2026-09-18',
      estimatedHours: 0,
      prerequisiteStageIds: [],
      aiRecommendation: 'Baseline established: 7.4 GPA to 9.0 target requires A grades in Higher Math and DSA.',
      whyImportant: 'Prevents misallocating study hours to low-weight or already-mastered concepts.',
      whatUnlocksNext: 'Unlocks Pending Assignments & Lab work.',
      category: 'Diagnostic',
      icon: 'BarChart2',
      graphCol: 1,
      graphRow: 0,
      tasks: [
        {
          id: 't-alex-r1',
          stageId: 'st-alex-1',
          title: 'Catalog syllabus units and mark weightage across all 4 subjects',
          description: 'Identify top scoring units: Linear Algebra (25%), DSA Trees & Graphs (30%), Electromagnetics (25%).',
          status: 'Completed',
          priority: 'high',
          difficulty: 'Easy',
          estimatedMinutes: 40,
          actualMinutes: 35,
          completedAt: '2026-09-17T10:00:00Z'
        },
        {
          id: 't-alex-r2',
          stageId: 'st-alex-1',
          title: 'Audit college attendance registers to ensure 75%+ eligibility',
          description: 'Confirm safe buffer in Higher Math (88%) and flag Physics (75%) for zero skips.',
          status: 'Completed',
          priority: 'high',
          difficulty: 'Easy',
          estimatedMinutes: 25,
          actualMinutes: 20,
          completedAt: '2026-09-17T11:00:00Z'
        },
        {
          id: 't-alex-r3',
          stageId: 'st-alex-1',
          title: 'Set up error-log notebook for tracking recurring exam mistakes',
          description: 'Dedicated section for calculus algebraic traps and edge case algorithms.',
          status: 'Completed',
          priority: 'medium',
          difficulty: 'Easy',
          estimatedMinutes: 20,
          actualMinutes: 15,
          completedAt: '2026-09-18T09:00:00Z'
        }
      ]
    },
    {
      id: 'st-alex-2',
      roadmapId: 'rd-alex-academic',
      name: '2. Complete Pending Assignments',
      shortDescription: 'Clear overdue internal assignments and laboratory submissions for maximum internal marks.',
      order: 2,
      status: 'completed',
      difficulty: 'Normal',
      deadline: '2026-09-22',
      estimatedHours: 0,
      prerequisiteStageIds: ['st-alex-1'],
      aiRecommendation: 'All internal submissions cleared with top marks. Internal 25% component is secure.',
      whyImportant: 'Internal assessments account for 25% of total GPA score.',
      whatUnlocksNext: 'Unlocks Unit 1 Theory & Foundations.',
      category: 'Backlog Clearing',
      icon: 'CheckSquare',
      graphCol: 1,
      graphRow: 1,
      tasks: [
        {
          id: 't-alex-r4',
          stageId: 'st-alex-2',
          title: 'Submit Mathematics Unit 1 Multivariable Homework Set',
          description: 'Directional derivatives, tangent planes, and critical point classifications.',
          status: 'Completed',
          priority: 'high',
          difficulty: 'Normal',
          estimatedMinutes: 60,
          actualMinutes: 55,
          completedAt: '2026-09-20T14:00:00Z'
        },
        {
          id: 't-alex-r5',
          stageId: 'st-alex-2',
          title: 'Complete and submit Java / DSA Tree Traversal assignment',
          description: 'AVL tree rotations, BFS level order, and depth calculations.',
          status: 'Completed',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 75,
          actualMinutes: 70,
          completedAt: '2026-09-21T18:00:00Z'
        },
        {
          id: 't-alex-r6',
          stageId: 'st-alex-2',
          title: 'Physics Lab Report: Electromagnetic Induction Verification',
          description: 'Faraday coil galvanometer readings and error margin calculations.',
          status: 'Completed',
          priority: 'medium',
          difficulty: 'Normal',
          estimatedMinutes: 45,
          actualMinutes: 40,
          completedAt: '2026-09-22T16:00:00Z'
        }
      ]
    },
    {
      id: 'st-alex-3',
      roadmapId: 'rd-alex-academic',
      name: '3. Finish Unit 1 — Core Foundations',
      shortDescription: 'Master Linear Algebra, Binary Search Trees, and Electromagnetic Induction definitions.',
      order: 3,
      status: 'completed',
      difficulty: 'Normal',
      deadline: '2026-09-24',
      estimatedHours: 0,
      prerequisiteStageIds: ['st-alex-2'],
      aiRecommendation: 'Foundations 100% understood. Formulas documented on 1-page condensed recall sheet.',
      whyImportant: 'All mid-semester exam questions build directly upon these base theorem mechanisms.',
      whatUnlocksNext: 'Unlocks Unit 2 Advanced Problem Solving.',
      category: 'Foundations',
      icon: 'BookOpen',
      graphCol: 0,
      graphRow: 2,
      tasks: [
        {
          id: 't-alex-r7',
          stageId: 'st-alex-3',
          title: 'Linear Algebra: Eigenvalues & Diagonalization mastery',
          description: 'Master characteristic polynomial calculation and Cayley-Hamilton theorem proofs.',
          status: 'Completed',
          priority: 'high',
          difficulty: 'Normal',
          estimatedMinutes: 50,
          actualMinutes: 45,
          completedAt: '2026-09-23T10:00:00Z'
        },
        {
          id: 't-alex-r8',
          stageId: 'st-alex-3',
          title: 'DSA: Binary Search Tree insertions & recursive traversals',
          description: 'In-order, pre-order, and post-order call stack walkthroughs with time complexity proofs.',
          status: 'Completed',
          priority: 'high',
          difficulty: 'Normal',
          estimatedMinutes: 60,
          actualMinutes: 55,
          completedAt: '2026-09-24T12:00:00Z'
        },
        {
          id: 't-alex-r9',
          stageId: 'st-alex-3',
          title: "Physics: Faraday's and Lenz's Law active recall drill",
          description: 'Solve 6 numerical exercises with magnetic flux change equations.',
          status: 'Completed',
          priority: 'medium',
          difficulty: 'Normal',
          estimatedMinutes: 40,
          actualMinutes: 40,
          completedAt: '2026-09-24T17:00:00Z'
        }
      ]
    },
    {
      id: 'st-alex-4',
      roadmapId: 'rd-alex-academic',
      name: '4. Finish Unit 2 — Advanced Problem Solving',
      shortDescription: 'Tackle Multivariable Derivatives, Graph Algorithms (Dijkstra/BFS), and Maxwell equations.',
      order: 4,
      status: 'in_progress',
      difficulty: 'Hard',
      deadline: '2026-10-02',
      estimatedHours: 2.5,
      prerequisiteStageIds: ['st-alex-3'],
      aiRecommendation: 'This is your CURRENT ACTIVE BATTLEGROUND. Clearing these problem sets unlocks Stage 5 Revision.',
      whyImportant: 'Unit 2 holds the heaviest grade weight (40% of mid-semester total points).',
      whatUnlocksNext: 'Unlocks Comprehensive Revision & Formula Blitz.',
      category: 'Core Mastery',
      icon: 'Zap',
      graphCol: 2,
      graphRow: 2,
      tasks: [
        {
          id: 't-alex-r10',
          stageId: 'st-alex-4',
          title: 'Mathematics: Solve Unit 3 Multivariable Derivatives Problem Set',
          description: 'Gradient vectors, directional derivatives, and Lagrange multipliers questions 1-12.',
          status: 'In Progress',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 45,
          actualMinutes: 20,
          deadline: 'Today, 20:00',
          notes: 'Review chain rule edge cases before problem #8.'
        },
        {
          id: 't-alex-r11',
          stageId: 'st-alex-4',
          title: "DSA Graph Algorithms: Dijkstra & Shortest Path Drill",
          description: "Implement priority queue min-heap Dijkstra and solve 3 adjacency list problems.",
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 60,
          deadline: 'Tomorrow, 14:00'
        },
        {
          id: 't-alex-r12',
          stageId: 'st-alex-4',
          title: "Maxwell's Equations in Free Space derivations",
          description: 'Poynting vector energy flow equations and boundary conditions.',
          status: 'Not Started',
          priority: 'medium',
          difficulty: 'Normal',
          estimatedMinutes: 45,
          deadline: 'In 2 days'
        }
      ]
    },
    {
      id: 'st-alex-5',
      roadmapId: 'rd-alex-academic',
      name: '5. Revise Units 1 & 2 — Formula Blitz',
      shortDescription: 'Active spaced recall across all theory and formulas without consulting notes.',
      order: 5,
      status: 'locked',
      difficulty: 'Normal',
      deadline: '2026-10-08',
      estimatedHours: 3.5,
      prerequisiteStageIds: ['st-alex-4'],
      aiRecommendation: 'Locked until Unit 2 completed. Consolidates recall across all units before testing.',
      whyImportant: 'Halts the forgetting curve. Active self-testing doubles long-term test performance.',
      whatUnlocksNext: 'Unlocks Practice Previous Years Exam Papers (PYQs).',
      category: 'Active Recall',
      icon: 'RefreshCw',
      graphCol: 1,
      graphRow: 3,
      tasks: [
        {
          id: 't-alex-r13',
          stageId: 'st-alex-5',
          title: 'Blank-sheet recall: Recreate all Math & Physics formulas from memory',
          description: 'Eigenvalues, vector calculus operators, Maxwell equations without open notes.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 45
        },
        {
          id: 't-alex-r14',
          stageId: 'st-alex-5',
          title: 'DSA Code speed drills: Re-write BFS/DFS and AVL rotation from scratch',
          description: 'Target: clean compile with zero syntax lookups in under 20 minutes.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Normal',
          estimatedMinutes: 40
        },
        {
          id: 't-alex-r15',
          stageId: 'st-alex-5',
          title: 'Review error-log notebook from previous unit homework mistakes',
          description: 'Annotate why each error occurred and write down the preventative guardrail.',
          status: 'Not Started',
          priority: 'medium',
          difficulty: 'Easy',
          estimatedMinutes: 30
        }
      ]
    },
    {
      id: 'st-alex-6',
      roadmapId: 'rd-alex-academic',
      name: '6. Practice Previous Questions (PYQs)',
      shortDescription: 'Solve 5 years of actual university mid-semester questions under untimed conditions.',
      order: 6,
      status: 'locked',
      difficulty: 'Hard',
      deadline: '2026-10-15',
      estimatedHours: 5.0,
      prerequisiteStageIds: ['st-alex-5'],
      aiRecommendation: 'Locked until Revision complete. Teaches question pattern recognition and mark distribution.',
      whyImportant: '70% of exam question formats repeat with minor variations.',
      whatUnlocksNext: 'Unlocks Full Timed Mock Examinations.',
      category: 'Exam Practice',
      icon: 'FileText',
      graphCol: 1,
      graphRow: 4,
      tasks: [
        {
          id: 't-alex-r16',
          stageId: 'st-alex-6',
          title: 'Solve Fall 2024 & 2025 Mid-Semester Higher Mathematics exam papers',
          description: 'Self-grade with university marking key and record score percentage.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 90
        },
        {
          id: 't-alex-r17',
          stageId: 'st-alex-6',
          title: 'Solve 2023-2025 Data Structures algorithmic coding section papers',
          description: 'Tree and graph questions solved on paper exactly as required in examination hall.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Hard',
          estimatedMinutes: 90
        },
        {
          id: 't-alex-r18',
          stageId: 'st-alex-6',
          title: 'Solve Applied Physics numerical sections from 4 past papers',
          description: 'Focus strictly on numerical calculation speed and unit consistency.',
          status: 'Not Started',
          priority: 'medium',
          difficulty: 'Normal',
          estimatedMinutes: 60
        }
      ]
    },
    {
      id: 'st-alex-7',
      roadmapId: 'rd-alex-academic',
      name: '7. Full Timed Mock Examinations',
      shortDescription: 'Simulate full exam conditions with strict 3-hour timer, closed book, and no distractions.',
      order: 7,
      status: 'locked',
      difficulty: 'Very Hard',
      deadline: '2026-10-20',
      estimatedHours: 6.0,
      prerequisiteStageIds: ['st-alex-6'],
      aiRecommendation: 'Locked until PYQ practice done. Trains pacing and eliminates test anxiety.',
      whyImportant: 'Reveals time management bottlenecks under strict pressure.',
      whatUnlocksNext: 'Unlocks Final Buffer & Calm Readiness state.',
      category: 'Simulation',
      icon: 'Award',
      graphCol: 1,
      graphRow: 5,
      tasks: [
        {
          id: 't-alex-r19',
          stageId: 'st-alex-7',
          title: 'Simulated 3-hour Higher Math exam under strict clock',
          description: 'Zero phone, quiet room, closed book. Review mistakes immediately after.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Very Hard',
          estimatedMinutes: 180
        },
        {
          id: 't-alex-r20',
          stageId: 'st-alex-7',
          title: 'Simulated 3-hour Data Structures exam on paper',
          description: 'Simulate full writing stamina with neat diagrams and clean code blocks.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Very Hard',
          estimatedMinutes: 180
        },
        {
          id: 't-alex-r21',
          stageId: 'st-alex-7',
          title: 'Post-mock autopsy: log all question marks lost to careless mistakes',
          description: 'Identify if errors were conceptual, calculation speed, or question misinterpretation.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Normal',
          estimatedMinutes: 45
        }
      ]
    },
    {
      id: 'st-alex-8',
      roadmapId: 'rd-alex-academic',
      name: '8. Buffer Days & Exam Ready State',
      shortDescription: 'Protected zero-cramming buffer. Light formula revision, sleep, and peak cognitive state.',
      order: 8,
      status: 'locked',
      difficulty: 'Easy',
      deadline: '2026-10-23',
      estimatedHours: 2.0,
      prerequisiteStageIds: ['st-alex-7'],
      aiRecommendation: 'Rest and mental composure produce a 15% higher score than sleep-deprived cramming.',
      whyImportant: 'Guarantees mental clarity, sharp memory retrieval, and peak exam performance.',
      whatUnlocksNext: 'Final examinations cleared with 9.0+ CGPA achieved!',
      category: 'Exam Readiness',
      icon: 'ShieldCheck',
      graphCol: 1,
      graphRow: 6,
      tasks: [
        {
          id: 't-alex-r22',
          stageId: 'st-alex-8',
          title: 'Light 30-min morning formula review using 1-page condensed cheatsheet',
          description: 'Calm glance over key identities while staying completely relaxed.',
          status: 'Not Started',
          priority: 'medium',
          difficulty: 'Easy',
          estimatedMinutes: 30
        },
        {
          id: 't-alex-r23',
          stageId: 'st-alex-8',
          title: 'Physical preparation: hall ticket, pens, scientific calculator, watch',
          description: 'Eliminate exam morning friction by packing everything 24 hours in advance.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Easy',
          estimatedMinutes: 20
        },
        {
          id: 't-alex-r24',
          stageId: 'st-alex-8',
          title: 'Protected 8 hours sleep and hydration prior to exam morning',
          description: 'No screens past 22:00. Enter the examination hall refreshed and confident.',
          status: 'Not Started',
          priority: 'high',
          difficulty: 'Easy',
          estimatedMinutes: 10
        }
      ]
    }
  ]
});

// Software Engineering & DSA Roadmap (Full 18-Node NeetCode 150 layout)
export const RAHUL_DEV_ROADMAP: PersonalRoadmap = recalculateRoadmap({
  id: 'rd-rahul-dsa',
  goalId: 'g-rahul-1',
  title: 'NeetCode 150 & Tech Interview Readiness',
  category: 'Career',
  targetGoal: 'Crack Tier-1 Product Company SWE Role (₹25LPA+ / $150K)',
  deadline: '2026-12-15',
  currentStreak: 18,
  totalTasks: 42,
  completedTasks: 18,
  progressPercentage: 43,
  aiInsight: 'Arrays & Two Pointers mastered. Trees and Graph algorithms are the next prerequisite for Dynamic Programming.',
  sourceNotes: `NeetCode 150 Coding Interview Preparation:
- Target: Google, Uber, Atlassian, Razorpay SWE roles
- Core Patterns:
  * Two Pointers: Left/Right boundaries, sorted arrays, shrink window
  * Sliding Window: Min window substring, longest non-repeating
  * Binary Search: Search in rotated sorted array, find min
  * Trees: Invert binary tree, max depth, lowest common ancestor
  * Graphs: DFS cycle detection, BFS level-order, Dijkstra
  * Dynamic Programming: 0/1 Knapsack, Coin Change, Longest Common Subsequence
Time Budget: 2.5 hours every morning before work/college. Solve 3 problems daily with 25-minute timer under zero distraction.`,
  referenceLinks: [
    { id: 'link-r-1', title: 'NeetCode.io Interactive Roadmap', url: 'https://neetcode.io/roadmap', note: 'Visual graph & step-by-step problem tiering' },
    { id: 'link-r-2', title: 'LeetCode 150 Curated Problem List', url: 'https://leetcode.com/problem-list/top-interview-questions/', note: 'Benchmark company questions' },
    { id: 'link-r-3', title: 'Tech Interview Handbook (Yangshun Tay)', url: 'https://www.techinterviewhandbook.org/', note: 'Algorithm cheat sheet & complexity analysis' }
  ],
  groundedSources: [
    { title: 'NeetCode.io: Algorithms & Data Structures Roadmap', uri: 'https://neetcode.io/roadmap' },
    { title: 'LeetCode: Top Interview Questions & Curated 150', uri: 'https://leetcode.com/problemset/' },
    { title: 'Tech Interview Handbook: Curated Coding Study Guide', uri: 'https://www.techinterviewhandbook.org/coding-interview-study-plan/' }
  ],
  keyTopicsCovered: ['Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Trees', 'Graphs', 'Dynamic Programming'],
  stages: [
    {
      id: 'st-r-arrays',
      roadmapId: 'rd-rahul-dsa',
      name: 'Arrays & Hashing',
      shortDescription: 'Contains Duplicate, Valid Anagram, Two Sum, Group Anagrams, Top K Frequent.',
      order: 1,
      status: 'completed',
      difficulty: 'Easy',
      estimatedHours: 0,
      prerequisiteStageIds: [],
      aiRecommendation: 'Mastered with O(n) hash map lookups.',
      whyImportant: 'The cornerstone of array transformations and frequency counting.',
      whatUnlocksNext: 'Unlocks Two Pointers and Stack.',
      graphRow: 0,
      graphCol: 2.5,
      tasks: [
        { id: 'tr-1', stageId: 'st-r-arrays', title: 'Contains Duplicate (HashSet O(n))', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-2', stageId: 'st-r-arrays', title: 'Valid Anagram (Frequency count / sorting)', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 25 },
        { id: 'tr-3', stageId: 'st-r-arrays', title: 'Two Sum (One-pass HashMap)', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 25 },
        { id: 'tr-4', stageId: 'st-r-arrays', title: 'Group Anagrams (Prime hash or sorted tuple key)', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-5', stageId: 'st-r-arrays', title: 'Top K Frequent Elements (Bucket sort / Min-Heap)', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 }
      ]
    },
    {
      id: 'st-r-twopointers',
      roadmapId: 'rd-rahul-dsa',
      name: 'Two Pointers',
      shortDescription: 'Valid Palindrome, Two Sum II, 3Sum, Container With Most Water, Trapping Rain Water.',
      order: 2,
      status: 'completed',
      difficulty: 'Normal',
      estimatedHours: 0,
      prerequisiteStageIds: ['st-r-arrays'],
      aiRecommendation: 'Opposite-end and fast-slow pointer mechanics mastered.',
      whyImportant: 'Reduces O(n^2) nested loops to clean O(n) linear scans on sorted arrays.',
      whatUnlocksNext: 'Unlocks Binary Search, Sliding Window, and Linked List.',
      graphRow: 1,
      graphCol: 1.8,
      tasks: [
        { id: 'tr-6', stageId: 'st-r-twopointers', title: 'Valid Palindrome (Alphanumeric scan)', status: 'Completed', priority: 'medium', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-7', stageId: 'st-r-twopointers', title: 'Two Sum II - Input Array Is Sorted', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 30 },
        { id: 'tr-8', stageId: 'st-r-twopointers', title: '3Sum (Sorted array with zero duplicate skips)', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-9', stageId: 'st-r-twopointers', title: 'Container With Most Water (Greedy area squeeze)', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 }
      ]
    },
    {
      id: 'st-r-stack',
      roadmapId: 'rd-rahul-dsa',
      name: 'Stack',
      shortDescription: 'Valid Parentheses, Min Stack, Daily Temperatures, Largest Rectangle in Histogram.',
      order: 3,
      status: 'completed',
      difficulty: 'Normal',
      estimatedHours: 0,
      prerequisiteStageIds: ['st-r-arrays'],
      aiRecommendation: 'Monotonic stack patterns consolidated.',
      whyImportant: 'LIFO tracking for nested delimiters and previous greater/smaller elements.',
      whatUnlocksNext: 'Supports expression parsing and tree depth traversals.',
      graphRow: 1,
      graphCol: 3.2,
      tasks: [
        { id: 'tr-10', stageId: 'st-r-stack', title: 'Valid Parentheses (Stack matching)', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-11', stageId: 'st-r-stack', title: 'Min Stack (O(1) retrieval with dual values)', status: 'Completed', priority: 'medium', difficulty: 'Normal', estimatedMinutes: 35 },
        { id: 'tr-12', stageId: 'st-r-stack', title: 'Daily Temperatures (Monotonic decreasing stack)', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 }
      ]
    },
    {
      id: 'st-r-binarysearch',
      roadmapId: 'rd-rahul-dsa',
      name: 'Binary Search',
      shortDescription: 'Binary Search, Search a 2D Matrix, Koko Eating Bananas, Find Minimum in Rotated Sorted Array.',
      order: 4,
      status: 'completed',
      difficulty: 'Normal',
      estimatedHours: 0,
      prerequisiteStageIds: ['st-r-twopointers'],
      aiRecommendation: 'O(log n) boundary conditions and midpoint invariants mastered.',
      whyImportant: 'Search space reduction is essential for monotonic predicate functions.',
      whatUnlocksNext: 'Converges into Trees.',
      graphRow: 2,
      graphCol: 0.8,
      tasks: [
        { id: 'tr-13', stageId: 'st-r-binarysearch', title: 'Binary Search (Standard left/right bounds)', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-14', stageId: 'st-r-binarysearch', title: 'Search a 2D Matrix (Flattened coordinate mapping)', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 35 },
        { id: 'tr-15', stageId: 'st-r-binarysearch', title: 'Koko Eating Bananas (Binary search on speed answer range)', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 }
      ]
    },
    {
      id: 'st-r-slidingwindow',
      roadmapId: 'rd-rahul-dsa',
      name: 'Sliding Window',
      shortDescription: 'Best Time to Buy & Sell Stock, Longest Substring Without Repeating, Minimum Window Substring.',
      order: 5,
      status: 'completed',
      difficulty: 'Normal',
      estimatedHours: 0,
      prerequisiteStageIds: ['st-r-twopointers'],
      aiRecommendation: 'Dynamic window expansion and contraction patterns mastered.',
      whyImportant: 'Contiguous subarray optimizations with frequency tables.',
      whatUnlocksNext: 'Converges into Trees.',
      graphRow: 2,
      graphCol: 2.0,
      tasks: [
        { id: 'tr-16', stageId: 'st-r-slidingwindow', title: 'Best Time to Buy & Sell Stock (Kadane variant)', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-17', stageId: 'st-r-slidingwindow', title: 'Longest Substring Without Repeating Characters', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-18', stageId: 'st-r-slidingwindow', title: 'Longest Repeating Character Replacement', status: 'Completed', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 }
      ]
    },
    {
      id: 'st-r-linkedlist',
      roadmapId: 'rd-rahul-dsa',
      name: 'Linked List',
      shortDescription: 'Reverse Linked List, Merge Two Sorted Lists, Reorder List, Remove Nth Node From End, LRU Cache.',
      order: 6,
      status: 'completed',
      difficulty: 'Normal',
      estimatedHours: 0,
      prerequisiteStageIds: ['st-r-twopointers'],
      aiRecommendation: 'Pointer manipulation and sentinel dummy nodes mastered.',
      whyImportant: 'Tests manual pointer references, cycle detection, and memory models.',
      whatUnlocksNext: 'Converges into Trees.',
      graphRow: 2,
      graphCol: 3.5,
      tasks: [
        { id: 'tr-19', stageId: 'st-r-linkedlist', title: 'Reverse Linked List (Iterative & recursive)', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-20', stageId: 'st-r-linkedlist', title: 'Merge Two Sorted Lists', status: 'Completed', priority: 'high', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-21', stageId: 'st-r-linkedlist', title: 'LRU Cache (Doubly linked list + HashMap)', status: 'Completed', priority: 'high', difficulty: 'Hard', estimatedMinutes: 60 }
      ]
    },
    {
      id: 'st-r-trees',
      roadmapId: 'rd-rahul-dsa',
      name: 'Trees',
      shortDescription: 'Invert Binary Tree, Maximum Depth, Lowest Common Ancestor, Binary Tree Level Order, Validate BST.',
      order: 7,
      status: 'in_progress',
      difficulty: 'Hard',
      estimatedHours: 2.5,
      prerequisiteStageIds: ['st-r-binarysearch', 'st-r-slidingwindow', 'st-r-linkedlist'],
      aiRecommendation: 'The central hub of all recursive algorithms. Currently solving Lowest Common Ancestor.',
      whyImportant: 'Hierarchical tree traversals (BFS/DFS) appear in 90% of interview rounds.',
      whatUnlocksNext: 'Unlocks Tries, Heap / Priority Queue, and Backtracking.',
      graphRow: 3,
      graphCol: 2.0,
      tasks: [
        { id: 'tr-22', stageId: 'st-r-trees', title: 'Invert Binary Tree & Max Depth', status: 'Completed', priority: 'medium', difficulty: 'Easy', estimatedMinutes: 25 },
        { id: 'tr-23', stageId: 'st-r-trees', title: 'Lowest Common Ancestor of a BST', status: 'In Progress', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-24', stageId: 'st-r-trees', title: 'Binary Tree Level Order Traversal (BFS Queue)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-25', stageId: 'st-r-trees', title: 'Validate Binary Search Tree (In-order invariant)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 }
      ]
    },
    {
      id: 'st-r-tries',
      roadmapId: 'rd-rahul-dsa',
      name: 'Tries',
      shortDescription: 'Implement Trie (Prefix Tree), Design Add & Search Words Data Structure, Word Search II.',
      order: 8,
      status: 'locked',
      difficulty: 'Normal',
      estimatedHours: 3.0,
      prerequisiteStageIds: ['st-r-trees'],
      aiRecommendation: 'Complete Trees mastery before diving into n-ary prefix trees.',
      whyImportant: 'Essential for prefix autocomplete, spell checking, and dictionary searches.',
      whatUnlocksNext: 'Supports advanced search string algorithms.',
      graphRow: 4,
      graphCol: 0.9,
      tasks: [
        { id: 'tr-26', stageId: 'st-r-tries', title: 'Implement Trie Prefix Tree (Insert, Search, StartsWith)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-27', stageId: 'st-r-tries', title: 'Design Add and Search Words Data Structure', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 50 }
      ]
    },
    {
      id: 'st-r-heap',
      roadmapId: 'rd-rahul-dsa',
      name: 'Heap / Priority Queue',
      shortDescription: 'Kth Largest Element in a Stream, Last Stone Weight, Task Scheduler, Find Median from Data Stream.',
      order: 9,
      status: 'locked',
      difficulty: 'Hard',
      estimatedHours: 4.0,
      prerequisiteStageIds: ['st-r-trees'],
      aiRecommendation: 'Active recommended pathway node. Unlocks Intervals, Greedy, and Advanced Graphs.',
      whyImportant: 'Streaming extremes, priority scheduling, and two-heap median partitions.',
      whatUnlocksNext: 'Unlocks Intervals, Greedy, and Advanced Graphs.',
      graphRow: 4,
      graphCol: 1.8,
      tasks: [
        { id: 'tr-28', stageId: 'st-r-heap', title: 'Kth Largest Element in an Array (QuickSelect / Min-Heap)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-29', stageId: 'st-r-heap', title: 'Task Scheduler (Greedy cooling frequency map + Max-Heap)', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 50 },
        { id: 'tr-30', stageId: 'st-r-heap', title: 'Find Median from Data Stream (Max-heap + Min-heap balance)', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 60 }
      ]
    },
    {
      id: 'st-r-backtracking',
      roadmapId: 'rd-rahul-dsa',
      name: 'Backtracking',
      shortDescription: 'Subsets, Combination Sum, Permutations, Word Search, N-Queens.',
      order: 10,
      status: 'locked',
      difficulty: 'Hard',
      estimatedHours: 4.5,
      prerequisiteStageIds: ['st-r-trees'],
      aiRecommendation: 'Decision tree generation with choice state rollback.',
      whyImportant: 'Foundational mental model for Graphs and Dynamic Programming recursion.',
      whatUnlocksNext: 'Unlocks Graphs and 1-D Dynamic Programming.',
      graphRow: 4,
      graphCol: 3.2,
      tasks: [
        { id: 'tr-31', stageId: 'st-r-backtracking', title: 'Subsets & Combination Sum', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-32', stageId: 'st-r-backtracking', title: 'Permutations (State visited tracking)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-33', stageId: 'st-r-backtracking', title: 'Word Search (Grid DFS with rollback)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 50 }
      ]
    },
    {
      id: 'st-r-intervals',
      roadmapId: 'rd-rahul-dsa',
      name: 'Intervals',
      shortDescription: 'Insert Interval, Merge Intervals, Non-overlapping Intervals, Meeting Rooms II.',
      order: 11,
      status: 'locked',
      difficulty: 'Normal',
      estimatedHours: 3.0,
      prerequisiteStageIds: ['st-r-heap'],
      aiRecommendation: 'Sorting by start/end times and overlap merging.',
      whyImportant: 'Calendar scheduling, bandwidth reservation, and collision detection.',
      whatUnlocksNext: 'Completes linear interval mastery.',
      graphRow: 5,
      graphCol: 0.2,
      tasks: [
        { id: 'tr-34', stageId: 'st-r-intervals', title: 'Insert Interval & Merge Intervals', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-35', stageId: 'st-r-intervals', title: 'Non-overlapping Intervals & Meeting Rooms II', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 50 }
      ]
    },
    {
      id: 'st-r-greedy',
      roadmapId: 'rd-rahul-dsa',
      name: 'Greedy',
      shortDescription: 'Maximum Subarray, Jump Game, Gas Station, Hand of Straights.',
      order: 12,
      status: 'locked',
      difficulty: 'Hard',
      estimatedHours: 3.5,
      prerequisiteStageIds: ['st-r-heap'],
      aiRecommendation: 'Locally optimal choice proofs.',
      whyImportant: 'Fast O(n) solutions where greedy choice property holds.',
      whatUnlocksNext: 'Supports dynamic programming heuristics.',
      graphRow: 5,
      graphCol: 1.2,
      tasks: [
        { id: 'tr-36', stageId: 'st-r-greedy', title: 'Jump Game I & II (Farthest reachable index)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-37', stageId: 'st-r-greedy', title: 'Gas Station (Circular deficit accumulator)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 }
      ]
    },
    {
      id: 'st-r-advgraphs',
      roadmapId: 'rd-rahul-dsa',
      name: 'Advanced Graphs',
      shortDescription: 'Reconstruct Itinerary, Min Cost to Connect All Points (Prim/Kruskal), Network Delay Time (Dijkstra).',
      order: 13,
      status: 'locked',
      difficulty: 'Very Hard',
      estimatedHours: 5.0,
      prerequisiteStageIds: ['st-r-heap', 'st-r-graphs'],
      aiRecommendation: 'Shortest path algorithms and Minimum Spanning Trees.',
      whyImportant: 'Network routing, graph weighted optimization, and topological flows.',
      whatUnlocksNext: 'Completes graph theory mastery.',
      graphRow: 5,
      graphCol: 2.1,
      tasks: [
        { id: 'tr-38', stageId: 'st-r-advgraphs', title: 'Network Delay Time (Dijkstra Priority Queue)', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 60 },
        { id: 'tr-39', stageId: 'st-r-advgraphs', title: 'Min Cost to Connect Points (Prim / Kruskal Union-Find)', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 60 }
      ]
    },
    {
      id: 'st-r-graphs',
      roadmapId: 'rd-rahul-dsa',
      name: 'Graphs',
      shortDescription: 'Number of Islands, Clone Graph, Pacific Atlantic Water Flow, Course Schedule, Rotting Oranges.',
      order: 14,
      status: 'locked',
      difficulty: 'Hard',
      estimatedHours: 5.0,
      prerequisiteStageIds: ['st-r-backtracking'],
      aiRecommendation: 'BFS grid flood-fill, cycle detection in directed graphs, and topological sort.',
      whyImportant: 'One of the most heavily tested domains in top tech software engineering interviews.',
      whatUnlocksNext: 'Unlocks Advanced Graphs and 2-D Dynamic Programming.',
      graphRow: 5,
      graphCol: 2.9,
      tasks: [
        { id: 'tr-40', stageId: 'st-r-graphs', title: 'Number of Islands & Clone Graph', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-41', stageId: 'st-r-graphs', title: 'Course Schedule I & II (Topological Sort)', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 60 },
        { id: 'tr-42', stageId: 'st-r-graphs', title: 'Rotting Oranges (Multi-source BFS)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 }
      ]
    },
    {
      id: 'st-r-1ddp',
      roadmapId: 'rd-rahul-dsa',
      name: '1-D Dynamic Programming',
      shortDescription: 'Climbing Stairs, House Robber, Coin Change, Longest Increasing Subsequence, Word Break.',
      order: 15,
      status: 'locked',
      difficulty: 'Hard',
      estimatedHours: 5.5,
      prerequisiteStageIds: ['st-r-backtracking'],
      aiRecommendation: 'Subproblem optimal structure with memoization arrays.',
      whyImportant: 'The classic interview differentiator. Turns exponential recursion into polynomial runtime.',
      whatUnlocksNext: 'Unlocks 2-D Dynamic Programming and Bit Manipulation.',
      graphRow: 5,
      graphCol: 4.0,
      tasks: [
        { id: 'tr-43', stageId: 'st-r-1ddp', title: 'Climbing Stairs & House Robber (1D recurrence)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-44', stageId: 'st-r-1ddp', title: 'Coin Change (Unbounded Knapsack memoization)', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 60 },
        { id: 'tr-45', stageId: 'st-r-1ddp', title: 'Longest Increasing Subsequence (Patience sorting O(n log n))', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 60 }
      ]
    },
    {
      id: 'st-r-2ddp',
      roadmapId: 'rd-rahul-dsa',
      name: '2-D Dynamic Programming',
      shortDescription: 'Unique Paths, Longest Common Subsequence, Best Time with Cooldown, Edit Distance, Burst Balloons.',
      order: 16,
      status: 'locked',
      difficulty: 'Very Hard',
      estimatedHours: 6.0,
      prerequisiteStageIds: ['st-r-1ddp', 'st-r-graphs'],
      aiRecommendation: 'Grid transitions, string alignment matching, and state machine DP.',
      whyImportant: 'Advanced bar raiser question for Google, Meta, and high-frequency trading firms.',
      whatUnlocksNext: 'Converges into Math & Geometry.',
      graphRow: 6,
      graphCol: 3.5,
      tasks: [
        { id: 'tr-46', stageId: 'st-r-2ddp', title: 'Unique Paths (2D grid combinatorics & DP)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-47', stageId: 'st-r-2ddp', title: 'Longest Common Subsequence (2D string matching)', status: 'Not Started', priority: 'high', difficulty: 'Hard', estimatedMinutes: 55 },
        { id: 'tr-48', stageId: 'st-r-2ddp', title: 'Edit Distance (Insert, Delete, Replace costs)', status: 'Not Started', priority: 'high', difficulty: 'Very Hard', estimatedMinutes: 70 }
      ]
    },
    {
      id: 'st-r-bitmanip',
      roadmapId: 'rd-rahul-dsa',
      name: 'Bit Manipulation',
      shortDescription: 'Single Number, Number of 1 Bits, Counting Bits, Reverse Bits, Missing Number.',
      order: 17,
      status: 'locked',
      difficulty: 'Normal',
      estimatedHours: 3.0,
      prerequisiteStageIds: ['st-r-1ddp'],
      aiRecommendation: 'Bitwise XOR, AND masks, shift operators, and Brian Kernighan trick.',
      whyImportant: 'Fast O(1) space tricks and low-level computer arithmetic.',
      whatUnlocksNext: 'Converges into Math & Geometry.',
      graphRow: 6,
      graphCol: 4.6,
      tasks: [
        { id: 'tr-49', stageId: 'st-r-bitmanip', title: 'Single Number (XOR cancellation trick)', status: 'Not Started', priority: 'high', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-50', stageId: 'st-r-bitmanip', title: 'Number of 1 Bits (Brian Kernighan n & (n - 1))', status: 'Not Started', priority: 'medium', difficulty: 'Easy', estimatedMinutes: 20 },
        { id: 'tr-51', stageId: 'st-r-bitmanip', title: 'Counting Bits (Dynamic programming + bit offset)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 35 }
      ]
    },
    {
      id: 'st-r-math',
      roadmapId: 'rd-rahul-dsa',
      name: 'Math & Geometry',
      shortDescription: 'Rotate Image, Spiral Matrix, Set Matrix Zeroes, Happy Number, Pow(x, n), Detect Squares.',
      order: 18,
      status: 'locked',
      difficulty: 'Hard',
      estimatedHours: 4.0,
      prerequisiteStageIds: ['st-r-2ddp', 'st-r-bitmanip'],
      aiRecommendation: 'Matrix transpositions, Euclidean geometry, modular exponentiation.',
      whyImportant: 'Coordinates, rotation symmetry, and mathematical edge case rigor.',
      whatUnlocksNext: 'NeetCode 150 Full Mastery Complete!',
      graphRow: 7,
      graphCol: 4.2,
      tasks: [
        { id: 'tr-52', stageId: 'st-r-math', title: 'Rotate Image 90 Degrees In-Place (Transpose + Reverse)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 },
        { id: 'tr-53', stageId: 'st-r-math', title: 'Spiral Matrix (Boundary tracking loops)', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 45 },
        { id: 'tr-54', stageId: 'st-r-math', title: 'Pow(x, n) (Binary exponentiation O(log n))', status: 'Not Started', priority: 'high', difficulty: 'Normal', estimatedMinutes: 40 }
      ]
    }
  ]
});

// Initial Subject Attendance Records for College Workflow
export const INITIAL_COLLEGE_ATTENDANCE: SubjectAttendanceRecord[] = [
  {
    subjectId: 'sub-math',
    subjectName: 'Higher Mathematics III',
    subjectCode: 'MATH-301',
    attended: 22,
    total: 25,
    targetPercent: 75,
    room: 'Hall B-204',
    professor: 'Dr. Evelyn Vance',
    nextClassTime: 'Tomorrow, 09:00 AM'
  },
  {
    subjectId: 'sub-dsa',
    subjectName: 'Data Structures & Algorithms',
    subjectCode: 'CS-202',
    attended: 26,
    total: 28,
    targetPercent: 80,
    room: 'Lab CS-3',
    professor: 'Prof. Marcus Chen',
    nextClassTime: 'Today, 01:00 PM'
  },
  {
    subjectId: 'sub-phys',
    subjectName: 'Applied Physics & Electromagnetics',
    subjectCode: 'PHYS-201',
    attended: 18,
    total: 24,
    targetPercent: 75,
    room: 'Physics Lab 1',
    professor: 'Dr. Sarah Al-Mansoor',
    nextClassTime: 'Thursday, 10:30 AM'
  },
  {
    subjectId: 'sub-arch',
    subjectName: 'Computer Architecture & Systems',
    subjectCode: 'CS-204',
    attended: 19,
    total: 22,
    targetPercent: 75,
    room: 'Hall A-102',
    professor: 'Prof. David Kumar',
    nextClassTime: 'Friday, 11:00 AM'
  }
];
