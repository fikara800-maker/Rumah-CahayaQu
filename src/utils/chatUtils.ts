import { useState, useEffect, useRef, useMemo } from 'react';
import { ChatMessage } from '../types';

/**
 * Deduplicates chat messages by ID and sorts them deterministically by timestamp and ID.
 */
export function deduplicateChats(chats: ChatMessage[] | undefined | null): ChatMessage[] {
  if (!chats || !Array.isArray(chats)) return [];
  const map = new Map<string, ChatMessage>();
  for (const c of chats) {
    if (c && c.id) {
      // If duplicate exists, prefer the one that is marked read
      const existing = map.get(c.id);
      if (!existing) {
        map.set(c.id, c);
      } else {
        const isExistingRead = existing.status === 'read' || existing.isRead === true;
        const isNewRead = c.status === 'read' || c.isRead === true;
        if (!isExistingRead && isNewRead) {
          map.set(c.id, c);
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}

export interface UnreadCountFilter {
  targetRole: 'parent' | 'teacher';
  studentIds?: string[];
  activeStudentId?: string;
}

/**
 * Centralized Single Source of Truth for unread messages count calculation.
 * Ensures deduplication and strict role filtering.
 */
export function getUnreadCount(
  chats: ChatMessage[] | undefined | null,
  filter: UnreadCountFilter
): number {
  if (!chats || !Array.isArray(chats)) return 0;
  
  const uniqueChats = deduplicateChats(chats);
  const seenIds = new Set<string>();
  let count = 0;

  for (const msg of uniqueChats) {
    if (!msg || !msg.id || seenIds.has(msg.id)) continue;
    seenIds.add(msg.id);

    const isUnread = msg.status !== 'read' && msg.isRead !== true;
    if (!isUnread) continue;

    if (filter.targetRole === 'parent') {
      // Parent only receives unread from 'guru'
      if (msg.sender !== 'guru') continue;
      // If studentIds provided, must match one of the parent's children (or broadcast if no studentId)
      if (filter.studentIds && filter.studentIds.length > 0) {
        if (msg.studentId && !filter.studentIds.includes(msg.studentId)) {
          continue;
        }
      }
      count++;
    } else if (filter.targetRole === 'teacher') {
      // Teacher only receives unread from 'orangtua'
      if (msg.sender !== 'orangtua') continue;
      // If studentIds pool provided, must match one of the teacher's pool of students
      if (filter.studentIds && filter.studentIds.length > 0) {
        if (msg.studentId && !filter.studentIds.includes(msg.studentId)) {
          continue;
        }
      }
      // If filtered by specific active student in view
      if (filter.activeStudentId) {
        if (msg.studentId && msg.studentId !== filter.activeStudentId) {
          continue;
        }
      }
      count++;
    }
  }

  return count;
}

/**
 * Custom React Hook that returns a debounced unread count (default 350ms)
 * to eliminate fast flashing and rapid consecutive re-renders.
 */
export function useDebouncedUnreadCount(
  chats: ChatMessage[] | undefined | null,
  filter: UnreadCountFilter,
  delayMs: number = 350
): number {
  // Stable filter memoization to prevent unnecessary recalculation
  const memoizedFilter = useMemo(() => ({
    targetRole: filter.targetRole,
    studentIds: filter.studentIds ? [...filter.studentIds].sort() : undefined,
    activeStudentId: filter.activeStudentId,
  }), [filter.targetRole, filter.studentIds?.join(','), filter.activeStudentId]);

  const rawCount = useMemo(() => {
    return getUnreadCount(chats, memoizedFilter);
  }, [chats, memoizedFilter]);

  const [debouncedCount, setDebouncedCount] = useState<number>(rawCount);
  const latestCountRef = useRef<number>(rawCount);
  latestCountRef.current = rawCount;

  useEffect(() => {
    // If rawCount immediately drops to 0 (e.g. user opened chat / marked as read), update immediately for snappy UX
    if (rawCount === 0) {
      setDebouncedCount(0);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedCount(latestCountRef.current);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [rawCount, delayMs]);

  return debouncedCount;
}

