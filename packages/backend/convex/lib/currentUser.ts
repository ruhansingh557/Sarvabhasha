import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

/**
 * The ONE path every user-scoped query/mutation in this codebase uses to
 * learn who is calling. Never accept a `userId` as a client argument —
 * `schema.ts`'s `users` table comment and CLAUDE.md rule say so explicitly,
 * and `animations.ts` has two `TODO(auth)` markers showing what happens when
 * this rule is skipped. Do not repeat that mistake in new code.
 *
 * `authComponent.safeGetAuthUser` validates the caller's session against the
 * Better Auth component's own tables (not just a decoded JWT claim) and
 * returns that component's `user` doc, whose `_id` is the stable Better Auth
 * user id mirrored into our own `users.authId` field. From there this looks
 * up our app-level `users` row by `by_authId`.
 *
 * Returns `null` — never throws — when there is no session OR the session is
 * valid but onboarding (`getOrCreateCurrentUser`) hasn't run yet. Both are
 * ordinary states a client-facing query must handle, not errors.
 */
export async function getCurrentUserDoc(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'> | null> {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) return null;

  return await ctx.db
    .query('users')
    .withIndex('by_authId', (q) => q.eq('authId', authUser._id))
    .unique();
}

/**
 * Same resolution, but throws when there is no app-level user row.
 *
 * Only call this from functions that are unreachable except by an
 * already-onboarded client (i.e. every mutation except
 * `getOrCreateCurrentUser` itself) — for anything a client might call before
 * onboarding completes, use `getCurrentUserDoc` and branch on `null` instead.
 */
export async function requireCurrentUserDoc(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const user = await getCurrentUserDoc(ctx);
  if (!user) throw new Error('Not authenticated');
  return user;
}
