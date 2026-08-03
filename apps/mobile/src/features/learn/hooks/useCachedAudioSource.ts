import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Local disk cache for remote pronunciation audio (lesson phrases,
 * Aksharmala letters, Vocabulary/Numbers words). Every clip is served from a
 * Convex storage URL that `usePhraseAudio`'s callers previously handed
 * straight to `useAudioPlayer` — meaning the SAME clip was re-downloaded over
 * the network on every single play, including replays seconds apart. That's
 * a real cost/reliability problem for this app's audience (mobile data,
 * patchy connectivity — see root CLAUDE.md), especially for content a
 * learner is expected to replay many times.
 *
 * Cache key: the remote URL itself. Convex storage URLs are keyed by
 * `storageId`, and regenerating audio (this project's content pipeline)
 * always produces a NEW storageId/URL rather than mutating one in place —
 * so a URL that has ever resolved to some bytes will resolve to the same
 * bytes forever. No ETag / cache-control / invalidation logic needed; a
 * cheap deterministic hash of the URL as the filename is enough.
 *
 * Storage: `FileSystem.cacheDirectory`, not `documentDirectory` — this is
 * re-fetchable, evictable data (same call the OS makes to a browser's HTTP
 * cache), not something needing guaranteed permanence. If the OS reclaims it
 * under storage pressure, the next play just re-downloads and re-populates.
 *
 * Concurrency: downloads for the same URL are deduped via the module-level
 * `inFlightDownloads` map, keyed synchronously before any `await` inside
 * `getCachedLocalUri` — so two near-simultaneous requests for the same clip
 * (rapid re-taps, two grid cards resolving around the same time) share one
 * network fetch instead of racing two.
 *
 * Failure handling: a failed download (offline, server error, no writable
 * cache dir) resolves to the ORIGINAL remote URL, not an error — playback
 * degrades to today's direct-from-network behavior rather than breaking.
 *
 * Returns `null` while a URL is unresolved/absent, and while the very first
 * download for a given URL is still in flight — deliberately not
 * "stream-while-caching," since that would mean fetching the same bytes
 * twice on a clip's first play, doubling data usage for the exact audience
 * this exists to protect. These clips are short (single words/letters/short
 * phrases), so the first-play wait is small; every play after is instant and
 * offline-capable. Callers already treat "no source yet" as a normal
 * loading state (see `usePhraseAudio`'s `isLoaded` gate), so this composes
 * for free.
 */
export function useCachedAudioSource(remoteUrl: string | null | undefined): string | null {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    if (!remoteUrl) {
      setLocalUri(null);
      return;
    }

    let cancelled = false;
    setLocalUri(null); // reset while resolving — was possibly a PREVIOUS url's local uri

    getCachedLocalUri(remoteUrl).then((uri) => {
      if (!cancelled) {
        setLocalUri(uri);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [remoteUrl]);

  return localUri;
}

const CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}phrase-audio/`;

// Every phrase/vocabulary/aksharmala audio clip is synthesized and stored as
// 16-bit mono WAV (see `useTutorReplyAudio`'s identical observation about
// `bhashini/tts.ts`'s pipeline, and `packages/backend/convex/*/*.ts`'s
// `ctx.storage.store(new Blob([bytes], { type: 'audio/wav' }))` calls) —
// Convex storage URLs themselves carry no file extension, so this is a known
// constant, not a per-URL guess.
const CACHE_FILE_EXTENSION = 'wav';

/** Deduped in-flight downloads, keyed by remote URL, so a second caller for
 * the same clip awaits the first caller's download instead of starting its
 * own. Entries are removed once the download settles (success or failure). */
const inFlightDownloads = new Map<string, Promise<string>>();

/** Deterministic, dependency-free string hash (djb2/xor variant) — stable
 * across app runs/sessions, which is all a cache filename needs. Not a
 * security hash; collisions are astronomically unlikely for this app's
 * content volume and would only cause a wrong cache HIT, never data
 * corruption, since the failure mode is "redownload," not "serve garbage." */
function hashUrl(url: string): string {
  let hash = 5381;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash * 33) ^ url.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

async function ensureCacheDirExists(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

function getCachedLocalUri(remoteUrl: string): Promise<string> {
  const inFlight = inFlightDownloads.get(remoteUrl);
  if (inFlight) {
    return inFlight;
  }

  // `cacheDirectory` is typed nullable (no writable cache on this
  // platform/state, same guard `useTutorReplyAudio` applies) — no local
  // caching is possible, so degrade straight to the remote URL rather than
  // writing into a broken "phrase-audio/" path built on an empty string.
  if (!FileSystem.cacheDirectory) {
    return Promise.resolve(remoteUrl);
  }

  const localUri = `${CACHE_DIR}${hashUrl(remoteUrl)}.${CACHE_FILE_EXTENSION}`;

  // Everything above this line is synchronous (no `await` yet), and so is
  // constructing + starting the async work below up to the map assignment —
  // the async IIFE runs synchronously until its own first `await`, and that
  // first `await` happens INSIDE the function body, after `.set()` below has
  // already run. So there is no window where a second synchronous or
  // same-tick caller can slip past the `inFlightDownloads.get()` check above
  // and start a duplicate download for the same URL.
  const downloadPromise = (async () => {
    try {
      const existing = await FileSystem.getInfoAsync(localUri);
      if (existing.exists) {
        return localUri;
      }
      await ensureCacheDirExists();
      const result = await FileSystem.downloadAsync(remoteUrl, localUri);
      return result.uri;
    } catch {
      // Offline, server error, disk full, etc. — fall back to the remote
      // URL (today's pre-caching behavior) rather than breaking playback.
      return remoteUrl;
    } finally {
      inFlightDownloads.delete(remoteUrl);
    }
  })();

  inFlightDownloads.set(remoteUrl, downloadPromise);
  return downloadPromise;
}
