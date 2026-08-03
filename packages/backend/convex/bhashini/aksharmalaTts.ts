/**
 * Bhashini Text-to-Speech for Aksharmala script characters — AUTHORING TIME
 * ONLY. Same shared HTTP flow as `tts.ts`/`vocabularyTts.ts` via `./lib`.
 *
 * ONE clip per (script, character) — not per language, per
 * `aksharmala.ts`'s doc comment and schema.ts's `scriptCharacterAudio`
 * comment. `languageCode` is a separate argument because Bhashini's TTS
 * pipeline is keyed by language, not script, and a script can serve several
 * languages (see `aksharmala.ts`'s header comment); the caller picks
 * whichever live language's TTS voice should read the clip (`hi` for
 * `devanagari` in this pass).
 *
 * The synthesized text is NOT the bare glyph. A single isolated character
 * (e.g. just "अ") is an inherently hard synthesis case — a TTS model trained
 * on continuous natural speech, given ~0.3s of audio to produce, articulates
 * it rushed and unclear (confirmed 2026-08 by downloading and ffprobe-ing
 * actual generated clips: valid, non-corrupted WAV, just too short to be
 * legible). `buildSynthesisText` below instead synthesizes the standard
 * Hindi pedagogical mnemonic every primary school teaches with — "<character>
 * से <exampleWord>" (e.g. "अ से अनार", "A, as in Anaar") — giving Bhashini a
 * real, natural Hindi utterance instead of an isolated phone. This is also
 * pedagogically correct on its own terms: a bare letter with no context
 * teaches less than the standard mnemonic. See `MNEMONIC_CONNECTOR` for why
 * this only applies to languages we have a confirmed "as in" convention for.
 *
 * Even with the mnemonic phrase, the owner reported the regenerated clips
 * still sounded "hurried" for a teaching context — a learner needs each
 * syllable clearly, not naturally-paced conversational speech. Investigated
 * whether Bhashini's ULCA pipeline exposes a native speech-rate control
 * before reaching for post-processing (see `TTS_SPEED` below): it does — an
 * undocumented but real `speed` field in the `tts` task's `config` object,
 * confirmed live (2026-08) against the `hi` pipeline's resolved service
 * (`ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4`) by comparing `speed: 0.7`
 * against the default on identical input text: output duration scaled by
 * ~1/0.7 as a genuine rate control would, while the estimated fundamental
 * pitch held steady (190.1Hz → 186.9Hz, within measurement noise) and the
 * WAV's own sample-rate header didn't change (22050Hz both) — i.e. the
 * model is generating genuinely slower speech, not being resampled after the
 * fact, so pitch doesn't drop into "chipmunk-in-reverse" territory the way
 * naive resampling would. This is why `TTS_SPEED` is threaded through to
 * `synthesizeTts` instead of an `ffmpeg atempo` pass — a real, model-level
 * rate control is more reliable than reconstructing pace from audio we
 * already generated.
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

/**
 * The real, standard "letter, as in <word>" mnemonic word per language —
 * NOT a generic translation of "as in", which would be a guess dressed up as
 * a fact. Only add an entry here once the convention is actually confirmed
 * for that language (same discipline as this project's phrase content:
 * researched, not invented). Every language without an entry falls back to
 * the bare glyph in `buildSynthesisText` — a known-mediocre-but-honest
 * result is better than silently mixing in a Hindi word for a language
 * that doesn't use it.
 *
 * `bn` added 2026-08-03 for the Bengali Aksharmala pass — the standard
 * Bengali primer convention (traceable to Ishwar Chandra Vidyasagar's 1855
 * "বর্ণপরিচয়", still the foundational reference) is "<character>-এ
 * <exampleWord>" (locative "e", e.g. "অ-এ অজগর" — literally "O, as in
 * Ajagar/python"), verified against bn.wikibooks.org's per-letter pages and
 * cross-checked against independent sources for the consonant set. This
 * template renders it as "<character> এ <exampleWord>" (a space, not the
 * written hyphen) — the hyphen is a text-formatting convention, not a
 * pronunciation difference, so reusing the SAME template shape as Hindi's
 * "<character> <connector> <exampleWord>" (rather than forking
 * `buildSynthesisText` for a hyphen that wouldn't change how it sounds) was
 * the right call, per this pipeline's "reuse, don't duplicate" discipline.
 */
const MNEMONIC_CONNECTOR: Record<string, string> = {
  hi: 'से', // "se" — standard Hindi primary-school Aksharmala convention
  bn: 'এ', // "e" — standard Bengali primer convention (Vidyasagar's বর্ণপরিচয়)
  // `ta` deliberately has NO entry: no confirmed single-word Tamil equivalent
  // of "से"/"এ" was found when Tamil was authored (2026-08-04) — see
  // `data.ts`'s `TAMIL_CHARACTERS` header. `buildSynthesisText` below falls
  // back to bare juxtaposition ("<character> <exampleWord>", no connector
  // word) for any language missing here, which still gives the model two
  // real words of context instead of an isolated glyph, without asserting a
  // specific Tamil grammatical convention this project can't verify.
};

/**
 * Speaking-rate multiplier sent as Bhashini's native `speed` config field
 * (see the file header for how this was discovered and verified). 1.0
 * (baseline) was the reported "hurried" result; 0.85 was a marginal,
 * easy-to-miss change; 0.75 (a ~30-40% duration increase in practice, since
 * the model's own duration predictor doesn't scale perfectly linearly with
 * the requested multiplier) read as clearly deliberate and
 * syllable-by-syllable without sounding unnatural; 0.6 stretched duration
 * ~1.65x and was technically clean (no clipping/distortion signature,
 * astats peak/RMS/noise-floor healthy) but was flagged in that pass as
 * subjectively "a slowed-recording parody, not pedagogy."
 *
 * Shipped at 0.75 first. The project owner then listened at 0.75 and asked
 * to slow down further — that subjective call belongs to the owner, not to
 * the earlier aesthetic reservation about 0.6, so this is now set to 0.6.
 * astats/pitch checks at 0.6 were already confirmed healthy across vowel,
 * consonant, and conjunct samples in the comparison pass; re-verify on the
 * actual regenerated batch before promoting (a ~1.65x-vs-1.0x rate change
 * generalizing cleanly across 3 sample characters isn't the same guarantee
 * as it holding across all 49).
 */
export const TTS_SPEED = 0.6;

/**
 * Builds the text actually sent to Bhashini/Google for one character's clip.
 * Prefers "<character> <connector> <exampleWord>" (e.g. "अ से अनार") when
 * both an example word and a confirmed mnemonic convention for `languageCode`
 * exist. When an example word exists but no connector is confirmed for this
 * language (e.g. `ta` — see `MNEMONIC_CONNECTOR`'s comment), falls back to
 * bare "<character> <exampleWord>" juxtaposition rather than inventing a
 * grammatical connector this project can't verify — still two real words of
 * context, just not asserting a specific "as in" phrasing. Falls back to the
 * bare glyph only when no `exampleWord` exists at all.
 */
export function buildSynthesisText(
  character: string,
  exampleWord: string | undefined,
  languageCode: string,
): string {
  if (!exampleWord) return character;
  const connector = MNEMONIC_CONNECTOR[languageCode];
  return connector ? `${character} ${connector} ${exampleWord}` : `${character} ${exampleWord}`;
}

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
      /** What was actually sent to Bhashini — for reproducibility, not persisted on the row. */
      synthesisText: string;
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
      const synthesisText = buildSynthesisText(row.character, row.exampleWord, args.languageCode);
      const base64 = await synthesizeTts(
        synthesisText,
        args.languageCode,
        gender,
        config,
        creds,
        TTS_SPEED,
      );
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
        synthesisText,
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
            : `${r.gender}, ${r.durationMs}ms, ${(r.bytes! / 1024).toFixed(0)}KB, text="${r.synthesisText}"`
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
