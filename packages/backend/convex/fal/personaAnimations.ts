/**
 * AI-tutor persona avatar clip generation — fal.ai, authoring time only.
 *
 * Sibling to `fal/animations.ts` (lesson-phrase clips), NOT a variant of it —
 * see `personaAnimations.ts`'s (the Convex-schema module, one directory up)
 * doc comment for why the two live in separate tables: a persona's "thinking"
 * loop has no `phraseId` and no `languageCode`, it is the same clip for every
 * learner regardless of what they're studying.
 *
 * Pipeline per (character, expression):
 *
 *   1. KEYFRAME — fal-ai/flux-pro/kontext (single-image edit, NOT the
 *      multi-reference `.../max/multi` variant `fal/animations.ts` uses for
 *      two-character scenes — there is only ever one character in an avatar
 *      loop). Conditioned on that character's locked FRONT reference image.
 *      Edits pose/expression only; identity is pinned via the same
 *      TRAIT_ANCHOR-style negative-constraint language `fal/animations.ts`
 *      uses, copied here for `dadi` (the only character built this pass).
 *   2. ANIMATE — fal-ai/kling-video/v2.5-turbo/pro/image-to-video, duration
 *      "5" (Kling's enum is "5" | "10" — 5 is the only value inside this
 *      table's 2–6s `durationSec` window; see `personaAnimations.ts`'s
 *      `recordAnimation` validation).
 *   3. Download + store, call the EXISTING `personaAnimations.recordAnimation`
 *      mutation (not reimplemented) with full reproducibility metadata.
 *      Lands as `draft` — nothing here calls `approveAnimation`.
 *
 * NO TALKING HEADS, adapted for an avatar: these clips sit behind a chat
 * bubble and the audio track over them (Bhashini/Gemini TTS of whatever Dadi
 * actually says) is generated completely independently, so mouth motion here
 * will never sync to it either — same root problem as lesson clips. Unlike a
 * lesson scene there is no framing escape hatch (profile / off-frame / cut
 * to an object) available for an avatar tile, since the whole point is a
 * legible face. The constraint instead becomes: keep the mouth closed/still
 * and let eyes, brows, hands, and posture carry the state — never open-mouth
 * "talking" motion.
 *
 * LOOP-ABILITY: unlike lesson clips (played once per view), these loop
 * indefinitely behind the chat UI. Every prompt below explicitly asks for the
 * clip to return close to its starting pose by the final frame so a naive
 * play-through-and-restart doesn't read as a jump-cut.
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal, api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import {
  downloadToStorage,
  runFalJob,
  FAL_TIMEOUTS,
  type FalImageOutput,
  type FalVideoOutput,
} from './lib';
import { STYLE_ANCHOR } from './characters';

type CharacterSlug = 'dadi' | 'parent' | 'kid' | 'neighbour';
type Expression = 'neutral' | 'happy' | 'encouraging' | 'thinking';

/**
 * Same identity-lock purpose as `fal/animations.ts`'s `TRAIT_ANCHORS` —
 * short, distinguishing traits repeated in every prompt so a single-image
 * edit doesn't drift the character off-model. Only `dadi` is populated: this
 * pass is Dadi-only by explicit scope (other personas are future work, see
 * the module doc comment above).
 */
const TRAIT_ANCHORS: Partial<Record<CharacterSlug, string>> = {
  dadi: 'an elderly Indian woman with silver-grey hair in a low bun, a red bindi, a thin gold nose pin, small gold hoop earrings, a cream cotton shawl over one shoulder, and NO facial hair of any kind — completely smooth face, no moustache, no beard',
};

const AVATAR_BACKGROUND =
  'Plain, softly warm-toned background (matching her reference sheet), no props, no other ' +
  'characters, no text, no watermark, no logo anywhere in the frame.';

/**
 * Per-expression pose (for the still keyframe) and motion (for the 5s loop).
 * Dadi-only this pass — extend with per-character entries if/when another
 * persona's avatar clips are built.
 */
const EXPRESSION_SPECS: Record<Expression, { pose: string; motion: string }> = {
  neutral: {
    pose:
      'Dadi in her resting, idle stance — calm, pleasant, neutral expression, eyes open, ' +
      'mouth softly closed and still, head level, hands resting loosely near her waist. ' +
      'Close bust-to-shoulders crop, facing the camera or a gentle near-front angle, suitable ' +
      'for a small chat-avatar tile.',
    motion:
      'The smallest possible ambient idle motion: one slow, natural blink partway through the ' +
      'clip, and a very slight, gentle breathing sway in her shoulders. HER MOUTH DOES NOT ' +
      'MOVE OR CHANGE SHAPE AT ANY POINT IN THE CLIP — no smiling more, no smiling less, no ' +
      'opening, no talking, exactly the same closed pleasant mouth shape in every single frame. ' +
      'No hand gesture, no change in her expression beyond the blink. This is her waiting-for-' +
      'the-learner-to-type state, so keep it calm and mostly still. The final frame must read ' +
      'as nearly identical to the first frame — same head position, same gaze, same mouth ' +
      'shape, same shoulder position — so a naive loop (play through, restart from frame 0) ' +
      'shows no visible jump.',
  },
  thinking: {
    pose:
      'Dadi in a considering pose — glancing upward and slightly to one side, one hand raised ' +
      'near her chin/jaw as if pondering, eyebrows slightly raised, thoughtful expression, ' +
      'mouth closed. Close bust-to-shoulders crop, three-quarter angle.',
    motion:
      'A small, natural considering movement: her eyes drift upward and to the side and back, ' +
      'her head tilts very slightly, the raised hand shifts subtly near her chin. Mouth stays ' +
      'closed throughout — no talking motion. This plays while a reply is being generated, so ' +
      'it should read as "still working on it," not resolved. End the loop back close to the ' +
      'starting head position, gaze direction, and hand position so it repeats seamlessly with ' +
      'no jump at the restart.',
  },
  happy: {
    pose:
      'Dadi mid warm smile — eyes crinkled with delight, head tilted slightly, a small joyful ' +
      'energy in her posture, a warm closed-mouth or gently-open smile (not an open "talking" ' +
      'mouth). Close bust-to-shoulders crop, near-front angle.',
    motion:
      'Her eyes crinkle further with delight and she gives one small, single approving nod — ' +
      'a brief soft happy bounce in her shoulders. HER MOUTH STAYS FULLY CLOSED THE ENTIRE ' +
      'CLIP — do not open her mouth at any point, even partway, even to laugh; express the joy ' +
      'entirely through her eyes, eyebrows, cheeks, and the nod, never through the mouth ' +
      'opening or changing shape. This is her peak-positive reaction (celebratory reply), so ' +
      'the eyes/nod can be a touch more energetic than the other expressions, but the mouth ' +
      'itself must remain closed and still throughout — a single clean beat, not a bouncy loop. ' +
      'Return close to the starting head position by the final frame so the loop restart is ' +
      'not a visible jump.',
  },
  encouraging: {
    pose:
      'Dadi with a warm, calm, approving expression — softer and calmer than `happy`, not a ' +
      'peak emotion — a gentle closed-mouth smile, one hand already raised and held at chest ' +
      'height in an open, welcoming "go on, you are doing fine" gesture (the hand is already in ' +
      'this position in the still image — it does not rise into it during the clip). Close ' +
      'bust-to-shoulders crop, near-front or gentle three-quarter angle.',
    motion:
      // Three prior attempts all opened her mouth during ANY requested head
      // or hand motion (a big laugh on attempts 1a/1b/2, a smaller but still
      // present "o" shape on attempt 3 even with the hand pre-placed and only
      // a nod requested). Attempt 4: drop the nod too and copy `neutral`'s
      // exact successful formula verbatim (blink-only, explicit "nothing else
      // moves") — the only requested motion at all is the same single blink
      // that worked cleanly for `neutral` and `happy`. Everything that makes
      // this read as "encouraging" rather than "neutral" now lives entirely
      // in the STILL keyframe (the pose's warmer smile + raised open-palm
      // hand), not in any added motion.
      'The smallest possible motion, identical in spirit to her neutral idle state: one slow, ' +
      'natural blink partway through the clip, nothing else. Her raised hand does not move at ' +
      'all, holding its exact position from the first frame to the last. HER MOUTH DOES NOT ' +
      'MOVE OR CHANGE SHAPE AT ANY POINT IN THE CLIP — no opening, no widening, no laughing, ' +
      'exactly the same closed warm smile in every single frame, as if it were a still ' +
      'photograph of her mouth pasted onto each frame. This is her default-adjacent, most ' +
      'common everyday state (plays for ordinary supportive replies far more often than any ' +
      'other expression), so it must be calm and restrained, not energetic, not ' +
      'a laugh. Return to the exact starting head position by the final frame so the loop ' +
      'restart is not a visible jump.',
  },
};

const NO_TALKING_MOUTH =
  'FRAMING RULE (hard constraint): this clip has visible audio-independent dialogue composited ' +
  'over it later in whatever language the learner is studying, and the mouth motion generated ' +
  'here will never match it. Keep the mouth closed or naturally still throughout — do not ' +
  'animate an open, talking, or lip-syncing mouth. Convey the expression entirely through eyes, ' +
  'eyebrows, hands, and posture instead.';

const NEGATIVE_PROMPT =
  'blurry, distorted hands, extra limbs, warped or morphing faces, text, watermark, logo, ' +
  'subtitles, captions, on-screen writing, extra characters, second person, identity drift, ' +
  'open mouth, mouth opening, wide open mouth, gaping mouth, teeth showing, teeth, tongue, ' +
  'laughing, giggling, chuckling, smile widening, big smile, growing smile, mouth movement, ' +
  'open-mouth talking, exaggerated lip-sync motion, speaking mouth, jump cut, scene change, ' +
  'background change, camera cut, zoom';

// ------------------------------------------------------------------- rates

/** fal-ai/flux-pro/kontext — $0.04/image (single reference edit; same as fal/characters.ts). */
const KEYFRAME_RATE_PER_IMAGE = 0.04;
/** fal-ai/kling-video/v2.5-turbo/pro/image-to-video — $0.07/s (verify against live billing). */
const KLING_RATE_PER_SECOND = 0.07;
const KLING_MODEL_ID = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
/** Kling's duration enum is "5" | "10"; 5 is the only value inside the 2–6s persona-loop window. */
const CLIP_DURATION_SEC = 5;

// ------------------------------------------------------------------ actions

type GeneratePersonaAnimationResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      animationId: Id<'personaAnimations'>;
      keyframeStorageId: Id<'_storage'>;
      keyframeUrl: string;
      videoStorageId: Id<'_storage'>;
      costUsd: number;
      model: string;
      durationSec: number;
    };

/**
 * Generate ONE persona avatar clip and record it as `draft` via the existing
 * `personaAnimations.recordAnimation` mutation. Does NOT approve — a human
 * (here, the pipeline engineer watching the clip at actual avatar size) must
 * apply the acceptance test before calling `approveAnimation` /
 * `approveAnimationInternal` separately.
 */
export const generatePersonaAnimation = internalAction({
  args: {
    characterSlug: v.union(
      v.literal('dadi'),
      v.literal('parent'),
      v.literal('kid'),
      v.literal('neighbour'),
    ),
    expression: v.union(
      v.literal('neutral'),
      v.literal('happy'),
      v.literal('encouraging'),
      v.literal('thinking'),
    ),
    attempt: v.number(),
  },
  handler: async (ctx, args): Promise<GeneratePersonaAnimationResult> => {
    const trait = TRAIT_ANCHORS[args.characterSlug];
    if (!trait) {
      return {
        ok: false as const,
        reason: `No TRAIT_ANCHORS entry for "${args.characterSlug}" — this pipeline is Dadi-only so far.`,
      };
    }

    const spec = EXPRESSION_SPECS[args.expression];

    const refUrl: string | null = await ctx.runQuery(internal.fal.animations.getCharacterRefUrl, {
      slug: args.characterSlug,
    });
    if (!refUrl) {
      return {
        ok: false as const,
        reason: `Missing character reference for "${args.characterSlug}" — run generateCharacterReferences first`,
      };
    }

    let costUsd = 0;

    // 1. KEYFRAME — single-image expression/pose edit, identity locked via
    // trait anchor + explicit "keep exact identity" instruction (same
    // technique as fal/characters.ts's anglePrompt).
    const keyframePrompt =
      `${STYLE_ANCHOR} Single-character avatar portrait. Keep this EXACT character — ` +
      `${trait} — identical face, hairstyle, skin tone, clothing, and colors as the reference ` +
      `image. Change ONLY her pose and expression: ${spec.pose} ${AVATAR_BACKGROUND}`;

    const keyframeResult = await runFalJob<FalImageOutput>(
      'fal-ai/flux-pro/kontext',
      { image_url: refUrl, prompt: keyframePrompt },
      FAL_TIMEOUTS.image,
    );
    costUsd += KEYFRAME_RATE_PER_IMAGE;
    const keyframeImage = keyframeResult.images[0];
    if (!keyframeImage) return { ok: false as const, reason: 'Keyframe generation returned no image' };

    const keyframeStorageId = await downloadToStorage(ctx, keyframeImage.url, 'image/jpeg');

    // 2. ANIMATE — image-to-video from that keyframe. Never text-to-video.
    const videoPrompt =
      `${STYLE_ANCHOR} Animate this single-character avatar portrait as a short, seamless, ` +
      `${CLIP_DURATION_SEC}-second looping reaction. ${spec.motion} ${NO_TALKING_MOUTH} Keep her ` +
      `design perfectly consistent with the reference image throughout — same face, hairstyle, ` +
      `clothing, and colors from start to end. Natural, gentle, believable motion; no camera ` +
      `movement, no scene change, no background change.`;

    const videoResult = await runFalJob<FalVideoOutput>(
      KLING_MODEL_ID,
      {
        image_url: keyframeImage.url,
        prompt: videoPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        duration: String(CLIP_DURATION_SEC),
      },
      FAL_TIMEOUTS.video,
    );
    costUsd += KLING_RATE_PER_SECOND * CLIP_DURATION_SEC;

    const video = videoResult.video;
    if (!video?.url) return { ok: false as const, reason: 'Kling returned no video' };

    const videoStorageId = await downloadToStorage(ctx, video.url, 'video/mp4');

    const animationId: Id<'personaAnimations'> = await ctx.runMutation(
      api.personaAnimations.recordAnimation,
      {
        characterSlug: args.characterSlug,
        expression: args.expression,
        storageId: videoStorageId,
        keyframeStorageIds: [keyframeStorageId],
        model: KLING_MODEL_ID,
        ratePerSecond: KLING_RATE_PER_SECOND,
        durationSec: CLIP_DURATION_SEC,
        prompt: videoPrompt,
        attempt: args.attempt,
      },
    );

    return {
      ok: true as const,
      animationId,
      keyframeStorageId,
      keyframeUrl: keyframeImage.url,
      videoStorageId,
      costUsd,
      model: KLING_MODEL_ID,
      durationSec: CLIP_DURATION_SEC,
    };
  },
});
