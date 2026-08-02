#!/usr/bin/env bun
/**
 * Upload a manually-generated animation clip to Convex.
 *
 * Generate clips by hand in the fal.ai playground while the character bible
 * and beat timing are being locked (see specs/content-pipeline.md rule 9),
 * then upload them with this. Automate only once the pilot category is done.
 *
 * Usage — single clip:
 *   bun scripts/upload-animation.ts \
 *     --file ./scratch/greetings/namaste.mp4 \
 *     --phrase-key namaste-hello \
 *     --model "fal-ai/kling-video/v2.5-turbo/pro" \
 *     --rate 0.07 \
 *     --duration 8 \
 *     --prompt "$(cat ./scratch/greetings/namaste.prompt.txt)" \
 *     --seed 42 \
 *     --attempt 3
 *
 * Usage — batch from a manifest:
 *   bun scripts/upload-animation.ts --manifest ./scratch/greetings/manifest.json
 *
 * Manifest format: an array of the same fields, with `file` relative to the
 * manifest's own directory.
 *
 * Requires CONVEX_URL in the environment (from `bunx convex dev`), and the
 * `convex` CLI to be authenticated (same login `bunx convex dev` uses) —
 * the upload-url step below shells out to `convex run` for an
 * `internalMutation`, which a plain `ConvexHttpClient` cannot call (the
 * platform does not expose `internal.*` functions to any client, public or
 * otherwise). See `generateUploadUrlInternal`'s doc comment in
 * `packages/backend/convex/animations.ts` for why this step needs that
 * instead of the public `generateUploadUrl` mutation this script used to
 * call directly: that mutation now requires an authenticated app-user
 * session, which this script — a one-off local CLI tool, not a signed-in
 * app screen — doesn't have.
 */

import { ConvexHttpClient } from 'convex/browser';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { api } from '../packages/backend/convex/_generated/api';

/**
 * `convex run` prints the function's return value as a JSON literal (here, a
 * JSON string, i.e. wrapped in quotes) to stdout. Runs from
 * `packages/backend/` so the CLI picks up that package's `convex.json`
 * without needing an explicit `--url`/`--admin-key` flag.
 */
function runConvexInternalMutation(functionPath: string, args: Record<string, unknown>): string {
  const stdout = execFileSync(
    'bun',
    ['x', 'convex', 'run', functionPath, JSON.stringify(args)],
    { cwd: resolve(__dirname, '../packages/backend'), encoding: 'utf8' },
  );
  return JSON.parse(stdout.trim()) as string;
}

interface ClipSpec {
  file: string;
  phraseKey: string;
  model: string;
  ratePerSecond: number;
  durationSec: number;
  prompt: string;
  seed?: number;
  attempt: number;
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key?.startsWith('--')) continue;
    out[key.slice(2)] = argv[i + 1] ?? '';
  }
  return out;
}

function specFromArgs(a: Record<string, string>): ClipSpec {
  const required = ['file', 'phrase-key', 'model', 'rate', 'duration', 'prompt', 'attempt'];
  const missing = required.filter((k) => !a[k]);
  if (missing.length) {
    throw new Error(
      `Missing required flags: ${missing.map((m) => `--${m}`).join(', ')}\n\n` +
        `The metadata is not optional. A clip you cannot reproduce is a clip\n` +
        `you cannot fix when the style changes.`,
    );
  }
  return {
    file: a.file!,
    phraseKey: a['phrase-key']!,
    model: a.model!,
    ratePerSecond: Number(a.rate),
    durationSec: Number(a.duration),
    prompt: a.prompt!,
    seed: a.seed ? Number(a.seed) : undefined,
    attempt: Number(a.attempt),
  };
}

async function uploadOne(client: ConvexHttpClient, spec: ClipSpec, baseDir: string) {
  const path = resolve(baseDir, spec.file);
  const bytes = await readFile(path);
  const sizeMb = bytes.byteLength / 1_000_000;

  // Every learner replays these clips many times. Bandwidth, not storage, is
  // the cost that scales — keep files small.
  if (sizeMb > 8) {
    console.warn(
      `  ⚠  ${basename(path)} is ${sizeMb.toFixed(1)}MB. Consider re-encoding ` +
        `(720p, H.264, CRF ~26) — learners replay these repeatedly.`,
    );
  }

  const phrase = await client.query(api.phrases.getByKey, { phraseKey: spec.phraseKey });
  if (!phrase) throw new Error(`No phrase with key "${spec.phraseKey}"`);

  const uploadUrl = runConvexInternalMutation('animations:generateUploadUrlInternal', {});
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'video/mp4' },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  const { storageId } = (await res.json()) as { storageId: string };

  const animationId = await client.mutation(api.animations.recordAnimation, {
    phraseId: phrase._id,
    storageId: storageId as never,
    model: spec.model,
    ratePerSecond: spec.ratePerSecond,
    durationSec: spec.durationSec,
    prompt: spec.prompt,
    seed: spec.seed,
    attempt: spec.attempt,
  });

  const cost = (spec.ratePerSecond * spec.durationSec * spec.attempt).toFixed(2);
  console.log(
    `  ✓ ${spec.phraseKey}  ${sizeMb.toFixed(1)}MB  ` +
      `${spec.attempt} attempt(s) ≈ $${cost}  → ${animationId}`,
  );
  return Number(cost);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error('CONVEX_URL is not set. Run `bunx convex dev` in packages/backend first.');
  }
  const client = new ConvexHttpClient(convexUrl);

  let specs: ClipSpec[];
  let baseDir: string;

  if (args.manifest) {
    const manifestPath = resolve(process.cwd(), args.manifest);
    baseDir = dirname(manifestPath);
    specs = JSON.parse(await readFile(manifestPath, 'utf8')) as ClipSpec[];
    console.log(`Uploading ${specs.length} clip(s) from ${args.manifest}\n`);
  } else {
    baseDir = process.cwd();
    specs = [specFromArgs(args)];
  }

  let total = 0;
  let failed = 0;
  for (const spec of specs) {
    try {
      total += await uploadOne(client, spec, baseDir);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${spec.phraseKey}: ${(err as Error).message}`);
    }
  }

  console.log(
    `\nDone. ${specs.length - failed}/${specs.length} uploaded. ` +
      `Estimated generation spend: $${total.toFixed(2)}`,
  );
  console.log(
    `\nAll clips landed as \x1b[1mdraft\x1b[0m. Before approving each one:\n` +
      `  → Mute the audio and hide the subtitle.\n` +
      `  → Can a learner infer what the phrase means?\n` +
      `  → If not, it is decoration, not teaching. Re-roll it.`,
  );
}

main().catch((err) => {
  console.error(`\n${(err as Error).message}\n`);
  process.exit(1);
});
