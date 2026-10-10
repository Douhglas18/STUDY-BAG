export type Occupation = 'student' | 'developer' | 'fitness' | 'entrepreneur' | 'custom';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  ageRange?: string;
  occupation: Occupation;
  roleLabel: string;
  desiredIdentity: string;
  behaviorRules: string[];
  availableHoursPerDay: number;
  preferredHours: string;
  energyPeak: 'morning' | 'afternoon' | 'evening' | 'night';
  timezone: string;
  studentModeEnabled: boolean;
  privacy: {
    hideTaskDetailsFromSquad: boolean;
    shareMetricsWithSquad: boolean;
    allowAccountabilityPings: boolean;
  };
}

export type GoalCategory = 'Academics' | 'Career' | 'Health & Fitness' | 'Building & Startup' | 'Personal Growth';

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  deadline: string;
  timeframe?: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  completionPercentage: number;
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  currentMetric: string;
  targetMetric: string;
  deadline: string;
  why: string;
  completionPercentage: number;
  status: 'active' | 'completed' | 'paused';
  isPrivate: boolean;
  milestones: Milestone[];
  aiInsight?: string;
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Skipped' | 'Delayed' | 'Blocked';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskDifficulty = 'Easy' | 'Normal' | 'Hard' | 'Very Hard';

export interface Task {
  id: string;
  title: string;
  description?: string;
  goalId?: string;
  milestoneId?: string;
  subjectId?: string;
  priority: TaskPriority;
  deadline?: string;
  scheduledTime?: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  status: TaskStatus;
  difficulty?: TaskDifficulty;
  tags: string[];
  notes?: string;
  isPrivate?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly';
  completedAt?: string;
}

export type TopicStatus = 'Not Started' | 'Learning' | 'Practicing' | 'Revised' | 'Mastered';

export interface SyllabusTopic {
  id: string;
  title: string;
  status: TopicStatus;
  weight: 'high' | 'medium' | 'low';
  estimatedHours: number;
  lastRevised?: string;
}

export interface SubjectUnit {
  id: string;
  unitNumber: number;
  title: string;
  topics: SyllabusTopic[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  targetScore: string;
  currentScore?: string;
  examDate?: string;
  weight: number;
  units: SubjectUnit[];
}

export interface ExamPhase {
  id: string;
  phaseName: string;
  duration: string;
  focus: string;
  isBuffer?: boolean;
  status: 'completed' | 'current' | 'upcoming';
}

export interface Exam {
  id: string;
  name: string;
  date: string;
  daysRemaining: number;
  subjects: string[];
  phases: ExamPhase[];
}

export interface PartnerStageInfo {
  id: string;
  order: number;
  name: string;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  description?: string;
}

export interface PartnerTaskInfo {
  id: string;
  title: string;
  status: string;
  priority: string;
  difficulty?: string;
  completedAt?: string;
}

export interface PartnerPlanDetails {
  targetMetric?: string;
  deadline?: string;
  currentLevelName?: string;
  currentLevelOrder?: number;
  totalLevels?: number;
  stages?: PartnerStageInfo[];
  activeTasks?: PartnerTaskInfo[];
  recentAchievements?: string[];
  focusNotes?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email?: string;
  goalTitle: string;
  progressPercentage: number;
  weeklyTasksCompleted: number;
  weeklyTargetTasks: number;
  hoursInvested: number;
  currentStreak: number;
  isOnline?: boolean;
  isCurrentUser?: boolean;
  desiredIdentity?: string;
  partnerPlan?: PartnerPlanDetails;
}

export interface GroupActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  target: string;
  timestamp: string;
  reactions: {
    emoji: string;
    count: number;
    userReacted?: boolean;
  }[];
}

export interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  deadline: string;
  completed: boolean;
}

export interface GroupWorkspace {
  id: string;
  name: string;
  type: 'single' | 'duo' | 'trio' | 'squad';
  members: GroupMember[];
  activityFeed: GroupActivity[];
  challenges: GroupChallenge[];
  groupGoal: {
    title: string;
    current: number;
    target: number;
    unit: string;
  };
}

export interface PartnerRoom {
  roomId: string;
  creatorId: string;
  members: GroupMember[];
  activityFeed: GroupActivity[];
  groupGoal?: {
    title: string;
    target: number;
    current: number;
    unit: string;
  };
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  startedAt: string;
  durationMinutes: number;
  actualDurationSeconds: number;
  difficulty?: TaskDifficulty;
  soundType: 'none' | 'whitenoise' | 'rain' | 'cafe' | 'binaural';
  notes?: string;
}

export interface DailyCheckInRecord {
  id: string;
  date: string;
  status: 'completed_all' | 'partial' | 'distracted' | 'unexpected_event' | 'need_reschedule';
  reflection?: string;
  tasksCompleted: number;
  tasksMissed: number;
  aiCoachResponse?: string;
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'upcoming' | 'deadline' | 'missed' | 'daily_plan' | 'coach' | 'squad';
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionType?: 'start_focus' | 'view_plan' | 'open_coach' | 'squad_cheer';
  actionPayload?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sara' | 'kairon';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  routedTo?: 'planner' | 'tutor' | 'document' | 'web_search';
  sourceUsed?: string;
}

// NeetCode-Inspired Roadmap Core Types
export type RoadmapStageStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'current' | 'overdue' | 'skipped';

export interface LevelQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface LevelAssessment {
  id: string;
  title: string;
  passingScorePercent: number; // e.g. 75 or 80
  questions: LevelQuestion[];
  userScorePercent?: number;
  completedAt?: string;
  passed?: boolean;
}

export interface LevelLearningMaterial {
  overview: string;
  keyConcepts: { title: string; explanation: string; example?: string }[];
  formulasOrRules?: string[];
  commonMistakes?: string[];
  sourceReference?: string;
}

export type ResourceCategory = 
  | 'Documentation' 
  | 'Video & Lecture' 
  | 'Practice & Problems' 
  | 'Notes & Cheatsheet' 
  | 'Textbook & Paper' 
  | 'Tool & Platform';

export interface ResourceBankItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: ResourceCategory;
  associatedGoalId?: string;
  associatedGoalTitle?: string;
  associatedStageId?: string;
  associatedStageName?: string;
  tags: string[];
  createdAt: string;
  includeInAIPrompts: boolean;
}

export interface RoadmapResource {
  id?: string;
  title: string;
  url: string;
  type?: 'doc' | 'video' | 'practice' | 'notes' | 'book';
  description?: string;
}

export interface RoadmapReferenceLink {
  id?: string;
  title: string;
  url: string;
  note?: string;
}

export interface GroundedWebSource {
  title: string;
  uri: string;
}

export interface RoadmapTask {
  id: string;
  stageId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  actualMinutes?: number;
  deadline?: string;
  notes?: string;
  completedAt?: string;
  tags?: string[];
}

export interface RoadmapStage {
  id: string;
  roadmapId: string;
  name: string;
  shortDescription: string;
  order: number;
  status: RoadmapStageStatus;
  difficulty: TaskDifficulty;
  deadline?: string;
  estimatedHours: number;
  prerequisiteStageIds: string[];
  aiRecommendation: string;
  whyImportant: string;
  whatUnlocksNext: string;
  tasks: RoadmapTask[];
  category?: string;
  icon?: string;
  graphCol?: number; // 0 to 4 for visual DAG grid layout
  graphRow?: number; // 0 to 7 for visual DAG grid layout
  resources?: RoadmapResource[];
  stageNotes?: string;
  learningMaterial?: LevelLearningMaterial;
  assessment?: LevelAssessment;
}

export interface PersonalRoadmap {
  id: string;
  goalId: string;
  title: string;
  category: GoalCategory | string;
  targetGoal: string;
  deadline: string;
  currentStreak: number;
  stages: RoadmapStage[];
  aiInsight?: string;
  // User notes and reference links
  sourceNotes?: string;
  referenceLinks?: RoadmapReferenceLink[];
  groundedSources?: GroundedWebSource[];
  searchQueries?: string[];
  keyTopicsCovered?: string[];
  // Dynamic metrics:
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

// Document Intelligence Types
export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  keywords?: string[];
}

export interface UserDocument {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string; // 'pdf' | 'txt' | 'md'
  uploadedAt: string;
  summary?: string;
  topics?: string[];
  chunkCount: number;
  textSnippet?: string;
  chunks?: DocumentChunk[];
}

// Real Group Types (Max 4 Members: Solo, Duo, Trio, Squad)
export interface GroupMemberInfo {
  userId: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'member';
  currentGoalTitle?: string;
  currentLevelName?: string;
  progressPercentage: number;
  tasksCompletedToday: number;
  currentStreak: number;
  lastActive: string;
  isCurrentUser?: boolean;
}

export interface SharedGroup {
  id: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  type: 'single' | 'duo' | 'trio' | 'squad'; // strictly <= 4 members
  memberCount: number;
  members: Record<string, GroupMemberInfo>;
  createdAt: string;
  updatedAt: string;
}

// College Workflow Types
export interface SubjectAttendanceRecord {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attended: number;
  total: number;
  targetPercent: number; // usually 75% or 85%
  room?: string;
  professor?: string;
  nextClassTime?: string;
}

