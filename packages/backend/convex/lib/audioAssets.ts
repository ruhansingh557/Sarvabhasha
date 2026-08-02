/**
 * Provider-agnostic `audioAssets` helpers, shared by every TTS provider
 * (`bhashini/tts.ts`, `google/tts.ts`, ...). One (phrase, language) pair gets
 * at most one live audio row regardless of which provider produced it —
 * `source` records which one did.
 *
 * These are `internalQuery`/`internalMutation`, not plain helpers like
 * `lib/currentUser.ts` or `lib/liveContent.ts`, because they're called via
 * `ctx.runQuery`/`ctx.runMutation` from `internalAction`s (actions have no
 * `ctx.db`). Living here — not inside `bhashini/tts.ts` — is what lets
 * `google/tts.ts` reuse the exact same idempotency check and insert path
 * instead of duplicating them and risking the two providers' bookkeeping
 * drifting apart.
 */

import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';
import { audioSource } from '../schema';

/** Idempotency check every provider's `generateAudioForPhrase*` must run before spending a call. */
export const findExistingAudio = internalQuery({
  args: { phraseId: v.id('phrases'), languageCode: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query('audioAssets')
      .withIndex('by_phrase_language', (q) =>
        q.eq('phraseId', args.phraseId).eq('languageCode', args.languageCode),
      )
      .first(),
});

export const insertAudioAsset = internalMutation({
  args: {
    phraseId: v.id('phrases'),
    languageCode: v.string(),
    storageId: v.id('_storage'),
    voiceGender: v.union(v.literal('male'), v.literal('female')),
    durationMs: v.number(),
    source: audioSource,
  },
  returns: v.id('audioAssets'),
  handler: async (ctx, args) =>
    await ctx.db.insert('audioAssets', {
      ...args,
      // Lands as draft. A human listens before it reaches a learner —
      // machine TTS mispronounces, and only a speaker of the language knows.
      status: 'draft',
    }),
});
