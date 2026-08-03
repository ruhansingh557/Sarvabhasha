#!/usr/bin/env bun
/**
 * Upload a re-encoded persona (AI-tutor avatar) clip to Convex, replacing the
 * oversized raw fal.ai output with a smaller final version.
 *
 * One-off companion to the repo-root `scripts/upload-animation.ts` (same
 * shape, different table): `fal/personaAnimations.ts`'s
 * `generatePersonaAnimation` already calls `personaAnimations.recordAnimation`
 * once with the RAW Kling output (routinely ~12-13MB for a 5s clip — well
 * over the project's 8MB bandwidth-conscious warning threshold from
 * `branding-and-voice.md`'s known gaps). That raw draft is left as-is
 * (harmless, just an unapproved row); this script uploads the
 * ffmpeg-reencoded (720p, H.264, CRF 26, no audio) final file as a SECOND
 * draft row carrying the same reproducibility metadata, and that is the row
 * a human then approves.
 *
 * Lives under `packages/backend/scripts/` rather than the repo-root
 * `scripts/` directory the lesson-clip equivalent uses: this monorepo's Bun
 * install does not hoist `convex` to the root `node_modules` (each workspace
 * package keeps its own deps), and Bun resolves a script's imports by
 * walking up from the SCRIPT FILE's own directory, not the process cwd — a
 * script at repo-root `scripts/` can never see `packages/backend/node_modules`.
 * Confirmed the pre-existing root-level `scripts/upload-animation.ts` hits
 * the identical `Cannot find module 'convex/browser'` error in this
 * environment; not something introduced here. Placing this one inside
 * `packages/backend/` sidesteps it.
 *
 * Usage — batch from a manifest (an array of ClipSpec):
 *   bun packages/backend/scripts/upload-persona-animation.ts --manifest <path>
 */

import { ConvexHttpClient } from 'convex/browser';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { api } from '../convex/_generated/api';

function runConvexInternalMutation(functionPath: string, args: Record<string, unknown>): string {
  const stdout = execFileSync(
    'bun',
    ['x', 'convex', 'run', functionPath, JSON.stringify(args)],
    { cwd: resolve(__dirname, '..'), encoding: 'utf8' },
  );
  return JSON.parse(stdout.trim()) as string;
}

interface ClipSpec {
  file: string;
  characterSlug: 'dadi' | 'parent' | 'kid' | 'neighbour';
  expression: 'neutral' | 'happy' | 'encouraging' | 'thinking';
  model: string;
  ratePerSecond: number;
  durationSec: number;
  prompt: string;
  seed?: number;
  attempt: number;
  keyframeStorageIds?: string[];
}

async function uploadOne(client: ConvexHttpClient, spec: ClipSpec, baseDir: string) {
  const path = resolve(baseDir, spec.file);
  const bytes = await readFile(path);
  const sizeMb = bytes.byteLength / 1_000_000;

  if (sizeMb > 8) {
    console.warn(`  ⚠  ${basename(path)} is ${sizeMb.toFixed(1)}MB — still over the 8MB guidance.`);
  }

  const uploadUrl = runConvexInternalMutation('animations:generateUploadUrlInternal', {});
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'video/mp4' },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  const { storageId } = (await res.json()) as { storageId: string };

  const animationId = await client.mutation(api.personaAnimations.recordAnimation, {
    characterSlug: spec.characterSlug,
    expression: spec.expression,
    storageId: storageId as never,
    keyframeStorageIds: (spec.keyframeStorageIds ?? []) as never,
    model: spec.model,
    ratePerSecond: spec.ratePerSecond,
    durationSec: spec.durationSec,
    prompt: spec.prompt,
    seed: spec.seed,
    attempt: spec.attempt,
  });

  console.log(
    `  ✓ ${spec.characterSlug}/${spec.expression}  ${sizeMb.toFixed(2)}MB  → ${animationId}`,
  );
  return animationId as string;
}

async function main() {
  const args = process.argv.slice(2);
  const manifestFlagIndex = args.indexOf('--manifest');
  if (manifestFlagIndex === -1 || !args[manifestFlagIndex + 1]) {
    throw new Error('Usage: bun packages/backend/scripts/upload-persona-animation.ts --manifest <path>');
  }
  const manifestPath = resolve(process.cwd(), args[manifestFlagIndex + 1]!);
  const baseDir = dirname(manifestPath);

  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error('CONVEX_URL is not set. Run `bunx convex dev` in packages/backend first.');
  }
  const client = new ConvexHttpClient(convexUrl);

  const specs: ClipSpec[] = JSON.parse(await readFile(manifestPath, 'utf8'));
  console.log(`Uploading ${specs.length} persona clip(s) from ${manifestPath}\n`);

  const ids: string[] = [];
  for (const spec of specs) {
    ids.push(await uploadOne(client, spec, baseDir));
  }

  console.log(`\nDone. ${ids.length}/${specs.length} uploaded, all landed as draft.`);
  console.log(JSON.stringify(ids));
}

main().catch((err) => {
  console.error(`\n${(err as Error).message}\n`);
  process.exit(1);
});
