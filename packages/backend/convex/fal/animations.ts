/**
 * Animation generation — fal.ai, authoring time only.
 *
 * Pipeline per phrase, per specs/branding-and-voice.md and schema.ts
 * structural decision 1 (animation attaches to `phraseId`, generated ONCE,
 * reused across all 22 languages — never regenerate per language):
 *
 *   1. KEYFRAME — fal-ai/flux-pro/kontext/max/multi, conditioned on BOTH
 *      characters' locked front reference images (`image_urls`, plural —
 *      this model accepts multiple reference images and is the mechanism
 *      that keeps two locked characters consistent in one composited scene;
 *      the single-image `flux-pro/kontext` used for character refs cannot
 *      do this). One static image capturing the PHRASE beat composition.
 *   2. ANIMATE — fal-ai/kling-video/v2.5-turbo/pro/image-to-video, image-to-
 *      video conditioned on that keyframe. Duration is fixed by Kling to
 *      "5" or "10" seconds (enum, not freeform) — "10" is used everywhere
 *      here since 5s is under recordAnimation's 7s floor and outside the
 *      three-beat structure entirely.
 *   3. Download + store both, call the EXISTING `recordAnimation` mutation
 *      (not reimplemented) with full reproducibility metadata. Lands as
 *      `draft` — recordAnimation enforces that, and nothing here calls
 *      `approveAnimation`.
 *
 * NO TALKING HEADS (hard constraint, not a preference): Bhashini audio and
 * fal.ai video are generated independently and will never lip-sync across
 * 22 languages. Every prompt below explicitly composes around this —
 * profile angles, partial off-frame faces, gesture-and-posture carrying the
 * line — rather than relying on mouth movement.
 *
 * LANGUAGE-INDEPENDENCE DEVIATION FROM THE SPEC'S WORKED EXAMPLE — flagged
 * for human review: branding-and-voice.md's worked example puts literal
 * target-script text in a speech bubble ("यह कितने का है?"). That is correct
 * advice for a clip generated per-language, but this pipeline generates the
 * clip ONCE and reuses it across all 22 languages (schema.ts decision 1) —
 * burning Hindi-only pixels into a clip a Tamil learner also watches would
 * be wrong for every language but one. Prompts here deliberately omit
 * script text from bubbles/signage and rely on gesture, body language, and
 * reaction instead, which is one of the doc's other three listed framing
 * options ("gesture and body language carrying the intent"). This is a
 * judgment call, not a spec citation — a human should confirm it's the
 * right read before this becomes the house style for later categories.
 */

import { v } from 'convex/values';
import { internalAction, internalQuery } from '../_generated/server';
import { internal, api } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import {
  downloadToStorage,
  runFalJob,
  FAL_TIMEOUTS,
  type FalImageOutput,
  type FalVideoOutput,
} from './lib';
import { STYLE_ANCHOR } from './characters';

// ------------------------------------------------------------------- rates

/** fal-ai/flux-pro/kontext/max/multi — $0.08/image (multi-reference edit). */
const KEYFRAME_RATE_PER_IMAGE = 0.08;
/** fal-ai/kling-video/v2.5-turbo/pro/image-to-video — $0.07/s (verify against live billing). */
const KLING_RATE_PER_SECOND = 0.07;
const KLING_MODEL_ID = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
const CLIP_DURATION_SEC = 10; // Kling's duration enum is "5" | "10"; 5s is under the 7s floor.

const NO_TALKING_HEADS =
  'FRAMING RULE (hard constraint): never compose this as a talking-head close-up on a ' +
  'mouth. Keep at least one character in profile, partly turned away, or with their face ' +
  'partially off-frame during the line; convey the moment through gesture, posture, and ' +
  'reaction, not mouth movement — the audio track is added separately, in a different ' +
  'language, and will never match lip motion. No captions, subtitles, or text of any kind ' +
  'baked into the frame.';

// --------------------------------------------------------- per-phrase beats

/**
 * Hand-authored three-beat breakdowns, grounded directly in each phrase's
 * `situation` and `sourceText` from seed.ts — not invented scenarios.
 * SETUP / PHRASE / REACTION per specs/branding-and-voice.md.
 */
const PHRASE_BEATS: Record<
  string,
  { other: 'dadi' | 'neighbour'; setup: string; phrase: string; reaction: string }
> = {
  'namaste-hello': {
    other: 'neighbour',
    setup:
      'On a quiet morning street, the Neighbour walks up and raises a hand toward Dadi, ' +
      'who is standing near her gate.',
    phrase:
      'Dadi turns warmly toward the Neighbour, presses her palms together in a namaste ' +
      'greeting at chest height, head tilted slightly, a welcoming open expression — shown ' +
      'mostly in three-quarter/profile so her face is not framed dead-on.',
    reaction:
      'The Neighbour mirrors the namaste gesture back, smiling; a beat of warm mutual ' +
      'acknowledgement passes between them.',
  },
  'dhanyavaad-thank-you': {
    other: 'neighbour',
    setup:
      'The Neighbour is carrying a heavy cloth shopping bag for Dadi as they walk toward ' +
      "her gate; he sets the bag down at Dadi's doorstep.",
    phrase:
      'Dadi places a hand over her heart and gives a small grateful bow of the head toward ' +
      'the Neighbour, her other hand gesturing toward the bag he set down — shown in ' +
      'profile/three-quarter so the moment reads through posture, not her mouth.',
    reaction:
      'The Neighbour waves the thanks off modestly with an easy smile, a little embarrassed ' +
      'by the gratitude, and gives a small nod before turning to go.',
  },
  'kaise-ho-how-are-you': {
    other: 'neighbour',
    setup:
      'The Neighbour spots Dadi sitting on her porch step in the morning and walks over, ' +
      'leaning in with open curiosity.',
    phrase:
      'The Neighbour tilts his head, opens both palms upward in a warm "how are you" ' +
      'questioning gesture, eyebrows raised — framed mostly from the side/behind Dadi so the ' +
      "Neighbour's face is not a straight-on talking-head shot.",
    reaction:
      "Dadi breaks into a content smile and gives an enthusiastic thumbs-up / a small pat to " +
      "her own chest meaning \"I'm well\", nodding.",
  },
  'phir-milenge-goodbye': {
    other: 'neighbour',
    setup:
      'Dadi and the Neighbour are finishing a warm chat on the street; the Neighbour starts ' +
      'to turn to leave, glancing back over his shoulder.',
    phrase:
      'Dadi raises one hand and waves it side to side in a clear goodbye gesture, her body ' +
      'turned three-quarter toward the Neighbour rather than facing the camera head-on, a ' +
      'warm closing-the-conversation posture.',
    reaction:
      'The Neighbour waves back over his shoulder with a smile and continues walking away ' +
      "down the street; Dadi watches him go, still smiling.",
  },
  'shubh-prabhat-good-morning': {
    other: 'neighbour',
    setup:
      'Early morning, soft golden light. Dadi steps out of her gate holding a small watering ' +
      'can for her plants. The Neighbour is passing by on the street.',
    phrase:
      'The Neighbour raises a hand and waves cheerfully toward Dadi from a few steps away, ' +
      'body angled down the street rather than square to the camera, an energetic ' +
      'first-thing-in-the-morning wave.',
    reaction:
      'Dadi looks up, breaks into a pleased smile, sets down the watering can and waves back ' +
      'with both hands raised slightly, happy to be greeted.',
  },
};

// ----------------------------------------------------------------- internals

export const getPhrase = internalQuery({
  args: { phraseId: v.id('phrases') },
  handler: async (ctx, args) => await ctx.db.get(args.phraseId),
});

export const getCharacterRefUrl = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const character = await ctx.db
      .query('characters')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
    if (!character || character.referenceStorageIds.length === 0) return null;
    // referenceStorageIds[0] is the FRONT view — see fal/characters.ts.
    return await ctx.storage.getUrl(character.referenceStorageIds[0]!);
  },
});

// ------------------------------------------------------------------ actions

type GenerateAnimationResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      animationId: Id<'animations'>;
      keyframeStorageId: Id<'_storage'>;
      videoStorageId: Id<'_storage'>;
      costUsd: number;
      model: string;
      durationSec: number;
    };

/**
 * Generate ONE animation clip for a phrase and record it as `draft` via the
 * existing `recordAnimation` mutation. Does NOT approve — that is a human
 * decision made by watching the clip and applying the mute-test (see
 * animations.ts's `approveAnimation` doc comment).
 */
export const generateAnimationForPhrase = internalAction({
  args: {
    phraseId: v.id('phrases'),
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<GenerateAnimationResult> => {
    const phrase: Doc<'phrases'> | null = await ctx.runQuery(internal.fal.animations.getPhrase, {
      phraseId: args.phraseId,
    });
    if (!phrase) return { ok: false as const, reason: `No phrase ${args.phraseId}` };
    if (phrase.speakerCharacter !== 'dadi' && phrase.speakerCharacter !== 'neighbour') {
      return {
        ok: false as const,
        reason: `Character bible entry for "${phrase.speakerCharacter}" not built in this pass`,
      };
    }

    const beats = PHRASE_BEATS[phrase.phraseKey];
    if (!beats) {
      return { ok: false as const, reason: `No hand-authored beat breakdown for "${phrase.phraseKey}"` };
    }

    const speaker = phrase.speakerCharacter;
    const other = beats.other;

    const [speakerRefUrl, otherRefUrl] = await Promise.all([
      ctx.runQuery(internal.fal.animations.getCharacterRefUrl, { slug: speaker }),
      ctx.runQuery(internal.fal.animations.getCharacterRefUrl, { slug: other }),
    ]);
    if (!speakerRefUrl || !otherRefUrl) {
      return {
        ok: false as const,
        reason: `Missing character reference for "${!speakerRefUrl ? speaker : other}" — run generateCharacterReferences first`,
      };
    }

    let costUsd = 0;

    // 1. KEYFRAME — multi-reference edit, both locked characters in one scene.
    const keyframePrompt =
      `${STYLE_ANCHOR} Two-character scene using EXACTLY the two reference characters shown ` +
      `— do not change either character's face, hairstyle, clothing, or colors. Setting: a ` +
      `simplified but specific Indian residential street in warm morning daylight. ` +
      `Composition, capturing this exact moment: ${beats.phrase} ${NO_TALKING_HEADS} Camera: ` +
      `mid shot, wide enough to show both characters and their body language clearly.`;

    const keyframeResult = await runFalJob<FalImageOutput>(
      'fal-ai/flux-pro/kontext/max/multi',
      {
        image_urls: [speakerRefUrl, otherRefUrl],
        prompt: keyframePrompt,
        aspect_ratio: '9:16',
      },
      FAL_TIMEOUTS.image,
    );
    costUsd += KEYFRAME_RATE_PER_IMAGE;
    const keyframeImage = keyframeResult.images[0];
    if (!keyframeImage) return { ok: false as const, reason: 'Keyframe generation returned no image' };

    const keyframeStorageId = await downloadToStorage(ctx, keyframeImage.url, 'image/jpeg');

    // 2. ANIMATE — image-to-video from that keyframe. Never text-to-video.
    const videoPrompt =
      `${STYLE_ANCHOR} Animate this scene as a warm, gently funny ${CLIP_DURATION_SEC}-second ` +
      `moment in three beats. SETUP (~3s): ${beats.setup} PHRASE (~3-4s): ${beats.phrase} ` +
      `Convey the line entirely through gesture, posture, and expression — never through ` +
      `mouth movement, since spoken audio in the target language is composited in separately ` +
      `afterward and will not match any lip motion generated here. REACTION (~3s): ` +
      `${beats.reaction}, confirming the meaning of the moment. ${NO_TALKING_HEADS} Keep both ` +
      `characters' designs perfectly consistent with the reference image throughout — same ` +
      `faces, hairstyles, clothing, and colors from start to end. Natural, smooth, believable ` +
      `motion; the comedic timing lands in the REACTION beat, never through mockery of anyone ` +
      `speaking imperfectly.`;

    const negativePrompt =
      'blurry, distorted hands, extra limbs, warped or morphing faces, text, watermark, logo, ' +
      'subtitles, captions, on-screen writing, extra characters, identity drift, close-up on ' +
      'mouth, talking-head close-up, exaggerated lip-sync motion';

    const videoResult = await runFalJob<FalVideoOutput>(
      KLING_MODEL_ID,
      {
        image_url: keyframeImage.url,
        prompt: videoPrompt,
        negative_prompt: negativePrompt,
        duration: String(CLIP_DURATION_SEC),
      },
      FAL_TIMEOUTS.video,
    );
    costUsd += KLING_RATE_PER_SECOND * CLIP_DURATION_SEC;

    const video = videoResult.video;
    if (!video?.url) return { ok: false as const, reason: 'Kling returned no video' };

    const videoStorageId = await downloadToStorage(ctx, video.url, 'video/mp4');

    const animationId: Id<'animations'> = await ctx.runMutation(api.animations.recordAnimation, {
      phraseId: phrase._id,
      storageId: videoStorageId,
      keyframeStorageIds: [keyframeStorageId],
      model: KLING_MODEL_ID,
      ratePerSecond: KLING_RATE_PER_SECOND,
      durationSec: CLIP_DURATION_SEC,
      prompt: videoPrompt,
      attempt: args.attempt ?? 1,
    });

    return {
      ok: true as const,
      animationId,
      keyframeStorageId,
      videoStorageId,
      costUsd,
      model: KLING_MODEL_ID,
      durationSec: CLIP_DURATION_SEC,
    };
  },
});

/**
 * Fan out generation across a batch of phrases. Sequential, not parallel —
 * this is real money per clip and a partial failure should stop with a
 * clear report of what was spent, not silently keep burning budget (see
 * CLAUDE.md cost discipline).
 */
export const generateAnimationsForPhrases = internalAction({
  args: { phraseIds: v.array(v.id('phrases')) },
  handler: async (ctx, args) => {
    const results: Array<{ phraseId: Id<'phrases'>; result: GenerateAnimationResult }> = [];
    let totalCostUsd = 0;

    for (const phraseId of args.phraseIds) {
      const result: GenerateAnimationResult = await ctx.runAction(
        internal.fal.animations.generateAnimationForPhrase,
        { phraseId },
      );
      if (result.ok) totalCostUsd += result.costUsd;
      results.push({ phraseId, result });

      // Stop on first failure rather than keep spending against a possibly
      // broken prompt/config — report exactly what succeeded and what didn't.
      if (!result.ok) break;
    }

    return { results, totalCostUsd };
  },
});
