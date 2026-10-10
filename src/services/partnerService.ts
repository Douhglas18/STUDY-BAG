import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { GroupMember, GroupActivity, PartnerRoom } from '../types';

const PARTNER_STORAGE_KEY = 'kairon_active_duo_room_id';
const BROADCAST_CHANNEL_NAME = 'kairon_partner_realtime_bridge';

// Setup BroadcastChannel for instant local cross-tab / cross-window synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this context:', e);
}

export function generateDuoRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PAIR-${code}`;
}

export function getUserPersonalRoomCode(userId?: string): string {
  if (!userId) return 'PAIR-DEMO';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffff;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt((hash >> (i * 5)) % chars.length);
  }
  return `PAIR-${code}`;
}

export function getStoredRoomId(): string | null {
  try {
    return localStorage.getItem(PARTNER_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredRoomId(roomId: string): void {
  try {
    localStorage.setItem(PARTNER_STORAGE_KEY, roomId);
  } catch {}
}

export function clearStoredRoomId(): void {
  try {
    localStorage.removeItem(PARTNER_STORAGE_KEY);
  } catch {}
}

function cleanFirestoreObject<T extends object>(data: T): any {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Automatically ensure that a user's personal duo room exists in Firestore with their current info
 * so any partner who pastes their room code can connect to them immediately.
 */
export async function ensureUserPersonalRoom(roomId: string, currentMember: GroupMember): Promise<void> {
  const cleanRoomId = roomId.trim().toUpperCase();
  const roomRef = doc(db, 'partner_rooms', cleanRoomId);

  const sanitizedMember = cleanFirestoreObject({
    ...currentMember,
    isOnline: true,
    isCurrentUser: false
  });

  try {
    const docSnap = await getDoc(roomRef);
    if (!docSnap.exists()) {
      await setDoc(roomRef, cleanFirestoreObject({
        roomId: cleanRoomId,
        creatorId: currentMember.id,
        members: [sanitizedMember],
        activityFeed: [{
          id: `act-${Date.now()}`,
          userId: currentMember.id,
          userName: currentMember.name,
          userAvatar: currentMember.avatar || '🎯',
          action: 'hosted the live accountability room',
          target: cleanRoomId,
          timestamp: 'Just now',
          reactions: [{ emoji: '🚀', count: 1 }]
        }],
        groupGoal: {
          title: 'Shared Focus Sprints',
          current: 0,
          target: 20,
          unit: 'blocks'
        },
        updatedAt: serverTimestamp()
      }));
    } else {
      const data = docSnap.data();
      const existingMembers: GroupMember[] = data.members || [];
      const updatedMembers = [
        ...existingMembers.filter(m => m.id !== currentMember.id && m.name !== currentMember.name),
        sanitizedMember
      ];
      await updateDoc(roomRef, cleanFirestoreObject({
        members: updatedMembers,
        updatedAt: serverTimestamp()
      }));
    }
  } catch (err) {
    console.warn('Notice ensuring user personal room in cloud:', err);
  }
}

/**
 * Join an existing duo/squad room or create a new room if it does not exist yet.
 */
export async function joinOrCreatePartnerRoom(roomId: string, currentMember: GroupMember): Promise<PartnerRoom> {
  const cleanRoomId = roomId.trim().toUpperCase();
  const roomRef = doc(db, 'partner_rooms', cleanRoomId);

  // Clean member record to store in cloud
  const sanitizedMember: GroupMember = {
    ...currentMember,
    isOnline: true,
    isCurrentUser: false // In the room, each viewer interprets their own isCurrentUser
  };

  try {
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const existingMembers: GroupMember[] = data.members || [];
      
      // Update or add current user in members list
      const updatedMembers = [
        ...existingMembers.filter(m => m.id !== currentMember.id && m.name !== currentMember.name),
        sanitizedMember
      ];

      const joinActivity: GroupActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: currentMember.id,
        userName: currentMember.name,
        userAvatar: currentMember.avatar || '🎯',
        action: 'connected to the live focus session',
        target: cleanRoomId,
        timestamp: 'Just now',
        reactions: [{ emoji: '🔥', count: 1 }]
      };

      const updatedFeed = [joinActivity, ...(data.activityFeed || [])].slice(0, 30);

      const updatedRoom: PartnerRoom = {
        roomId: cleanRoomId,
        creatorId: data.creatorId || currentMember.id,
        members: updatedMembers,
        activityFeed: updatedFeed,
        groupGoal: data.groupGoal || {
          title: 'Shared Focus Sprints',
          current: 0,
          target: 20,
          unit: 'blocks'
        },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(roomRef, cleanFirestoreObject({
        members: updatedMembers,
        activityFeed: updatedFeed,
        updatedAt: serverTimestamp()
      }));

      setStoredRoomId(cleanRoomId);

      // Broadcast across tabs
      broadcastChannel?.postMessage({
        type: 'ROOM_UPDATED',
        room: updatedRoom
      });

      return updatedRoom;
    } else {
      // Create fresh room
      const initialActivity: GroupActivity = {
        id: `act-${Date.now()}`,
        userId: currentMember.id,
        userName: currentMember.name,
        userAvatar: currentMember.avatar || '🎯',
        action: 'created the live accountability room',
        target: cleanRoomId,
        timestamp: 'Just now',
        reactions: [{ emoji: '🚀', count: 1 }]
      };

      const newRoom: PartnerRoom = {
        roomId: cleanRoomId,
        creatorId: currentMember.id,
        members: [sanitizedMember],
        activityFeed: [initialActivity],
        groupGoal: {
          title: 'Shared Focus Sprints',
          current: 0,
          target: 20,
          unit: 'blocks'
        },
        updatedAt: new Date().toISOString()
      };

      await setDoc(roomRef, cleanFirestoreObject({
        roomId: cleanRoomId,
        creatorId: currentMember.id,
        members: [sanitizedMember],
        activityFeed: [initialActivity],
        groupGoal: newRoom.groupGoal,
        updatedAt: serverTimestamp()
      }));

      setStoredRoomId(cleanRoomId);

      // Broadcast across tabs
      broadcastChannel?.postMessage({
        type: 'ROOM_UPDATED',
        room: newRoom
      });

      return newRoom;
    }
  } catch (error) {
    console.error('Error joining or creating partner room in Firestore:', error);
    // Local fallback for offline/preview
    const localRoom: PartnerRoom = {
      roomId: cleanRoomId,
      creatorId: currentMember.id,
      members: [sanitizedMember],
      activityFeed: [],
      updatedAt: new Date().toISOString()
    };
    setStoredRoomId(cleanRoomId);
    broadcastChannel?.postMessage({
      type: 'ROOM_UPDATED',
      room: localRoom
    });
    return localRoom;
  }
}

/**
 * Subscribe to real-time room updates via Firestore onSnapshot + BroadcastChannel.
 */
export function subscribeToPartnerRoom(
  roomId: string, 
  currentUserId: string,
  onUpdate: (room: PartnerRoom | null) => void
): () => void {
  const cleanRoomId = roomId.trim().toUpperCase();
  const roomRef = doc(db, 'partner_rooms', cleanRoomId);

  let isSubscribed = true;

  // 1. Listen via Firestore Snapshot
  const unsubFirestore = onSnapshot(roomRef, (snapshot) => {
    if (!isSubscribed) return;
    if (snapshot.exists()) {
      const data = snapshot.data();
      const rawMembers: GroupMember[] = data.members || [];
      
      // Tag current user correctly for the viewing client
      const members = rawMembers.map(m => ({
        ...m,
        isCurrentUser: m.id === currentUserId
      }));

      const roomData: PartnerRoom = {
        roomId: cleanRoomId,
        creatorId: data.creatorId || '',
        members,
        activityFeed: data.activityFeed || [],
        groupGoal: data.groupGoal,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      onUpdate(roomData);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.warn('Partner room onSnapshot listener notice:', err.message);
  });

  // 2. Listen via BroadcastChannel for instant local cross-tab message updates
  const handleBroadcast = (event: MessageEvent) => {
    if (!isSubscribed) return;
    if (event.data?.type === 'ROOM_UPDATED' && event.data.room?.roomId === cleanRoomId) {
      const bRoom: PartnerRoom = event.data.room;
      const members = bRoom.members.map(m => ({
        ...m,
        isCurrentUser: m.id === currentUserId
      }));
      onUpdate({ ...bRoom, members });
    }
  };

  broadcastChannel?.addEventListener('message', handleBroadcast);

  return () => {
    isSubscribed = false;
    unsubFirestore();
    broadcastChannel?.removeEventListener('message', handleBroadcast);
  };
}

/**
 * Push real-time status update for current member to the active duo room.
 */
export async function pushMemberStatusUpdate(
  roomId: string, 
  memberUpdate: Partial<GroupMember> & { id: string }
): Promise<void> {
  const cleanRoomId = roomId.trim().toUpperCase();
  const roomRef = doc(db, 'partner_rooms', cleanRoomId);

  try {
    const docSnap = await getDoc(roomRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const members: GroupMember[] = data.members || [];
    
    const updatedMembers = members.map(m => {
      if (m.id === memberUpdate.id) {
        return { ...m, ...memberUpdate };
      }
      return m;
    });

    await updateDoc(roomRef, cleanFirestoreObject({
      members: updatedMembers,
      updatedAt: serverTimestamp()
    }));

    broadcastChannel?.postMessage({
      type: 'ROOM_UPDATED',
      room: {
        ...data,
        roomId: cleanRoomId,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.warn('Failed to push member status to partner room:', error);
  }
}

/**
 * Send real-time high-five or nudge to partner.
 */
export async function sendPartnerAccountabilityPing(
  roomId: string,
  sender: { id: string; name: string; avatar?: string },
  recipientName: string,
  message: string,
  type: 'nudge' | 'high_five'
): Promise<void> {
  const cleanRoomId = roomId.trim().toUpperCase();
  const roomRef = doc(db, 'partner_rooms', cleanRoomId);

  const newActivity: GroupActivity = {
    id: `ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: sender.id,
    userName: sender.name,
    userAvatar: sender.avatar || (type === 'high_five' ? '🙌' : '🔥'),
    action: type === 'high_five' 
      ? `sent a High-Five to ${recipientName}: "${message}"`
      : `sent an Accountability Nudge to ${recipientName}: "${message}"`,
    target: recipientName,
    timestamp: 'Just now',
    reactions: [{ emoji: type === 'high_five' ? '🙌' : '⚡', count: 1 }]
  };

  try {
    const docSnap = await getDoc(roomRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const currentFeed: GroupActivity[] = data.activityFeed || [];
      const updatedFeed = [newActivity, ...currentFeed].slice(0, 30);

      await updateDoc(roomRef, {
        activityFeed: updatedFeed,
        updatedAt: serverTimestamp()
      });

      broadcastChannel?.postMessage({
        type: 'ROOM_UPDATED',
        room: {
          ...data,
          activityFeed: updatedFeed
        }
      });
    }
  } catch (error) {
    console.warn('Failed to record accountability ping in cloud:', error);
  }
}

/**
 * Disconnect/leave a partner room.
 */
export async function leavePartnerRoom(roomId: string, memberId: string): Promise<void> {
  const cleanRoomId = roomId.trim().toUpperCase();
  const roomRef = doc(db, 'partner_rooms', cleanRoomId);
  clearStoredRoomId();

  try {
    const docSnap = await getDoc(roomRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const members: GroupMember[] = data.members || [];
      const remainingMembers = members.filter(m => m.id !== memberId);

      await updateDoc(roomRef, {
        members: remainingMembers,
        updatedAt: serverTimestamp()
      });

      broadcastChannel?.postMessage({
        type: 'ROOM_UPDATED',
        room: {
          ...data,
          members: remainingMembers
        }
      });
    }
  } catch (error) {
    console.warn('Error leaving partner room:', error);
  }
}
