# Branding, Voice & Character Bible

> Status: ✅ written — decisions locked 2026-07-18, art direction revised 2026-08-02 after the first real fal.ai pilot (see Art direction below). Changes here invalidate generated clips; treat edits as breaking.

## Purpose and scope

This spec defines the visual and tonal identity of Sarvabhasha: the art direction, the recurring cast, how they're prompted, and the tone of every user-facing surface. Every fal.ai prompt in `content-pipeline.md` references this file.

Does not cover: the generation pipeline mechanics (see [`content-pipeline.md`](content-pipeline.md)), UI theme tokens (see [`theming-and-dark-mode.md`](theming-and-dark-mode.md)).

## Naming strategy

**Sarvabhasha** (सर्वभाषा, "all languages") is the parent/legal name — distinctive, semantically exact, ownable.

It is also a Sanskrit word, which is a ceiling on international expansion. The strategy is therefore **mascot-forward**: the brand a user recognises is the character, not the word. That lets a future non-Indian market get a localised product name without a rebrand, because the recognisable asset — the cast — travels.

Practical consequence: the cast appears on the splash screen, as the AI tutor's avatar, in empty states, and in every animation. Not just in the content.

## Art direction

**Stylized cartoon — soft-shaded, not flat.**

> **Revision note (2026-08-02):** the original plan called for a *flat*, two-tone, visible-outline 2D style. The first real pilot (fal.ai FLUX + Kontext for references, Kling for video) consistently produced a softly-shaded, semi-dimensional look instead — gradient shading, no hard outline — regardless of prompting toward flat/cel-shaded rendering. Rather than fight the model or invest in a custom style LoRA before the pilot category even had one full pass, the decision was to accept what the pipeline naturally produces well and lock *that* as the style, since it independently satisfies all three reasons flat-2D was chosen (below). Revisit only if a LoRA investment becomes worthwhile for other reasons (e.g. multi-character scene composition), not to chase the originally-planned line-art look for its own sake.

Chosen over photoreal and folk-art styles because it solves three problems at once:
1. **Character consistency** is far more achievable in a stylized register than in photoreal faces, where small drifts read as uncanny. Confirmed in the pilot: the same character stayed recognizable across front/three-quarter/profile references and into the animated clip.
2. **Lip-sync tolerance** — cartoon mouth movement is forgiving. Photoreal mouths that don't match Tamil audio are actively distracting. (We are avoiding talking-head framing regardless — see below — but the tolerance is a useful safety margin.)
3. **Comedy register** — "funny and playful" is native to the style. Photoreal comedy is hard; cartoon comedy is the default.

Style anchors to hold constant across every generation:

| Attribute | Locked value |
|---|---|
| Line | No hard outline — soft-shaded, gently dimensional rendering (what FLUX/Kontext produce natively) |
| Shading | Smooth gradient shading, not flat/cel-shaded — this is the actual pilot output, not a stylistic reach |
| Palette | Warm, saturated, Indian daylight — not pastel, not muted |
| Proportion | Slightly stylized heads, expressive faces, readable at phone size |
| Backgrounds | Simplified but specific — a real Indian street, not generic |
| Camera | Mid and wide shots. Close-ups only when no speech is on screen |

## The cast

Four recurring characters — a family and their neighbour. A family unit was chosen deliberately: it covers nearly every category naturally (a grandmother handles Greetings and Health, a kid handles School, a parent handles Market and Money) without inventing new people per category.

| Character | Role | Appears in |
|---|---|---|
| **Dadi** — grandmother | Warm, direct, mildly bossy. The authority on courtesy. | Greetings, Health & Body, Family, Daily Routine |
| **Parent** — mother or father | Practical, busy, does the errands. | Food & Market, Numbers/Money/Bargaining, Travel & Directions |
| **Kid** — ~9 years old | Curious, literal, comic engine. Gets things slightly wrong. | School & Work, Numbers, Daily Routine |
| **Neighbour** — adult peer | The outside world: the vendor, the stranger, the person you ask. | Market, Travel & Directions, Emergency & Help |

Each has a locked reference image set (front, three-quarter, profile) stored as pipeline assets. Every keyframe generation is conditioned on the relevant reference. A character not in this table needs an explicit reason; if it recurs, it gets added here.

## Framing constraint — no talking heads

Bhashini TTS audio and fal.ai video are generated independently. Mouths will never match the target language, across 22 languages. Every scene is therefore composed so that speech is not read off a mouth:

- Speech bubble carrying the phrase in the target script
- Gesture and body language carrying the intent
- Speaker in profile, partly off-frame, or with the listener in foreground
- Cutaway to the object of the sentence (the vegetables, the bus, the price)

This is a hard constraint on every prompt, not a stylistic preference.

## What makes a clip meaningful

The acceptance test, applied to every generation: **mute the audio and hide the subtitle. Can a learner infer roughly what the phrase means?** If not, the clip is decoration.

Structure is three beats in 8–10 seconds:

```
SETUP     (~3s)  establish who, where, what's wanted
PHRASE    (~3s)  the line is delivered — bubble + gesture
REACTION  (~3s)  response confirms meaning landed
```

Worked example, *yeh kitne ka hai?* ("how much is this?"):

```
SETUP     Parent stops at a vegetable cart, picks up a bunch of coriander,
          turns to the Neighbour-as-vendor.
PHRASE    Speech bubble: यह कितने का है? — Parent gestures at the coriander
          with a questioning open palm.
REACTION  Vendor holds up four fingers, grins. Parent's eyebrows shoot up.
          Beat. Parent starts to put it back. Vendor's grin falters.
```

Meaning survives the mute test: someone is asking a price, and the price is too high. The comedy is in the reaction, not in the phrase — which is the general rule.

## Tone of voice

| Surface | Register |
|---|---|
| Animations | Warm, observational, gently funny. Comedy comes from human reactions — sticker shock, a kid's literalism, Dadi's disapproval — never from mocking a language, region, accent, or the learner. |
| AI tutor | Encouraging, patient, never condescending. Corrects by modelling the right phrasing, not by marking things wrong. Persona options carried over from `learn-bharat` (Dadi, Didi, Master Ji, etc.), defaulting to Dadi to reinforce the cast. |
| UI copy | Plain and short. The learner is often not fluent in the *interface* language either. Avoid idiom, avoid cleverness. |
| Error states | Take responsibility, never blame the learner. "That didn't load" not "You are offline". |

## Hard lines

- No caricature of region, caste, class, religion, or accent. The cast is specific but not a stereotype.
- No joke where the butt is someone speaking a language imperfectly. That is the learner.
- No real public figures, no branded products, no existing IP in any generated frame.
- Comedy is warm. If a clip could make a learner feel laughed at rather than laughed with, it fails.

## Known gaps

- Reference image sets now exist for all four cast members, all visually reviewed and approved. Dadi and Neighbour were generated 2026-08-02 and are in production use (5 live `greetings` animations). Parent and Kid were generated 2026-08-02 (`packages/backend/convex/fal/characters.ts`'s `CHARACTER_BIBLE`, front/three-quarter/profile via `generateCharacterReferences`) and reviewed the same day — Kid's front needed a repair (see `plans/phase-5-content-pipeline-animation.md`: `flux/dev` produced a soft/out-of-focus front across 4 attempts, fixed by Kontext-editing the already-sharp three-quarter view back to a front-facing pose via the new `regenerateFrontFromAngle` action instead of re-rolling the full generation). Nothing downstream consumes Parent/Kid yet — no phrases or animations exist for them, so this is pure setup for whichever category comes next.
- **Resolved 2026-08-02:** no style LoRA — FLUX (`flux/dev` for the front reference, `flux-pro/kontext` for angle-locked edits, `flux-pro/kontext/max/multi` for multi-character scene keyframes) plus Kling (`kling-video/v2.5-turbo/pro/image-to-video`) reference conditioning alone produces consistent, on-brand characters. See the Art direction revision note above — the achievable style differs from the original flat-2D plan, and the plan was changed to match reality rather than adding LoRA-training scope to hit the original look.
- Regional visual variation across 22 languages (a Tamil street vs a Bengali one) is undecided. Default for launch: keep backgrounds regionally neutral, revisit if learners report it feels generic.
- Clip file size ran large in the pilot (~11.5MB for a 10s clip) — above the manual-upload script's own 8MB bandwidth-conscious warning threshold. Re-encoding (720p, H.264, CRF ~26, per that script's existing comment) before clips reach real learners is an open task, not yet automated into the generation pipeline.

## Cross-references

| Concern | Authoritative spec |
|---|---|
| How clips are generated and published | [`content-pipeline.md`](content-pipeline.md) |
| Which languages are live, and quality tiers | [`languages-and-rollout.md`](languages-and-rollout.md) |
| Categories and phrase selection | [`learn-and-categories.md`](learn-and-categories.md) |
| Tutor personas and conversation behaviour | [`ai-tutor.md`](ai-tutor.md) |
| UI theme tokens and dark mode | [`theming-and-dark-mode.md`](theming-and-dark-mode.md) |
