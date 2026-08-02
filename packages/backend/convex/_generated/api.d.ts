/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as animations from "../animations.js";
import type * as auth from "../auth.js";
import type * as bhashini_tts from "../bhashini/tts.js";
import type * as categories from "../categories.js";
import type * as fal_animations from "../fal/animations.js";
import type * as fal_characters from "../fal/characters.js";
import type * as fal_lib from "../fal/lib.js";
import type * as google_tts from "../google/tts.js";
import type * as home from "../home.js";
import type * as http from "../http.js";
import type * as languages from "../languages.js";
import type * as lib_audioAssets from "../lib/audioAssets.js";
import type * as lib_currentUser from "../lib/currentUser.js";
import type * as lib_liveContent from "../lib/liveContent.js";
import type * as phrases from "../phrases.js";
import type * as progress from "../progress.js";
import type * as review from "../review.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  animations: typeof animations;
  auth: typeof auth;
  "bhashini/tts": typeof bhashini_tts;
  categories: typeof categories;
  "fal/animations": typeof fal_animations;
  "fal/characters": typeof fal_characters;
  "fal/lib": typeof fal_lib;
  "google/tts": typeof google_tts;
  home: typeof home;
  http: typeof http;
  languages: typeof languages;
  "lib/audioAssets": typeof lib_audioAssets;
  "lib/currentUser": typeof lib_currentUser;
  "lib/liveContent": typeof lib_liveContent;
  phrases: typeof phrases;
  progress: typeof progress;
  review: typeof review;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
