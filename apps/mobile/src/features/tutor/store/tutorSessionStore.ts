import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { Id } from '@backend/_generated/dataModel';

/**
 * Client state = only the "which tutor session is active" pointer
 * (CLAUDE.md rule 7: server state is Convex, client state is
 * Zustand/MMKV-persisted). Everything ABOUT the session — messages,
 * persona, rollingSummary, ownership — lives in Convex and is read via
 * `useTutorSession`'s `getSession` query, never duplicated here.
 *
 * This is the app's first Zustand store; no existing pattern to match
 * beyond the hard rule itself, so the shape is deliberately minimal.
 */

const mmkv = new MMKV({ id: 'tutor-session-store' });

const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.delete(name),
};

interface TutorSessionState {
  sessionId: Id<'tutorSessions'> | null;
  setSessionId: (sessionId: Id<'tutorSessions'>) => void;
  clearSessionId: () => void;
}

export const useTutorSessionStore = create<TutorSessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      setSessionId: (sessionId) => set({ sessionId }),
      clearSessionId: () => set({ sessionId: null }),
    }),
    {
      name: 'tutor-session-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
