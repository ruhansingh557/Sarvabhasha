import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { authComponent } from './auth';
import { getCurrentUserDoc, requireCurrentUserDoc } from './lib/currentUser';

/**
 * The app-level `users` mirror and its onboarding lifecycle.
 *
 * `auth.ts`'s `getCurrentUser` returns the raw Better Auth identity (name,
 * email, session bookkeeping) — useful for the auth screens, useless for
 * anything that needs `targetLanguage`, `ageBand`, etc. This file is the
 * first thing that resolves that identity down to OUR `users` row, and every
 * other user-scoped function in this codebase should go through
 * `lib/currentUser.ts` rather than repeat the lookup.
 */

const userDoc = v.object({
  _id: v.id('users'),
  _creationTime: v.number(),
  authId: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  uiLanguage: v.string(),
  targetLanguage: v.optional(v.string()),
  birthYear: v.optional(v.number()),
  ageBand: v.union(v.literal('unknown'), v.literal('minor'), v.literal('adult')),
  parentalConsentAt: v.optional(v.number()),
  onboardedAt: v.optional(v.number()),
  createdAt: v.number(),
});

/**
 * `null` means "no session" OR "session valid but never onboarded" — both are
 * real, expected states. The client checks for `null` and routes to
 * onboarding; it never sees this as an error.
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(userDoc, v.null()),
  handler: async (ctx) => {
    return await getCurrentUserDoc(ctx);
  },
});

/**
 * Idempotent onboarding. Safe to call on every app launch: once a `users` row
 * exists it is returned as-is — this NEVER overwrites `targetLanguage`,
 * `ageBand`, or anything else a returning user has already set.
 *
 * Throws if there is no authenticated session. Unlike `getCurrentUser`, this
 * is only ever called by an already-authenticated client (right after
 * sign-in), so an unauthenticated call here is a client bug, not a valid
 * empty state.
 */
export const getOrCreateCurrentUser = mutation({
  args: { uiLanguage: v.optional(v.string()) },
  returns: userDoc,
  handler: async (ctx, args) => {
    // Throws if unauthenticated — this mutation is only ever called by an
    // already-signed-in client, right after sign-in.
    const authUser = await authComponent.getAuthUser(ctx);

    const existing = await ctx.db
      .query('users')
      .withIndex('by_authId', (q) => q.eq('authId', authUser._id))
      .unique();
    if (existing) return existing;

    const userId = await ctx.db.insert('users', {
      authId: authUser._id,
      name: authUser.name,
      email: authUser.email,
      uiLanguage: args.uiLanguage ?? 'en',
      targetLanguage: undefined,
      ageBand: 'unknown' as const,
      createdAt: Date.now(),
    });

    const created = await ctx.db.get(userId);
    if (!created) throw new Error('Failed to create user'); // unreachable — just inserted
    return created;
  },
});

/**
 * Sets the learner's target language. Enforces the schema comment that has
 * never actually been checked anywhere: `targetLanguage` must name a
 * language whose Convex `status` is `live` — a draft/archived language has
 * no reviewed content and would silently show an empty Learn tab.
 */
export const setTargetLanguage = mutation({
  args: { languageCode: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUserDoc(ctx);

    const language = await ctx.db
      .query('languages')
      .withIndex('by_code', (q) => q.eq('code', args.languageCode))
      .unique();
    if (!language) {
      throw new Error(`Unknown language code "${args.languageCode}"`);
    }
    if (language.status !== 'live') {
      throw new Error(
        `Language "${args.languageCode}" is not live yet (status: ${language.status}).`,
      );
    }

    await ctx.db.patch(user._id, { targetLanguage: args.languageCode });
    return null;
  },
});

/**
 * Sets the learner's UI (interface-chrome) language. Deliberately does NOT
 * enforce `status === 'live'` the way `setTargetLanguage` does: `uiLanguage`
 * is not a claim about lesson-content availability, just which language the
 * interface text renders in, and all 22 `@sarvabhasha/shared` languages are
 * legitimate choices regardless of launch status (see the `uiLanguage`
 * schema comment — "ISO 639-1, any of the 22"). Still validated against the
 * `languages` table so a typo'd/unknown code can't be stored.
 */
export const setUiLanguage = mutation({
  args: { languageCode: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireCurrentUserDoc(ctx);

    const language = await ctx.db
      .query('languages')
      .withIndex('by_code', (q) => q.eq('code', args.languageCode))
      .unique();
    if (!language) {
      throw new Error(`Unknown language code "${args.languageCode}"`);
    }

    await ctx.db.patch(user._id, { uiLanguage: args.languageCode });
    return null;
  },
});
