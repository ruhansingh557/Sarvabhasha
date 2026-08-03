/**
 * Google Cloud TTS (Chirp3-HD) trial for Aksharmala script-character audio —
 * A SAMPLE COMPARISON, NOT A REGENERATION. Authoring-time only.
 *
 * SUPERSEDED as the promotion path: the project owner listened to this
 * trial's clips and picked Google Chirp3-HD for Devanagari, so the real,
 * permanent generator now lives in `google/aksharmalaTts.ts` (wired into
 * `scriptCharacterAudio`, invoked via `scripts/phase13/run.ts`'s
 * `gen-audio-characters`). This file is kept only as a reusable A/B
 * mechanism for any FUTURE script/engine comparison — it deliberately still
 * writes nothing to `scriptCharacterAudio`, so it stays safe to run again
 * without touching live content.
 *
 * Context: even after two prior fixes this session to the Bhashini clips —
 * switching from a bare glyph to the "<character> से <exampleWord>" mnemonic
 * phrase, then slowing pace via Bhashini's `speed: 0.6` config field — the
 * project owner still found some Aksharmala letters unclear (see
 * `bhashini/aksharmalaTts.ts`'s header for that history). This module tries
 * ONE alternative: the SAME mnemonic text, synthesized by Google Cloud TTS's
 * Chirp3-HD engine (already proven in production for mr/gu/ur lesson-phrase
 * audio, see `google/tts.ts`) at a comparable pace, so the owner can actually
 * A/B listen before anything changes.
 *
 * DELIBERATELY NOT a regeneration of all 49 characters (CLAUDE.md rule 9 /
 * the content-pipeline-engineer's "pilot before catalog" rule, scaled down to
 * a comparison of two ENGINES rather than two prompts on a small sample).
 * DELIBERATELY NOT wired into `scriptCharacterAudio` at all — every clip
 * generated here is a bare Convex file-storage blob with NO row in any table
 * pointing at it: not `draft`, not `live`, not referenced by
 * `listCharactersForScript` or anywhere else the mobile client or admin
 * console could read it. That is the simplest possible guarantee this trial
 * cannot leak to a learner — there is no wiring to remove later, because none
 * was added. The only way to reach a clip is the signed URL these actions
 * hand back directly to whoever ran them (`convex run`'s stdout).
 *
 * Reuses rather than duplicates:
 *   - `internal.bhashini.aksharmalaTts.getScriptCharacterRow` /
 *     `findExistingScriptCharacterAudio` — the exact (script, character) →
 *     row and → live-audio lookups the Bhashini path already uses, so the
 *     live Bhashini clip for the same character can be reported alongside
 *     the trial clip for a direct A/B, read-only.
 *   - `buildSynthesisText` from `bhashini/aksharmalaTts.ts` — the SAME
 *     "<character> से <exampleWord>" phrasing already established, so this
 *     trial compares TTS ENGINES, not prompts.
 *   - `synthesize`/`getGoogleTtsKey`/`GOOGLE_VOICES` from `./tts.ts` — the
 *     same Chirp3-HD call already proven for mr/gu/ur, extended with an
 *     optional `speakingRate` there rather than forked here.
 *
 * `internalAction` only — never client-facing, same as every other
 * authoring-time generator in this pipeline (root CLAUDE.md rule 10).
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { buildSynthesisText } from '../bhashini/aksharmalaTts';
import { synthesize, getGoogleTtsKey, GOOGLE_VOICES } from './tts';

// ------------------------------------------------------------------ actions

/**
 * Live-verifies that the Chirp3-HD voice names `google/tts.ts` hardcodes for
 * a locale actually exist on Google's `voices.list` endpoint right now — the
 * same live check the gu-IN/ur-IN wiring got (see `tts.ts`'s comment on
 * `GOOGLE_VOICES`), which hi-IN had NOT yet gotten (it was only checked
 * against Google's Chirp3-HD docs page, not called live). Returns every
 * voice Google reports for the locale, not just the two this codebase uses,
 * so a mismatch (wrong name, wrong gender mapping) is visible rather than
 * silently swallowed by a narrow filter.
 */
export const verifyGoogleVoicesForLocale = internalAction({
  args: { locale: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = getGoogleTtsKey();
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?languageCode=${encodeURIComponent(args.locale)}&key=${apiKey}`,
    );
    if (!res.ok) {
      throw new Error(`voices.list failed: ${res.status} — ${await res.text()}`);
    }
    const data = await res.json();
    const voices = (data.voices ?? []) as Array<{
      name: string;
      ssmlGender: string;
      naturalSampleRateHertz: number;
    }>;
    return voices.map((voice) => ({
      name: voice.name,
      ssmlGender: voice.ssmlGender,
      naturalSampleRateHertz: voice.naturalSampleRateHertz,
    }));
  },
});

type TrialClipResult =
  | { ok: false; character: string; reason: string }
  | {
      ok: true;
      character: string;
      synthesisText: string;
      charCount: number;
      voiceName: string;
      speakingRate: number;
      durationMs: number;
      bytes: number;
      storageId: Id<'_storage'>;
      /** Signed URL to the NEW Google clip — for A/B listening only, nothing reads this from a table. */
      trialUrl: string | null;
      /** The character's EXISTING live Bhashini clip, for direct comparison — read-only, untouched. */
      liveBhashiniUrl: string | null;
      liveBhashiniDurationMs: number | null;
    };

/**
 * Generates ONE trial clip for a script character via Google Cloud TTS,
 * using the identical mnemonic phrasing the live Bhashini clip for that same
 * character uses, and reports the live Bhashini clip's URL/duration
 * alongside it for a same-character A/B. Writes NOTHING to
 * `scriptCharacterAudio` — the storage blob this creates is orphaned by
 * design (see file header).
 */
export const generateAksharmalaTrialClip = internalAction({
  args: {
    script: v.string(),
    character: v.string(),
    languageCode: v.string(),
    /** Google's documented linear rate, e.g. 0.6 to match Bhashini's `TTS_SPEED`. */
    speakingRate: v.number(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
  },
  handler: async (ctx, args): Promise<TrialClipResult> => {
    const row: Doc<'scriptCharacters'> | null = await ctx.runQuery(
      internal.bhashini.aksharmalaTts.getScriptCharacterRow,
      { script: args.script, character: args.character },
    );
    if (!row) {
      return {
        ok: false,
        character: args.character,
        reason: `No character "${args.character}" for script "${args.script}"`,
      };
    }

    const gender = args.genderOverride ?? 'female';
    const synthesisText = buildSynthesisText(row.character, row.exampleWord, args.languageCode);

    // Read-only lookup of the character's LIVE Bhashini clip, purely so the
    // caller gets both URLs back together. Never patched, never touched.
    const existingAudio: Doc<'scriptCharacterAudio'> | null = await ctx.runQuery(
      internal.bhashini.aksharmalaTts.findExistingScriptCharacterAudio,
      { scriptCharacterId: row._id },
    );
    const liveBhashiniUrl = existingAudio ? await ctx.storage.getUrl(existingAudio.storageId) : null;
    const liveBhashiniDurationMs = existingAudio ? existingAudio.durationMs : null;

    try {
      const apiKey = getGoogleTtsKey();
      const voiceName = GOOGLE_VOICES[args.languageCode]?.[gender] ?? 'unknown';
      const base64 = await synthesize(
        synthesisText,
        args.languageCode,
        gender,
        apiKey,
        args.speakingRate,
      );

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      // Stored as a bare blob — no `scriptCharacterAudio` row created or
      // patched. See file header for why this is the safety mechanism.
      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));

      // LINEAR16 24kHz 16-bit mono — Google Cloud TTS's default sample rate
      // (same estimate `google/tts.ts`'s live fallback path uses).
      const durationMs = Math.round((bytes.length / (24000 * 2)) * 1000);
      const trialUrl = await ctx.storage.getUrl(storageId);

      return {
        ok: true,
        character: args.character,
        synthesisText,
        charCount: synthesisText.length,
        voiceName,
        speakingRate: args.speakingRate,
        durationMs,
        bytes: bytes.length,
        storageId,
        trialUrl,
        liveBhashiniUrl,
        liveBhashiniDurationMs,
      };
    } catch (err) {
      return { ok: false, character: args.character, reason: (err as Error).message };
    }
  },
});

/**
 * Fans the single-clip trial out over a small sample of characters for one
 * script — sequential with a delay, same rate-limiting posture as every
 * other batch action in this codebase (`bhashini/aksharmalaTts.ts`'s
 * `generateScriptCharacterAudioForScript`). Also totals the character count
 * actually sent to Google, so cost can be confirmed against the Chirp3-HD
 * rate (root CLAUDE.md's cost table: $30 / 1M characters, 1M free/month)
 * instead of assumed.
 */
export const runAksharmalaTrialBatch = internalAction({
  args: {
    script: v.string(),
    characters: v.array(v.string()),
    languageCode: v.string(),
    speakingRate: v.number(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
  },
  handler: async (ctx, args) => {
    const results: TrialClipResult[] = [];

    for (const character of args.characters) {
      const r: TrialClipResult = await ctx.runAction(
        internal.google.aksharmalaTtsTrial.generateAksharmalaTrialClip,
        {
          script: args.script,
          character,
          languageCode: args.languageCode,
          speakingRate: args.speakingRate,
          genderOverride: args.genderOverride,
        },
      );
      results.push(r);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const totalCharCount = results.reduce((sum, r) => sum + (r.ok ? r.charCount : 0), 0);

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
