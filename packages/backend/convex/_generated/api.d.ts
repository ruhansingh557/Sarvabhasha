/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aksharmala from "../aksharmala.js";
import type * as animations from "../animations.js";
import type * as auth from "../auth.js";
import type * as bhashini_aksharmalaTts from "../bhashini/aksharmalaTts.js";
import type * as bhashini_asr from "../bhashini/asr.js";
import type * as bhashini_lib from "../bhashini/lib.js";
import type * as bhashini_meeteiTrial from "../bhashini/meeteiTrial.js";
import type * as bhashini_tts from "../bhashini/tts.js";
import type * as bhashini_tutorSpeech from "../bhashini/tutorSpeech.js";
import type * as bhashini_vocabularyTts from "../bhashini/vocabularyTts.js";
import type * as categories from "../categories.js";
import type * as fal_animations from "../fal/animations.js";
import type * as fal_characters from "../fal/characters.js";
import type * as fal_lib from "../fal/lib.js";
import type * as fal_personaAnimations from "../fal/personaAnimations.js";
import type * as fal_vocabularyImages from "../fal/vocabularyImages.js";
import type * as google_aksharmalaTts from "../google/aksharmalaTts.js";
import type * as google_aksharmalaTtsTrial from "../google/aksharmalaTtsTrial.js";
import type * as google_tts from "../google/tts.js";
import type * as google_vocabularyTts from "../google/vocabularyTts.js";
import type * as home from "../home.js";
import type * as http from "../http.js";
import type * as languages from "../languages.js";
import type * as lib_audioAssets from "../lib/audioAssets.js";
import type * as lib_currentUser from "../lib/currentUser.js";
import type * as lib_dayKey from "../lib/dayKey.js";
import type * as lib_liveContent from "../lib/liveContent.js";
import type * as personaAnimations from "../personaAnimations.js";
import type * as phrases from "../phrases.js";
import type * as progress from "../progress.js";
import type * as review from "../review.js";
import type * as seed from "../seed.js";
import type * as tutor from "../tutor.js";
import type * as users from "../users.js";
import type * as vocabulary from "../vocabulary.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aksharmala: typeof aksharmala;
  animations: typeof animations;
  auth: typeof auth;
  "bhashini/aksharmalaTts": typeof bhashini_aksharmalaTts;
  "bhashini/asr": typeof bhashini_asr;
  "bhashini/lib": typeof bhashini_lib;
  "bhashini/meeteiTrial": typeof bhashini_meeteiTrial;
  "bhashini/tts": typeof bhashini_tts;
  "bhashini/tutorSpeech": typeof bhashini_tutorSpeech;
  "bhashini/vocabularyTts": typeof bhashini_vocabularyTts;
  categories: typeof categories;
  "fal/animations": typeof fal_animations;
  "fal/characters": typeof fal_characters;
  "fal/lib": typeof fal_lib;
  "fal/personaAnimations": typeof fal_personaAnimations;
  "fal/vocabularyImages": typeof fal_vocabularyImages;
  "google/aksharmalaTts": typeof google_aksharmalaTts;
  "google/aksharmalaTtsTrial": typeof google_aksharmalaTtsTrial;
  "google/tts": typeof google_tts;
  "google/vocabularyTts": typeof google_vocabularyTts;
  home: typeof home;
  http: typeof http;
  languages: typeof languages;
  "lib/audioAssets": typeof lib_audioAssets;
  "lib/currentUser": typeof lib_currentUser;
  "lib/dayKey": typeof lib_dayKey;
  "lib/liveContent": typeof lib_liveContent;
  personaAnimations: typeof personaAnimations;
  phrases: typeof phrases;
  progress: typeof progress;
  review: typeof review;
  seed: typeof seed;
  tutor: typeof tutor;
  users: typeof users;
  vocabulary: typeof vocabulary;
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
