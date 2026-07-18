# Branding, Voice & Character Bible

> Status: ✅ written — decisions locked 2026-07-18. Changes here invalidate generated clips; treat edits as breaking.

## Purpose and scope

This spec defines the visual and tonal identity of Sarvabhasha: the art direction, the recurring cast, how they're prompted, and the tone of every user-facing surface. Every fal.ai prompt in `content-pipeline.md` references this file.

Does not cover: the generation pipeline mechanics (see [`content-pipeline.md`](content-pipeline.md)), UI theme tokens (see [`theming-and-dark-mode.md`](theming-and-dark-mode.md)).

## Naming strategy

**Sarvabhasha** (सर्वभाषा, "all languages") is the parent/legal name — distinctive, semantically exact, ownable.

It is also a Sanskrit word, which is a ceiling on international expansion. The strategy is therefore **mascot-forward**: the brand a user recognises is the character, not the word. That lets a future non-Indian market get a localised product name without a rebrand, because the recognisable asset — the cast — travels.

Practical consequence: the cast appears on the splash screen, as the AI tutor's avatar, in empty states, and in every animation. Not just in the content.

## Art direction

**Stylized 2D cartoon.**

Chosen over 3D, photoreal, and folk-art styles because it solves three problems at once:
1. **Character consistency** is far more achievable in a flat, stylized register than in photoreal faces, where small drifts read as uncanny.
2. **Lip-sync tolerance** — cartoon mouth movement is forgiving. Photoreal mouths that don't match Tamil audio are actively distracting. (We are avoiding talking-head framing regardless — see below — but the tolerance is a useful safety margin.)
3. **Comedy register** — "funny and playful" is native to the style. Photoreal comedy is hard; cartoon comedy is the default.

Style anchors to hold constant across every generation:

| Attribute | Locked value |
|---|---|
| Line | Clean, moderate weight, visible outline |
| Shading | Flat to two-tone; no gradient rendering |
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

- Reference image sets for the four characters are **not yet generated**. This is the first pipeline task — the bible is unusable until they exist, and they must be produced and approved before any category batch.
- Whether a style LoRA is needed (as in `chitrakatha`) or FLUX reference conditioning is sufficient is unresolved. Decide during the Greetings pilot.
- Regional visual variation across 22 languages (a Tamil street vs a Bengali one) is undecided. Default for launch: keep backgrounds regionally neutral, revisit if learners report it feels generic.

## Cross-references

| Concern | Authoritative spec |
|---|---|
| How clips are generated and published | [`content-pipeline.md`](content-pipeline.md) |
| Which languages are live, and quality tiers | [`languages-and-rollout.md`](languages-and-rollout.md) |
| Categories and phrase selection | [`learn-and-categories.md`](learn-and-categories.md) |
| Tutor personas and conversation behaviour | [`ai-tutor.md`](ai-tutor.md) |
| UI theme tokens and dark mode | [`theming-and-dark-mode.md`](theming-and-dark-mode.md) |
