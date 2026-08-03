#!/usr/bin/env bun
/**
 * Phase 13 pilot authoring orchestrator — Hindi/Devanagari only.
 *
 * Shells out to `npx convex run` for every call (internal
 * mutations/actions aren't reachable via a plain `ConvexHttpClient` without
 * an admin key — same reasoning and same shape as
 * `packages/backend/scripts/upload-persona-animation.ts`).
 *
 * Usage (run from anywhere; cwd is fixed to packages/backend internally):
 *   bun scripts/phase13/run.ts seed-characters
 *   bun scripts/phase13/run.ts seed-vocab numbers
 *   bun scripts/phase13/run.ts seed-vocab family
 *   bun scripts/phase13/run.ts gen-images numbers
 *   bun scripts/phase13/run.ts gen-images family
 *   bun scripts/phase13/run.ts gen-audio-characters
 *   bun scripts/phase13/run.ts gen-audio-vocab numbers
 *   bun scripts/phase13/run.ts gen-audio-vocab family
 *   bun scripts/phase13/run.ts download-images
 *
 * Every step writes/updates a JSON report at
 * packages/backend/scripts/phase13/report.json so review (contact sheets,
 * ASR transcript comparison) has a single source of truth, and so a partial
 * failure can be retried without re-running completed steps (every
 * underlying mutation/action is itself idempotent).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEVANAGARI_CHARACTERS, NUMBERS, FAMILY } from './data';

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

async function seedCharacters() {
  console.log(`Seeding ${DEVANAGARI_CHARACTERS.length} Devanagari characters...`);
  for (const c of DEVANAGARI_CHARACTERS) {
    runConvex('aksharmala:upsertScriptCharacter', {
      script: 'devanagari',
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

async function seedVocab(categorySlug: 'numbers' | 'family') {
  const items = categorySlug === 'numbers' ? NUMBERS : FAMILY;
  console.log(`Seeding ${items.length} "${categorySlug}" items + hi translations...`);
  let sortOrder = 1;
  for (const item of items) {
    runConvex('vocabulary:upsertVocabularyItem', {
      categorySlug,
      itemKey: item.itemKey,
      englishWord: item.englishWord,
      sortOrder: sortOrder++,
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

async function genImages(categorySlug: 'numbers' | 'family') {
  const report = loadReport();
  const items =
    categorySlug === 'numbers'
      ? NUMBERS.map((n, i) => ({
          itemKey: n.itemKey,
          englishWord: n.englishWord,
          sortOrder: i + 1,
          prompt: numberImagePrompt(Number(n.itemKey), n.objectDescription),
        }))
      : FAMILY.map((f, i) => ({
          itemKey: f.itemKey,
          englishWord: f.englishWord,
          sortOrder: i + 1,
          prompt: familyIconPrompt(f.imageSubject),
        }));

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

async function genAudioCharacters(force?: boolean) {
  const report = loadReport();
  console.log(`Generating audio for ${DEVANAGARI_CHARACTERS.length} Devanagari characters...`);
  const r = runConvex('bhashini/aksharmalaTts:generateScriptCharacterAudioForScript', {
    script: 'devanagari',
    characters: DEVANAGARI_CHARACTERS.map((c) => c.character),
    languageCode: 'hi',
    force: force ?? false,
  });
  report.audioCalls = report.audioCalls.filter((c) => c.kind !== 'character');
  const byChar = new Map(DEVANAGARI_CHARACTERS.map((c) => [c.character, c]));
  for (const row of r.results) {
    report.audioCalls.push({
      kind: 'character',
      key: row.character,
      ok: row.ok,
      detail: row.detail,
      audioUrl: row.audioUrl ?? null,
      expectedText: byChar.get(row.character)?.character,
    });
  }
  saveReport(report);
  console.log(`Succeeded: ${r.succeeded}, Failed: ${r.failed}`);
  if (r.failed > 0) console.log(JSON.stringify(r.results.filter((x: any) => !x.ok), null, 2));
}

async function genAudioVocab(categorySlug: 'numbers' | 'family', force?: boolean) {
  const report = loadReport();
  const items = categorySlug === 'numbers' ? NUMBERS : FAMILY;
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
async function asrCheck() {
  const report = loadReport();
  for (const call of report.audioCalls) {
    if (!call.ok || !call.audioUrl) continue;
    try {
      const res = await fetch(call.audioUrl);
      if (!res.ok) throw new Error(`download failed: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const audioBase64 = buf.toString('base64');

      const r = runConvex('bhashini/asr:transcribeSpeech', { audioBase64, languageCode: 'hi' });
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

/** After human review — approve a list of Devanagari characters (glyph + audio together). */
async function approveCharacters(charsJson: string) {
  const chars: string[] = JSON.parse(charsJson);
  for (const character of chars) {
    runConvex('aksharmala:approveScriptCharacterAndAudio', { script: 'devanagari', character });
    console.log(`  ✓ approved ${character}`);
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
  const [cmd, arg, arg2] = process.argv.slice(2);
  switch (cmd) {
    case 'seed-characters':
      return seedCharacters();
    case 'seed-vocab':
      return seedVocab(arg as 'numbers' | 'family');
    case 'gen-images':
      return genImages(arg as 'numbers' | 'family');
    case 'gen-audio-characters':
      return genAudioCharacters(arg === '--force');
    case 'gen-audio-vocab':
      return genAudioVocab(arg as 'numbers' | 'family', arg2 === '--force');
    case 'download-images':
      return downloadImages();
    case 'asr-check':
      return asrCheck();
    case 'approve-characters':
      return approveCharacters(arg);
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
