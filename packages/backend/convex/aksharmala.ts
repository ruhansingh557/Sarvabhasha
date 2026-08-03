import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import { contentStatus, scriptCharacterType } from './schema';
import {
  getLiveScriptCharacterAudio,
  getLiveScriptCharactersForScript,
} from './lib/liveContent';

/**
 * Aksharmala (the alphabet) content for the Learn tab — see
 * plans/phase-13-foundations-vocab-numbers-alphabet.md.
 *
 * Keyed by SCRIPT, not `languageCode` — `devanagari` alone serves hi, mr, ne,
 * sa, kok, doi, mai, and brx, so one script's character set is built once and
 * reused across every language that shares it (`schema.ts`'s
 * `scriptCharacters` comment). There is therefore no per-language gate here
 * the way `phrases.ts`/`vocabulary.ts` have one: a character and its audio
 * either are or are not ready for its SCRIPT, full stop.
 *
 * Held to a stricter review bar than phrase or vocabulary content — the
 * alphabet is maximally checkable by any literate speaker of the script, so
 * a wrong or partial character set is a trust failure, not a stylistic
 * quibble. See the plan doc's "what to avoid" item 3.
 */

// ------------------------------------------------------------- client-facing

const scriptCharacterListItem = v.object({
  scriptCharacterId: v.id('scriptCharacters'),
  character: v.string(),
  characterType: scriptCharacterType,
  romanization: v.string(),
  exampleWord: v.optional(v.string()),
  exampleTransliteration: v.optional(v.string()),
  sortOrder: v.number(),
  audioUrl: v.union(v.string(), v.null()),
  durationMs: v.union(v.number(), v.null()),
});

/**
 * Live characters for one script, in `sortOrder` — the sequence a flashcard
 * screen steps through. No auth check: unlike a learner's own progress, a
 * script's character set is public reference content with no per-user data
 * in it, so there is nothing to scope by identity (Rule 1 is about never
 * trusting a client-supplied `userId`, not about withholding a content
 * selector like `script` — the mobile client resolves `script` itself from
 * the learner's own `targetLanguage` via `@sarvabhasha/shared`'s
 * `languages.ts`, this query just serves whatever script it's asked for).
 *
 * `audioUrl`/`durationMs` are `null` when the character has no `live` audio
 * yet — a real state, not a missing-data bug, exactly like
 * `phrases.getDetail`'s `animationUrl`. The client should treat a null
 * `audioUrl` as "don't show a broken play button" (see the plan doc's "what
 * to avoid" item 4), not throw.
 */
export const listCharactersForScript = query({
  args: { script: v.string() },
  returns: v.array(scriptCharacterListItem),
  handler: async (ctx, args) => {
    const characters = await getLiveScriptCharactersForScript(ctx, args.script);
    characters.sort((a, b) => a.sortOrder - b.sortOrder);

    const items = [];
    for (const character of characters) {
      const audio = await getLiveScriptCharacterAudio(ctx, character._id);
      items.push({
        scriptCharacterId: character._id,
        character: character.character,
        characterType: character.characterType,
        romanization: character.romanization,
        exampleWord: character.exampleWord,
        exampleTransliteration: character.exampleTransliteration,
        sortOrder: character.sortOrder,
        audioUrl: audio ? await ctx.storage.getUrl(audio.storageId) : null,
        durationMs: audio ? audio.durationMs : null,
      });
    }
    return items;
  },
});

// -------------------------------------------------------- authoring / admin

/**
 * Same unreachable-by-clients reasoning as `vocabulary.ts`'s authoring
 * mutations: every export below is an `internalMutation`, driven only by
 * `npx convex run` or the content pipeline's own actions.
 *
 * `resolveCharacter` narrows via the indexed `by_script_order` range first
 * (bounded to one script's own character count, ~30–50 — see the plan doc),
 * then filters in memory for the exact glyph — same "index narrows, filter
 * finishes" shape as `vocabulary.ts`'s `resolveItem`, and for the same
 * reason: nothing else in this file needs a dedicated `by_character` index
 * on `scriptCharacters` to justify adding one.
 */
async function resolveCharacter(ctx: QueryCtx, script: string, character: string) {
  const characters = await ctx.db
    .query('scriptCharacters')
    .withIndex('by_script_order', (q) => q.eq('script', script))
    .collect();
  const match = characters.find((c) => c.character === character);
  if (!match) {
    throw new Error(
      `No character "${character}" for script "${script}" — run upsertScriptCharacter first.`,
    );
  }
  return match;
}

/**
 * Idempotent upsert of one script character's content. Always re-lands as
 * `draft`, even on update — glyph/romanization/example text are exactly the
 * content a native-speaker reviewer must re-check after any edit, same
 * "changing the content invalidates the review" discipline as `seed.ts`'s
 * `seedTranslation` and `vocabulary.ts`'s upserts.
 */
export const upsertScriptCharacter = internalMutation({
  args: {
    script: v.string(),
    character: v.string(),
    characterType: scriptCharacterType,
    romanization: v.string(),
    exampleWord: v.optional(v.string()),
    exampleTransliteration: v.optional(v.string()),
    sortOrder: v.number(),
  },
  returns: v.id('scriptCharacters'),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('scriptCharacters')
      .withIndex('by_script_order', (q) => q.eq('script', args.script))
      .collect();
    const existing = rows.find((r) => r.character === args.character);

    const fields = {
      script: args.script,
      character: args.character,
      characterType: args.characterType,
      romanization: args.romanization,
      exampleWord: args.exampleWord,
      exampleTransliteration: args.exampleTransliteration,
      sortOrder: args.sortOrder,
      status: 'draft' as const,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert('scriptCharacters', fields);
  },
});

/**
 * Stores the ONE audio clip for a character, generated once via
 * `bhashini/tts.ts`'s `synthesize` pattern — never called at runtime
 * (CLAUDE.md rule 10). Single row per character, re-recorded in place
 * (upsert), same as `vocabulary.ts`'s `upsertVocabularyAudio` and
 * `audioAssets` — no `attempt`/model metadata, unlike `animations`.
 */
export const upsertScriptCharacterAudio = internalMutation({
  args: {
    script: v.string(),
    character: v.string(),
    storageId: v.id('_storage'),
    durationMs: v.number(),
    source: v.union(v.literal('bhashini'), v.literal('google-tts')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scriptCharacter = await resolveCharacter(ctx, args.script, args.character);

    const existing = await ctx.db
      .query('scriptCharacterAudio')
      .withIndex('by_character', (q) => q.eq('scriptCharacterId', scriptCharacter._id))
      .first();

    const fields = {
      scriptCharacterId: scriptCharacter._id,
      storageId: args.storageId,
      durationMs: args.durationMs,
      source: args.source,
      status: 'draft' as const,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert('scriptCharacterAudio', fields);
    }
    return null;
  },
});

/**
 * The approval gate for one character, after a reviewer has confirmed the
 * glyph/romanization/example AND listened to the audio. Flips BOTH the
 * character and its audio to `live` in one call — mirrors `seed.ts`'s
 * `approveTranslationAndAudio`, requiring the audio to already exist
 * (throws otherwise, same as that function) rather than allowing a
 * glyph-only approval with a dead play button — exactly the failure mode
 * the plan doc's "what to avoid" item 4 documents.
 *
 * There is no separate "promote the whole script" mutation, unlike
 * `vocabulary.ts`'s `promoteCategoryToLive` — a script has no row of its own
 * to promote (it's a string field, not an entity); a script's readiness is
 * simply the union of all its characters being individually `live`, which
 * `getScriptCoverage` below reports on.
 */
export const approveScriptCharacterAndAudio = internalMutation({
  args: { script: v.string(), character: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const scriptCharacter = await resolveCharacter(ctx, args.script, args.character);
    await ctx.db.patch(scriptCharacter._id, { status: 'live' });

    const audio = await ctx.db
      .query('scriptCharacterAudio')
      .withIndex('by_character', (q) => q.eq('scriptCharacterId', scriptCharacter._id))
      .first();
    if (!audio) {
      throw new Error(`No audio for character "${args.character}" (script "${args.script}")`);
    }
    await ctx.db.patch(audio._id, { status: 'live' });

    return null;
  },
});

const scriptCoverageRow = v.object({
  character: v.string(),
  characterType: scriptCharacterType,
  characterStatus: contentStatus,
  hasAudio: v.boolean(),
  audioStatus: v.union(contentStatus, v.null()),
  ready: v.boolean(),
});

/**
 * Coverage dashboard for one script — same "completeness before promoting"
 * shape as `review.ts`'s `getCategoryCoverage` and `vocabulary.ts`'s
 * `getCategoryCoverage`. Returns ALL statuses (admin-only, not learner-
 * facing) so gaps are visible, not just what's already live.
 *
 * `canPromote` reports whether every ROW CURRENTLY SEEDED is ready — it
 * cannot verify that the full, CORRECT character set for the script has
 * been entered at all (that is a human judgment against an authoritative
 * source, per the plan doc's "what to avoid" item 3). A script with 15 of
 * 46 characters seeded and all 15 `live` reports `canPromote: true` here;
 * shipping it anyway would repeat exactly the mistake this feature exists
 * to avoid. Cross-check row COUNT against the authoritative character-set
 * size before treating this as a green light.
 */
export const getScriptCoverage = query({
  args: { script: v.string() },
  returns: v.object({
    script: v.string(),
    rows: v.array(scriptCoverageRow),
    total: v.number(),
    ready: v.number(),
    canPromote: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const characters = await ctx.db
      .query('scriptCharacters')
      .withIndex('by_script_order', (q) => q.eq('script', args.script))
      .collect();
    characters.sort((a, b) => a.sortOrder - b.sortOrder);

    const rows = await Promise.all(
      characters.map(async (c) => {
        const audio = await ctx.db
          .query('scriptCharacterAudio')
          .withIndex('by_character', (q) => q.eq('scriptCharacterId', c._id))
          .first();

        return {
          character: c.character,
          characterType: c.characterType,
          characterStatus: c.status,
          hasAudio: !!audio,
          audioStatus: audio?.status ?? null,
          ready: c.status === 'live' && audio?.status === 'live',
        };
      }),
    );

    return {
      script: args.script,
      rows,
      total: rows.length,
      ready: rows.filter((r) => r.ready).length,
      canPromote: rows.length > 0 && rows.every((r) => r.ready),
    };
  },
});
