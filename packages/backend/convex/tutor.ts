import { v } from 'convex/values';
import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { mutation, query, internalMutation, internalQuery, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { LIMITS } from '@sarvabhasha/shared';
import { getCurrentUserDoc, requireCurrentUserDoc } from './lib/currentUser';
import { assertDayKeyFresh } from './lib/dayKey';
import { tutorExpression } from './schema';

/**
 * The AI tutor. See specs/monetization-and-limits.md (enforcement model) and
 * specs/branding-and-voice.md (persona voice, tone). `sendMessage` below is
 * the highest-stakes function in this codebase: it is the one path that can
 * run up an unbounded Gemini bill if the usage check and the API call are
 * ever allowed to drift into separate transactions. They are not — see its
 * comment.
 */

// ------------------------------------------------------------------ personas

export type PersonaKey = 'dadi' | 'parent' | 'kid' | 'neighbour';

/**
 * Exported so other modules that need the same 4-persona union — e.g.
 * `bhashini/tutorSpeech.ts`'s `characterSlug` arg — import this instead of
 * redeclaring the four literals a third time.
 */
export const personaKeyValidator = v.union(
  v.literal('dadi'),
  v.literal('parent'),
  v.literal('kid'),
  v.literal('neighbour'),
);

interface Persona {
  displayName: string;
  /**
   * The system-prompt voice fragment. Ported from specs/branding-and-voice.md's
   * cast table (not invented) so the tutor sounds like the character the
   * learner already knows from the lesson clips, not a new personality.
   */
  voice: string;
}

const PERSONAS: Record<PersonaKey, Persona> = {
  dadi: {
    displayName: 'Dadi',
    voice:
      'You are Dadi, the grandmother from the lesson clips the learner has already watched: warm, ' +
      'direct, and mildly bossy. You are the authority on courtesy and on how things are properly ' +
      'said — you correct with affectionate confidence, never with disapproval.',
  },
  parent: {
    displayName: 'Parent',
    voice:
      'You are the Parent from the lesson clips: practical and busy, usually in the middle of an ' +
      'errand — the market, the money, getting somewhere on time. You talk plainly and to the point, ' +
      'the way someone does when they like the learner but have things to do.',
  },
  kid: {
    displayName: 'Kid',
    voice:
      'You are the roughly nine-year-old Kid from the lesson clips: curious, literal, and a little bit ' +
      'of a comic engine — delighted by small things, asks plain questions, notices details adults skip ' +
      'past. Playful, never the one making fun of anyone, especially never the learner.',
  },
  neighbour: {
    displayName: 'Neighbour',
    voice:
      'You are the Neighbour from the lesson clips — the friendly outside world: the vendor, the ' +
      'stranger on the street, the person you stop to ask. Easygoing and welcoming to anyone who ' +
      'strikes up a conversation.',
  },
};

const DEFAULT_PERSONA_KEY: PersonaKey = 'dadi';

// --------------------------------------------------------------- age gating

/**
 * Defense in depth: `startSession` checks this once when a session is
 * created, but `sendMessage` re-checks it on every single turn rather than
 * trusting that `startSession` was ever called, or that the user's band
 * hasn't changed (e.g. consent revoked) since. The tagged prefixes let the
 * client route to the right screen (birth-year prompt vs. a "coming soon"
 * notice) without parsing free-form text.
 */
function assertAdult(user: Doc<'users'>): void {
  if (user.ageBand === 'unknown') {
    throw new Error('AGE_GATE_REQUIRED: tell us your birth year before using the tutor.');
  }
  if (user.ageBand === 'minor') {
    throw new Error(
      'PARENTAL_CONSENT_REQUIRED: the tutor needs parental permission for under-18 learners — coming soon.',
    );
  }
}

// ------------------------------------------------------- local intent match

type Intent = 'greeting' | 'goodbye' | 'encouragement';

/**
 * Deliberately simple — a handful of patterns across English + the six live
 * launch languages. This is a cost saver, not the main event: most turns
 * still go to Gemini. Ported conceptually from learn-bharat's `detectIntent`.
 */
const INTENT_PATTERNS: ReadonlyArray<[Intent, RegExp]> = [
  ['greeting', /\b(hello|hi|hey|namaste)\b|नमस्ते|नमस्कार|নমস্কার|வணக்கம்|నమస్కారం|ನಮಸ್ಕಾರ/i],
  [
    'goodbye',
    /\b(bye|goodbye|see\s*you)\b|अलविदा|বিদায়|নিরোপ|निरोप|போய்\s*வருகிறேன்|వెళ్తాను|ಬರ್ತೀನಿ/i,
  ],
  [
    'encouragement',
    /\b(thanks|thank\s*you|great|good\s*job|awesome)\b|शाबाश|धन्यवाद|ধন্যবাদ|நன்றி|ధన్యవాదాలు|ಧನ್ಯವಾದ/i,
  ],
];

const TEMPLATE_REPLIES: Record<Intent, Record<string, string>> = {
  greeting: {
    en: 'Hello! Ready to practise a little today?',
    hi: 'नमस्ते! आज थोड़ा अभ्यास करते हैं?',
    bn: 'নমস্কার! আজ একটু অনুশীলন করি?',
    ta: 'வணக்கம்! இன்று கொஞ்சம் பயிற்சி செய்யலாமா?',
    te: 'నమస్కారం! ఈరోజు కొంచెం అభ్యాసం చేద్దామా?',
    mr: 'नमस्कार! आज थोडा सराव करूया का?',
    kn: 'ನಮಸ್ಕಾರ! ಇಂದು ಸ್ವಲ್ಪ ಅಭ್ಯಾಸ ಮಾಡೋಣವೇ?',
  },
  goodbye: {
    en: 'Goodbye! Come back soon to practise more.',
    hi: 'अलविदा! फिर अभ्यास करने आना।',
    bn: 'বিদায়! আবার অনুশীলন করতে এসো।',
    ta: 'போய் வருகிறேன்! மீண்டும் பயிற்சிக்கு வா.',
    te: 'వెళ్తాను! మళ్ళీ అభ్యాసానికి రా.',
    mr: 'निरोप! पुन्हा सरावासाठी ये.',
    kn: 'ಬರ್ತೀನಿ! ಮತ್ತೆ ಅಭ್ಯಾಸಕ್ಕೆ ಬಾ.',
  },
  encouragement: {
    en: "You're doing well — keep going!",
    hi: 'तुम अच्छा कर रहे हो — ऐसे ही करते रहो!',
    bn: 'তুমি ভালো করছো — চালিয়ে যাও!',
    ta: 'நீ நன்றாக செய்கிறாய் — தொடர்!',
    te: 'నువ్వు బాగా చేస్తున్నావు — కొనసాగించు!',
    mr: 'तू छान करतो आहेस — असंच चालू ठेव!',
    kn: 'ನೀನು ಚೆನ್ನಾಗಿ ಮಾಡ್ತಿದ್ದೀಯ — ಮುಂದುವರಿಸು!',
  },
};

function detectIntent(text: string): Intent | null {
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return null;
}

function templateReply(intent: Intent, languageCode: string): string {
  // The `?? ''` never actually triggers — every `Intent` has an `en` entry —
  // it only satisfies `noUncheckedIndexedAccess`, which can't see that from
  // the `Record<string, string>` index signature alone.
  return TEMPLATE_REPLIES[intent][languageCode] ?? TEMPLATE_REPLIES[intent].en ?? '';
}

// ---------------------------------------------------------------- validators

const tutorSessionDoc = v.object({
  _id: v.id('tutorSessions'),
  _creationTime: v.number(),
  userId: v.id('users'),
  languageCode: v.string(),
  personaKey: v.string(),
  rollingSummary: v.optional(v.string()),
  createdAt: v.number(),
  lastMessageAt: v.number(),
});

const tutorMessageDoc = v.object({
  _id: v.id('tutorMessages'),
  _creationTime: v.number(),
  sessionId: v.id('tutorSessions'),
  role: v.union(v.literal('user'), v.literal('assistant')),
  text: v.string(),
  source: v.union(v.literal('gemini'), v.literal('template')),
  model: v.optional(v.string()),
  tokensIn: v.optional(v.number()),
  tokensOut: v.optional(v.number()),
  /** Only a Gemini-sourced assistant reply has one — see schema.ts's field comment. */
  expression: v.optional(tutorExpression),
  createdAt: v.number(),
});

// ------------------------------------------------------------------ session

/**
 * Starts a tutor session. Enforces the age gate up front so the client never
 * even gets a session id to send messages against if the learner can't
 * legally use the tutor yet.
 */
export const startSession = mutation({
  args: {
    languageCode: v.string(),
    personaKey: v.optional(personaKeyValidator),
  },
  returns: v.id('tutorSessions'),
  handler: async (ctx, args) => {
    const user = await requireCurrentUserDoc(ctx);
    assertAdult(user);

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

    const now = Date.now();
    return await ctx.db.insert('tutorSessions', {
      userId: user._id,
      languageCode: args.languageCode,
      personaKey: args.personaKey ?? DEFAULT_PERSONA_KEY,
      createdAt: now,
      lastMessageAt: now,
    });
  },
});

/** `null` covers both "no session with this id" and "not this caller's session" — same client handling either way. */
export const getSession = query({
  args: { sessionId: v.id('tutorSessions') },
  returns: v.union(tutorSessionDoc, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user) return null;
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) return null;
    return session;
  },
});

export const listMessages = query({
  args: { sessionId: v.id('tutorSessions'), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(tutorMessageDoc),
  handler: async (ctx, args) => {
    const user = await requireCurrentUserDoc(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error('Session not found');
    }

    return await ctx.db
      .query('tutorMessages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .paginate(args.paginationOpts);
  },
});

/**
 * Display-only. The client may show this to render a paywall nudge — it may
 * never use it to DECIDE whether to let a message through; only
 * `sendMessage`'s own read of the same table does that (Rule 7: entitlements
 * are server-resolved). Returns the trial size, not granted, for a user whose
 * `credits` row doesn't exist yet — the grant itself only happens
 * transactionally inside `sendMessage`, never here.
 */
export const getCreditsBalance = query({
  args: {},
  returns: v.union(v.object({ balance: v.number(), granted: v.boolean() }), v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUserDoc(ctx);
    if (!user) return null;

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();
    if (!credits) return { balance: LIMITS.TRIAL_CREDITS, granted: false };
    return { balance: credits.balance, granted: true };
  },
});

// ------------------------------------------------------------- send message

/**
 * THE single-transaction gate. Every step below — age re-check, the lazy
 * trial grant, the template short-circuit, the safety-net rate limit, the
 * credits check-and-decrement, the usage increment, and the user-message
 * insert — happens inside this ONE mutation. Convex mutations are
 * transactional; that is the entire mechanism that makes this a real limit
 * instead of a race. The actual Gemini call is scheduled as a separate
 * `internalAction` (`generateReply`) because mutations cannot `fetch` — but
 * by the time that action runs, the credit has already been spent and the
 * usage counter already incremented, so a failure in the action never
 * re-opens the gate or costs a retry-without-a-charge.
 */
export const sendMessage = mutation({
  args: {
    sessionId: v.id('tutorSessions'),
    text: v.string(),
    /** Device-local "YYYY-MM-DD", clamped server-side — see `lib/dayKey.ts`. */
    dayKey: v.string(),
  },
  returns: v.union(
    v.object({ kind: v.literal('template'), reply: v.string() }),
    v.object({ kind: v.literal('scheduled'), messageId: v.id('tutorMessages') }),
  ),
  handler: async (ctx, args) => {
    assertDayKeyFresh(args.dayKey);

    const text = args.text.trim();
    if (!text) {
      throw new Error('Message text is empty.');
    }

    // 1. Resolve identity, re-check the age gate — defense in depth, not
    // trusting that startSession was ever called for this session.
    const user = await requireCurrentUserDoc(ctx);
    assertAdult(user);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error('Session not found');
    }

    const now = Date.now();

    // 2. Lazily grant the one-time trial. Exactly once, at first tutor use —
    // NOT at account creation, so a user who never opens the tutor never gets
    // a credits row at all.
    let credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();
    if (!credits) {
      const creditsId = await ctx.db.insert('credits', {
        userId: user._id,
        balance: LIMITS.TRIAL_CREDITS,
        lifetimePurchased: 0,
        updatedAt: now,
      });
      credits = await ctx.db.get(creditsId);
      if (!credits) throw new Error('Failed to create credits row'); // unreachable — just inserted
    }

    // 3. Local zero-token intent match FIRST, before credits/usage are
    // touched at all. Template replies never reach Gemini and cost nothing.
    const intent = detectIntent(text);
    if (intent) {
      const reply = templateReply(intent, session.languageCode);
      await ctx.db.insert('tutorMessages', {
        sessionId: session._id,
        role: 'user',
        text,
        // Both rows of a template-matched turn are tagged 'template' — this
        // turn never touched Gemini, on either side of the conversation.
        source: 'template',
        createdAt: now,
      });
      await ctx.db.insert('tutorMessages', {
        sessionId: session._id,
        role: 'assistant',
        text: reply,
        source: 'template',
        createdAt: now,
      });
      await ctx.db.patch(session._id, { lastMessageAt: now });
      return { kind: 'template' as const, reply };
    }

    // 4. Safety-net cap — bounds a client bug/script loop, NOT an economic
    // control (see specs/monetization-and-limits.md). Checked before the
    // credits check so a runaway loop never even gets to spend a credit.
    const usageRow = await ctx.db
      .query('usage')
      .withIndex('by_user_day_kind', (q) =>
        q.eq('userId', user._id).eq('day', args.dayKey).eq('kind', 'tutor_turn'),
      )
      .first();
    if (usageRow && usageRow.count >= LIMITS.SAFETY_NET_TUTOR_TURNS_PER_DAY) {
      throw new Error('SAFETY_NET_EXCEEDED: too many tutor turns today — try again tomorrow.');
    }

    // 5. The actual economic control: credits balance.
    if (credits.balance <= 0) {
      throw new Error('CREDITS_EXHAUSTED: buy the Tutor Pack to keep chatting.');
    }
    await ctx.db.patch(credits._id, { balance: credits.balance - 1, updatedAt: now });

    // 6. Increment (or create) today's usage counter.
    if (usageRow) {
      await ctx.db.patch(usageRow._id, { count: usageRow.count + 1 });
    } else {
      await ctx.db.insert('usage', {
        userId: user._id,
        day: args.dayKey,
        kind: 'tutor_turn',
        count: 1,
      });
    }

    // 7. Insert the user's message row. `source` is a required field on this
    // table (not nullable) — set to 'gemini' here because this turn IS the
    // one going to Gemini, mirroring the assistant reply's source rather
    // than leaving it ambiguous.
    const messageId = await ctx.db.insert('tutorMessages', {
      sessionId: session._id,
      role: 'user',
      text,
      source: 'gemini',
      createdAt: now,
    });

    await ctx.db.patch(session._id, { lastMessageAt: now });

    // 8. Schedule the Gemini call. Never call it synchronously from a
    // mutation — mutations can't `fetch`, and this is exactly why
    // `generateReply` is a separate internalAction.
    await ctx.scheduler.runAfter(0, internal.tutor.generateReply, { sessionId: session._id });

    return { kind: 'scheduled' as const, messageId };
  },
});

// ------------------------------------------------------ internal: db plumbing

export const getSessionForGeneration = internalQuery({
  args: { sessionId: v.id('tutorSessions') },
  returns: v.union(tutorSessionDoc, v.null()),
  handler: async (ctx, args) => await ctx.db.get(args.sessionId),
});

/** Last `limit` messages, chronological (oldest first) — the window sent to Gemini. */
export const getRecentMessagesDesc = internalQuery({
  args: { sessionId: v.id('tutorSessions'), limit: v.number() },
  returns: v.array(tutorMessageDoc),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('tutorMessages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('desc')
      .take(args.limit);
    return rows.reverse();
  },
});

/** Oldest `limit` messages, chronological — used to find the block that just fell out of the window. */
export const getOldestMessages = internalQuery({
  args: { sessionId: v.id('tutorSessions'), limit: v.number() },
  returns: v.array(tutorMessageDoc),
  handler: async (ctx, args) =>
    await ctx.db
      .query('tutorMessages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .take(args.limit),
});

export const countSessionMessages = internalQuery({
  args: { sessionId: v.id('tutorSessions') },
  returns: v.number(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('tutorMessages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();
    return rows.length;
  },
});

export const insertAssistantMessage = internalMutation({
  args: {
    sessionId: v.id('tutorSessions'),
    text: v.string(),
    model: v.string(),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    expression: v.optional(tutorExpression),
  },
  returns: v.id('tutorMessages'),
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert('tutorMessages', {
      sessionId: args.sessionId,
      role: 'assistant',
      text: args.text,
      source: 'gemini',
      model: args.model,
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
      expression: args.expression,
      createdAt: now,
    });
    await ctx.db.patch(args.sessionId, { lastMessageAt: now });
    return messageId;
  },
});

export const appendRollingSummary = internalMutation({
  args: { sessionId: v.id('tutorSessions'), summary: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { rollingSummary: args.summary });
    return null;
  },
});

// -------------------------------------------------------------- Gemini call

/** Exactly this string per root CLAUDE.md's cost table — never substitute a different model. */
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const EXPRESSIONS = ['neutral', 'happy', 'encouraging', 'thinking'] as const;
type Expression = (typeof EXPRESSIONS)[number];

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set. Run `bunx convex env set GEMINI_API_KEY <key>` on the Convex deployment.',
    );
  }
  return key;
}

/**
 * Builds the system prompt from: the persona voice fragment, the target
 * language, the rolling summary (if any), and two fixed instructions that
 * matter — see the phase-6 brief. Both are non-negotiable per
 * specs/branding-and-voice.md and root CLAUDE.md, not stylistic choices.
 */
function buildSystemPrompt(persona: Persona, languageCode: string, rollingSummary?: string): string {
  const parts = [
    `You are ${persona.displayName}, a character the learner already knows from Sarvabhasha's lesson clips.`,
    persona.voice,
    `You are helping the learner practise conversational ${languageCode}. Reply mainly in ${languageCode} ` +
      'script, with a brief English gloss in parentheses only for a word or phrase you introduce that is ' +
      'likely new to the learner.',
    // ASR-charity instruction — the agreed alternative to a second cleanup
    // LLM call: cheaper, one round-trip instead of two.
    "The learner's message may have come through speech recognition and can contain transcription " +
      'errors — missing words, homophone substitutions, garbled fragments. Interpret charitably: infer ' +
      'the most likely intended meaning and respond to that. Only ask for clarification if the message ' +
      'is truly incomprehensible, not merely imperfect.',
    // Encouraging-not-correcting instruction, per branding-and-voice.md's AI-tutor tone row.
    'Never mark the learner wrong or point out their mistake directly. Correct by modelling the right ' +
      'phrasing naturally within your own reply, the way a warm relative would.',
    'Keep replies short — one or two sentences — sized for a mobile chat bubble.',
  ];
  if (rollingSummary) {
    parts.push(`Summary of the conversation so far: ${rollingSummary}`);
  }
  return parts.join('\n\n');
}

interface GeminiReplyResult {
  reply: string;
  expression: Expression;
  tokensIn?: number;
  tokensOut?: number;
}

/**
 * Calls Gemini's native structured-JSON-output mode: `responseMimeType:
 * "application/json"` + a `responseSchema`, both inside `generationConfig`,
 * confirmed current against https://ai.google.dev/api/generate-content and
 * https://ai.google.dev/gemini-api/docs/structured-output (2026-08) — see
 * this module's deviation note in the phase-6 report for what changed
 * versus an older/guessed API shape. `expression` drives which looping
 * avatar clip the client plays later; `generateReply` below persists it on
 * the assistant's `tutorMessages` row so the client can actually read it.
 */
async function callGemini(
  systemPrompt: string,
  history: Doc<'tutorMessages'>[],
): Promise<GeminiReplyResult> {
  const apiKey = getGeminiApiKey();

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            expression: { type: 'string', enum: EXPRESSIONS as unknown as string[] },
          },
          required: ['reply', 'expression'],
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini generateContent failed: ${res.status} — ${await res.text()}`);
  }

  const data = await res.json();
  const raw: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini response missing content');

  let parsed: { reply?: unknown; expression?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned non-JSON despite responseMimeType: ${raw}`);
  }

  const reply = typeof parsed.reply === 'string' ? parsed.reply : '';
  const expression: Expression = (EXPRESSIONS as readonly string[]).includes(parsed.expression as string)
    ? (parsed.expression as Expression)
    : 'neutral';

  return {
    reply,
    expression,
    tokensIn: data.usageMetadata?.promptTokenCount,
    tokensOut: data.usageMetadata?.candidatesTokenCount,
  };
}

/** One cheap plain-text Gemini call that compresses a batch of messages about to fall out of the window. */
async function summarizeFallingOutBlock(
  messages: Doc<'tutorMessages'>[],
  priorSummary: string | undefined,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.text}`)
    .join('\n');

  const prompt =
    'Compress the following tutor-conversation excerpt into 2-3 sentences of context worth ' +
    "remembering (topics covered, the learner's apparent level, anything notable). No greeting, no " +
    `sign-off, just the summary.\n\n${transcript}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    throw new Error(`Gemini summarize failed: ${res.status} — ${await res.text()}`);
  }

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const trimmed = text.trim();
  return priorSummary ? `${priorSummary} ${trimmed}` : trimmed;
}

/**
 * Loads the session + last 8 messages, calls Gemini, inserts the reply.
 * Every 8 messages (never every turn — that would defeat the point of
 * batching), also regenerates the rolling summary for the block that just
 * fell out of the 8-message window, appended to whatever summary already
 * existed.
 */
export const generateReply = internalAction({
  args: { sessionId: v.id('tutorSessions') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session: Doc<'tutorSessions'> | null = await ctx.runQuery(
      internal.tutor.getSessionForGeneration,
      { sessionId: args.sessionId },
    );
    if (!session) return null; // session vanished between scheduling and running — nothing to reply to

    const recent: Doc<'tutorMessages'>[] = await ctx.runQuery(internal.tutor.getRecentMessagesDesc, {
      sessionId: args.sessionId,
      limit: LIMITS.TUTOR_HISTORY_WINDOW,
    });

    const persona = PERSONAS[session.personaKey as PersonaKey] ?? PERSONAS[DEFAULT_PERSONA_KEY];
    const systemPrompt = buildSystemPrompt(persona, session.languageCode, session.rollingSummary);

    const { reply, expression, tokensIn, tokensOut } = await callGemini(systemPrompt, recent);

    await ctx.runMutation(internal.tutor.insertAssistantMessage, {
      sessionId: args.sessionId,
      text: reply,
      model: GEMINI_MODEL,
      tokensIn,
      tokensOut,
      expression,
    });

    const total: number = await ctx.runQuery(internal.tutor.countSessionMessages, {
      sessionId: args.sessionId,
    });

    const window = LIMITS.TUTOR_HISTORY_WINDOW;
    // Only at 16, 24, 32, ... — a full window's worth has fallen out since
    // the last summary. NOT at 8 itself: the first window hasn't pushed
    // anything out yet.
    if (total >= 2 * window && total % window === 0) {
      const oldest: Doc<'tutorMessages'>[] = await ctx.runQuery(internal.tutor.getOldestMessages, {
        sessionId: args.sessionId,
        limit: total - window,
      });
      const fallingOut = oldest.slice(-window);
      const summary = await summarizeFallingOutBlock(fallingOut, session.rollingSummary);
      await ctx.runMutation(internal.tutor.appendRollingSummary, {
        sessionId: args.sessionId,
        summary,
      });
    }

    return null;
  },
});
