import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { expo } from '@better-auth/expo';
import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authConfig from './auth.config';

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    // 'exp://*' is Expo Go's dev origin (it can't register our custom scheme —
    // it's one shared container app). 'sarvabhasha://*' covers dev-client/standalone
    // builds. Both are wildcarded: Better Auth does a plain `url.startsWith(pattern)`
    // for non-http(s) schemes with no '*', and the LAN IP:port after 'exp://' varies
    // per network.
    trustedOrigins: ['sarvabhasha://*', 'exp://*'],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      // Dev-only. Production needs an email provider wired before flipping this on.
      requireEmailVerification: false,
    },
    plugins: [expo(), convex({ authConfig })],
  } satisfies BetterAuthOptions);
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
