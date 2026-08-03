/**
 * Vocabulary/number image generation — fal.ai, authoring time only.
 *
 * Deliberately the SIMPLE half of `fal/characters.ts`: plain
 * `fal-ai/flux/dev` text-to-image, ONE image per item, no Kontext angle
 * editing, no character-reference conditioning. Per
 * plans/phase-13-foundations-vocab-numbers-alphabet.md and
 * specs/branding-and-voice.md: vocabulary/number images are standalone
 * illustrations (a numeral + a matching count of objects; a generic family
 * icon) — explicitly NOT the locked four-character cast (Dadi/Parent/Kid/
 * Neighbour). Reusing that cast here would be wrong on two counts: these
 * items have no scene/speaker to justify a cast member, and copying a
 * specific character's design into a plain icon illustration is exactly the
 * kind of identity dilution the character bible exists to prevent.
 *
 * Style note: `fal/characters.ts`'s `STYLE_ANCHOR` constant text still
 * describes the ORIGINAL flat/visible-outline plan. `branding-and-voice.md`
 * documents that the actual locked style (since the 2026-08-02 revision) is
 * softly-shaded, gently dimensional, NO hard outline — what FLUX/Kontext
 * produce natively. `VOCAB_STYLE_ANCHOR` below matches the CURRENT spec, not
 * the stale text in `characters.ts` (flagged as a worthwhile follow-up: that
 * constant's wording should probably be updated to match, but that's
 * `fal/characters.ts`'s file to own, not touched here).
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { downloadToStorage, runFalJob, FAL_TIMEOUTS, type FalImageOutput } from './lib';

/** Every prompt built in this file must fold this in explicitly. */
export const VOCAB_STYLE_ANCHOR =
  'Soft-shaded 2D digital illustration style — gently dimensional rendering with smooth ' +
  'gradient shading, NO hard black outline or visible linework. Warm, saturated ' +
  'Indian-daylight color palette (not pastel, not muted). Single centered subject on a ' +
  'plain softly-warm background (a gentle solid or subtle gradient wash — no scene, no ' +
  'setting, no other objects unless the subject calls for them). Clean, friendly, iconic, ' +
  'readable at small size — not photorealistic, not busy, not cluttered. No text, no ' +
  'numerals baked into the art (unless the item IS a numeral illustration), no watermark, ' +
  'no logo, no signature.';

/**
 * Prompt for a numeral flashcard: the numeral itself plus a matching count
 * of simple identical objects, so the image teaches the QUANTITY, not just
 * the digit shape (per Rule 1's "mute-and-hide-subtitle" spirit — applied
 * here as "the image alone should convey the number").
 */
export function numberImagePrompt(numeral: number, objectDescription: string): string {
  const countNote =
    numeral <= 20
      ? `exactly ${numeral} small identical ${objectDescription}, clearly countable and neatly arranged (not overlapping, not scattered) so the count is unambiguous`
      : `a small identical group of ${objectDescription} suggesting the quantity (exact count not required above 20)`;
  return (
    `A children's counting flashcard illustration. The numeral "${numeral}" rendered large, ` +
    `bold, and friendly in a rounded sans-serif style, positioned to one side. Next to it, ${countNote}. ` +
    `${VOCAB_STYLE_ANCHOR}`
  );
}

/**
 * Prompt for a generic family-relation icon — explicitly generic, NOT a
 * depiction of Dadi/Parent/Kid/Neighbour. See this file's doc comment.
 */
export function familyIconPrompt(subjectDescription: string): string {
  return (
    `A simple, friendly, GENERIC icon-style illustration representing "${subjectDescription}" — ` +
    `a standalone figure/portrait icon, deliberately simple and universal (not a specific named ` +
    `character, no identifying accessories or outfit details that would tie it to a particular ` +
    `person or design). ${VOCAB_STYLE_ANCHOR}`
  );
}

// ----------------------------------------------------------------- internals

const FLUX_DEV_RATE_PER_IMAGE = 0.025; // fal-ai/flux/dev, single 1024px-class image — verify live.

type GenerateVocabularyImageResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      vocabularyItemId: Id<'vocabularyItems'>;
      imageStorageId: Id<'_storage'>;
      imageUrl: string | null;
      seed: number;
      costUsd: number;
    };

/**
 * Generate ONE static image for a vocabulary/number item and upsert it onto
 * the item via `vocabulary.upsertVocabularyItem` (re-supplying `englishWord`/
 * `sortOrder` — that mutation always re-lands the item as `draft`, so this
 * is the intended way to attach or replace an item's image). NOT
 * idempotent — re-running replaces the image, which is the intended repair
 * path for a bad generation (same convention as `fal/characters.ts`'s
 * `generateCharacterReferences`).
 */
export const generateVocabularyImage = internalAction({
  args: {
    categorySlug: v.string(),
    itemKey: v.string(),
    englishWord: v.string(),
    sortOrder: v.number(),
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<GenerateVocabularyImageResult> => {
    const result = await runFalJob<FalImageOutput>(
      'fal-ai/flux/dev',
      { prompt: args.prompt, image_size: 'square_hd', num_images: 1 },
      FAL_TIMEOUTS.image,
    );
    const image = result.images[0];
    if (!image) return { ok: false as const, reason: 'FLUX returned no image' };

    const imageStorageId = await downloadToStorage(ctx, image.url, 'image/jpeg');

    const vocabularyItemId: Id<'vocabularyItems'> = await ctx.runMutation(
      internal.vocabulary.upsertVocabularyItem,
      {
        categorySlug: args.categorySlug,
        itemKey: args.itemKey,
        englishWord: args.englishWord,
        imageStorageId,
        sortOrder: args.sortOrder,
      },
    );

    const imageUrl = await ctx.storage.getUrl(imageStorageId);

    return {
      ok: true as const,
      vocabularyItemId,
      imageStorageId,
      imageUrl,
      seed: result.seed,
      costUsd: FLUX_DEV_RATE_PER_IMAGE,
    };
  },
});
