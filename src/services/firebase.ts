import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Goal, Task, PersonalRoadmap, ResourceBankItem } from '../types';

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore with required database ID & Auth
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 3. Error handling specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Validate Connection to Firestore on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
// Run connection check
testConnection();

// 5. Auth operations
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/user-cancelled'
    ) {
      // User closed popup or cancelled sign-in intentionally
      return null;
    }
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function switchGoogleAccount(): Promise<FirebaseUser | null> {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    await signOut(auth);
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/user-cancelled'
    ) {
      return null;
    }
    console.error('Google account switch failed:', error);
    throw error;
  }
}

// 6. User Profile Records
export async function syncUserProfile(firebaseUser: FirebaseUser, existingProfile: UserProfile): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const path = `users/${firebaseUser.uid}`;
  const googleName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User');

  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Always honor the active Google Account's real display name
      const activeName = firebaseUser.displayName || 
        ((data.name && data.name !== 'Alex Rivera' && data.name !== 'Tanmayi' && data.name !== 'Guest User') ? data.name : googleName);

      return {
        ...existingProfile,
        id: firebaseUser.uid,
        name: activeName,
        email: firebaseUser.email || data.email || '',
        photoURL: firebaseUser.photoURL || data.photoURL || '',
        desiredIdentity: data.desiredIdentity || existingProfile.desiredIdentity,
        occupation: data.occupation || existingProfile.occupation,
        studentModeEnabled: data.studentModeEnabled ?? existingProfile.studentModeEnabled
      };
    } else {
      // First time user record creation
      const validOccupation = ['student', 'developer', 'fitness', 'entrepreneur', 'custom'].includes(existingProfile.occupation)
        ? existingProfile.occupation
        : 'developer';

      const newProfileData: any = {
        userId: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: googleName.slice(0, 100),
        desiredIdentity: (existingProfile.desiredIdentity || 'High-agency builder executing daily with consistency').slice(0, 200),
        occupation: validOccupation,
        studentModeEnabled: Boolean(existingProfile.studentModeEnabled),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (firebaseUser.photoURL) {
        newProfileData.photoURL = firebaseUser.photoURL.slice(0, 1000);
      }

      await setDoc(userRef, newProfileData);

      return {
        ...existingProfile,
        id: firebaseUser.uid,
        name: newProfileData.name,
        email: newProfileData.email,
        photoURL: newProfileData.photoURL || '',
        desiredIdentity: newProfileData.desiredIdentity,
        occupation: newProfileData.occupation,
        studentModeEnabled: newProfileData.studentModeEnabled
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileInFirestore(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const path = `users/${userId}`;

  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      const validOcc = updates.occupation && ['student', 'developer', 'fitness', 'entrepreneur', 'custom'].includes(updates.occupation)
        ? updates.occupation
        : 'developer';

      const newProfileData: any = {
        userId,
        email: auth.currentUser?.email || '',
        name: (updates.name || auth.currentUser?.displayName || 'User').slice(0, 100),
        desiredIdentity: (updates.desiredIdentity || 'High-agency builder executing daily with consistency').slice(0, 200),
        occupation: validOcc,
        studentModeEnabled: Boolean(updates.studentModeEnabled),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (auth.currentUser?.photoURL) {
        newProfileData.photoURL = auth.currentUser.photoURL.slice(0, 1000);
      }
      await setDoc(userRef, newProfileData);
      return;
    }

    const payload: any = {
      updatedAt: serverTimestamp()
    };
    if (updates.name !== undefined) payload.name = updates.name.slice(0, 100);
    if (updates.desiredIdentity !== undefined) payload.desiredIdentity = updates.desiredIdentity.slice(0, 200);
    if (updates.occupation !== undefined) payload.occupation = updates.occupation;
    if (updates.studentModeEnabled !== undefined) payload.studentModeEnabled = updates.studentModeEnabled;

    await updateDoc(userRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// 7. Goals Persistence
export async function saveGoalToFirestore(userId: string, goal: Goal): Promise<void> {
  const path = `users/${userId}/goals/${goal.id}`;
  const goalRef = doc(db, 'users', userId, 'goals', goal.id);

  try {
    const docSnap = await getDoc(goalRef);
    const payload: any = {
      id: goal.id,
      userId,
      title: goal.title.slice(0, 200),
      category: goal.category.slice(0, 50),
      targetMetric: goal.targetMetric.slice(0, 100),
      currentMetric: goal.currentMetric.slice(0, 100),
      completionPercentage: Number(goal.completionPercentage) || 0,
      deadline: goal.deadline.slice(0, 50),
      why: (goal.why || 'Drive personal mastery').slice(0, 500),
      status: goal.status || 'active',
      isPrivate: Boolean(goal.isPrivate),
      updatedAt: serverTimestamp()
    };

    if (goal.aiInsight) {
      payload.aiInsight = goal.aiInsight.slice(0, 500);
    }
    if (goal.milestones) {
      payload.milestones = goal.milestones.slice(0, 50);
    }

    if (!docSnap.exists()) {
      payload.createdAt = serverTimestamp();
      await setDoc(goalRef, payload);
    } else {
      await updateDoc(goalRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGoalFromFirestore(userId: string, goalId: string): Promise<void> {
  const path = `users/${userId}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 7b. Roadmap Persistence
export async function saveRoadmapToFirestore(userId: string, roadmap: PersonalRoadmap): Promise<void> {
  const path = `users/${userId}/roadmaps/${roadmap.id}`;
  const roadmapRef = doc(db, 'users', userId, 'roadmaps', roadmap.id);

  try {
    const docSnap = await getDoc(roadmapRef);
    const payload: any = {
      id: roadmap.id,
      userId,
      title: (roadmap.title || 'Personal Roadmap').slice(0, 200),
      targetGoal: (roadmap.targetGoal || 'Master Goal').slice(0, 200),
      totalTasks: Number(roadmap.totalTasks) || 0,
      completedTasks: Number(roadmap.completedTasks) || 0,
      progressPercentage: Number(roadmap.progressPercentage) || 0,
      currentStreak: Number(roadmap.currentStreak) || 0,
      updatedAt: serverTimestamp()
    };

    if (roadmap.sourceNotes) {
      payload.sourceNotes = roadmap.sourceNotes.slice(0, 10000);
    }
    if (roadmap.stages && Array.isArray(roadmap.stages)) {
      payload.stages = roadmap.stages.slice(0, 50);
    }
    if (roadmap.referenceLinks && Array.isArray(roadmap.referenceLinks)) {
      payload.referenceLinks = roadmap.referenceLinks.slice(0, 50);
    }

    if (!docSnap.exists()) {
      payload.createdAt = serverTimestamp();
      await setDoc(roadmapRef, payload);
    } else {
      await updateDoc(roadmapRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadRoadmapFromFirestore(userId: string): Promise<PersonalRoadmap | null> {
  const path = `users/${userId}/roadmaps`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'roadmaps'));
    if (snap.empty) return null;
    const firstDoc = snap.docs[0];
    const data = firstDoc.data();
    return {
      id: data.id || firstDoc.id,
      goalId: data.goalId || '',
      title: data.title || 'Personal Roadmap',
      category: data.category || 'General',
      targetGoal: data.targetGoal || '',
      deadline: data.deadline || '',
      currentStreak: data.currentStreak || 0,
      stages: data.stages || [],
      sourceNotes: data.sourceNotes,
      referenceLinks: data.referenceLinks,
      groundedSources: data.groundedSources,
      searchQueries: data.searchQueries,
      keyTopicsCovered: data.keyTopicsCovered,
      totalTasks: data.totalTasks || 0,
      completedTasks: data.completedTasks || 0,
      progressPercentage: data.progressPercentage || 0
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

export async function deleteRoadmapFromFirestore(userId: string, roadmapId: string): Promise<void> {
  const path = `users/${userId}/roadmaps/${roadmapId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'roadmaps', roadmapId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function wipeAllUserFirestoreData(userId: string): Promise<void> {
  try {
    const [goalsSnap, tasksSnap, roadmapsSnap, resourcesSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'goals')),
      getDocs(collection(db, 'users', userId, 'tasks')),
      getDocs(collection(db, 'users', userId, 'roadmaps')),
      getDocs(collection(db, 'users', userId, 'resources'))
    ]);

    const deletePromises: Promise<any>[] = [];
    goalsSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    tasksSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    roadmapsSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    resourcesSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error wiping user Firestore data:', error);
  }
}

export async function loadGoalsFromFirestore(userId: string): Promise<Goal[]> {
  const path = `users/${userId}/goals`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'goals'));
    const goals: Goal[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const raw = JSON.stringify(data).toLowerCase();
      if (['alex', 'rahul', 'david', 'sam'].some(m => raw.includes(m))) {
        return;
      }
      goals.push({
        id: data.id || docSnap.id,
        title: data.title,
        category: data.category,
        targetMetric: data.targetMetric,
        currentMetric: data.currentMetric,
        completionPercentage: data.completionPercentage || 0,
        deadline: data.deadline,
        why: data.why || 'Drive personal mastery and career advancement',
        status: data.status || 'active',
        isPrivate: Boolean(data.isPrivate),
        aiInsight: data.aiInsight,
        milestones: data.milestones || []
      });
    });
    return goals;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 8. Tasks Persistence
export async function saveTaskToFirestore(userId: string, task: Task): Promise<void> {
  const path = `users/${userId}/tasks/${task.id}`;
  const taskRef = doc(db, 'users', userId, 'tasks', task.id);

  try {
    const docSnap = await getDoc(taskRef);
    const payload: any = {
      id: task.id,
      userId,
      title: task.title.slice(0, 200),
      status: task.status,
      priority: task.priority,
      estimatedMinutes: Number(task.estimatedMinutes) || 30,
      updatedAt: serverTimestamp()
    };

    if (task.description) payload.description = task.description.slice(0, 1000);
    if (task.difficulty) payload.difficulty = task.difficulty;
    if (task.actualMinutes !== undefined) payload.actualMinutes = Number(task.actualMinutes);
    if (task.scheduledTime) payload.scheduledTime = task.scheduledTime.slice(0, 50);
    if (task.tags) payload.tags = task.tags.slice(0, 20);
    if (task.notes) payload.notes = task.notes.slice(0, 1000);
    if (task.goalId) payload.goalId = task.goalId.slice(0, 128);
    if (task.milestoneId) payload.milestoneId = task.milestoneId.slice(0, 128);
    if (task.completedAt) payload.completedAt = task.completedAt.slice(0, 50);
    if (task.recurrence) payload.recurrence = task.recurrence;
    if (task.isPrivate !== undefined) payload.isPrivate = Boolean(task.isPrivate);

    if (!docSnap.exists()) {
      payload.createdAt = serverTimestamp();
      await setDoc(taskRef, payload);
    } else {
      await updateDoc(taskRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadTasksFromFirestore(userId: string): Promise<Task[]> {
  const path = `users/${userId}/tasks`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'tasks'));
    const tasks: Task[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const raw = JSON.stringify(data).toLowerCase();
      if (['alex', 'rahul', 'david', 'sam'].some(m => raw.includes(m))) {
        return;
      }
      tasks.push({
        id: data.id || docSnap.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        difficulty: data.difficulty,
        estimatedMinutes: data.estimatedMinutes,
        actualMinutes: data.actualMinutes,
        scheduledTime: data.scheduledTime,
        tags: data.tags || [],
        notes: data.notes
      });
    });
    return tasks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 9. Resource Bank Persistence
export async function saveResourceToFirestore(userId: string, resource: ResourceBankItem): Promise<void> {
  const path = `users/${userId}/resources/${resource.id}`;
  const resRef = doc(db, 'users', userId, 'resources', resource.id);

  try {
    const docSnap = await getDoc(resRef);
    const payload: any = {
      id: resource.id,
      userId,
      title: resource.title.slice(0, 200),
      url: resource.url.slice(0, 1000),
      category: resource.category,
      tags: resource.tags || [],
      includeInAIPrompts: Boolean(resource.includeInAIPrompts),
      updatedAt: serverTimestamp()
    };

    if (resource.description) payload.description = resource.description.slice(0, 500);
    if (resource.associatedGoalId) payload.associatedGoalId = resource.associatedGoalId.slice(0, 128);
    if (resource.associatedGoalTitle) payload.associatedGoalTitle = resource.associatedGoalTitle.slice(0, 200);
    if (resource.associatedStageId) payload.associatedStageId = resource.associatedStageId.slice(0, 128);
    if (resource.associatedStageName) payload.associatedStageName = resource.associatedStageName.slice(0, 200);

    if (!docSnap.exists()) {
      payload.createdAt = serverTimestamp();
      await setDoc(resRef, payload);
    } else {
      await updateDoc(resRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteResourceFromFirestore(userId: string, resourceId: string): Promise<void> {
  const path = `users/${userId}/resources/${resourceId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'resources', resourceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadResourcesFromFirestore(userId: string): Promise<ResourceBankItem[]> {
  const path = `users/${userId}/resources`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'resources'));
    const items: ResourceBankItem[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: data.id || docSnap.id,
        title: data.title,
        url: data.url,
        category: data.category,
        description: data.description,
        associatedGoalId: data.associatedGoalId,
        associatedGoalTitle: data.associatedGoalTitle,
        associatedStageId: data.associatedStageId,
        associatedStageName: data.associatedStageName,
        tags: data.tags || [],
        includeInAIPrompts: data.includeInAIPrompts ?? true,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
