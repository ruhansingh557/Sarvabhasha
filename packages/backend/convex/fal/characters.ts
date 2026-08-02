/**
 * Character reference generation — fal.ai, authoring time only.
 *
 * This is the FIRST pipeline task per specs/branding-and-voice.md ("Known
 * gaps": reference sets don't exist yet, and the bible is unusable until
 * they do). Every keyframe generated after this point conditions on these
 * images, so they must be produced and visually approved by a human before
 * any video spend happens against them.
 *
 * Approach for consistency across the three angles (front / three-quarter /
 * profile), given this is the FIRST generation for a character and there is
 * nothing yet to condition on:
 *
 *   1. FRONT   — fal-ai/flux/dev, plain text-to-image. This is the anchor.
 *   2. 3/4     — fal-ai/flux-pro/kontext, an image-EDIT of the front image
 *                ("keep this exact character, only change the camera angle").
 *   3. PROFILE — same, edited from the front image.
 *
 * Editing the same source image for (2) and (3) rather than generating three
 * independent text-to-image calls is what gives identity lock across angles
 * — three independent generations, even with a shared seed, drift on face
 * and outfit the moment the pose description changes.
 *
 * All four cast members — `dadi`, `neighbour`, `parent`, `kid` — are
 * described below (see `specs/branding-and-voice.md`'s cast table). `dadi`
 * and `neighbour` were generated first, for the pilot batch (see the 5
 * greetings phrases); `parent` and `kid` were generated afterward, before
 * any category needing them (Food & Market, Numbers/Money, Family, School &
 * Work, Daily Routine) is built. Calling this for an undocumented slug still
 * throws rather than silently generating an undocumented character design.
 */

import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { downloadToStorage, runFalJob, FAL_TIMEOUTS, type FalImageOutput } from './lib';

// ------------------------------------------------------------- style anchor

/**
 * Every prompt in this pipeline must encode these explicitly — per
 * specs/branding-and-voice.md, the model will not default to the right
 * aesthetic on its own.
 */
export const STYLE_ANCHOR =
  '2D cartoon illustration style. Clean, moderate-weight visible black outline ' +
  '(linework), flat-to-two-tone cel shading with no photorealistic gradients, ' +
  'warm saturated Indian-daylight color palette (not pastel, not muted), ' +
  'slightly stylized proportions with an expressive, readable-at-small-size ' +
  'face. No text, no watermark, no logo anywhere in the frame.';

const FRONT_BACKGROUND =
  'Plain flat pale cream studio background, bright even daylight lighting, sharp focus ' +
  'throughout, crisp clean linework and detail from edge to edge, no depth-of-field blur, ' +
  'no soft-focus or hazy/dreamy effect, no props, no other characters, no shadows on the ' +
  'background.';

type CharacterSlug = 'dadi' | 'parent' | 'kid' | 'neighbour';

// Exported so fal/animations.ts can build reference-image labels that name
// each character explicitly by their distinguishing traits — see that
// file's keyframePrompt for why (a real cross-reference trait-bleed bug:
// Dadi picked up Neighbour's moustache when the two reference images went
// into flux-pro/kontext/max/multi with nothing pinning image-to-name).
export const CHARACTER_BIBLE: Record<CharacterSlug, { displayName: string; description: string }> = {
  dadi: {
    displayName: 'Dadi',
    description:
      'Dadi, an Indian grandmother in her late 60s — warm, direct, mildly bossy, the ' +
      "family's authority on courtesy. Plump, dignified build; silver-grey hair " +
      'center-parted and pulled into a neat low bun; round face with expressive thick ' +
      'eyebrows that can arch into mock-sternness, warm brown eyes, a few simple ' +
      'stylized smile-lines (cartoon-simple, not photoreal wrinkles). Wears a plain-weave ' +
      'cotton saree in warm terracotta-orange with a solid mustard-yellow blouse, a thin ' +
      'gold nose pin, small gold hoop earrings, a red bindi, and a cream cotton shawl ' +
      'draped loosely over one shoulder. Brown leather sandals. Upright posture with a ' +
      'slight dignified stoop; hands are expressive and often mid-gesture.',
  },
  // Gender call for Parent: mother, not father. Reasoning (the task requires
  // picking one, for a single consistent design): Neighbour already covers
  // "adult man" in the cast, so a father would visually double that role and
  // leave the cast with three men's-register designs (Neighbour, a father,
  // and eventually a male Kid) against Dadi alone on the women's side. A
  // mother reads as clearly Dadi's adult daughter/daughter-in-law — same
  // household, one generation on — while giving the cast a second distinct
  // woman's design (younger, busier, plainer than Dadi) rather than a
  // repeat of Neighbour's silhouette. She's also the more legible default
  // for the market/bargaining scenes this character anchors (the worked
  // example in specs/branding-and-voice.md is gender-neutral, so this is a
  // free design choice, not a spec constraint).
  parent: {
    displayName: 'Parent',
    description:
      'Parent, an Indian mother in her mid-30s, Dadi’s daughter — practical, busy, ' +
      'always mid-errand. Medium build, average height, energetic and slightly hurried ' +
      'posture, like she is always halfway to the next task. Black hair pulled back into ' +
      'a low, practical braid with a few loose strands, oval face, sharp attentive eyes, ' +
      'expression alert and slightly no-nonsense but warm. Wears a simple teal-green ' +
      'cotton kurta over cream cotton leggings, sleeves pushed up to the forearms, a thin ' +
      'plain gold chain and small gold studs (no bindi, no elaborate jewelry — deliberately ' +
      'plainer and more modern than Dadi), a folded cotton cloth market bag slung across one ' +
      'shoulder, and flat brown sandals. Hands often mid-gesture or holding/reaching for ' +
      'something, weight shifted onto one hip.',
  },
  // Kid reads as a son — a distinct silhouette from all three adults (small,
  // round-proportioned, high-energy) so scale alone signals "child" even
  // before framing does. No gender ambiguity was requested for this slug,
  // but the same single-consistent-design logic as Parent applies: giving
  // him one locked identity (rather than leaving pronoun/appearance loose)
  // is what keeps every keyframe he appears in recognizable as the same kid.
  kid: {
    displayName: 'Kid',
    description:
      'Kid, an Indian boy about 9 years old — curious, literal, the family’s comic ' +
      'engine, always slightly too eager. Small build with rounder, more compact ' +
      'proportions than the adults (bigger head-to-body ratio, shorter limbs), noticeably ' +
      'shorter and less filled-out than Parent or Neighbour. Messy short black hair that ' +
      'never quite lies flat, round face, big expressive eyes, a gap-toothed grin. Wears a ' +
      'bright orange-red cotton t-shirt with a simple stripe, navy-blue cotton shorts, and ' +
      'well-worn white canvas sneakers with one lace usually untied; a scuffed blue ' +
      'school backpack slung over one shoulder when the scene calls for it. Loose, ' +
      'bouncy, high-energy posture — weight forward on the balls of his feet, leaning ' +
      'in, arms mid-swing, always about to move rather than standing still.',
  },
  neighbour: {
    displayName: 'Neighbour',
    description:
      'Neighbour, an Indian man in his mid-40s — the outside world: the vendor, the ' +
      'stranger, the person you ask. Medium build, average height, short black hair ' +
      'neatly combed with a hint of grey at the temples, a trim black moustache, warm ' +
      'approachable face with an easy smile. Wears a light blue short-sleeved checked ' +
      'cotton shirt tucked into simple grey trousers, a plain stainless-steel wristwatch, ' +
      'brown leather chappals. Open, friendly body language, hands often gesturing while ' +
      'talking.',
  },
};

function frontPrompt(description: string): string {
  return (
    `${STYLE_ANCHOR} Character reference sheet, FRONT VIEW, facing the camera directly, ` +
    `standing, waist-up to full-body framing, arms relaxed at sides, neutral pleasant ` +
    `expression. ${description} ${FRONT_BACKGROUND}`
  );
}

function anglePrompt(angle: 'three-quarter' | 'profile' | 'front'): string {
  const turn =
    angle === 'three-quarter'
      ? 'turn the character to a three-quarter (3/4) angle view, still standing'
      : angle === 'profile'
        ? 'turn the character to a full side profile view facing left, still standing'
        : 'turn the character to face the camera directly, front view, still standing';
  return (
    `Keep this exact same character — identical face, hairstyle, skin tone, clothing, ` +
    `colors, and art style. Change ONLY the camera angle: ${turn}, same neutral pleasant ` +
    `expression, same plain pale cream studio background, same bright even daylight ` +
    `lighting, sharp focus throughout, no depth-of-field blur, no props, no other ` +
    `characters, no text.`
  );
}

// ----------------------------------------------------------------- internals

export const upsertCharacter = internalMutation({
  args: {
    slug: v.union(v.literal('dadi'), v.literal('parent'), v.literal('kid'), v.literal('neighbour')),
    displayName: v.string(),
    description: v.string(),
    referenceStorageIds: v.array(v.id('_storage')),
  },
  returns: v.id('characters'),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('characters')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        description: args.description,
        referenceStorageIds: args.referenceStorageIds,
      });
      return existing._id;
    }

    return await ctx.db.insert('characters', {
      slug: args.slug,
      displayName: args.displayName,
      description: args.description,
      referenceStorageIds: args.referenceStorageIds,
    });
  },
});

export const getCharacterWithUrls = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const character = await ctx.db
      .query('characters')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
    if (!character) return null;
    const referenceUrls = await Promise.all(
      character.referenceStorageIds.map((id) => ctx.storage.getUrl(id)),
    );
    return { ...character, referenceUrls };
  },
});

// ------------------------------------------------------------------ actions

/** fal-ai/flux/dev — ~$0.025/image (1024px-class, verify against live billing). */
const FLUX_DEV_RATE_PER_IMAGE = 0.025;
/** fal-ai/flux-pro/kontext — $0.04/image (single reference edit). */
const KONTEXT_PRO_RATE_PER_IMAGE = 0.04;

type GenerateCharacterResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      characterId: Id<'characters'>;
      referenceStorageIds: Id<'_storage'>[];
      referenceUrls: (string | null)[];
      costUsd: number;
    };

/**
 * Generate the locked front/three-quarter/profile reference set for ONE
 * character and upsert the `characters` row. Costs real money — front image
 * + two Kontext edits, roughly $0.10/character at list rate (see the module
 * doc comment). NOT idempotent by default: re-running replaces the
 * character's reference set, which is the intended way to fix a bad batch
 * (see specs/data-model.md's rationale for `model`/`seed`/`prompt` fields —
 * the equivalent discipline here is simply re-running this action).
 */
export const generateCharacterReferences = internalAction({
  args: {
    slug: v.union(
      v.literal('dadi'),
      v.literal('parent'),
      v.literal('kid'),
      v.literal('neighbour'),
    ),
  },
  handler: async (ctx, args): Promise<GenerateCharacterResult> => {
    const bible = CHARACTER_BIBLE[args.slug];
    if (!bible) {
      return { ok: false as const, reason: `No character bible entry for "${args.slug}"` };
    }

    let costUsd = 0;

    // 1. FRONT — the anchor image every later edit conditions on.
    const frontResult = await runFalJob<FalImageOutput>(
      'fal-ai/flux/dev',
      {
        prompt: frontPrompt(bible.description),
        image_size: 'portrait_4_3',
        num_images: 1,
      },
      FAL_TIMEOUTS.image,
    );
    costUsd += FLUX_DEV_RATE_PER_IMAGE;
    const frontImage = frontResult.images[0];
    if (!frontImage) return { ok: false as const, reason: 'FLUX returned no front image' };

    // 2 & 3 — Kontext edits of the front image, angle changed, identity locked.
    const [threeQuarterResult, profileResult] = await Promise.all([
      runFalJob<FalImageOutput>(
        'fal-ai/flux-pro/kontext',
        { image_url: frontImage.url, prompt: anglePrompt('three-quarter') },
        FAL_TIMEOUTS.image,
      ),
      runFalJob<FalImageOutput>(
        'fal-ai/flux-pro/kontext',
        { image_url: frontImage.url, prompt: anglePrompt('profile') },
        FAL_TIMEOUTS.image,
      ),
    ]);
    costUsd += KONTEXT_PRO_RATE_PER_IMAGE * 2;

    const threeQuarterImage = threeQuarterResult.images[0];
    const profileImage = profileResult.images[0];
    if (!threeQuarterImage || !profileImage) {
      return { ok: false as const, reason: 'Kontext returned no image for an angle edit' };
    }

    // Store all three, front first — getCharacterWithUrls/animations code
    // assumes referenceStorageIds[0] is the front (canonical) view.
    const referenceStorageIds: Id<'_storage'>[] = [
      await downloadToStorage(ctx, frontImage.url, 'image/jpeg'),
      await downloadToStorage(ctx, threeQuarterImage.url, 'image/jpeg'),
      await downloadToStorage(ctx, profileImage.url, 'image/jpeg'),
    ];

    const characterId: Id<'characters'> = await ctx.runMutation(
      internal.fal.characters.upsertCharacter,
      {
        slug: args.slug,
        displayName: bible.displayName,
        description: bible.description,
        referenceStorageIds,
      },
    );

    const referenceUrls = await Promise.all(
      referenceStorageIds.map((id) => ctx.storage.getUrl(id)),
    );

    return { ok: true as const, characterId, referenceStorageIds, referenceUrls, costUsd };
  },
});

/**
 * Repair path for a specific observed failure mode: `flux/dev`'s FRONT
 * generation came back soft/out-of-focus across 4 consecutive attempts for
 * `kid` (never for the other three characters), while the Kontext angle
 * edits sourced FROM that same soft front still came out sharp every time —
 * Kontext's edit pass doesn't inherit the source's blur, since it re-renders
 * rather than sharpening. Rather than keep re-rolling the ~$0.105 full
 * three-image `flux/dev` + 2×Kontext generation hoping for a non-blurry
 * front, this Kontext-edits an EXISTING sharp angle image (e.g. the
 * three-quarter view, index 1) back to a front-facing pose — one $0.04 call
 * — and replaces only `referenceStorageIds[0]`, leaving the other two
 * (already good) images untouched.
 */
export const regenerateFrontFromAngle = internalAction({
  args: {
    slug: v.union(
      v.literal('dadi'),
      v.literal('parent'),
      v.literal('kid'),
      v.literal('neighbour'),
    ),
    sourceIndex: v.number(),
  },
  handler: async (ctx, args): Promise<GenerateCharacterResult> => {
    const bible = CHARACTER_BIBLE[args.slug];
    if (!bible) {
      return { ok: false as const, reason: `No character bible entry for "${args.slug}"` };
    }

    const character = await ctx.runQuery(internal.fal.characters.getCharacterWithUrls, {
      slug: args.slug,
    });
    if (!character) return { ok: false as const, reason: `No character row for "${args.slug}"` };

    const sourceUrl = character.referenceUrls[args.sourceIndex];
    if (!sourceUrl) {
      return { ok: false as const, reason: `No reference image at index ${args.sourceIndex}` };
    }

    const frontResult = await runFalJob<FalImageOutput>(
      'fal-ai/flux-pro/kontext',
      { image_url: sourceUrl, prompt: anglePrompt('front') },
      FAL_TIMEOUTS.image,
    );
    const costUsd = KONTEXT_PRO_RATE_PER_IMAGE;
    const frontImage = frontResult.images[0];
    if (!frontImage) return { ok: false as const, reason: 'Kontext returned no front image' };

    const newFrontId = await downloadToStorage(ctx, frontImage.url, 'image/jpeg');
    const referenceStorageIds: Id<'_storage'>[] = [
      newFrontId,
      ...character.referenceStorageIds.slice(1),
    ];

    const characterId: Id<'characters'> = await ctx.runMutation(
      internal.fal.characters.upsertCharacter,
      {
        slug: args.slug,
        displayName: bible.displayName,
        description: bible.description,
        referenceStorageIds,
      },
    );

    const referenceUrls = await Promise.all(
      referenceStorageIds.map((id) => ctx.storage.getUrl(id)),
    );

    return { ok: true as const, characterId, referenceStorageIds, referenceUrls, costUsd };
  },
});
