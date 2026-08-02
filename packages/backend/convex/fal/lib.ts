/**
 * Shared fal.ai queue client — plain `fetch`, no SDK, matching the pattern in
 * `bhashini/tts.ts` (raw HTTP calls, credentials from `process.env`, no third
 * party client library). Every function here costs real money to call and
 * must only ever be reached from an `internalAction` (CLAUDE.md rule 14 /
 * root cost-discipline table — this is the fal.ai integration).
 *
 * fal.ai's queue API (verified against the live OpenAPI schema per model,
 * e.g. `https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=<id>`,
 * 2026-08):
 *
 *   POST  https://queue.fal.run/{endpointId}   → submit. Returns
 *         { status, request_id, response_url, status_url, cancel_url }.
 *   GET   {status_url}                          → poll. `status` is one of
 *         IN_QUEUE | IN_PROGRESS | COMPLETED.
 *   GET   {response_url}                        → the model's actual output,
 *         once status is COMPLETED.
 *
 * Auth: `Authorization: Key ${FAL_KEY}` — fal.ai's own scheme, NOT Bearer.
 *
 * Generation time varies a lot by model: FLUX/Kontext images land in
 * seconds, Kling image-to-video clips commonly take 1-6 minutes. Timeouts
 * below are generous on the video side rather than risk a false failure
 * report on a real spend.
 */

import type { ActionCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

const FAL_QUEUE_BASE = 'https://queue.fal.run';

export function getFalKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error('FAL_KEY is not set. Add it to the Convex deployment env (see CLAUDE.md).');
  }
  return key;
}

interface QueueSubmitResponse {
  status: string;
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
}

interface QueueStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED';
  request_id: string;
  queue_position?: number;
}

async function falSubmit(
  endpointId: string,
  input: Record<string, unknown>,
): Promise<QueueSubmitResponse> {
  const res = await fetch(`${FAL_QUEUE_BASE}/${endpointId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${getFalKey()}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`fal.ai submit failed for ${endpointId}: ${res.status} — ${await res.text()}`);
  }
  return (await res.json()) as QueueSubmitResponse;
}

async function falPollUntilComplete(
  statusUrl: string,
  opts: { timeoutMs: number; intervalMs: number },
): Promise<void> {
  const deadline = Date.now() + opts.timeoutMs;
  for (;;) {
    const res = await fetch(statusUrl, { headers: { Authorization: `Key ${getFalKey()}` } });
    if (!res.ok) {
      throw new Error(`fal.ai status check failed: ${res.status} — ${await res.text()}`);
    }
    const status = (await res.json()) as QueueStatusResponse;
    if (status.status === 'COMPLETED') return;
    if (Date.now() > deadline) {
      throw new Error(
        `fal.ai request timed out after ${opts.timeoutMs}ms polling ${statusUrl} ` +
          `(last status: ${status.status})`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, opts.intervalMs));
  }
}

async function falFetchResult<T>(responseUrl: string): Promise<T> {
  const res = await fetch(responseUrl, { headers: { Authorization: `Key ${getFalKey()}` } });
  if (!res.ok) {
    throw new Error(`fal.ai result fetch failed: ${res.status} — ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Submit a job to the fal.ai queue, poll until complete, and return the result. */
export async function runFalJob<T>(
  endpointId: string,
  input: Record<string, unknown>,
  opts: { timeoutMs: number; intervalMs: number },
): Promise<T> {
  const submitted = await falSubmit(endpointId, input);
  await falPollUntilComplete(submitted.status_url, opts);
  return await falFetchResult<T>(submitted.response_url);
}

/** Poll/timeout presets. Images are fast; Kling video is slow and variable. */
export const FAL_TIMEOUTS = {
  image: { timeoutMs: 3 * 60_000, intervalMs: 3_000 },
  video: { timeoutMs: 10 * 60_000, intervalMs: 5_000 },
} as const;

/** Download a generated asset (image or video) from its fal.ai URL into Convex storage. */
export async function downloadToStorage(
  ctx: ActionCtx,
  url: string,
  contentType: string,
): Promise<Id<'_storage'>> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download generated asset from ${url}: ${res.status}`);
  }
  const blob = await res.blob();
  return await ctx.storage.store(blob.type ? blob : new Blob([await blob.arrayBuffer()], { type: contentType }));
}

// ------------------------------------------------------------- fal.ai shapes

export interface FalImage {
  url: string;
  width: number;
  height: number;
  content_type?: string;
}

export interface FalImageOutput {
  images: FalImage[];
  seed: number;
}

export interface FalVideoFile {
  url: string;
  content_type?: string;
  file_size?: number;
}

export interface FalVideoOutput {
  video: FalVideoFile;
}
