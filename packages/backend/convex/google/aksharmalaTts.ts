/**
 * Google Cloud TTS (Chirp3-HD) for Devanagari Aksharmala script-character
 * audio — the PRIMARY, PERMANENT generator for this (script, engine) pair.
 * Authoring time only, same as every other file in this pipeline.
 *
 * Why this file exists instead of `bhashini/aksharmalaTts.ts` calling Google
 * internally: this codebase's convention (see `bhashini/tts.ts` vs
 * `google/tts.ts` for lesson-phrase audio) is that each ENGINE gets its own
 * module — `bhashini/*.ts` only ever calls Bhashini, `google/*.ts` only ever
 * calls Google. Which engine is actually invoked for a given (script,
 * language) is a decision made at the CALL SITE (the `scripts/phase13/run.ts`
 * orchestrator), not buried inside a function that silently switches
 * providers. That mirrors the existing precedent one level up: Marathi/
 * Gujarati/Urdu LESSON-PHRASE audio is Google-primary while every other
 * language is Bhashini-primary, and the choice lives in which module the
 * orchestrator calls, not in a branch inside `bhashini/tts.ts`.
 *
 * ENGINE DECISION FOR DEVANAGARI AKSHARMALA, made explicit here:
 * `bhashini/aksharmalaTts.ts` remains the generator for any OTHER script's
 * character audio (should one be added later) — Bhashini is free and covers
 * more languages, so it stays the default. Devanagari specifically is
 * Google-primary as of 2026-08: two rounds of Bhashini prompt/pace fixes
 * (mnemonic phrasing, then `speed: 0.6`) still left some isolated-letter
 * clips reading as unclear to the project owner, and a direct 6-character
 * A/B trial (`google/aksharmalaTtsTrial.ts`) confirmed Google's Chirp3-HD
 * output has a materially cleaner noise floor at a comparable pace. This is
 * the SAME "Bhashini isn't good enough for this specific case" reasoning
 * that flipped gu/ur to Google at the language level — just triggered by
 * synthesis clarity on isolated letters rather than a sustained API failure.
 * This is a per-SCRIPT decision, not a per-language one, because
 * `scriptCharacterAudio` itself is script-scoped (`schema.ts`'s comment on
 * that table) — Devanagari serves hi/mr/ne/sa/kok/doi/mai/brx and all of
 * them get this one Google-synthesized clip per character.
 *
 * Reuses rather than duplicates:
 *   - `buildSynthesisText`/`TTS_SPEED` from `bhashini/aksharmalaTts.ts` — the
 *     SAME "<character> से <exampleWord>" mnemonic phrasing and the SAME 0.6
 *     pace the project owner heard and approved in the trial. This file
 *     changes the ENGINE only, never the prompt.
 *   - `getScriptCharacterRow`/`findExistingScriptCharacterAudio` from
 *     `bhashini/aksharmalaTts.ts` — identical (script, character) → row
 *     lookups, no reason for a second copy.
 *   - `synthesize`/`getGoogleTtsKey`/`GOOGLE_VOICES` from `./tts.ts` — the
 *     same Chirp3-HD call already proven for mr/gu/ur lesson-phrase audio.
 *   - `internal.aksharmala.upsertScriptCharacterAudio` — the SAME write path
 *     `bhashini/aksharmalaTts.ts` uses, with `source: 'google-tts'`. That
 *     mutation always re-lands the row as `draft` on write (see
 *     `aksharmala.ts`), so switching a character's audio from Bhashini to
 *     Google correctly demotes it back through the human approval gate
 *     rather than silently keeping a stale `live` status pointed at content
 *     nobody has reviewed (CLAUDE.md rule 14). Because that mutation always
 *     PATCHES the single existing `by_character` row in place rather than
 *     inserting a competing one, "one live row per character" is already
 *     structurally guaranteed here — there is never a second row to archive,
 *     unlike `personaAnimations`' multi-attempt table.
 *
 * `internalAction` only — never client-facing (CLAUDE.md rule 10).
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { buildSynthesisText, TTS_SPEED } from '../bhashini/aksharmalaTts';
import { synthesize, getGoogleTtsKey, GOOGLE_VOICES } from './tts';

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
      /** What was actually sent to Google — for reproducibility, not persisted on the row. */
      synthesisText: string;
      voiceName: string;
      speakingRate: number;
    };

/**
 * Generate (or regenerate) the ONE audio clip for a script character via
 * Google Chirp3-HD. Idempotent — skips if audio already exists unless
 * `force` is set, same contract as `bhashini/aksharmalaTts.ts`'s
 * `generateScriptCharacterAudio`. `force: true` is required to overwrite a
 * character that already has Bhashini-sourced audio, e.g. the one-time
 * Devanagari migration this file was built for.
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
    if (!(args.languageCode in GOOGLE_VOICES)) {
      return { ok: false as const, reason: `No Google TTS voice for "${args.languageCode}"` };
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
    const synthesisText = buildSynthesisText(row.character, row.exampleWord, args.languageCode);

    try {
      const apiKey = getGoogleTtsKey();
      const voiceName = GOOGLE_VOICES[args.languageCode]?.[gender] ?? 'unknown';
      const base64 = await synthesize(synthesisText, args.languageCode, gender, apiKey, TTS_SPEED);

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));

      // LINEAR16 24kHz 16-bit mono — Google Cloud TTS's default sample rate
      // (same estimate `google/tts.ts`'s live phrase-fallback path uses).
      const durationMs = Math.round((bytes.length / (24000 * 2)) * 1000);

      await ctx.runMutation(internal.aksharmala.upsertScriptCharacterAudio, {
        script: args.script,
        character: args.character,
        storageId,
        durationMs,
        source: 'google-tts',
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
        synthesisText,
        voiceName,
        speakingRate: TTS_SPEED,
      };
    } catch (err) {
      return { ok: false as const, reason: (err as Error).message };
    }
  },
});

/**
 * Fan out over a list of characters for ONE script, sequentially with a
 * delay — same rate-limiting posture as every other batch action in this
 * codebase (`bhashini/aksharmalaTts.ts`'s `generateScriptCharacterAudioForScript`).
 * Also totals the character count actually sent to Google, so cost can be
 * confirmed against the Chirp3-HD rate (root CLAUDE.md's cost table: $30 /
 * 1M characters, 1M free/month) instead of assumed.
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
      charCount: number;
    }> = [];

    for (const character of args.characters) {
      const r: GenerateScriptCharacterAudioResult = await ctx.runAction(
        internal.google.aksharmalaTts.generateScriptCharacterAudio,
        {
          script: args.script,
          character,
          languageCode: args.languageCode,
          genderOverride: args.genderOverride,
          force: args.force,
        },
      );

      results.push({
        character,
        ok: r.ok,
        detail: r.ok
          ? r.skipped
            ? 'already existed'
            : `${r.gender}, ${r.durationMs}ms, ${(r.bytes! / 1024).toFixed(0)}KB, voice=${r.voiceName}, rate=${r.speakingRate}, text="${r.synthesisText}"`
          : r.reason,
        audioUrl: r.ok && !r.skipped ? r.audioUrl : null,
        charCount: r.ok && !r.skipped ? r.synthesisText.length : 0,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const totalCharCount = results.reduce((sum, r) => sum + r.charCount, 0);

    return {
      script: args.script,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      totalCharCount,
      estimatedCostUsd: (totalCharCount / 1_000_000) * 30,
      results,
    };
  },
});
