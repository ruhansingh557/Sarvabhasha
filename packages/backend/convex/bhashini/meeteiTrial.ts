/**
 * ONE-OFF feasibility trial for Meetei Mayek (Manipuri script) Aksharmala
 * TTS — NOT wired into any table, writes nothing to `scriptCharacters` or
 * `scriptCharacterAudio`. Exists purely to answer one question before any
 * Meetei Mayek content is authored: can Bhashini's `mni` TTS voice actually
 * synthesize ISOLATED Meetei Mayek text (a bare glyph, or a short
 * letter-name word) legibly, the same hard case `bhashini/aksharmalaTts.ts`'s
 * header documents for Hindi (a single phone rushed/unclear even though the
 * model is free of errors)? Bhashini's `mni` TTS was previously confirmed
 * live (`plans/phase-12-v1-launch.md` Step 0) only for full LESSON-PHRASE
 * sentences (`ai4bharat/indic-tts-coqui-misc-gpu--t4`) — never for short
 * isolated text, which is a materially different synthesis case.
 *
 * Same orphaned-blob safety pattern as `google/aksharmalaTtsTrial.ts`: the
 * clip this produces has NO row anywhere pointing at it, so there is no way
 * for a learner to ever reach it. The only way to hear it is the signed URL
 * handed back directly to whoever ran this via `convex run`.
 *
 * `internalAction` only (CLAUDE.md rule 10) — this is authoring-time-only,
 * one-off investigation tooling, never client-facing.
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { getBhashiniCredentials, getTtsPipelineConfig, synthesizeTts, decodeBase64Audio } from './lib';

type TrialResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      text: string;
      charCount: number;
      gender: 'male' | 'female';
      durationMs: number;
      bytes: number;
      audioUrl: string | null;
    };

export const synthesizeMeeteiTrial = internalAction({
  args: {
    text: v.string(),
    genderOverride: v.optional(v.union(v.literal('male'), v.literal('female'))),
    speed: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<TrialResult> => {
    const gender = args.genderOverride ?? 'female';
    try {
      const creds = getBhashiniCredentials();
      const config = await getTtsPipelineConfig('mni', gender, creds);
      const base64 = await synthesizeTts(args.text, 'mni', gender, config, creds, args.speed);
      const { bytes, durationMs } = decodeBase64Audio(base64);

      // Orphaned blob — no scriptCharacterAudio row, deliberately (see file header).
      const storageId = await ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }));
      const audioUrl = await ctx.storage.getUrl(storageId);

      return {
        ok: true,
        text: args.text,
        charCount: args.text.length,
        gender,
        durationMs,
        bytes: bytes.length,
        audioUrl,
      };
    } catch (err) {
      return { ok: false, reason: (err as Error).message };
    }
  },
});
