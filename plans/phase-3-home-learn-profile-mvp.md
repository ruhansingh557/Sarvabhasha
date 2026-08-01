# Phase 3 — Home/Learn/Profile MVP

**Status:** ✅ done (as scoped — see "Deliberately out of scope" below; this is a narrow v1, not a finished product surface)

## Scope decisions made up front (still binding — don't relitigate without a reason)

1. **No fal.ai/animation.** No API key configured, no character reference images generated yet (that's phase 5's first task). The phrase detail screen's animation slot is a themed static "coming soon" placeholder.
2. **No onboarding flow.** Signed-in users land directly on the tab bar. Home shows a "choose your language" empty state when `users.targetLanguage` is unset, instead of a dedicated pre-tab-bar flow.
3. **No social/leaderboard features.** No friend graph in the schema. Streaks + three simple achievement booleans (computed inline, no badges table) cover the engagement-research findings without the added scope of a social graph.
4. **Seed real content, not fixtures.** 5 hand-authored greetings phrases, translated to Hindi and reviewed by a human (the project owner) before going live — not machine-translated, not fake placeholder text.

## Backend — `packages/backend/convex/`

New modules, none of which existed before this phase:

- **`users.ts`** — `getCurrentUser` (query, current user's `users` row or `null`), `getOrCreateCurrentUser` (mutation, lazy-creates on first call post-sign-in, idempotent after), `setTargetLanguage` (mutation, enforces the target must be a `status: 'live'` language — this was previously just a schema comment, now actually enforced), `setUiLanguage` (mutation, added later — no live-status requirement, since UI language is interface chrome, not a content-readiness claim).
- **`languages.ts`** — `listLiveLanguages` (the 6 live languages, for target-language selection), `listAllLanguages` (all 22, for UI-language selection — added alongside `setUiLanguage`).
- **`categories.ts`** — `listCategories`. Deliberately returns **all** categories regardless of status (not just live) — category existence is navigation chrome, not lesson content, so non-live ones render as "coming soon" in the UI rather than disappearing. Phrases/translations/audio inside a category still strictly gate on `live`.
- **`phrases.ts`** — `getByKey` (also fixes a previously-broken reference from `scripts/upload-animation.ts`, which called this before it existed), `listByCategory` (returns a discriminated union — `{needsTargetLanguage: true}` vs. the actual phrase list — so the client can render the right empty state), `getDetail` (one phrase, fully resolved: text/transliteration/audio URL, does NOT touch the `animations` table per scope decision 1).
- **`progress.ts`** — `recordViewed` (progress + streak updated in the **same transaction** — this is `data-model.md`'s structural decision 2, actually implemented now, including a previously-just-documented ±1-day clamp on the client-supplied `dayKey`), `getStreak`.
- **`home.ts`** — `getHomeSummary`, one query for the whole Home screen (streak, totals, "continue learning" suggestion, three achievement booleans).
- **`seed.ts`** — `internalMutation`s only (never public): `seedLanguages`/`seedCategories` (idempotent upserts from `@sarvabhasha/shared`), `seedGreetingsPhrases` (5 hand-authored phrases, English metadata only), `seedTranslation` (takes translation text as an argument — never hardcodes any language's actual words), `approveTranslationAndAudio` (flips both translation and audio to `live` together, since a phrase isn't browsable until both are — the stopgap review-approval mechanism until phase 10's admin console exists).
- **`lib/currentUser.ts`, `lib/liveContent.ts`** — shared helpers so every module derives the caller from the auth identity the same way (never a client-supplied `userId`) and agrees on what "live" means.
- **Schema change:** `users.targetLanguage` is now `v.optional(v.string())` (was required) — a new user legitimately has none yet.

## Mobile — `apps/mobile/src/`

- **`shared/components/{atoms,molecules}/`** — the first reusable component layer in the app: `Button` (primary/secondary, loading/disabled), `Screen` (the outer/inner max-width screen shell), `ListCard` (tappable row, used by both the category grid and phrase lists), `LanguagePicker` (generalized to take `languages`/`onSelect` as props so both target-language and UI-language selection share it — it started hardwired to one query/mutation pair and had to be refactored when the UI-language feature needed a second use).
- **Home** (`features/home/screens/HomeScreen.tsx`) — streak, progress summary, continue-learning CTA (jumps to the pilot category's phrase list, not an exact-phrase deep link — a deliberate v1 simplification), three milestone rows, or the choose-language empty state.
- **Learn** (`features/learn/`) — three screens: category grid (two-pane on tablet/wide, pushed stack on phone — the one screen in this app that's genuinely responsive-different by breakpoint, per `CLAUDE.md` rule 16) → phrase list → phrase detail. Phrase detail is the first real use of the theme's `phrase`/`transliteration` text variants and the first `expo-audio` usage in the app (`hooks/usePhraseAudio.ts`). Records progress via `useFocusEffect` (not plain `useEffect`) so re-viewing an already-seen phrase still counts.
- **Profile** (`features/profile/screens/ProfileScreen.tsx`) — account (email, sign-out — the one thing that existed before this phase), display language (all 22, via `LanguagePicker`), target/"Learning" language (6 live, via the same `LanguagePicker`), streak stats.
- **Navigation:** `LearnStackParamList` grew `PhraseList`/`PhraseDetail` routes; `MainTabParamList` had to widen from `undefined`-only tab entries to `NavigatorScreenParams<...>` so Home's cross-tab "continue learning" navigate call would typecheck.

## Content — what's actually live right now (dev deployment)

- All 22 languages seeded (6 `live`, 16 `draft`, matching `@sarvabhasha/shared`'s launch plan).
- All 9 categories seeded (`greetings` `live`, the other 8 `draft` — render as "coming soon" in the Learn tab).
- 5 phrases in `greetings`, Hindi only, fully live (text + transliteration + Bhashini-generated audio, listened to and approved by the project owner):

  | phraseKey | Hindi | Transliteration |
  |---|---|---|
  | `namaste-hello` | नमस्ते, कैसे हो? | Namaste, kaise ho? |
  | `dhanyavaad-thank-you` | धन्यवाद | Dhanyavaad |
  | `kaise-ho-how-are-you` | आप कैसे हैं? | Aap kaise hain? |
  | `phir-milenge-goodbye` | फिर मिलेंगे | Phir milenge |
  | `shubh-prabhat-good-morning` | सुप्रभात | Suprabhat |

- No other language has translations for these phrases yet. No other category has any phrases yet.

## Verification performed

Full loop tested live in the iOS Simulator via `idb` (scripted taps + screenshots, not just typecheck): sign-in → Home shows real streak/progress → Learn → Greetings category → phrase list (all 5, correct Hindi + transliteration) → phrase detail → Play button actually plays audio to completion (confirmed by timing the button's Pause→Play auto-revert against the clip's exact duration) → back to Home, streak incremented to 1, "Viewed your first phrase" milestone flipped to earned. Profile's display-language and target-language pickers both verified switching correctly and independently.

## Deliberately out of scope (see later phases)

Animation/video (phase 5), more categories/languages (phase 4), the Tutor tab (phase 6), monetization (phase 7), onboarding/age-gating (phase 8), other UI locales (phase 9), an actual admin UI instead of `convex run` + manual dashboard flips (phase 10).
