import React, { useState, useEffect } from 'react';
import { 
  UserProfile, Goal, Task, Subject, Exam, GroupWorkspace, GroupMember,
  SmartNotification, ChatMessage, TaskDifficulty, TaskStatus, DailyCheckInRecord,
  PersonalRoadmap, SubjectAttendanceRecord, ResourceBankItem,
  SubjectUnit, SyllabusTopic
} from './types';
import { storageService, PERSONA_PRESETS, DEMO_FOCUS_PARTNER, DEFAULT_FOCUS_PARTNER } from './services/storage';
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  switchGoogleAccount,
  syncUserProfile, 
  updateUserProfileInFirestore, 
  saveGoalToFirestore, 
  saveTaskToFirestore, 
  deleteTaskFromFirestore, 
  deleteGoalFromFirestore,
  saveResourceToFirestore, 
  deleteResourceFromFirestore, 
  loadGoalsFromFirestore, 
  loadTasksFromFirestore, 
  loadResourcesFromFirestore,
  loadRoadmapFromFirestore,
  saveRoadmapToFirestore,
  wipeAllUserFirestoreData 
} from './services/firebase';
import { 
  joinOrCreatePartnerRoom, 
  subscribeToPartnerRoom, 
  pushMemberStatusUpdate, 
  sendPartnerAccountabilityPing, 
  leavePartnerRoom, 
  getStoredRoomId, 
  setStoredRoomId,
  clearStoredRoomId,
  generateDuoRoomCode,
  getUserPersonalRoomCode,
  ensureUserPersonalRoom
} from './services/partnerService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { WhatShouldIDoNowModal } from './components/WhatShouldIDoNowModal';
import { FocusModeModal } from './components/FocusModeModal';
import { DailyCheckinModal } from './components/DailyCheckinModal';
import { AdaptPlanModal } from './components/AdaptPlanModal';
import { PlanImproverModal } from './components/PlanImproverModal';
import { NewTaskModal } from './components/NewTaskModal';
import { OnboardingModal } from './components/OnboardingModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { GoalWizardModal } from './components/GoalWizardModal';
import { PartnerPlanModal } from './components/PartnerPlanModal';

// Screens
import { HomeScreen } from './screens/HomeScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ResourceBankScreen } from './screens/ResourceBankScreen';
import { TasksScreen } from './screens/TasksScreen';
import { AICoachScreen } from './screens/AICoachScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Core App State
  const [profile, setProfile] = useState<UserProfile>(() => storageService.loadProfile());
  const [goals, setGoals] = useState<Goal[]>(() => storageService.loadGoals());
  const [roadmap, setRoadmap] = useState<PersonalRoadmap>(() => storageService.loadRoadmap());
  const [attendanceRecords, setAttendanceRecords] = useState<SubjectAttendanceRecord[]>(() => storageService.loadAttendance());
  const [tasks, setTasks] = useState<Task[]>(() => storageService.loadTasks());
  const [subjects, setSubjects] = useState<Subject[]>(() => storageService.loadSubjects());
  const [exam, setExam] = useState<Exam | null>(() => storageService.loadExam());
  const [group, setGroup] = useState<GroupWorkspace>(() => storageService.loadGroup());
  const [notifications, setNotifications] = useState<SmartNotification[]>(() => storageService.loadNotifications());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => storageService.loadChat());
  const [resourceBank, setResourceBank] = useState<ResourceBankItem[]>(() => storageService.loadResourceBank());

  // Firebase User & Sync State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [whatNowOpen, setWhatNowOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [focusDuration, setFocusDuration] = useState(35);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [planImproverOpen, setPlanImproverOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [goalWizardOpen, setGoalWizardOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  const [initialCoachQuery, setInitialCoachQuery] = useState<string | null>(null);

  const [duoRoomId, setDuoRoomId] = useState<string | null>(() => getStoredRoomId() || null);

  // Guarantee clean zero-data state for real demo presentations
  useEffect(() => {
    const CLEAN_DEMO_FLAG = 'kairon_clean_zero_data_v2';
    if (!localStorage.getItem(CLEAN_DEMO_FLAG)) {
      const clean = storageService.clearAllData({
        name: 'Guest User',
        roleLabel: 'Independent Learner & Builder'
      });
      setProfile(clean.profile);
      setGoals([]);
      setTasks([]);
      setRoadmap(clean.roadmap);
      setGroup(clean.group);
      setAttendanceRecords([]);
      setSubjects([]);
      setExam(null);
      setResourceBank([]);
      setChatHistory([]);
      setNotifications(storageService.loadNotifications());
      localStorage.setItem(CLEAN_DEMO_FLAG, 'true');
    }
  }, []);

  // Auth state listener: Keep record of user & cloud sync with strict account isolation
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsSyncing(true);
        try {
          const syncedProf = await syncUserProfile(user, profile);
          setProfile(syncedProf);

          // Check if user has remote cloud records in their isolated Firestore space
          const [cloudGoals, cloudTasks, cloudResources, cloudRoadmap] = await Promise.all([
            loadGoalsFromFirestore(user.uid).catch(() => []),
            loadTasksFromFirestore(user.uid).catch(() => []),
            loadResourcesFromFirestore(user.uid).catch(() => []),
            loadRoadmapFromFirestore(user.uid).catch(() => null)
          ]);

          // Filter out legacy unwanted math records
          const realCloudGoals = (cloudGoals || []).filter(g => 
            g.id !== 'g-initial-math' && 
            !g.title.toLowerCase().includes('improve mathematics for examination')
          );
          const realCloudTasks = (cloudTasks || []).filter(t => 
            !t.id.startsWith('t-math-') && 
            t.goalId !== 'g-initial-math'
          );

          // Clean up legacy mock goals if any
          for (const g of (cloudGoals || [])) {
            if (g.id === 'g-initial-math' || g.title.toLowerCase().includes('improve mathematics for examination')) {
              deleteGoalFromFirestore(user.uid, g.id).catch(console.error);
            }
          }
          for (const t of (cloudTasks || [])) {
            if (t.id.startsWith('t-math-') || t.goalId === 'g-initial-math') {
              deleteTaskFromFirestore(user.uid, t.id).catch(console.error);
            }
          }

          // Real user isolation: load this user's cloud goals or clean 0-data
          setGoals(realCloudGoals);
          setTasks(realCloudTasks);

          if (cloudRoadmap && cloudRoadmap.stages && cloudRoadmap.stages.length > 0) {
            setRoadmap(cloudRoadmap);
          } else {
            setRoadmap({
              id: `roadmap-${user.uid.slice(0, 8)}`,
              goalId: '',
              title: `${syncedProf.name}'s Roadmap`,
              category: 'General',
              targetGoal: '',
              deadline: '',
              currentStreak: 0,
              stages: [],
              totalTasks: 0,
              completedTasks: 0,
              progressPercentage: 0
            });
          }

          setResourceBank(cloudResources || []);

          // Save synced profile to storageService so it persists across reloads/components
          storageService.saveProfile(syncedProf);

          // DYNAMICALLY UPDATE MAIN ACCOUNT in Group Workspace to match this Google Account
          const userAvatar = user.photoURL ? '👤' : (syncedProf.occupation === 'student' ? '🎓' : '🎯');
          const roadmapStages = cloudRoadmap?.stages || [];
          const activePlan = roadmapStages.length > 0 ? {
            targetMetric: cloudRoadmap?.targetGoal || realCloudGoals[0]?.title || 'Active roadmap goal',
            deadline: cloudRoadmap?.deadline || '2026-12-31',
            currentLevelName: roadmapStages.find(s => s.status === 'in_progress' || s.status === 'current')?.name || roadmapStages[0]?.name || 'Stage 1',
            currentLevelOrder: (roadmapStages.findIndex(s => s.status === 'in_progress' || s.status === 'current') + 1) || 1,
            totalLevels: roadmapStages.length,
            stages: roadmapStages.map((st, idx) => ({
              id: st.id || `st-${idx}`,
              order: idx + 1,
              name: st.name,
              status: (st.status === 'completed' ? 'completed' : (st.status === 'in_progress' || st.status === 'current') ? 'in_progress' : st.status === 'locked' ? 'locked' : 'available') as 'completed' | 'in_progress' | 'available' | 'locked',
              description: st.shortDescription || `Milestone ${idx + 1}`
            }))
          } : undefined;

          const updatedCurrentMember: GroupMember = {
            id: user.uid,
            name: syncedProf.name,
            avatar: userAvatar,
            role: 'Squad Leader',
            email: user.email || undefined,
            goalTitle: realCloudGoals[0]?.title || 'Planning next goal',
            progressPercentage: realCloudGoals[0]?.completionPercentage || 0,
            weeklyTasksCompleted: realCloudTasks.filter(t => t.status === 'Completed').length,
            weeklyTargetTasks: Math.max(10, realCloudTasks.length),
            hoursInvested: 0,
            currentStreak: cloudRoadmap?.currentStreak || 0,
            isOnline: true,
            isCurrentUser: true,
            desiredIdentity: syncedProf.desiredIdentity,
            partnerPlan: activePlan
          };

          // Automatically publish/ensure their hosted room in Firestore
          const userPersonalRoom = getUserPersonalRoomCode(user.uid);
          const activeRoom = getStoredRoomId() || userPersonalRoom;
          setDuoRoomId(activeRoom);
          ensureUserPersonalRoom(userPersonalRoom, updatedCurrentMember).catch(console.warn);

          setGroup(prevGroup => {
            const otherMembers = prevGroup.members.filter(m => 
              !m.isCurrentUser && 
              m.id !== user.uid && 
              m.id !== 'partner-priya' && 
              m.id !== 'partner-demo' && 
              !m.name.includes('Priya')
            );
            const updatedGroup: GroupWorkspace = {
              ...prevGroup,
              type: otherMembers.length > 0 ? 'duo' : prevGroup.type,
              members: [updatedCurrentMember, ...otherMembers]
            };
            storageService.saveGroup(updatedGroup);
            return updatedGroup;
          });

        } catch (err) {
          console.error('Error during initial user record synchronization:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setFirebaseUser(null);
        // Signed out: reset to clean guest profile
        const cleanProf = storageService.loadProfile();
        setProfile(cleanProf);
        setGroup(storageService.loadGroup());
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Duo Room subscription via Firestore and BroadcastChannel
  useEffect(() => {
    if (!duoRoomId) return;
    const currentUserId = firebaseUser?.uid || profile.id;
    const unsub = subscribeToPartnerRoom(duoRoomId, currentUserId, (room) => {
      if (!room) return;
      const remotePartners = room.members.filter(m => 
        m.id !== currentUserId && 
        !m.isCurrentUser && 
        !m.name.includes('Priya') && 
        m.id !== 'partner-priya'
      );

      setGroup(prev => {
        const currentMember = prev.members.find(m => m.isCurrentUser) || {
          id: currentUserId,
          name: profile.name,
          avatar: firebaseUser?.photoURL ? '👤' : '🎯',
          role: 'Squad Leader',
          goalTitle: goals[0]?.title || 'No active goal set',
          progressPercentage: goals[0]?.completionPercentage || 0,
          weeklyTasksCompleted: tasks.filter(t => t.status === 'Completed').length,
          weeklyTargetTasks: Math.max(10, tasks.length),
          hoursInvested: 0,
          currentStreak: roadmap.currentStreak || 0,
          isOnline: true,
          isCurrentUser: true
        };

        if (remotePartners.length > 0) {
          const updatedGrp: GroupWorkspace = {
            ...prev,
            type: 'duo',
            members: [currentMember, ...remotePartners],
            activityFeed: room.activityFeed?.length ? room.activityFeed : prev.activityFeed
          };
          storageService.saveGroup(updatedGrp);
          return updatedGrp;
        } else {
          return {
            ...prev,
            members: [currentMember],
            activityFeed: room.activityFeed?.length ? room.activityFeed : prev.activityFeed
          };
        }
      });
    });

    return () => unsub();
  }, [duoRoomId, firebaseUser?.uid, profile.id, profile.name]);

  // Push status updates to active duo room when local progress or goals update
  useEffect(() => {
    if (!duoRoomId) return;
    const currentUserId = firebaseUser?.uid || profile.id;
    const roadmapStages = roadmap.stages || [];
    const userTasks = tasks || [];

    const realPlan = {
      targetMetric: roadmap.targetGoal || goals[0]?.title || (goals.length > 0 ? goals[0].title : 'Planning next goal'),
      deadline: roadmap.deadline || 'No target date set',
      currentLevelName: roadmapStages.find(s => s.status === 'in_progress' || s.status === 'current')?.name || (roadmapStages.length > 0 ? roadmapStages[0].name : 'No active level yet'),
      currentLevelOrder: (roadmapStages.findIndex(s => s.status === 'in_progress' || s.status === 'current') + 1) || (roadmapStages.length > 0 ? 1 : 0),
      totalLevels: roadmapStages.length,
      stages: roadmapStages.map((st, idx) => ({
        id: st.id || `st-${idx}`,
        order: idx + 1,
        name: st.name,
        status: (st.status === 'completed' ? 'completed' : (st.status === 'in_progress' || st.status === 'current') ? 'in_progress' : st.status === 'locked' ? 'locked' : 'available') as 'completed' | 'in_progress' | 'available' | 'locked',
        description: st.shortDescription || `Milestone ${idx + 1}`
      })),
      activeTasks: userTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        difficulty: t.difficulty,
        completedAt: t.completedAt
      })),
      recentAchievements: userTasks.filter(t => t.status === 'Completed').slice(-3).map(t => `Completed: ${t.title}`),
      focusNotes: profile.desiredIdentity || 'Consistent daily focus'
    };

    pushMemberStatusUpdate(duoRoomId, {
      id: currentUserId,
      name: profile.name,
      avatar: firebaseUser?.photoURL ? '👤' : '🎯',
      goalTitle: goals[0]?.title || 'Planning next goal',
      progressPercentage: goals[0]?.completionPercentage || 0,
      currentStreak: roadmap.currentStreak || 0,
      weeklyTasksCompleted: userTasks.filter(t => t.status === 'Completed').length,
      weeklyTargetTasks: Math.max(10, userTasks.length),
      isOnline: true,
      partnerPlan: realPlan
    }).catch(() => {});
  }, [duoRoomId, goals, tasks, roadmap, profile.name, profile.desiredIdentity, firebaseUser?.photoURL]);

  // Sync to local storage
  useEffect(() => {
    storageService.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    storageService.saveGoals(goals);
  }, [goals]);

  useEffect(() => {
    storageService.saveRoadmap(roadmap);
  }, [roadmap]);

  useEffect(() => {
    storageService.saveAttendance(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    storageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storageService.saveSubjects(subjects);
  }, [subjects]);

  useEffect(() => {
    if (exam) storageService.saveExam(exam);
  }, [exam]);

  useEffect(() => {
    storageService.saveGroup(group);
  }, [group]);

  useEffect(() => {
    storageService.saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    storageService.saveChat(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    storageService.saveResourceBank(resourceBank);
  }, [resourceBank]);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const activeGoal = goals.find(g => g.id === selectedGoalId) || goals[0] || undefined;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const partnerUser = group.members.find(m => !m.isCurrentUser && !m.name.includes('Priya') && m.id !== 'partner-priya') || null;
  const isPartnerConnected = group.type === 'duo' && group.members.some(m => !m.isCurrentUser && !m.name.includes('Priya'));

  const handleDeleteGoal = async (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    setTasks(prev => prev.filter(t => t.goalId !== goalId));
    if (selectedGoalId === goalId) {
      setSelectedGoalId(null);
    }
    if (firebaseUser) {
      deleteGoalFromFirestore(firebaseUser.uid, goalId).catch(console.error);
    }
  };

  // Handlers
  const handleSignIn = async () => {
    try {
      setIsSyncing(true);
      const user = await signInWithGoogle();
      if (!user) return;
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        err?.code !== 'auth/user-cancelled'
      ) {
        console.error('Sign-in error:', err);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      setIsSyncing(true);
      await switchGoogleAccount();
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        err?.code !== 'auth/user-cancelled'
      ) {
        console.error('Account switch error:', err);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setFirebaseUser(null);
      clearStoredRoomId();
      setDuoRoomId(null);
      const clean = storageService.clearAllData({
        name: 'Guest User',
        roleLabel: 'Independent Learner & Builder'
      });
      setProfile(clean.profile);
      setGoals([]);
      setTasks([]);
      setRoadmap(clean.roadmap);
      setGroup(clean.group);
      setResourceBank([]);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleJoinPartnerRoom = async (roomId: string) => {
    const currentUserId = firebaseUser?.uid || profile.id;
    const currentMember: GroupMember = {
      id: currentUserId,
      name: profile.name,
      avatar: firebaseUser?.photoURL ? '👤' : '🎯',
      role: 'Squad Leader',
      email: firebaseUser?.email || undefined,
      goalTitle: activeGoal?.title || 'Continuous Improvement Target',
      progressPercentage: activeGoal?.completionPercentage || 0,
      weeklyTasksCompleted: tasks.filter(t => t.status === 'Completed').length,
      weeklyTargetTasks: Math.max(10, tasks.length),
      hoursInvested: Math.round((tasks.filter(t => t.status === 'Completed').reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 30), 0) / 60) * 10) / 10,
      currentStreak: roadmap.currentStreak || 0,
      isOnline: true,
      isCurrentUser: true,
      partnerPlan: roadmap.stages && roadmap.stages.length > 0 ? {
        targetMetric: roadmap.targetGoal || activeGoal?.title || 'Active roadmap goal',
        deadline: roadmap.deadline || '2026-12-31',
        currentLevelName: roadmap.stages.find(s => s.status === 'in_progress' || s.status === 'current')?.name || roadmap.stages[0]?.name || 'Stage 1',
        currentLevelOrder: (roadmap.stages.findIndex(s => s.status === 'in_progress' || s.status === 'current') + 1) || 1,
        totalLevels: roadmap.stages.length,
        stages: roadmap.stages.map((st, idx) => ({
          id: st.id || `st-${idx}`,
          order: idx + 1,
          name: st.name,
          status: (st.status === 'completed' ? 'completed' : (st.status === 'in_progress' || st.status === 'current') ? 'in_progress' : st.status === 'locked' ? 'locked' : 'available') as 'completed' | 'in_progress' | 'available' | 'locked',
          description: st.shortDescription || `Milestone ${idx + 1}`
        }))
      } : undefined
    };

    const room = await joinOrCreatePartnerRoom(roomId, currentMember);
    setDuoRoomId(room.roomId);
    setStoredRoomId(room.roomId);

    const partnerMembers = room.members.filter(m => 
      m.id !== currentUserId && 
      !m.name.includes('Priya') && 
      m.id !== 'partner-priya'
    );
    setGroup(prev => {
      const updatedGrp: GroupWorkspace = {
        ...prev,
        type: 'duo',
        members: [currentMember, ...partnerMembers],
        activityFeed: room.activityFeed
      };
      storageService.saveGroup(updatedGrp);
      return updatedGrp;
    });
  };

  const handleLeavePartnerRoom = async () => {
    if (duoRoomId) {
      const currentUserId = firebaseUser?.uid || profile.id;
      await leavePartnerRoom(duoRoomId, currentUserId);
    }
    clearStoredRoomId();
    const personalCode = getUserPersonalRoomCode(firebaseUser?.uid || profile.id);
    setDuoRoomId(personalCode);
    setGroup(prev => {
      const currentMember = prev.members.find(m => m.isCurrentUser) || prev.members[0];
      const updatedGrp: GroupWorkspace = {
        ...prev,
        type: 'single',
        members: currentMember ? [currentMember] : []
      };
      storageService.saveGroup(updatedGrp);
      return updatedGrp;
    });
  };

  const handleSendPingToPartner = (partnerName: string, message: string, type: 'nudge' | 'high_five') => {
    if (duoRoomId) {
      sendPartnerAccountabilityPing(
        duoRoomId,
        { id: firebaseUser?.uid || profile.id, name: profile.name, avatar: firebaseUser?.photoURL ? '👤' : '🎯' },
        partnerName,
        message,
        type
      );
    }
    handlePostAccountabilityRequest(
      type === 'high_five' 
        ? `🙌 High-five sent to ${partnerName}: "${message}"` 
        : `⚡ Focus nudge sent to ${partnerName}: "${message}"`
    );
  };

  const handleSimulateDemoPartner = async () => {
    const roomCode = duoRoomId || generateDuoRoomCode();
    await handleJoinPartnerRoom(roomCode);
    setGroup(prev => ({
      ...prev,
      type: 'duo',
      members: [
        ...prev.members.filter(m => m.isCurrentUser),
        {
          ...DEMO_FOCUS_PARTNER,
          id: 'partner-demo-live',
          name: 'Demo Partner (Presentation Mode)',
          isOnline: true,
          progressPercentage: 65,
          currentStreak: 7,
          goalTitle: 'Cloud Architecture & Systems Certification',
          partnerPlan: DEMO_FOCUS_PARTNER.partnerPlan
        }
      ]
    }));
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (firebaseUser) {
      updateUserProfileInFirestore(firebaseUser.uid, newProfile).catch(console.error);
    }
  };

  const handleSwitchPersona = (key: string) => {
    const loaded = storageService.switchPersona(key);
    setProfile(loaded.profile);
    setGoals(loaded.goals);
    setTasks(loaded.tasks);
    if (loaded.subjects) setSubjects(loaded.subjects);
    if (loaded.exam) setExam(loaded.exam);
    setGroup(storageService.loadGroup());
    setRoadmap(storageService.loadRoadmap());
    setAttendanceRecords(storageService.loadAttendance());
    setResourceBank(storageService.loadResourceBank());

    if (firebaseUser) {
      updateUserProfileInFirestore(firebaseUser.uid, loaded.profile).catch(console.error);
    }
  };

  const handleAddResource = (item: Omit<ResourceBankItem, 'id' | 'createdAt'>) => {
    const created = storageService.addResourceToBank(item);
    setResourceBank(storageService.loadResourceBank());
    if (firebaseUser) {
      saveResourceToFirestore(firebaseUser.uid, created).catch(console.error);
    }
  };

  const handleUpdateResource = (id: string, updates: Partial<ResourceBankItem>) => {
    storageService.updateResourceInBank(id, updates);
    const updatedList = storageService.loadResourceBank();
    setResourceBank(updatedList);
    const target = updatedList.find(i => i.id === id);
    if (firebaseUser && target) {
      saveResourceToFirestore(firebaseUser.uid, target).catch(console.error);
    }
  };

  const handleDeleteResource = (id: string) => {
    storageService.deleteResourceFromBank(id);
    setResourceBank(storageService.loadResourceBank());
    if (firebaseUser) {
      deleteResourceFromFirestore(firebaseUser.uid, id).catch(console.error);
    }
  };

  const handleStartFocus = (task: Task, durationMins: number) => {
    setFocusTask(task);
    setFocusDuration(durationMins);
    setFocusModalOpen(true);
  };

  const handleCompleteFocusTask = (
    taskId: string,
    actualMinutes: number,
    difficulty: TaskDifficulty,
    notes?: string
  ) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Completed' as TaskStatus,
          actualMinutes,
          difficulty,
          notes: notes ? (t.notes ? `${t.notes} | ${notes}` : notes) : t.notes,
          completedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    // Update group feed and member task count
    setGroup(prev => {
      const updatedMembers = prev.members.map(m => {
        if (m.isCurrentUser) {
          return {
            ...m,
            weeklyTasksCompleted: m.weeklyTasksCompleted + 1,
            hoursInvested: Number((m.hoursInvested + actualMinutes / 60).toFixed(1))
          };
        }
        return m;
      });

      const updatedGoal = {
        ...prev.groupGoal,
        current: prev.groupGoal.current + 1
      };

      const newActivity = {
        id: 'act-' + Date.now(),
        userId: profile.id,
        userName: profile.name,
        userAvatar: profile.occupation === 'student' ? '👨‍🎓' : profile.occupation === 'developer' ? '💻' : profile.occupation === 'fitness' ? '🏃‍♂️' : '🚀',
        action: 'completed focused session',
        target: `${focusTask?.title || 'Milestone Task'} (${actualMinutes}m, rated ${difficulty})`,
        timestamp: 'Just now',
        reactions: [{ emoji: '🔥', count: 1, userReacted: false }]
      };

      return {
        ...prev,
        members: updatedMembers,
        groupGoal: updatedGoal,
        activityFeed: [newActivity, ...prev.activityFeed]
      };
    });
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const nextStatus: TaskStatus = t.status === 'Completed' ? 'Not Started' : 'Completed';
          const updatedTask = {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined
          };
          if (firebaseUser) {
            saveTaskToFirestore(firebaseUser.uid, updatedTask).catch(console.error);
          }
          return updatedTask;
        }
        return t;
      });
      return updated;
    });
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const updatedTask = { ...t, status };
          if (firebaseUser) {
            saveTaskToFirestore(firebaseUser.uid, updatedTask).catch(console.error);
          }
          return updatedTask;
        }
        return t;
      });
      return updated;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (firebaseUser) {
      deleteTaskFromFirestore(firebaseUser.uid, taskId).catch(console.error);
    }
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    setTasks(prev => {
      const exists = prev.some(t => t.id === taskData.id);
      let updated: Task[];
      let target: Task;
      if (exists) {
        target = { ...prev.find(t => t.id === taskData.id)!, ...taskData } as Task;
        updated = prev.map(t => t.id === taskData.id ? target : t);
      } else {
        target = taskData as Task;
        updated = [target, ...prev];
      }
      if (firebaseUser && target) {
        saveTaskToFirestore(firebaseUser.uid, target).catch(console.error);
      }
      return updated;
    });
  };

  const handleOpenCoachWithQuestion = (q: string) => {
    setInitialCoachQuery(q);
    setCurrentTab('tutor');
  };

  const handlePostAccountabilityRequest = (text: string) => {
    const newAct = {
      id: 'act-' + Date.now(),
      userId: profile.id,
      userName: profile.name,
      userAvatar: profile.occupation === 'student' ? '👨‍🎓' : profile.occupation === 'developer' ? '💻' : profile.occupation === 'fitness' ? '🏃‍♂️' : '🚀',
      action: 'posted accountability commitment',
      target: text,
      timestamp: 'Just now',
      reactions: [
        { emoji: '👀', count: 2, userReacted: false },
        { emoji: '💪', count: 1, userReacted: false }
      ]
    };
    setGroup(prev => ({ ...prev, activityFeed: [newAct, ...(prev.activityFeed || [])] }));
  };

  const handleReactToActivity = (activityId: string, emoji: string) => {
    setGroup(prev => ({
      ...prev,
      activityFeed: prev.activityFeed.map(act => {
        if (act.id !== activityId) return act;
        const exists = act.reactions.find(r => r.emoji === emoji);
        if (exists) {
          return {
            ...act,
            reactions: act.reactions.map(r => r.emoji === emoji ? {
              ...r,
              count: r.userReacted ? r.count - 1 : r.count + 1,
              userReacted: !r.userReacted
            } : r)
          };
        }
        return {
          ...act,
          reactions: [...act.reactions, { emoji, count: 1, userReacted: true }]
        };
      })
    }));
  };

  const handleUpdateTopicStatus = (subjectId: string, unitId: string, topicId: string, status: any) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        units: s.units.map(u => {
          if (u.id !== unitId) return u;
          return {
            ...u,
            topics: u.topics.map(t => t.id === topicId ? { ...t, status } : t)
          };
        })
      };
    }));
  };

  const handleAddSubject = (newSubject: Subject) => {
    setSubjects(prev => [...prev, newSubject]);
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
  };

  const handleAddUnit = (subjectId: string, newUnit: SubjectUnit) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        units: [...s.units, newUnit]
      };
    }));
  };

  const handleDeleteUnit = (subjectId: string, unitId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        units: s.units.filter(u => u.id !== unitId)
      };
    }));
  };

  const handleAddTopic = (subjectId: string, unitId: string, newTopic: SyllabusTopic) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        units: s.units.map(u => {
          if (u.id !== unitId) return u;
          return {
            ...u,
            topics: [...u.topics, newTopic]
          };
        })
      };
    }));
  };

  const handleDeleteTopic = (subjectId: string, unitId: string, topicId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        units: s.units.map(u => {
          if (u.id !== unitId) return u;
          return {
            ...u,
            topics: u.topics.filter(t => t.id !== topicId)
          };
        })
      };
    }));
  };

  const handleWipeAllDemoData = () => {
    const clean = storageService.clearAllData({
      name: firebaseUser?.displayName || profile.name || 'Tanmayi',
      roleLabel: 'Independent Learner & Builder'
    });
    setProfile(clean.profile);
    setGoals([]);
    setTasks([]);
    setSubjects([]);
    setExam(null);
    setRoadmap(clean.roadmap);
    setGroup(clean.group);
    setAttendanceRecords([]);
    setResourceBank([]);
    setChatHistory([]);
    setNotifications([
      {
        id: 'notif-' + Date.now(),
        title: 'Clean Slate Activated',
        message: 'All workspace data cleared. You can now build your own personalized goals.',
        timestamp: 'Just now',
        type: 'daily_plan',
        read: false
      }
    ]);

    if (firebaseUser) {
      wipeAllUserFirestoreData(firebaseUser.uid).catch(console.error);
    }
  };

  const handleSaveGoalAndRoadmap = async (newGoal: Goal, newRoadmap: PersonalRoadmap) => {
    // 1. Update goals state (new goal at front)
    const updatedGoals = [newGoal, ...goals.filter(g => g.id !== newGoal.id)];
    setGoals(updatedGoals);
    storageService.saveGoals(updatedGoals);

    // 2. Update roadmap state
    setRoadmap(newRoadmap);
    storageService.saveRoadmap(newRoadmap);

    // 3. Extract tasks from stages
    const generatedTasks: Task[] = [];
    (newRoadmap.stages || []).forEach(stage => {
      (stage.tasks || []).forEach(t => {
        generatedTasks.push({
          id: t.id,
          goalId: newGoal.id,
          title: t.title,
          description: t.description,
          status: (t.status as TaskStatus) || 'Not Started',
          priority: t.priority || 'medium',
          difficulty: t.difficulty || 'Normal',
          estimatedMinutes: t.estimatedMinutes || 35,
          tags: [stage.name.split(' ')[0] || 'Roadmap', 'Milestone']
        });
      });
    });

    if (generatedTasks.length > 0) {
      const mergedTasks = [...generatedTasks, ...tasks];
      setTasks(mergedTasks);
      storageService.saveTasks(mergedTasks);
    }

    // 4. Firestore sync if authenticated
    if (firebaseUser) {
      await saveGoalToFirestore(firebaseUser.uid, newGoal).catch(console.error);
      for (const t of generatedTasks) {
        await saveTaskToFirestore(firebaseUser.uid, t).catch(console.error);
      }
    }

    setGoalWizardOpen(false);
    setCurrentTab('roadmap');
  };

  const handleApplyAdaptation = (record: DailyCheckInRecord, rescheduledTasks: Task[]) => {
    // Update rescheduled tasks
    setTasks(prev => {
      const taskMap = new Map(rescheduledTasks.map(t => [t.id, t]));
      return prev.map(t => taskMap.get(t.id) || t);
    });

    // Add notification
    const notif: SmartNotification = {
      id: 'notif-' + Date.now(),
      title: 'Daily Check-in Complete',
      message: record.aiCoachResponse || 'Schedule adapted cleanly. Missed tasks redistributed into buffer slots.',
      type: 'coach',
      timestamp: 'Just now',
      read: false,
      actionLabel: 'View Schedule',
      actionType: 'view_plan'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleApplyRecalibration = (optionId: string, details: string) => {
    const notif: SmartNotification = {
      id: 'notif-' + Date.now(),
      title: 'Adaptive Recalibration Applied',
      message: `Strategy applied: ${details}`,
      type: 'coach',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleApplyImprovedPlan = (schedule: any[]) => {
    const notif: SmartNotification = {
      id: 'notif-' + Date.now(),
      title: 'AI Spaced Routine Activated',
      message: 'Your routine spacing has been updated with dedicated 20-minute recall drills and buffers.',
      type: 'coach',
      timestamp: 'Just now',
      read: false,
      actionLabel: 'View Schedule',
      actionType: 'view_plan'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleOnboardingComplete = (newProf: UserProfile, newGoal: Goal, newTasks: Task[]) => {
    setProfile(newProf);
    setGoals([newGoal]);
    setTasks(newTasks);
    setCurrentTab('home');
  };

  const handleNotificationAction = (notif: SmartNotification) => {
    if (notif.actionType === 'start_focus') {
      const t = tasks.find(item => item.status !== 'Completed') || tasks[0];
      if (t) handleStartFocus(t, 45);
    } else if (notif.actionType === 'view_plan') {
      setCurrentTab('roadmap');
    } else if (notif.actionType === 'open_coach') {
      setCurrentTab('tutor');
    } else if (notif.actionType === 'squad_cheer') {
      setCurrentTab('group');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Header */}
      <Header
        profile={profile}
        activeGoal={activeGoal}
        goals={goals}
        onSelectGoal={(id) => setSelectedGoalId(id)}
        onDeleteGoal={handleDeleteGoal}
        partner={isPartnerConnected ? partnerUser : null}
        onOpenPartnerPlan={() => setPartnerModalOpen(true)}
        unreadCount={unreadNotifsCount}
        firebaseUser={firebaseUser}
        isSyncing={isSyncing}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSwitchAccount={handleSwitchAccount}
        onOpenWhatNow={() => setWhatNowOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenCheckIn={() => setCheckinOpen(true)}
        onSwitchPersona={handleSwitchPersona}
        onOpenOnboarding={() => setGoalWizardOpen(true)}
        onWipeAllDemoData={handleWipeAllDemoData}
      />

      {/* Main Layout: Sidebar Navigation + Dynamic Main Screen */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          studentMode={profile.studentModeEnabled}
          activeStreak={roadmap.currentStreak || 0}
          partnerName={isPartnerConnected && partnerUser ? partnerUser.name : undefined}
          onOpenPartnerPlan={() => setPartnerModalOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto mb-16 md:mb-0">
          {currentTab === 'home' && (
            <HomeScreen
              profile={profile}
              activeGoal={activeGoal}
              roadmap={roadmap}
              tasks={tasks}
              group={group}
              onOpenWhatNow={() => setWhatNowOpen(true)}
              onStartFocus={handleStartFocus}
              onOpenGoalWizard={() => setGoalWizardOpen(true)}
              onNavigateTab={setCurrentTab}
              onToggleTaskComplete={handleToggleTaskComplete}
              onAskAIQuestion={q => {
                handleOpenCoachWithQuestion(q);
                setCurrentTab('tutor');
              }}
              onOpenPartnerPlan={() => setPartnerModalOpen(true)}
            />
          )}

          {currentTab === 'roadmap' && (
            <RoadmapScreen
              roadmap={roadmap}
              profile={profile}
              group={group}
              attendanceRecords={attendanceRecords}
              resources={resourceBank}
              goals={goals}
              onAddResource={handleAddResource}
              onUpdateResource={handleUpdateResource}
              onDeleteResource={handleDeleteResource}
              onUpdateRoadmap={setRoadmap}
              onUpdateAttendance={setAttendanceRecords}
              onStartFocus={(t, mins) => {
                const matched = tasks.find(item => item.id === t.id) || {
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  estimatedMinutes: mins || t.estimatedMinutes || 35,
                  priority: t.priority || 'high',
                  difficulty: t.difficulty,
                  status: 'In Progress',
                  tags: ['Roadmap']
                };
                handleStartFocus(matched as Task, mins);
              }}
              onOpenCoachWithQuestion={handleOpenCoachWithQuestion}
              onNavigateToScreen={(targetTab) => setCurrentTab(targetTab as NavTab)}
              onOpenPartnerPlan={() => setPartnerModalOpen(true)}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressScreen
              goals={goals}
              tasks={tasks}
              profile={profile}
              roadmap={roadmap}
              onOpenRoadmap={() => setCurrentTab('roadmap')}
              onOpenCoachWithQuestion={handleOpenCoachWithQuestion}
            />
          )}

          {currentTab === 'resources' && (
            <ResourceBankScreen
              resources={resourceBank}
              goals={goals}
              roadmap={roadmap}
              onAddResource={handleAddResource}
              onUpdateResource={handleUpdateResource}
              onDeleteResource={handleDeleteResource}
              onNavigateToRoadmap={() => setCurrentTab('roadmap')}
              onOpenRoadmapGenerator={() => setCurrentTab('roadmap')}
            />
          )}

          {currentTab === 'today' && (
            <TasksScreen
              tasks={tasks}
              goals={goals}
              roadmap={roadmap}
              onOpenNewTaskModal={taskToEdit => {
                setEditingTask(taskToEdit || null);
                setTaskModalOpen(true);
              }}
              onToggleComplete={handleToggleTaskComplete}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onStartFocus={handleStartFocus}
              onOpenWhatNow={() => setWhatNowOpen(true)}
            />
          )}

          {currentTab === 'tutor' && (
            <AICoachScreen
              profile={profile}
              goals={goals}
              roadmap={roadmap}
              tasks={tasks}
              chatHistory={chatHistory}
              onAddMessage={msg => {
                setChatHistory(prev => {
                  const uniqueMsg = prev.some(m => m.id === msg.id)
                    ? { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }
                    : msg;
                  const updated = [...prev, uniqueMsg];
                  storageService.saveChat(updated);
                  return updated;
                });
              }}
              onClearHistory={() => {
                const init: ChatMessage[] = [
                  {
                    id: 'init',
                    sender: 'sara',
                    text: 'Sara Unified AI ready. Ask any question about your roadmap, daily plan, concepts, uploaded textbooks, or current exam syllabi.',
                    timestamp: 'Now',
                    routedTo: 'planner',
                    sourceUsed: 'Planner & Tutor Router'
                  }
                ];
                setChatHistory(init);
                storageService.saveChat(init);
              }}
              initialQuestion={initialCoachQuery}
            />
          )}

          {currentTab === 'group' && (
            <GroupsScreen
              group={group}
              profile={profile}
              duoRoomId={duoRoomId || getUserPersonalRoomCode(firebaseUser?.uid || profile.id)}
              onPostAccountabilityRequest={handlePostAccountabilityRequest}
              onReactToActivity={handleReactToActivity}
              onChangeGroupType={t => {
                setGroup(prev => {
                  let updatedMembers = [...prev.members];
                  if (t === 'single') {
                    updatedMembers = updatedMembers.filter(m => m.isCurrentUser);
                  }
                  const updatedGrp: GroupWorkspace = {
                    ...prev,
                    type: t,
                    members: updatedMembers
                  };
                  storageService.saveGroup(updatedGrp);
                  return updatedGrp;
                });
              }}
              onAddPartner={partner => {
                setGroup(prev => ({
                  ...prev,
                  type: 'duo',
                  members: [
                    ...prev.members.filter(m => m.id !== partner.id),
                    partner
                  ]
                }));
              }}
              onJoinRoom={handleJoinPartnerRoom}
              onLeaveRoom={handleLeavePartnerRoom}
              onSendPingToPartner={handleSendPingToPartner}
              onSimulateDemoPartner={handleSimulateDemoPartner}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              profile={profile}
              firebaseUser={firebaseUser}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              onSwitchAccount={handleSwitchAccount}
              onUpdateProfile={handleUpdateProfile}
              onResetData={() => {
                handleWipeAllDemoData();
              }}
              onWipeAllDemoData={handleWipeAllDemoData}
              onOpenOnboarding={() => setGoalWizardOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <WhatShouldIDoNowModal
        isOpen={whatNowOpen}
        onClose={() => setWhatNowOpen(false)}
        tasks={tasks}
        activeGoal={activeGoal}
        profile={profile}
        onStartFocus={handleStartFocus}
        onOpenCoachWithQuestion={handleOpenCoachWithQuestion}
      />

      <FocusModeModal
        isOpen={focusModalOpen}
        task={focusTask}
        targetDurationMinutes={focusDuration}
        onClose={() => setFocusModalOpen(false)}
        onCompleteTask={handleCompleteFocusTask}
      />

      <DailyCheckinModal
        isOpen={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        tasks={tasks}
        onApplyAdaptation={handleApplyAdaptation}
      />

      <AdaptPlanModal
        isOpen={adaptOpen}
        onClose={() => setAdaptOpen(false)}
        goal={activeGoal}
        tasks={tasks}
        onApplyAdjustment={handleApplyRecalibration}
      />

      <PlanImproverModal
        isOpen={planImproverOpen}
        onClose={() => setPlanImproverOpen(false)}
        goal={activeGoal}
        onApplyImprovedPlan={handleApplyImprovedPlan}
        onOpenCoachWithQuestion={handleOpenCoachWithQuestion}
      />

      <NewTaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        goals={goals}
        onSaveTask={handleSaveTask}
        editTask={editingTask}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
      />

      <NotificationCenterModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
        onClearAll={() => setNotifications([])}
        onActionClick={handleNotificationAction}
      />

      <GoalWizardModal
        isOpen={goalWizardOpen}
        onClose={() => setGoalWizardOpen(false)}
        onSaveGoalAndRoadmap={handleSaveGoalAndRoadmap}
      />

      <PartnerPlanModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        partner={partnerUser}
        onSendEncouragement={(partnerName, message) => {
          handlePostAccountabilityRequest(`High-five sent to ${partnerName}: ${message}`);
        }}
        onSendNudge={partnerName => {
          handlePostAccountabilityRequest(`Accountability nudge sent to ${partnerName} 🔥`);
        }}
      />

    </div>
  );
}
