#!/usr/bin/env bun
/**
 * Phase 13 pilot authoring orchestrator — vocabulary/numbers content is
 * Hindi-only so far; Aksharmala (script character) content is now
 * multi-script (Devanagari, then Bengali as of 2026-08-03 — see
 * `data.ts`'s `BENGALI_CHARACTERS` header for the research/sourcing notes).
 *
 * Shells out to `npx convex run` for every call (internal
 * mutations/actions aren't reachable via a plain `ConvexHttpClient` without
 * an admin key — same reasoning and same shape as
 * `packages/backend/scripts/upload-persona-animation.ts`).
 *
 * Usage (run from anywhere; cwd is fixed to packages/backend internally):
 *   bun scripts/phase13/run.ts seed-characters devanagari
 *   bun scripts/phase13/run.ts seed-characters bengali
 *   bun scripts/phase13/run.ts seed-category food-drink food-drink 3
 *   bun scripts/phase13/run.ts seed-category animals animals 4
 *   bun scripts/phase13/run.ts seed-category colours colours 5
 *   bun scripts/phase13/run.ts seed-category body-parts body-parts 6
 *   bun scripts/phase13/run.ts seed-category household-items household-items 7
 *   bun scripts/phase13/run.ts seed-vocab numbers '["25","30","40","50","60","70","80","90","100","200","500","1000"]'
 *   bun scripts/phase13/run.ts seed-vocab family
 *   bun scripts/phase13/run.ts seed-vocab food-drink
 *   bun scripts/phase13/run.ts seed-vocab animals
 *   bun scripts/phase13/run.ts seed-vocab colours
 *   bun scripts/phase13/run.ts seed-vocab body-parts
 *   bun scripts/phase13/run.ts seed-vocab household-items
 *
 * `seed-vocab`'s optional 2nd arg is a JSON array of itemKeys to restrict
 * seeding to — REQUIRED for `numbers` whenever new items have been added to
 * an already-partially-live category. `upsertVocabularyItem`/
 * `upsertVocabularyTranslation` both unconditionally re-land `status:
 * 'draft'` on every call (deliberate — any re-authoring invalidates a prior
 * review, CLAUDE.md rule 14), so an unfiltered re-seed of a
 * partially-live category silently demotes its already-live items back to
 * draft. This bit the follow-on pass for real: numbers 1–20 briefly
 * disappeared from the live app until manually re-approved. Omit the
 * filter only for a brand-new category with nothing live yet to demote.
 *   bun scripts/phase13/run.ts gen-images numbers '["25","30","40","50","60","70","80","90","100","200","500","1000"]'
 *   bun scripts/phase13/run.ts gen-images family
 *   bun scripts/phase13/run.ts gen-images food-drink
 *   bun scripts/phase13/run.ts gen-images animals
 *   bun scripts/phase13/run.ts gen-images colours
 *   bun scripts/phase13/run.ts gen-images body-parts
 *   bun scripts/phase13/run.ts gen-images household-items
 *
 * `gen-images`'s optional 2nd arg is a JSON array of itemKeys to restrict
 * generation to — REQUIRED for `numbers` whenever new items have been added
 * to an already-partially-live category (see `genImages`'s doc comment:
 * `generateVocabularyImage` is not idempotent, so an unfiltered re-run
 * would re-roll every already-live image at real fal.ai cost for no reason).
 * Omit it for a brand-new category where every item is new to this pass.
 *   bun scripts/phase13/run.ts gen-audio-characters devanagari
 *   bun scripts/phase13/run.ts gen-audio-characters bengali
 *   bun scripts/phase13/run.ts gen-audio-vocab numbers
 *   bun scripts/phase13/run.ts gen-audio-vocab family
 *   bun scripts/phase13/run.ts gen-audio-vocab food-drink
 *   bun scripts/phase13/run.ts gen-audio-vocab animals
 *   bun scripts/phase13/run.ts gen-audio-vocab colours
 *   bun scripts/phase13/run.ts gen-audio-vocab body-parts
 *   bun scripts/phase13/run.ts gen-audio-vocab household-items
 *   bun scripts/phase13/run.ts download-images
 *   bun scripts/phase13/run.ts asr-check                          # everything
 *   bun scripts/phase13/run.ts asr-check null '["bengali"]'        # only new Bengali characters
 *   bun scripts/phase13/run.ts approve-characters bengali '["অ","আ",...]'
 *
 * Every step writes/updates a JSON report at
 * packages/backend/scripts/phase13/report.json so review (contact sheets,
 * ASR transcript comparison) has a single source of truth, and so a partial
 * failure can be retried without re-running completed steps (every
 * underlying mutation/action is itself idempotent).
 *
 * Extended 2026-08-03 (follow-on pass, still Hindi-only): `categorySlug`
 * broadened from `'numbers' | 'family'` to the 5-slug union below, and a new
 * `seed-category` command creates the new categories' chrome rows before
 * `seed-vocab` can attach items to them (numbers/family already had their
 * category rows from the original pilot, so this step was previously
 * folded into `seed-vocab:numbers|family`'s one-time manual setup — new
 * categories need it explicit).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEVANAGARI_CHARACTERS,
  BENGALI_CHARACTERS,
  TAMIL_CHARACTERS,
  TELUGU_CHARACTERS,
  KANNADA_CHARACTERS,
  GUJARATI_CHARACTERS,
  GURMUKHI_CHARACTERS,
  MALAYALAM_CHARACTERS,
  NUMBERS,
  FAMILY,
  FOOD_DRINK,
  ANIMALS,
  COLOURS,
  BODY_PARTS,
  HOUSEHOLD_ITEMS,
  CLOTHES,
  VEGETABLES,
  type ScriptCharacterData,
} from './data';

type CategorySlug =
  | 'numbers'
  | 'family'
  | 'food-drink'
  | 'animals'
  | 'colours'
  | 'body-parts'
  | 'household-items'
  | 'clothing'
  | 'vegetables';

type ScriptSlug = 'devanagari' | 'bengali' | 'tamil' | 'telugu' | 'kannada' | 'gujarati' | 'gurmukhi' | 'malayalam';

/**
 * Every script authored through this pipeline, plus the ONE live language
 * whose TTS voice reads that script's clips (a script can serve several
 * languages — see `schema.ts`'s `scriptCharacters` comment — but only one
 * voice is needed to record it, same reasoning `google/aksharmalaTts.ts`
 * already documents for Devanagari/hi). Bengali serves both bn and as;
 * bn is the live language whose Chirp3-HD voice is used here.
 */
const SCRIPTS: Record<ScriptSlug, { characters: ScriptCharacterData[]; languageCode: string }> = {
  devanagari: { characters: DEVANAGARI_CHARACTERS, languageCode: 'hi' },
  bengali: { characters: BENGALI_CHARACTERS, languageCode: 'bn' },
  tamil: { characters: TAMIL_CHARACTERS, languageCode: 'ta' },
  telugu: { characters: TELUGU_CHARACTERS, languageCode: 'te' },
  kannada: { characters: KANNADA_CHARACTERS, languageCode: 'kn' },
  gujarati: { characters: GUJARATI_CHARACTERS, languageCode: 'gu' },
  gurmukhi: { characters: GURMUKHI_CHARACTERS, languageCode: 'pa' },
  malayalam: { characters: MALAYALAM_CHARACTERS, languageCode: 'ml' },
};

const BACKEND_DIR = resolve(__dirname, '..', '..');
const REPORT_PATH = resolve(__dirname, 'report.json');
const IMAGES_DIR = resolve(__dirname, 'images');

const FLUX_DEV_RATE = 0.025;
const SPEND_STOP_LIMIT = 5.0;

interface Report {
  spendUsd: number;
  imageCalls: Array<{ categorySlug: string; itemKey: string; ok: boolean; detail: string; imageUrl?: string | null; seed?: number }>;
  audioCalls: Array<{
    kind: 'character' | 'vocab';
    key: string;
    categorySlug?: string;
    /** Only set for `kind: 'character'` rows — which script this character belongs to. */
    script?: string;
    ok: boolean;
    detail: string;
    audioUrl?: string | null;
    expectedText?: string;
    asrTranscript?: string;
    asrOk?: boolean;
    asrNote?: string;
  }>;
}

function loadReport(): Report {
  if (existsSync(REPORT_PATH)) {
    return JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  }
  return { spendUsd: 0, imageCalls: [], audioCalls: [] };
}

function saveReport(report: Report) {
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

function runConvex(functionPath: string, args: Record<string, unknown>): any {
  const stdout = execFileSync('npx', ['convex', 'run', functionPath, JSON.stringify(args)], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  const trimmed = stdout.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

async function seedCharacters(scriptSlug: ScriptSlug) {
  const { characters } = SCRIPTS[scriptSlug];
  console.log(`Seeding ${characters.length} ${scriptSlug} characters...`);
  for (const c of characters) {
    runConvex('aksharmala:upsertScriptCharacter', {
      script: scriptSlug,
      character: c.character,
      characterType: c.characterType,
      romanization: c.romanization,
      exampleWord: c.exampleWord,
      exampleTransliteration: c.exampleTransliteration,
      sortOrder: c.sortOrder,
    });
    console.log(`  ✓ ${c.character} (${c.romanization})`);
  }
  console.log('Done.');
}

function numberImagePrompt(numeral: number, objectDescription: string): string {
  const countNote =
    numeral <= 20
      ? `exactly ${numeral} small identical ${objectDescription}, clearly countable and neatly arranged (not overlapping, not scattered) so the count is unambiguous`
      : `a small identical group of ${objectDescription} suggesting the quantity`;
  return (
    `A children's counting flashcard illustration. The numeral "${numeral}" rendered large, bold, ` +
    `and friendly in a rounded sans-serif style, positioned to one side. Next to it, ${countNote}. ` +
    `Soft-shaded 2D digital illustration style — gently dimensional rendering with smooth gradient ` +
    `shading, NO hard black outline or visible linework. Warm, saturated Indian-daylight color ` +
    `palette (not pastel, not muted). Plain softly-warm background, no scene, no setting. Clean, ` +
    `friendly, iconic, readable at small size. No extraneous text, no watermark, no logo.`
  );
}

function familyIconPrompt(subjectDescription: string): string {
  return (
    `A simple, friendly, GENERIC icon-style illustration representing "${subjectDescription}" — a ` +
    `standalone figure/portrait icon, centered, waist-up. Soft-shaded 2D digital illustration style ` +
    `— gently dimensional rendering with smooth gradient shading, NO hard black outline or visible ` +
    `linework. Warm, saturated Indian-daylight color palette (not pastel, not muted). Plain ` +
    `softly-warm background, no scene, no other figures, no props. Clean, friendly, iconic, readable ` +
    `at small size — not photorealistic. No text, no watermark, no logo.`
  );
}

/** Mirrors `convex/fal/vocabularyImages.ts`'s `foodImagePrompt` — see that file for the reasoning. */
function foodImagePrompt(subjectDescription: string): string {
  return (
    `A simple, appetizing icon-style illustration of "${subjectDescription}" — a single, clearly ` +
    `recognizable food or drink item, centered, filling most of the frame. No plate-of-many-dishes ` +
    `clutter — only the vessel the item is naturally served in (a cup, a bowl, a plate) if any, and ` +
    `nothing else sharing the frame. Soft-shaded 2D digital illustration style — gently dimensional ` +
    `rendering with smooth gradient shading, NO hard black outline or visible linework. Warm, ` +
    `saturated Indian-daylight color palette (not pastel, not muted). Plain softly-warm background, ` +
    `no scene, no setting. Clean, friendly, iconic, readable at small size. No text, no watermark, no logo.`
  );
}

/** Mirrors `convex/fal/vocabularyImages.ts`'s `animalImagePrompt` — see that file for the reasoning. */
function animalImagePrompt(subjectDescription: string): string {
  return (
    `A simple, friendly icon-style illustration of "${subjectDescription}" — a single animal, fully ` +
    `visible from head to tail in a simple relaxed pose (standing or sitting), oriented so its ` +
    `species is clearly legible even at small size — no other animals, no rider, no props. ` +
    `Soft-shaded 2D digital illustration style — gently dimensional rendering with smooth gradient ` +
    `shading, NO hard black outline or visible linework. Warm, saturated Indian-daylight color ` +
    `palette (not pastel, not muted). Plain softly-warm background, no scene, no setting. Clean, ` +
    `friendly, iconic, readable at small size. No text, no watermark, no logo.`
  );
}

/**
 * Mirrors `convex/fal/vocabularyImages.ts`'s `colourImagePrompt` — see that
 * file for the reasoning, including why `colourName` is deliberately NOT
 * interpolated into the prompt text (it caused literal English-word
 * captions to get baked into 3 of 12 images on the first real batch).
 */
function colourImagePrompt(colourName: string, colourDescription: string): string {
  return (
    `A colour-learning flashcard illustration. A large, smooth, rounded paint-swatch blob of ` +
    `${colourDescription} fills about half the frame, rendered as a vivid, accurate, saturated ` +
    `example of that exact colour — the swatch itself IS the subject. Beside it, two or three small ` +
    `everyday objects that are unmistakably that same colour in real life, rendered in that same ` +
    `colour, reinforcing which colour is being taught. Soft-shaded 2D digital illustration style — ` +
    `gently dimensional rendering with smooth gradient shading, NO hard black outline or visible ` +
    `linework. Plain softly-warm background, no scene, no setting. Clean, friendly, iconic, readable ` +
    `at small size. ABSOLUTELY NO words, letters, numerals, or writing of any kind rendered anywhere ` +
    `in the image, in any language — not the colour's name, not a caption, not a label on any ` +
    `object. This is a strict requirement: a purely pictorial illustration with zero text.`
  );
}

/** Mirrors `convex/fal/vocabularyImages.ts`'s `bodyPartImagePrompt` — see that file for the reasoning. */
function bodyPartImagePrompt(subjectDescription: string): string {
  return (
    `A simple, friendly icon-style illustration of "${subjectDescription}" — a single human body ` +
    `part shown in isolated close-up, deliberately generic (no specific skin tone, hairstyle, or ` +
    `outfit detail that would tie it to a particular person or named character). No other body ` +
    `parts or full figures sharing the frame beyond what the description itself calls for. ` +
    `Soft-shaded 2D digital illustration style — gently dimensional rendering with smooth gradient ` +
    `shading, NO hard black outline or visible linework. Warm, saturated Indian-daylight color ` +
    `palette (not pastel, not muted). Plain softly-warm background, no scene, no setting. Clean, ` +
    `friendly, iconic, readable at small size. No text, no watermark, no logo.`
  );
}

/** Mirrors `convex/fal/vocabularyImages.ts`'s `householdItemImagePrompt` — see that file for the reasoning. */
function householdItemImagePrompt(subjectDescription: string): string {
  return (
    `A simple, clean icon-style illustration of "${subjectDescription}" — a single, clearly ` +
    `recognizable household object, centered, filling most of the frame, nothing else sharing the ` +
    `frame. Soft-shaded 2D digital illustration style — gently dimensional rendering with smooth ` +
    `gradient shading, NO hard black outline or visible linework. Warm, saturated Indian-daylight ` +
    `color palette (not pastel, not muted). Plain softly-warm background, no scene, no setting. ` +
    `Clean, friendly, iconic, readable at small size. No text, no watermark, no logo.`
  );
}

/** Mirrors `convex/fal/vocabularyImages.ts`'s `clothesImagePrompt` — see that file for the reasoning. */
function clothesImagePrompt(subjectDescription: string): string {
  return (
    `A simple, clean icon-style illustration of "${subjectDescription}" — a single, clearly ` +
    `recognizable garment, centered, filling most of the frame, nothing else sharing the frame. ` +
    `Soft-shaded 2D digital illustration style — gently dimensional rendering with smooth gradient ` +
    `shading, NO hard black outline or visible linework. Warm, saturated Indian-daylight color ` +
    `palette (not pastel, not muted). Plain softly-warm background, no scene, no setting. Clean, ` +
    `friendly, iconic, readable at small size. No text, no watermark, no logo.`
  );
}

/** Mirrors `convex/fal/vocabularyImages.ts`'s `vegetableImagePrompt` — see that file for the reasoning. */
function vegetableImagePrompt(subjectDescription: string): string {
  return (
    `A simple, appetizing icon-style illustration of "${subjectDescription}" — a single, clearly ` +
    `recognizable whole vegetable, centered, filling most of the frame, nothing else sharing the ` +
    `frame. Soft-shaded 2D digital illustration style — gently dimensional rendering with smooth ` +
    `gradient shading, NO hard black outline or visible linework. Warm, saturated Indian-daylight ` +
    `color palette (not pastel, not muted). Plain softly-warm background, no scene, no setting. ` +
    `Clean, friendly, iconic, readable at small size. No text, no watermark, no logo.`
  );
}

function itemsForCategory(categorySlug: CategorySlug) {
  switch (categorySlug) {
    case 'numbers':
      return NUMBERS;
    case 'family':
      return FAMILY;
    case 'food-drink':
      return FOOD_DRINK;
    case 'animals':
      return ANIMALS;
    case 'colours':
      return COLOURS;
    case 'body-parts':
      return BODY_PARTS;
    case 'household-items':
      return HOUSEHOLD_ITEMS;
    case 'clothing':
      return CLOTHES;
    case 'vegetables':
      return VEGETABLES;
  }
}

/**
 * Creates (or re-patches chrome on) a new vocabulary category's row. Numbers
 * and family already had their category rows from the original pilot
 * (created ad hoc, not through this command) — this is only needed for
 * categories added in the follow-on pass. Idempotent, mirrors
 * `vocabulary:upsertVocabularyCategory`'s own contract exactly (leaves
 * `status` at whatever it already is / `draft` on first insert).
 */
async function seedCategory(slug: string, iconKey: string, sortOrder: string) {
  runConvex('vocabulary:upsertVocabularyCategory', {
    slug,
    iconKey,
    sortOrder: Number(sortOrder),
  });
  console.log(`  ✓ category "${slug}" seeded (iconKey=${iconKey}, sortOrder=${sortOrder})`);
}

/**
 * `onlyKeys`, when given, restricts seeding to those itemKeys.
 *
 * IMPORTANT LESSON (2026-08-03, follow-on pass — caused a real live-content
 * regression, since fixed by hand): `vocabulary:upsertVocabularyItem` and
 * `upsertVocabularyTranslation` BOTH unconditionally re-land `status:
 * 'draft'` on every call, per their own doc comments — deliberate, so any
 * re-authoring invalidates a prior human review (CLAUDE.md rule 14). That
 * means calling `seedVocab('numbers')` unfiltered, after numbers 1–20 were
 * already `live` from the original pilot, silently demoted all 20 of them
 * back to `draft` — they briefly disappeared from `listItemsByCategory`
 * until re-approved. Extending an ALREADY-PARTIALLY-LIVE category with new
 * items must pass `onlyKeys` naming just the new items; only a genuinely
 * brand-new category (nothing live yet to demote) is safe to seed
 * unfiltered.
 */
async function seedVocab(categorySlug: CategorySlug, onlyKeys?: string[]) {
  const allItems = itemsForCategory(categorySlug);
  // sortOrder reflects each item's position in the FULL category array (1-based),
  // never a fresh counter over a filtered subset — otherwise filtering to just the
  // new items would reassign colliding/wrong sortOrder values onto them.
  const items = allItems
    .map((item, i) => ({ item, sortOrder: i + 1 }))
    .filter(({ item }) => !onlyKeys || onlyKeys.includes(item.itemKey));
  console.log(`Seeding ${items.length} "${categorySlug}" items + hi translations...`);
  for (const { item, sortOrder } of items) {
    runConvex('vocabulary:upsertVocabularyItem', {
      categorySlug,
      itemKey: item.itemKey,
      englishWord: item.englishWord,
      sortOrder,
    });
    runConvex('vocabulary:upsertVocabularyTranslation', {
      categorySlug,
      itemKey: item.itemKey,
      languageCode: 'hi',
      text: item.text,
      transliteration: item.transliteration,
    });
    console.log(`  ✓ ${item.itemKey} — ${item.text} (${item.transliteration})`);
  }
  console.log('Done.');
}

/**
 * `onlyKeys`, when given, restricts generation to those itemKeys —
 * essential for `numbers` in the follow-on pass: `generateVocabularyImage`
 * is NOT idempotent (each call replaces the item's image, the intended
 * repair path for a bad generation), so running this unfiltered against the
 * full `NUMBERS` array would re-roll all 20 already-live, human-approved
 * 1–20 images for no reason — a real, avoidable cost mistake. `family` and
 * the three brand-new categories don't need this since every item in them
 * is new to this pass.
 */
async function genImages(categorySlug: CategorySlug, onlyKeys?: string[]) {
  const report = loadReport();
  const items: Array<{ itemKey: string; englishWord: string; sortOrder: number; prompt: string }> = (
    categorySlug === 'numbers'
      ? NUMBERS.map((n, i) => ({
          itemKey: n.itemKey,
          englishWord: n.englishWord,
          sortOrder: i + 1,
          prompt: numberImagePrompt(Number(n.itemKey), n.objectDescription),
        }))
      : categorySlug === 'family'
        ? FAMILY.map((f, i) => ({
            itemKey: f.itemKey,
            englishWord: f.englishWord,
            sortOrder: i + 1,
            prompt: familyIconPrompt(f.imageSubject),
          }))
        : categorySlug === 'food-drink'
          ? FOOD_DRINK.map((f, i) => ({
              itemKey: f.itemKey,
              englishWord: f.englishWord,
              sortOrder: i + 1,
              prompt: foodImagePrompt(f.imageSubject),
            }))
          : categorySlug === 'animals'
            ? ANIMALS.map((a, i) => ({
                itemKey: a.itemKey,
                englishWord: a.englishWord,
                sortOrder: i + 1,
                prompt: animalImagePrompt(a.imageSubject),
              }))
            : categorySlug === 'colours'
              ? COLOURS.map((c, i) => ({
                  itemKey: c.itemKey,
                  englishWord: c.englishWord,
                  sortOrder: i + 1,
                  prompt: colourImagePrompt(c.englishWord, c.imageSubject),
                }))
              : categorySlug === 'body-parts'
                ? BODY_PARTS.map((b, i) => ({
                    itemKey: b.itemKey,
                    englishWord: b.englishWord,
                    sortOrder: i + 1,
                    prompt: bodyPartImagePrompt(b.imageSubject),
                  }))
                : categorySlug === 'household-items'
                  ? HOUSEHOLD_ITEMS.map((h, i) => ({
                      itemKey: h.itemKey,
                      englishWord: h.englishWord,
                      sortOrder: i + 1,
                      prompt: householdItemImagePrompt(h.imageSubject),
                    }))
                  : categorySlug === 'clothing'
                    ? CLOTHES.map((c, i) => ({
                        itemKey: c.itemKey,
                        englishWord: c.englishWord,
                        sortOrder: i + 1,
                        prompt: clothesImagePrompt(c.imageSubject),
                      }))
                    : VEGETABLES.map((v, i) => ({
                        itemKey: v.itemKey,
                        englishWord: v.englishWord,
                        sortOrder: i + 1,
                        prompt: vegetableImagePrompt(v.imageSubject),
                      }))
  ).filter((item) => !onlyKeys || onlyKeys.includes(item.itemKey));

  for (const item of items) {
    const projected = report.spendUsd + FLUX_DEV_RATE;
    if (projected > SPEND_STOP_LIMIT) {
      console.error(
        `STOPPING — projected spend $${projected.toFixed(2)} would exceed the $${SPEND_STOP_LIMIT} ` +
          `pilot ceiling. Current tally: $${report.spendUsd.toFixed(2)}. Report saved for review.`,
      );
      saveReport(report);
      process.exit(1);
    }

    console.log(`Generating image: ${categorySlug}/${item.itemKey}...`);
    try {
      const r = runConvex('fal/vocabularyImages:generateVocabularyImage', {
        categorySlug,
        itemKey: item.itemKey,
        englishWord: item.englishWord,
        sortOrder: item.sortOrder,
        prompt: item.prompt,
      });
      if (r.ok) {
        report.spendUsd += FLUX_DEV_RATE;
        report.imageCalls.push({
          categorySlug,
          itemKey: item.itemKey,
          ok: true,
          detail: `seed ${r.seed}`,
          imageUrl: r.imageUrl,
          seed: r.seed,
        });
        console.log(`  ✓ ${item.itemKey} — ${r.imageUrl}  (running spend: $${report.spendUsd.toFixed(3)})`);
      } else {
        report.imageCalls.push({ categorySlug, itemKey: item.itemKey, ok: false, detail: r.reason });
        console.error(`  ✗ ${item.itemKey} — ${r.reason}`);
      }
    } catch (err) {
      report.imageCalls.push({
        categorySlug,
        itemKey: item.itemKey,
        ok: false,
        detail: (err as Error).message,
      });
      console.error(`  ✗ ${item.itemKey} — ${(err as Error).message}`);
    }
    saveReport(report);
  }
  console.log(`Done. Total spend so far: $${report.spendUsd.toFixed(3)}`);
}

/**
 * Devanagari script-character audio is Google Chirp3-HD-primary as of
 * 2026-08 (see `convex/google/aksharmalaTts.ts`'s header for the full
 * reasoning: two rounds of Bhashini prompt/pace fixes still left isolated
 * letters unclear, and the Chirp3-HD A/B trial confirmed a cleaner result at
 * the same mnemonic phrasing and pace). Bengali (2026-08-03, the SECOND
 * script through this pipeline) goes straight to Google Chirp3-HD from the
 * start — no repeat of the two-pass Bhashini discovery process, per this
 * pass's own explicit instruction — so this orchestrator always calls the
 * Google module, never the Bhashini one. `bhashini/aksharmalaTts.ts` still
 * exists and remains available for a future script that doesn't need it.
 *
 * IMPORTANT (fixed 2026-08-03 when Bengali became the second script):
 * previously this unconditionally wiped ALL `kind: 'character'` rows before
 * re-adding them — harmless with only one script, but would have silently
 * erased Devanagari's report history the first time this ran for Bengali.
 * Now scoped to `kind === 'character' && script === scriptSlug`, same
 * per-slug scoping `genAudioVocab` already uses for `categorySlug`.
 */
async function genAudioCharacters(scriptSlug: ScriptSlug, force?: boolean) {
  const report = loadReport();
  const { characters, languageCode } = SCRIPTS[scriptSlug];
  console.log(`Generating audio for ${characters.length} ${scriptSlug} characters (voice: ${languageCode})...`);
  const r = runConvex('google/aksharmalaTts:generateScriptCharacterAudioForScript', {
    script: scriptSlug,
    characters: characters.map((c) => c.character),
    languageCode,
    force: force ?? false,
  });
  report.audioCalls = report.audioCalls.filter(
    // Legacy rows from before this file tracked `script` per-row (Devanagari-only
    // era) have no `script` field at all — treat those as implicitly 'devanagari'
    // so re-running for 'devanagari' still replaces them, while a Bengali run
    // never touches them.
    (c) => !(c.kind === 'character' && (c.script ?? 'devanagari') === scriptSlug),
  );
  const byChar = new Map(characters.map((c) => [c.character, c]));
  for (const row of r.results) {
    report.audioCalls.push({
      kind: 'character',
      key: row.character,
      script: scriptSlug,
      ok: row.ok,
      detail: row.detail,
      audioUrl: row.audioUrl ?? null,
      expectedText: byChar.get(row.character)?.character,
    });
  }
  saveReport(report);
  console.log(
    `Succeeded: ${r.succeeded}, Failed: ${r.failed}, chars sent: ${r.totalCharCount}, ` +
      `estimated cost: $${r.estimatedCostUsd.toFixed(6)}`,
  );
  if (r.failed > 0) console.log(JSON.stringify(r.results.filter((x: any) => !x.ok), null, 2));
}

async function genAudioVocab(categorySlug: CategorySlug, force?: boolean) {
  const report = loadReport();
  const items = itemsForCategory(categorySlug);
  console.log(`Generating audio for ${items.length} "${categorySlug}" items...`);
  const r = runConvex('bhashini/vocabularyTts:generateVocabularyAudioForCategory', {
    categorySlug,
    itemKeys: items.map((i) => i.itemKey),
    languageCode: 'hi',
    force: force ?? false,
  });
  report.audioCalls = report.audioCalls.filter(
    (c) => !(c.kind === 'vocab' && c.categorySlug === categorySlug),
  );
  const byKey = new Map(items.map((i) => [i.itemKey, i]));
  for (const row of r.results) {
    report.audioCalls.push({
      kind: 'vocab',
      key: row.itemKey,
      categorySlug,
      ok: row.ok,
      detail: row.detail,
      audioUrl: row.audioUrl ?? null,
      expectedText: byKey.get(row.itemKey)?.text,
    });
  }
  saveReport(report);
  console.log(`Succeeded: ${r.succeeded}, Failed: ${r.failed}`);
  if (r.failed > 0) console.log(JSON.stringify(r.results.filter((x: any) => !x.ok), null, 2));
}

async function downloadImages() {
  const report = loadReport();
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
  for (const call of report.imageCalls) {
    if (!call.ok || !call.imageUrl) continue;
    const dest = resolve(IMAGES_DIR, `${call.categorySlug}-${call.itemKey}.jpg`);
    const res = await fetch(call.imageUrl);
    if (!res.ok) {
      console.error(`Failed to download ${call.categorySlug}/${call.itemKey}: ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    console.log(`  ✓ ${dest}`);
  }
}

/**
 * Best-effort pronunciation QA via a Bhashini ASR round-trip: download the
 * generated TTS clip, transcribe it back to text via the existing
 * client-facing `bhashini/asr:transcribeSpeech` action, and compare against
 * the text that was actually synthesized. This is the "transcript/
 * inspection method available to me" stand-in for literally listening (an
 * LLM has no ears) — real evidence the clip contains speech that Bhashini's
 * OWN ASR model reads back as the intended word, not silence, noise, or a
 * garbled/wrong pronunciation.
 *
 * Honest limitation, logged per-row via `asrNote`: ASR models are trained
 * on continuous speech, not isolated single letters/syllables — a Devanagari
 * VOWEL or CONSONANT clip (a fraction of a second of a bare sound) is a
 * genuinely hard case for ASR, and a transcript mismatch there is much
 * weaker evidence of a real problem than the same mismatch on a whole word
 * (numbers/family). Both are logged; only the whole-word mismatches should
 * be treated as a real regeneration signal without independent corroboration.
 */
/**
 * `onlyCategorySlugs`, when given, restricts the check to `vocab` calls in
 * those categories (plus never touches `character` rows) — added in the
 * follow-on pass so re-running this doesn't re-verify the ~80 already-
 * reviewed rows from the original pilot (20 numbers, 14 family, 46
 * Devanagari characters) every time, which cost real wall-clock time for no
 * new signal (each row is a network fetch + a `convex run` round trip).
 *
 * `onlyScripts`, added when Bengali became the second script (2026-08-03),
 * is the symmetric filter for `character` rows — lets a Bengali-only ASR
 * pass skip re-verifying Devanagari's already-reviewed 49 characters. Passing
 * NEITHER filter checks everything (original behaviour, unchanged).
 */
async function asrCheck(onlyCategorySlugs?: string[], onlyScripts?: string[]) {
  const report = loadReport();
  for (const call of report.audioCalls) {
    if (!call.ok || !call.audioUrl) continue;
    if (onlyCategorySlugs && !(call.categorySlug && onlyCategorySlugs.includes(call.categorySlug))) {
      continue;
    }
    if (onlyScripts && !(call.script && onlyScripts.includes(call.script))) {
      continue;
    }
    try {
      const res = await fetch(call.audioUrl);
      if (!res.ok) throw new Error(`download failed: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const audioBase64 = buf.toString('base64');

      // ASR check always uses Bhashini (free) regardless of which TTS engine
      // generated the clip — this is a QA read-back, not a re-synthesis.
      // For `character` rows, the correct ASR voice/language is the script's
      // own live language (SCRIPTS map), not a hardcoded 'hi' — Bengali
      // characters must be transcribed with a bn ASR model, not hi's.
      // `vocab` rows stay 'hi' (vocabulary/numbers content is Hindi-only so far).
      const languageCode =
        call.kind === 'character'
          ? SCRIPTS[(call.script ?? 'devanagari') as ScriptSlug]?.languageCode ?? 'hi'
          : 'hi';
      const r = runConvex('bhashini/asr:transcribeSpeech', { audioBase64, languageCode });
      if (r.ok) {
        call.asrTranscript = r.transcript;
        const expected = (call.expectedText ?? '').trim();
        const transcript = (r.transcript ?? '').trim();
        const matches =
          transcript.length > 0 &&
          (transcript === expected || transcript.includes(expected) || expected.includes(transcript));
        call.asrOk = matches;
        call.asrNote =
          call.kind === 'character'
            ? 'Isolated-letter ASR is inherently unreliable — treat mismatch as weak signal only.'
            : matches
              ? 'ASR transcript matches synthesized text.'
              : 'ASR transcript did NOT match — flag for manual re-check / regeneration.';
      } else {
        call.asrTranscript = undefined;
        call.asrOk = false;
        call.asrNote = `ASR call failed: ${r.reason}`;
      }
    } catch (err) {
      call.asrOk = false;
      call.asrNote = `ASR check errored: ${(err as Error).message}`;
    }
    console.log(
      `  ${call.kind}/${call.key}: expected="${call.expectedText}" transcript="${call.asrTranscript}" ` +
        `asrOk=${call.asrOk} (${call.asrNote})`,
    );
    saveReport(report);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

/** After human review — approve a list of one script's characters (glyph + audio together). */
async function approveCharacters(scriptSlug: ScriptSlug, charsJson: string) {
  const chars: string[] = JSON.parse(charsJson);
  for (const character of chars) {
    runConvex('aksharmala:approveScriptCharacterAndAudio', { script: scriptSlug, character });
    console.log(`  ✓ approved ${character} (${scriptSlug})`);
  }
}

/** After human review — approve a category's item content (English word + image) for a list of itemKeys. */
async function approveVocabItems(categorySlug: string, keysJson: string) {
  const keys: string[] = JSON.parse(keysJson);
  for (const itemKey of keys) {
    runConvex('vocabulary:approveVocabularyItem', { categorySlug, itemKey });
    console.log(`  ✓ approved item ${categorySlug}/${itemKey}`);
  }
}

/** After human review — approve a (item, hi) translation+audio pair for a list of itemKeys. */
async function approveVocabTranslations(categorySlug: string, keysJson: string) {
  const keys: string[] = JSON.parse(keysJson);
  for (const itemKey of keys) {
    runConvex('vocabulary:approveVocabularyTranslationAndAudio', {
      categorySlug,
      itemKey,
      languageCode: 'hi',
    });
    console.log(`  ✓ approved translation+audio ${categorySlug}/${itemKey} (hi)`);
  }
}

async function promoteCategory(categorySlug: string) {
  runConvex('vocabulary:promoteCategoryToLive', { slug: categorySlug });
  console.log(`  ✓ promoted ${categorySlug} to live`);
}

async function main() {
  const [cmd, arg, arg2, arg3] = process.argv.slice(2);
  switch (cmd) {
    case 'seed-characters':
      return seedCharacters(arg as ScriptSlug);
    case 'seed-category':
      return seedCategory(arg, arg2, arg3);
    case 'seed-vocab':
      return seedVocab(arg as CategorySlug, arg2 ? (JSON.parse(arg2) as string[]) : undefined);
    case 'gen-images':
      return genImages(arg as CategorySlug, arg2 ? (JSON.parse(arg2) as string[]) : undefined);
    case 'gen-audio-characters':
      return genAudioCharacters(arg as ScriptSlug, arg2 === '--force');
    case 'gen-audio-vocab':
      return genAudioVocab(arg as CategorySlug, arg2 === '--force');
    case 'download-images':
      return downloadImages();
    case 'asr-check':
      return asrCheck(
        arg ? (JSON.parse(arg) as string[]) : undefined,
        arg2 ? (JSON.parse(arg2) as string[]) : undefined,
      );
    case 'approve-characters':
      return approveCharacters(arg as ScriptSlug, arg2);
    case 'approve-vocab-items':
      return approveVocabItems(arg, arg2);
    case 'approve-vocab-translations':
      return approveVocabTranslations(arg, arg2);
    case 'promote-category':
      return promoteCategory(arg);
    default:
      console.error('Unknown command:', cmd);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
