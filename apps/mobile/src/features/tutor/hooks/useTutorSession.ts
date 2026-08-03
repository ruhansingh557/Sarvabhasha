import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { useTutorSessionStore } from '../store/tutorSessionStore';

/** Matches `PersonaKey` in packages/backend/convex/tutor.ts — not re-exported
 * from there, so mirrored here (a fixed, tiny, backend-defined enum, not
 * data that changes independently on either side). */
export type PersonaKey = 'dadi' | 'parent' | 'kid' | 'neighbour';

const DEFAULT_PERSONA_KEY: PersonaKey = 'dadi';

/**
 * Bootstraps (first use) or resumes (returning user) the learner's tutor
 * session. Client state is only the "which session id is active" pointer
 * (Zustand/MMKV, CLAUDE.md rule 7) — the session itself is Convex server
 * state, read reactively via `getSession`.
 *
 * A persisted sessionId can go stale two ways: the session row was deleted,
 * or it belongs to a different account that later signed into this same
 * device (`getSession` ownership-checks and returns `null` for both). Either
 * way this hook clears the stale pointer and starts a fresh session rather
 * than surfacing an error — the learner never sees this happen.
 */
export function useTutorSession(targetLanguage: string | undefined) {
  const sessionId = useTutorSessionStore((s) => s.sessionId);
  const setSessionId = useTutorSessionStore((s) => s.setSessionId);
  const clearSessionId = useTutorSessionStore((s) => s.clearSessionId);

  const session = useQuery(api.tutor.getSession, sessionId ? { sessionId } : 'skip');
  const startSession = useMutation(api.tutor.startSession);

  const startingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetLanguage) return;

    if (sessionId && session === null) {
      clearSessionId();
      return;
    }

    if (!sessionId && !startingRef.current) {
      startingRef.current = true;
      setError(null);
      startSession({ languageCode: targetLanguage, personaKey: DEFAULT_PERSONA_KEY })
        .then((id) => setSessionId(id))
        .catch((err) => setError(err instanceof Error ? err.message : String(err)))
        .finally(() => {
          startingRef.current = false;
        });
    }
  }, [targetLanguage, sessionId, session, startSession, setSessionId, clearSessionId]);

  const resolvedSessionId = session ? sessionId : null;

  return {
    sessionId: resolvedSessionId,
    personaKey: (session?.personaKey as PersonaKey | undefined) ?? DEFAULT_PERSONA_KEY,
    /** The session's own `languageCode`, authoritative over the `targetLanguage`
     * prop this hook was started with (they're the same value in practice —
     * `startSession` is called WITH `targetLanguage` — but reading it back off
     * the session row rather than re-threading the prop keeps every caller
     * pointed at one source of truth). `undefined` until the session loads. */
    languageCode: session?.languageCode as string | undefined,
    isLoading: !!targetLanguage && !resolvedSessionId && !error,
    error,
  };
}
