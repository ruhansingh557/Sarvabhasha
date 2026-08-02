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
import { STYLE_ANCHOR, CHARACTER_BIBLE } from './characters';

/**
 * Short, distinguishing trait anchors for the reference-image labeling fix
 * below — deliberately NOT the full CHARACTER_BIBLE description (too long to
 * repeat per image slot), just the traits most likely to cross-bleed between
 * reference images in a multi-image edit. Facial hair is called out
 * explicitly and by name because that's the confirmed failure mode: Dadi
 * picked up Neighbour's moustache in kaise-ho-how-are-you's first regenerate
 * (flux-pro/kontext/max/multi has no per-image role/label field — see the
 * module doc comment — so if the prompt doesn't pin traits to a name, the
 * model can average features across the two input images).
 */
const TRAIT_ANCHORS: Record<'dadi' | 'neighbour', string> = {
  dadi: 'an elderly woman with silver-grey hair in a low bun, a red bindi, and NO facial hair of any kind — completely smooth face, no moustache, no beard',
  neighbour: 'an adult man with short black hair and a trim black moustache — the moustache belongs ONLY to him',
};

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
    // speakerCharacter for this phrase is 'neighbour' — the OTHER character
    // in the scene is Dadi. Was hardcoded to 'neighbour' for every entry in
    // this table, which for the two neighbour-speaker phrases made
    // speaker === other: both keyframe reference-image slots resolved to
    // Neighbour's URL and Dadi never appeared in the scene at all. Confirmed
    // by inspecting the two neighbour-speaker clips directly.
    other: 'dadi',
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
    // Same bug as kaise-ho-how-are-you above — speakerCharacter here is also
    // 'neighbour', so the OTHER character is Dadi, not another Neighbour.
    other: 'dadi',
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

    // Guard against the exact bug found in the first batch: PHRASE_BEATS had
    // `other: 'neighbour'` hardcoded for two neighbour-speaker phrases, so
    // speaker === other, both keyframe reference slots resolved to the same
    // character, and the second character silently vanished from the scene.
    // Fail loudly here rather than generate (and pay for) a broken keyframe.
    if (speaker === other) {
      return {
        ok: false as const,
        reason:
          `PHRASE_BEATS["${phrase.phraseKey}"].other ("${other}") is the same as ` +
          `speakerCharacter ("${speaker}") — the scene needs two distinct characters.`,
      };
    }

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
    //
    // FIX (kaise-ho-how-are-you regen #2 gave Dadi a moustache — confirmed by
    // inspecting frames directly): fal-ai/flux-pro/kontext/max/multi's
    // `image_urls` is a plain array with no per-image role/label field (see
    // module doc comment — checked its live schema, there is no structural
    // way to pin a trait to a specific reference image). Position-label each
    // reference explicitly and state the specific trait that bled
    // (moustache) as a direct, named negative constraint rather than relying
    // on the model to infer image-to-name mapping from beats.phrase alone.
    const speakerBible = CHARACTER_BIBLE[speaker];
    const otherBible = CHARACTER_BIBLE[other];
    const keyframePrompt =
      `${STYLE_ANCHOR} Two-character scene. REFERENCE IMAGE 1 shows ${speakerBible.displayName}: ` +
      `${TRAIT_ANCHORS[speaker]}. REFERENCE IMAGE 2 shows ${otherBible.displayName}: ` +
      `${TRAIT_ANCHORS[other]}. Keep each character's face, hairstyle, clothing, and colors ` +
      `EXACTLY as in their own reference image — do not blend or share traits between the two ` +
      `characters, especially facial hair, which must stay only on whichever of them has it in ` +
      `their own reference. Setting: a simplified but specific Indian residential street in warm ` +
      `morning daylight. Composition, capturing this exact moment: ${beats.phrase} ` +
      `${NO_TALKING_HEADS} Camera: mid shot, wide enough to show both characters and their body ` +
      `language clearly.`;

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
 * Fan out generation across a batch of phrases.
 *
 * BUG FIX (found after the first 5-phrase batch): this used to `await` each
 * `ctx.runAction(generateAnimationForPhrase, ...)` call in a sequential
 * for-loop, inside this one outer action invocation. Each individual clip
 * (keyframe + a 10s Kling video, polling up to FAL_TIMEOUTS.video = 10min)
 * can legitimately take several minutes, and every one of the 5 sub-calls
 * completed and persisted successfully — but the OUTER action's own
 * cumulative execution time, summed across all 5 sequential awaits, ran long
 * enough that the Convex platform killed *this* action's invocation before
 * it could return its own summary. That surfaced as a generic, message-less
 * "✖ Failed to run function... Error" AFTER all the real work had already
 * committed — the batch wrapper's return step failed, not the generation
 * work. (`recordAnimation` calls happen inside each independently-awaited
 * sub-action and commit as soon as that sub-action finishes, regardless of
 * what later happens to this outer action.)
 *
 * FIX: don't hold one action invocation open across N sequential multi-
 * minute sub-calls. Schedule each phrase's generation as its own
 * independent, separately time-boxed invocation via `ctx.scheduler`, and
 * return immediately after scheduling rather than waiting on results. This
 * is the pattern the Convex guidelines point at generally ("pull shared code
 * into a helper" / avoid deep action-calls-action chains) and specifically
 * avoids any single invocation's execution time compounding across a batch.
 *
 * Trade-off, stated plainly: this can no longer return `totalCostUsd` or a
 * "stopped on first failure" result synchronously, because results arrive
 * asynchronously as each scheduled run completes. Check `animations:
 * listPendingReview` (successes) or `convex logs` / the dashboard (failures
 * — there is no queryable failure record yet; `generationJobs` exists in the
 * schema for exactly this but is still unused, per this file's other
 * comments) after calling this.
 */
export const generateAnimationsForPhrases = internalAction({
  args: { phraseIds: v.array(v.id('phrases')) },
  handler: async (ctx, args) => {
    // Staggered, not simultaneous — avoid firing N keyframe+video submissions
    // at fal.ai in the same instant. 5s apart is arbitrary but conservative.
    const STAGGER_MS = 5_000;

    const scheduled: Array<{ phraseId: Id<'phrases'>; jobId: Id<'_scheduled_functions'> }> = [];
    for (let i = 0; i < args.phraseIds.length; i++) {
      const phraseId = args.phraseIds[i]!;
      const jobId = await ctx.scheduler.runAfter(
        i * STAGGER_MS,
        internal.fal.animations.generateAnimationForPhrase,
        { phraseId },
      );
      scheduled.push({ phraseId, jobId });
    }

    return {
      scheduledCount: scheduled.length,
      scheduled,
      note:
        'Each phrase runs as an independent scheduled action, staggered ' +
        `${STAGGER_MS}ms apart. This returns as soon as all are SCHEDULED, ` +
        'not once they finish — check animations:listPendingReview a few ' +
        'minutes later for results.',
    };
  },
});
