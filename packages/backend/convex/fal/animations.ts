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
const TRAIT_ANCHORS: Record<'dadi' | 'parent' | 'kid' | 'neighbour', string> = {
  dadi: 'an elderly woman with silver-grey hair in a low bun, a red bindi, and NO facial hair of any kind — completely smooth face, no moustache, no beard',
  neighbour: 'an adult man with short black hair and a trim black moustache ONLY — NO beard, NO goatee, NO stubble or facial hair anywhere on the cheeks, jaw, or chin, completely clean-shaven except for the moustache; wearing a light-blue and white checked short-sleeved shirt — the moustache and the checked shirt both belong ONLY to him',
  parent: 'an adult woman, medium build, with black hair pulled back into a low braid, wearing a teal-green kurta, NO bindi and NO facial hair — deliberately plainer than Dadi',
  kid: 'a small 9-year-old boy with small, rounded child proportions — a noticeably bigger head-to-body ratio and shorter limbs than any adult in the scene — messy short black hair and a bright orange-red t-shirt; he must read as visibly shorter and less filled-out than every adult character, never adult-proportioned',
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
  {
    other: 'dadi' | 'parent' | 'kid' | 'neighbour';
    setting: string;
    setup: string;
    phrase: string;
    reaction: string;
  }
> = {
  'namaste-hello': {
    other: 'neighbour',
    setting: 'a simplified but specific Indian residential street in warm morning daylight',
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
    setting: 'a simplified but specific Indian residential street in warm morning daylight',
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
    setting: 'a simplified but specific Indian residential street in warm morning daylight',
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
    setting: 'a simplified but specific Indian residential street in warm morning daylight',
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
    setting: 'a simplified but specific Indian residential street in warm morning daylight',
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
  'kitne-ka-hai-how-much': {
    other: 'neighbour',
    setting: 'a simplified but specific Indian street-market vegetable cart, warm daylight',
    setup:
      "Parent walks up to the Neighbour's vegetable cart and picks up a bunch of coriander, " +
      'looking it over.',
    phrase:
      'Parent turns to the Neighbour, holds up the coriander with a questioning open-palm ' +
      'gesture toward it, eyebrows raised in a "what\'s the price" expression.',
    reaction:
      "The Neighbour smiles and holds up fingers indicating a price, watching Parent's face " +
      'for a reaction.',
  },
  'bahut-mahanga-too-expensive': {
    other: 'neighbour',
    setting: 'the same street-market vegetable cart, warm daylight',
    setup:
      "The Neighbour has just named a price, holding up fingers to show the number; Parent " +
      'is still holding the coriander.',
    phrase:
      "Parent's eyebrows shoot up in surprise, one hand goes to their chest in mock shock, " +
      'the other hand gestures toward the vegetable as if to say "for this?"',
    reaction:
      "The Neighbour's confident grin falters slightly, scratching the back of his neck, " +
      'half-expecting the reaction.',
  },
  'thoda-kam-karo-lower-price': {
    other: 'neighbour',
    setting: 'the same street-market vegetable cart, warm daylight',
    setup:
      'Parent and the Neighbour are mid-negotiation at the cart, Parent still holding the ' +
      'coriander, a beat of standoff between them.',
    phrase:
      'Parent presses their palms together slightly, tilting their head with a ' +
      'pleading-but-friendly expression, gesturing downward with one hand as if lowering an ' +
      'invisible bar.',
    reaction:
      'The Neighbour sighs theatrically, shrugs, and gives a small relenting nod, starting to ' +
      'recount the price.',
  },
  'paanch-rupaye-five-rupees': {
    other: 'neighbour',
    setting: 'a small street-side sweet stall with jars of candy visible, warm daylight',
    setup:
      "Kid stands on tiptoe at the Neighbour's sweet stall, carefully counting coins out of a " +
      'small cloth pouch onto his open palm.',
    phrase:
      'Kid holds up his palm full of coins toward the Neighbour proudly, chest puffed out, a ' +
      'big confident grin.',
    reaction:
      'The Neighbour leans down, inspects the coins with an amused smile, and gives Kid an ' +
      'approving nod before reaching for the sweets.',
  },
  'chutta-nahi-hai-no-change': {
    // speakerCharacter for this phrase is 'neighbour' (confirmed against
    // seed.ts) — the OTHER character in the scene is Parent, not another
    // Neighbour. Setting other: 'neighbour' here would trip the
    // speaker === other guard below (the exact bug documented on
    // kaise-ho-how-are-you / shubh-prabhat-good-morning above).
    other: 'parent',
    setting: 'the same street-market vegetable cart, warm daylight',
    // "note" (banknote) read as a WRITTEN note in one generation — the model
    // rendered Parent holding a piece of paper with actual handwritten text
    // on it, violating the hard "no text baked into the frame" rule (that
    // text would show, untranslated, in every one of the 22 languages this
    // clip is reused across). Reworded to unambiguous currency/cash language
    // throughout — no bare "note".
    setup:
      'Parent hands the Neighbour a large-denomination rupee banknote (a purple or pink bill, ' +
      'no readable text or numbers on it) after a purchase; the Neighbour takes the cash and ' +
      'starts checking his coin pouch.',
    phrase:
      "The Neighbour turns his coin pouch inside out with an apologetic shrug, showing " +
      "Parent there's nothing there.",
    reaction:
      "Parent's shoulders drop slightly in mild exasperation, then breaks into a resigned, " +
      'understanding smile, patting their own pockets to see if they have smaller-denomination ' +
      'cash instead.',
  },

  // --------------------------------------------------------- food-market

  'aapko-kya-chahiye-what-do-you-need': {
    other: 'parent',
    setting: 'a simplified but specific Indian street-market fruit and vegetable stall, warm daylight',
    setup: "Parent walks up to the Neighbour's fruit and vegetable stall, looking over the produce.",
    phrase:
      'The Neighbour looks up with a welcoming smile and open palms, asking what she needs.',
    reaction:
      'Parent smiles back and starts pointing at a basket of vegetables.',
  },
  'ek-kilo-aalu-one-kilo-potatoes': {
    other: 'neighbour',
    setting: 'the same fruit and vegetable stall, warm daylight',
    setup: 'Parent points to a pile of potatoes at the stall.',
    phrase:
      'Parent holds up one finger and gestures at the potatoes, indicating the quantity she wants.',
    reaction: 'The Neighbour nods and starts scooping potatoes onto a hanging scale.',
  },
  'kya-yeh-taaze-hain-are-these-fresh': {
    other: 'neighbour',
    setting: 'the same fruit and vegetable stall, warm daylight',
    setup: 'Parent picks up a tomato from the stall and examines it closely.',
    phrase:
      'Parent holds the tomato toward the Neighbour with a questioning look, checking its freshness.',
    reaction: 'The Neighbour puffs up proudly, gesturing at the produce with confidence.',
  },
  'haan-bahut-taaze-hain-yes-very-fresh': {
    other: 'parent',
    setting: 'the same fruit and vegetable stall, warm daylight',
    setup:
      'The Neighbour picks up another tomato and holds it up next to the scale, still confident.',
    phrase: 'The Neighbour nods enthusiastically, giving a thumbs-up about the freshness.',
    reaction:
      'Parent smiles, satisfied, and starts placing items into a basket.',
  },
  'ek-thaila-dijiye-give-me-a-bag': {
    other: 'neighbour',
    setting: 'the same fruit and vegetable stall, warm daylight',
    setup: 'Parent has finished selecting her vegetables, now piled on the counter.',
    phrase:
      'Parent gestures toward the vegetables and mimes holding open a bag, asking for one.',
    reaction: 'The Neighbour reaches under the stall and hands her a cloth bag with a smile.',
  },

  // ----------------------------------------------------- travel-directions

  'rasta-bhool-gaya-i-am-lost': {
    // speakerCharacter is 'parent'; the Neighbour appears as a passerby she
    // is about to approach, not yet in conversation with her during SETUP —
    // still a valid two-character scene per the speaker !== other rule.
    other: 'neighbour',
    setting: 'a simplified but specific Indian street corner with shopfronts, warm daylight',
    setup:
      'Parent stands at a street corner, looking around uncertainly at the unfamiliar ' +
      'buildings, a phone in hand.',
    phrase:
      "Parent sighs and rubs her forehead, looking around, realizing she doesn't recognize " +
      'where she is.',
    reaction:
      'The Neighbour, passing by, notices her confusion and slows down, looking at her with ' +
      'concern.',
  },
  'bus-stop-kahan-hai-where-is-bus-stop': {
    other: 'neighbour',
    setting: 'the same street corner, warm daylight',
    setup: 'The Neighbour has stopped near Parent, ready to help.',
    phrase: 'Parent turns to him and asks, pointing questioningly down the street.',
    reaction: 'The Neighbour nods and points confidently in a specific direction.',
  },
  'seedhe-jaiye-go-straight-turn-left': {
    other: 'parent',
    setting: 'the same street corner, warm daylight',
    setup: 'The Neighbour gestures down the street, orienting himself to explain the route.',
    phrase:
      'The Neighbour points straight ahead, then makes a sweeping motion to the left, ' +
      'explaining the turn.',
    reaction:
      'Parent nods, following his hand movements, mentally noting the directions.',
  },
  'kitni-door-hai-how-far-is-it': {
    other: 'neighbour',
    setting: 'the same street corner, warm daylight',
    setup: 'Parent looks down the street in the direction the Neighbour pointed.',
    phrase:
      'Parent turns back to him with a slightly worried expression, asking about the distance.',
    reaction:
      'The Neighbour smiles reassuringly and holds up a hand in a "not much" gesture.',
  },
  'paanch-minute-just-five-minutes': {
    other: 'parent',
    setting: 'the same street corner, warm daylight',
    setup: 'The Neighbour taps his wrist where a watch would be, thinking about the time.',
    phrase:
      'The Neighbour holds up five fingers and gestures toward the walking direction.',
    reaction:
      'Parent looks relieved, smiles, and waves goodbye as she starts walking.',
  },

  // -------------------------------------------------------------- family

  'dadi-mujhe-bhookh-lagi-hai-im-hungry': {
    // First attempt read as an affectionate hug on inspection — the mute
    // test failed (a learner couldn't infer "hungry" from it). Reworded to
    // an explicit, hard-to-misread hungry-complaint pose with a direct
    // negative constraint against the hug/affection reading it drifted to.
    other: 'dadi',
    setting: 'a simplified but specific Indian home kitchen, warm daylight',
    setup: "Kid runs into the kitchen where Dadi is cooking, tugging urgently at her saree.",
    phrase:
      'Kid clutches both hands over his own belly, rubbing it, eyebrows furrowed and mouth ' +
      'open in an urgent hungry complaint — a whiny "I\'m starving" expression, body ' +
      'slightly hunched forward. This is a hungry complaint, NOT a hug or an affectionate ' +
      'moment — Kid does not embrace Dadi here.',
    reaction:
      'Dadi looks down at him with a fond, amused smile, wiping her hands on her apron.',
  },
  'thoda-ruko-beta-wait-a-little': {
    other: 'kid',
    setting: 'the same home kitchen, warm daylight',
    setup: 'Dadi continues stirring something on the stove, Kid still waiting beside her.',
    phrase:
      'Dadi holds up a hand in a "wait" gesture, glancing at Kid warmly without stopping her work.',
    reaction:
      'Kid sighs dramatically and slumps his shoulders, but nods, resigned to waiting.',
  },
  'mummy-kahan-hai-where-is-mumma': {
    other: 'dadi',
    setting: 'a simplified but specific Indian home living room, warm daylight',
    setup: 'Kid looks around the room, not seeing his mother anywhere.',
    phrase:
      'Kid tugs Dadi\'s sleeve and looks up at her questioningly, shrugging his shoulders.',
    reaction: 'Dadi smiles and points toward the door, about to explain.',
  },
  'woh-bazaar-gayi-hai-she-went-to-market': {
    other: 'kid',
    setting: 'the same home living room, warm daylight',
    setup: 'Dadi points toward the door where Parent recently left.',
    phrase: 'Dadi gestures outward with an open palm, explaining calmly to Kid.',
    reaction: 'Kid nods, satisfied with the answer, and goes back to playing.',
  },
  'main-aapse-pyaar-karta-hoon-i-love-you': {
    other: 'dadi',
    setting: 'the same home living room, warm daylight',
    setup: 'Kid runs up to Dadi, who is sitting on a chair, and wraps his arms around her.',
    phrase: 'Kid hugs Dadi tightly, resting his head on her shoulder.',
    reaction:
      "Dadi's eyes soften, she wraps her arms around him and pats his back warmly.",
  },

  // -------------------------------------------------------- daily-routine

  'jaag-jao-subah-ho-gayi-wake-up': {
    // First attempt showed Kid already standing, fully dressed, and alert —
    // the mute test failed (didn't read as "waking up" at all). Reworded so
    // Kid stays lying down / in-bed through the whole clip, with an explicit
    // negative constraint against standing up or getting dressed.
    other: 'kid',
    setting: 'a simplified but specific Indian home bedroom, soft morning light',
    setup:
      'Morning light streams into a small bedroom where Kid is lying down in bed, eyes ' +
      'closed, blanket pulled up to his chest, clearly still fast asleep.',
    phrase:
      "Dadi sits on the edge of the bed and gently shakes Kid's shoulder while he is still " +
      'lying down, smiling as she wakes him. Kid remains lying in bed throughout — NOT ' +
      'standing, NOT out of bed, NOT dressed.',
    reaction:
      'Kid slowly opens his eyes and stretches while still lying in bed, hair messy, one ' +
      'hand rubbing his eyes, clearly groggy — still under the blanket, not yet out of bed.',
  },
  'pehle-daant-saaf-karo-brush-your-teeth': {
    other: 'kid',
    setting: 'a simplified but specific Indian home hallway near a bathroom door, morning light',
    setup: 'Kid, now out of bed, starts to wander toward the door still in his pajamas.',
    phrase:
      'Dadi points firmly toward the bathroom, holding up an imaginary toothbrush gesture.',
    reaction: 'Kid makes a reluctant face but turns toward the bathroom.',
  },
  'mujhe-daant-saaf-nahi-karne-dont-want-to-brush': {
    other: 'dadi',
    setting: 'the same hallway near the bathroom door, morning light',
    setup: 'Kid stands at the bathroom doorway, arms crossed, refusing to go further.',
    phrase: 'Kid shakes his head firmly, crossing his arms with a stubborn pout.',
    reaction: 'Dadi puts her hands on her hips, giving him a mock-stern look.',
  },
  'jaldi-nashta-karo-eat-breakfast-quickly': {
    other: 'kid',
    setting: 'a simplified but specific Indian home kitchen table set for breakfast, morning light',
    setup: 'Kid now sits at the table with a bowl in front of him, dawdling.',
    phrase:
      'Dadi taps the table and gestures for him to hurry, glancing at an imaginary clock.',
    reaction: 'Kid quickly picks up his spoon and starts eating.',
  },
  'main-school-ke-liye-taiyaar-hoon-ready-for-school': {
    other: 'dadi',
    setting: 'a simplified but specific Indian home front door, morning light',
    setup: 'Kid now stands by the door in his school uniform, backpack on.',
    phrase: 'Kid strikes a proud pose, gesturing at himself, fully ready.',
    reaction: 'Dadi claps her hands together, beaming with pride.',
  },

  // ---------------------------------------------------------- health-body

  'mere-pet-mein-dard-hai-stomach-hurts': {
    other: 'dadi',
    setting: 'a simplified but specific Indian home living room, warm daylight',
    setup: 'Kid stands in the living room clutching his stomach, wincing.',
    phrase:
      'Kid presses both hands to his belly, doubled over slightly, face scrunched in ' +
      'discomfort.',
    reaction: 'Dadi rushes over, concern etched on her face, reaching out to him.',
  },
  'kahan-dard-hai-where-does-it-hurt': {
    // First attempt read as generic affection with no questioning gesture —
    // mute test failed for this QUESTION phrase (a learner couldn't tell
    // Dadi was asking anything, let alone where it hurts). Reworded with an
    // explicit, unmistakable pointing/searching gesture on both sides.
    other: 'kid',
    setting: 'the same home living room, warm daylight',
    setup:
      "Dadi kneels down in front of Kid, still holding his belly, her face full of concern.",
    phrase:
      "Dadi holds both palms open and moves them searchingly along Kid's torso without " +
      'touching him, eyebrows raised high, mouth open mid-question, clearly asking "where" ' +
      '— an unmistakable questioning gesture, not a hug or an embrace.',
    reaction:
      'Kid points with one finger directly at his own belly, wincing, giving her a clear answer.',
  },
  'mujhe-bukhaar-hai-i-have-a-fever': {
    other: 'dadi',
    setting: 'the same home living room, warm daylight',
    setup: "Dadi presses the back of her hand to Kid's forehead to check his temperature.",
    phrase:
      'Kid looks up at her, cheeks flushed pink, feeling warm and unwell.',
    reaction:
      "Dadi's eyes widen slightly with concern, and she immediately guides him toward the " +
      'bedroom.',
  },
  'aaram-karo-take-rest': {
    other: 'kid',
    setting: 'a simplified but specific Indian home bedroom, soft warm light',
    setup: 'Dadi tucks Kid into bed, pulling a blanket over him.',
    phrase: 'Dadi pats the blanket gently and gestures for him to lie back and rest.',
    reaction: 'Kid nods obediently and settles into the pillow, closing his eyes.',
  },
  'ab-mujhe-accha-lag-raha-hai-feeling-better': {
    other: 'dadi',
    setting: 'the same home bedroom, soft warm light',
    setup:
      'Some time has passed; Kid sits up in bed, looking brighter and more energetic.',
    phrase: 'Kid smiles widely and gives a thumbs-up, sitting up on his own.',
    reaction:
      "Dadi claps her hands together with relief and joy, delighted to see him well again.",
  },

  // ------------------------------------------------------------ emergency
  // Tone note: unlike the other categories, this one is not played for
  // comedy — warm and reassuring throughout, per the pipeline's own rule
  // against ever mocking anyone (here, someone hurt/in distress).

  'madad-karo-help': {
    other: 'neighbour',
    setting: 'a simplified but specific Indian residential street, warm daylight',
    setup: 'Parent walks along the street and trips on an uneven paving stone, stumbling.',
    phrase:
      'Parent falls to the ground, one hand raised, calling out with an alarmed expression.',
    reaction: 'The Neighbour, nearby, spins around immediately and rushes toward her.',
  },
  'mujhe-chot-lagi-hai-i-am-injured': {
    other: 'neighbour',
    setting: 'the same residential street, warm daylight',
    setup: 'The Neighbour crouches down beside Parent, who is still sitting on the ground.',
    phrase: 'Parent holds her ankle, wincing, showing him where she is hurt.',
    reaction: "The Neighbour's face fills with concern as he looks at her ankle.",
  },
  'main-doctor-ko-bulata-hoon-ill-call-a-doctor': {
    other: 'parent',
    setting: 'the same residential street, warm daylight',
    setup: 'The Neighbour reaches into his pocket and pulls out his phone.',
    phrase: 'The Neighbour holds the phone to his ear, nodding reassuringly at Parent.',
    reaction: 'Parent nods back gratefully, still holding her ankle.',
  },
  'ambulance-bulaiye-call-an-ambulance': {
    other: 'neighbour',
    setting: 'the same residential street, warm daylight',
    setup: 'Parent, still in pain, looks up at the Neighbour urgently.',
    phrase:
      'Parent gestures with an open palm toward his phone, asking urgently for more help.',
    reaction: 'The Neighbour nods quickly and dials again, his expression turning serious.',
  },
  'chinta-mat-karo-dont-worry': {
    other: 'parent',
    setting: 'the same residential street, warm daylight',
    setup: 'The Neighbour kneels beside Parent, phone call finished, staying close to her.',
    phrase:
      "The Neighbour holds a hand near her shoulder at a respectful distance, not touching, " +
      'smiling gently to calm her.',
    reaction: 'Parent takes a breath and manages a small, relieved smile.',
  },

  // ----------------------------------------------------------- school-work

  'homework-kar-liya-have-you-done-homework': {
    other: 'kid',
    setting: 'a simplified but specific Indian home living room, warm daylight',
    setup: 'Parent walks into the living room where Kid is playing with a toy on the floor.',
    phrase:
      'Parent crosses her arms and raises an eyebrow, gesturing toward a school bag in the ' +
      'corner, asking about homework.',
    reaction: 'Kid freezes mid-play, looking up sheepishly.',
  },
  'abhi-nahi-main-khel-raha-hoon-not-yet-playing': {
    other: 'parent',
    setting: 'the same home living room, warm daylight',
    setup: 'Kid, still holding his toy, glances at Parent.',
    phrase:
      'Kid shrugs and holds up his toy, gesturing that he is busy playing, an innocent ' +
      'evasive smile.',
    reaction: "Parent's eyebrow rises further, unconvinced, hands now on her hips.",
  },
  'abhi-jaakar-padho-go-study-now': {
    other: 'kid',
    setting: 'the same home living room with a small study desk visible, warm daylight',
    setup: 'Parent points firmly toward a small study desk in the corner of the room.',
    phrase:
      'Parent gestures decisively toward the desk and chair, a no-nonsense expression.',
    reaction: 'Kid sighs, sets down his toy, and shuffles toward the desk.',
  },
  'kal-mera-exam-hai-i-have-an-exam-tomorrow': {
    other: 'parent',
    setting: 'the same study desk corner, warm daylight',
    setup:
      'Kid, now sitting at the desk with a book open, suddenly sits up straight.',
    phrase:
      "Kid's eyes go wide, one hand slapping his forehead, suddenly remembering and looking " +
      'worried.',
    reaction:
      'Parent, nearby, gives him a knowing, sympathetic look and nods toward the book.',
  },
  'maine-homework-poora-kar-liya-finished-homework': {
    other: 'parent',
    setting: 'the same study desk corner, warm daylight',
    setup: 'Some time later, Kid closes his notebook and jumps up from the desk.',
    phrase: 'Kid holds up his notebook proudly toward Parent, beaming.',
    reaction: 'Parent takes the notebook, checks it, and smiles warmly, ruffling his hair.',
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
    // All four cast members' bible entries and reference images exist now
    // (dadi/neighbour from the greetings pilot, parent/kid generated ahead of
    // numbers-money). This guard's job is only to reject a genuinely
    // unknown/future character slug early and cheaply — actual
    // reference-existence is checked below via getCharacterRefUrl.
    if (
      phrase.speakerCharacter !== 'dadi' &&
      phrase.speakerCharacter !== 'parent' &&
      phrase.speakerCharacter !== 'kid' &&
      phrase.speakerCharacter !== 'neighbour'
    ) {
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
      `their own reference. Setting: ${beats.setting}. Composition, capturing this exact moment: ${beats.phrase} ` +
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
