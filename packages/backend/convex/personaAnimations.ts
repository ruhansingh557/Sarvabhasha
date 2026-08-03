import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { requireCurrentUserDoc } from './lib/currentUser';

/**
 * AI-tutor avatar clip recording + approval.
 *
 * Mirrors `animations.ts` exactly, adapted from "one clip per phrase" to
 * "one clip per (character, expression)". See `schema.ts`'s
 * `personaAnimations` doc comment for why this is a separate table from
 * `animations` rather than a variant of it: no phraseId, no languageCode —
 * a persona's "thinking" loop is the same clip no matter what the learner
 * is studying.
 *
 * The content-pipeline's fal.ai action calls `recordAnimation` after
 * generating a clip; a human reviewer (or the batch-approval script, via
 * `approveAnimationInternal`) promotes it to `live` afterwards. Nothing
 * generative auto-publishes (CLAUDE.md rule 14).
 */

const characterSlug = v.union(
  v.literal('dadi'),
  v.literal('parent'),
  v.literal('kid'),
  v.literal('neighbour'),
);

const expression = v.union(
  v.literal('neutral'),
  v.literal('happy'),
  v.literal('encouraging'),
  v.literal('thinking'),
);

/**
 * Records a persona clip. Always lands as `draft` — publishing is a
 * separate, deliberate act (CLAUDE.md rule 14), even when the reviewer
 * generated the clip themselves and is looking right at it.
 */
export const recordAnimation = mutation({
  args: {
    characterSlug,
    expression,
    storageId: v.id('_storage'),
    keyframeStorageIds: v.optional(v.array(v.id('_storage'))),

    // Reproducibility metadata — required, same as animations.ts.
    model: v.string(),
    ratePerSecond: v.number(),
    durationSec: v.number(),
    prompt: v.string(),
    seed: v.optional(v.number()),
    attempt: v.number(),
  },
  returns: v.id('personaAnimations'),
  handler: async (ctx, args) => {
    if (args.durationSec < 2 || args.durationSec > 6) {
      // Avatar loops are short reaction beats, not scenes — no three-act
      // structure to fit, so the window is much tighter than a lesson clip's
      // 7–12s (animations.ts). Adjust alongside the fal.ai prompt template if
      // that changes.
      throw new Error(
        `Duration ${args.durationSec}s is outside the 2–6s persona-loop window.`,
      );
    }

    return await ctx.db.insert('personaAnimations', {
      characterSlug: args.characterSlug,
      expression: args.expression,
      storageId: args.storageId,
      keyframeStorageIds: args.keyframeStorageIds ?? [],
      model: args.model,
      ratePerSecond: args.ratePerSecond,
      durationSec: args.durationSec,
      prompt: args.prompt,
      seed: args.seed,
      attempt: args.attempt,
      status: 'draft',
      approvedBy: undefined,
      approvedAt: undefined,
    });
  },
});

/**
 * The approval gate. Before calling this, watch the loop muted at actual
 * playback size — a clip that reads fine full-screen can turn to mush at
 * avatar size, and that's the only size it will ever be shown at.
 */
export const approveAnimation = mutation({
  args: {
    animationId: v.id('personaAnimations'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Approver is derived from the auth identity, never a client argument —
    // same reasoning as animations.ts's approveAnimation.
    const approver = await requireCurrentUserDoc(ctx);

    const animation = await ctx.db.get(args.animationId);
    if (!animation) throw new Error(`No persona animation ${args.animationId}`);

    // Supersede any previously live clip for this (character, expression) —
    // one live clip each.
    const existing = await ctx.db
      .query('personaAnimations')
      .withIndex('by_character_expression', (q) =>
        q.eq('characterSlug', animation.characterSlug).eq('expression', animation.expression),
      )
      .collect();

    for (const a of existing) {
      if (a._id !== args.animationId && a.status === 'live') {
        await ctx.db.patch(a._id, { status: 'archived' });
      }
    }

    await ctx.db.patch(args.animationId, {
      status: 'live',
      approvedBy: approver._id,
      approvedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Same approval logic, for the trusted CLI/ops batch-approval path — see
 * `animations.ts`'s `approveAnimationInternal` for why this exists.
 * `approvedBy` is an explicit arg because `bunx convex run` (deploy-key
 * auth) has no app-user session to derive one from; safe here because
 * `internalMutation`s have no client-facing spoofing surface at all.
 */
export const approveAnimationInternal = internalMutation({
  args: {
    animationId: v.id('personaAnimations'),
    approvedBy: v.id('users'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const animation = await ctx.db.get(args.animationId);
    if (!animation) throw new Error(`No persona animation ${args.animationId}`);

    const existing = await ctx.db
      .query('personaAnimations')
      .withIndex('by_character_expression', (q) =>
        q.eq('characterSlug', animation.characterSlug).eq('expression', animation.expression),
      )
      .collect();

    for (const a of existing) {
      if (a._id !== args.animationId && a.status === 'live') {
        await ctx.db.patch(a._id, { status: 'archived' });
      }
    }

    await ctx.db.patch(args.animationId, {
      status: 'live',
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
    });
    return null;
  },
});

/** Admin review queue. Returns non-live clips — never exposed to the app. */
export const listPendingReview = query({
  args: {},
  handler: async (ctx) => {
    const drafts = await ctx.db
      .query('personaAnimations')
      .withIndex('by_status', (q) => q.eq('status', 'draft'))
      .collect();

    return Promise.all(
      drafts.map(async (a) => ({
        ...a,
        url: await ctx.storage.getUrl(a.storageId),
      })),
    );
  },
});

/**
 * The mobile avatar player's one call: every expression for one character,
 * resolved to a signed URL where a `live` clip exists. `null` for any
 * expression not yet promoted — a persona goes live one expression at a
 * time, exactly like `review.ts`'s "static illustration until a clip is
 * produced" fallback for lesson phrases. The client is expected to fall back
 * to a static portrait for any `null` entry rather than treat it as an error.
 */
export const getLiveClipsForCharacter = query({
  args: { characterSlug },
  returns: v.object({
    neutral: v.union(v.string(), v.null()),
    happy: v.union(v.string(), v.null()),
    encouraging: v.union(v.string(), v.null()),
    thinking: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('personaAnimations')
      .withIndex('by_character_expression', (q) => q.eq('characterSlug', args.characterSlug))
      .collect();

    const liveByExpression = new Map(
      rows.filter((r) => r.status === 'live').map((r) => [r.expression, r]),
    );

    const urlFor = async (expr: 'neutral' | 'happy' | 'encouraging' | 'thinking') => {
      const row = liveByExpression.get(expr);
      return row ? await ctx.storage.getUrl(row.storageId) : null;
    };

    const [neutral, happy, encouraging, thinking] = await Promise.all([
      urlFor('neutral'),
      urlFor('happy'),
      urlFor('encouraging'),
      urlFor('thinking'),
    ]);

    return { neutral, happy, encouraging, thinking };
  },
});
