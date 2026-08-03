import { create } from 'zustand';

/**
 * Whether the learner has denied microphone permission THIS APP SESSION.
 * Deliberately NOT persisted (no MMKV, unlike `tutorSessionStore`) —
 * `expo-audio`'s `requestRecordingPermissionsAsync` reflects the OS-level
 * grant, which can change outside the app (Settings) at any time, so a
 * denial from three days ago shouldn't be remembered forever. This only
 * exists to satisfy one narrow requirement: don't re-prompt the system
 * permission dialog on every single mic tap once the learner has said no
 * once in this run of the app — check this flag first, and only fall
 * through to a fresh `requestRecordingPermissionsAsync()` call if it hasn't
 * been denied yet this session (or the app was restarted).
 */
interface MicPermissionState {
  deniedThisSession: boolean;
  markDenied: () => void;
  /** Called after a successful grant, in case the OS asks again later
   * (e.g. permission was revoked and re-granted mid-session) — resets the
   * "don't ask again" flag so a future denial is tracked freshly too. */
  markGranted: () => void;
}

export const useMicPermissionStore = create<MicPermissionState>((set) => ({
  deniedThisSession: false,
  markDenied: () => set({ deniedThisSession: true }),
  markGranted: () => set({ deniedThisSession: false }),
}));
