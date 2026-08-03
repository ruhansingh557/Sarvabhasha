import { useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import type { PersonaKey } from './useTutorSession';

/**
 * Thin wrapper around `personaAnimations.getLiveClipsForCharacter` (CLAUDE.md
 * rule 9 — a component may call `useQuery` from a feature hook wrapper, not
 * build query args inline). Returns `undefined` while loading, or an object
 * whose four expression keys are each a signed clip URL or `null` (no
 * approved clip for that expression yet — the normal state for personas
 * other than Dadi, and even for Dadi until every expression has one).
 *
 * `tutorMessages` doesn't yet persist Gemini's `expression` field (see
 * specs/ai-tutor.md's "scaffolding, not a feature" section), so every caller
 * of this hook today only ever requests/renders the `neutral` clip.
 */
export function usePersonaAnimations(characterSlug: PersonaKey) {
  return useQuery(api.personaAnimations.getLiveClipsForCharacter, { characterSlug });
}
