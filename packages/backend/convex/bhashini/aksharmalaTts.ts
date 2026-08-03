/**
 * Bhashini Text-to-Speech for Aksharmala script characters — AUTHORING TIME
 * ONLY. Same shared HTTP flow as `tts.ts`/`vocabularyTts.ts` via `./lib`.
 *
 * ONE clip per (script, character) — not per language, per
 * `aksharmala.ts`'s doc comment and schema.ts's `scriptCharacterAudio`
 * comment. The synthesized text is the character's own glyph (a single
 * letter/short syllable utterance, not a sentence) — `languageCode` is a
 * separate argument because Bhashini's TTS pipeline is keyed by language,
 * not script, and a script can serve several languages (see
 * `aksharmala.ts`'s header comment); the caller picks whichever live
 * language's TTS voice should read the glyph (`hi` for `devanagari` in this
 * pass).
 *
 * `internalAction` only, never a client-facing `action` — CLAUDE.md rule 10.
 */

import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { TTS_LANGUAGES } from '@sarvabhasha/shared';
import { getBhashiniCredentials, getTtsPipelineConfig, synthesizeTts, decodeBase64Audio } from './lib';

// ---------------------------------------------------------------- internals

/**
 * Resolves (script, character) → the row, same "narrow via script index,
 * filter in memory" shape as `aksharmala.ts`'s own (unexported)
 * `resolveCharacter` — duplicated here because that helper isn't exported
 * and this file needs it from inside an `internalQuery`.
 */
export const getScriptCharacterRow = internalQuery({
  args: { script: v.string(), character: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('scriptCharacters')
      .withIndex('by_script_order', (q) => q.eq('script', args.script))
      .collect();
    return rows.find((r) => r.character === args.character) ?? null;
  },
});

export const findExistingScriptCharacterAudio = internalQuery({
  args: { scriptCharacterId: v.id('scriptCharacters') },
  handler: async (ctx, args) =>
    await ctx.db
      .query('scriptCharacterAudio')
      .withIndex('by_character', (q) => q.eq('scriptCharacterId', args.scriptCharacterId))
      .first(),
});

// ------------------------------------------------------------------ actions

type GenerateScriptCharacterAudioResult =
  | { ok: false; reason: string }
  | { ok: true; skipped: true }
  | {
      ok: true;
      skipped: false;
      durationMs: number;
      bytes: number;
      gender: 'male' | 'female';
      storageId: Id<'_storage'>;
      /** Signed URL, returned purely so an authoring script can fetch the clip for review. */
      audioUrl: string | null;
    };

/**
 * Generate the ONE audio clip for a script character. Idempotent — skips if
 * audio already exists unless `force` is set.
 *
 * `languageCode` picks the Bhashini TTS voice (e.g. `hi` for `devanagari`),
 * NOT a field on `scriptCharacterAudio` itself — the row is script-scoped,
 * so only the row's language provenance lives in this call, not in storage.
 */
export const generateScriptCharacterAudio = internalAction({
  args: {
    script: v.string(),
    character: v.string(),
    languageCode: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<GenerateScriptCharacterAudioResult> => {
    if (!TTS_LANGUAGES.has(args.languageCode)) {
      return { ok: false as const, reason: `No Bhashini TTS voice for "${args.languageCode}"` };
    }

    const row: Doc<'scriptCharacters'> | null = await ctx.runQuery(
      internal.bhashini.aksharmalaTts.getScriptCharacterRow,
      { script: args.script, character: args.character },
    );
    if (!row) {
      return {
        ok: false as const,
        reason: `No character "${args.character}" for script "${args.script}"`,
      };
    }

    if (!args.force) {
      const existing: Doc<'scriptCharacterAudio'> | null = await ctx.runQuery(
        internal.bhashini.aksharmalaTts.findExistingScriptCharacterAudio,
        { scriptCharacterId: row._id },
      );
      if (existing) return { ok: true as const, skipped: true };
    }

    const gender = args.genderOverride ?? 'female';

    try {
      const creds = getBhashiniCredentials();
      const config = await getTtsPipelineConfig(args.languageCode, gender, creds);
      const base64 = await synthesizeTts(row.character, args.languageCode, gender, config, creds);
      const { bytes, durationMs } = decodeBase64Audio(base64);

      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));

      await ctx.runMutation(internal.aksharmala.upsertScriptCharacterAudio, {
        script: args.script,
        character: args.character,
        storageId,
        durationMs,
        source: 'bhashini',
      });

      const audioUrl = await ctx.storage.getUrl(storageId);
      return {
        ok: true as const,
        skipped: false,
        durationMs,
        bytes: bytes.length,
        gender,
        storageId,
        audioUrl,
      };
    } catch (err) {
      return { ok: false as const, reason: (err as Error).message };
    }
  },
});

/**
 * Fan out over a list of characters for ONE script, sequentially with a
 * delay — same rate-limiting reasoning as every other Bhashini batch action
 * in this codebase.
 */
export const generateScriptCharacterAudioForScript = internalAction({
  args: {
    script: v.string(),
    characters: v.array(v.string()),
    languageCode: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      character: string;
      ok: boolean;
      detail: string;
      audioUrl: string | null;
    }> = [];

    for (const character of args.characters) {
      const r = await ctx.runAction(internal.bhashini.aksharmalaTts.generateScriptCharacterAudio, {
        script: args.script,
        character,
        languageCode: args.languageCode,
        genderOverride: args.genderOverride,
        force: args.force,
      });

      results.push({
        character,
        ok: r.ok,
        detail: r.ok
          ? r.skipped
            ? 'already existed'
            : `${r.gender}, ${r.durationMs}ms, ${(r.bytes! / 1024).toFixed(0)}KB`
          : r.reason,
        audioUrl: r.ok && !r.skipped ? r.audioUrl : null,
      });

      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    return {
      script: args.script,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  },
});
