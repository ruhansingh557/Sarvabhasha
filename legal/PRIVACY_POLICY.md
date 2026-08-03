# Sarvabhasha Privacy Policy

> **⚠️ DRAFT — NOT YET LEGALLY REVIEWED.** This document was authored by an AI coding assistant grounded in this codebase's actual data flows, as a starting point for v1.0.0 launch. It is **not** a substitute for review by a qualified lawyer, particularly for DPDP Act 2023 compliance (India), and every `[TODO]` marker below is a real gap, not a formatting placeholder. Do not publish or link this from a live app store listing until a lawyer has reviewed it and every `[TODO]` is resolved.

**Last updated:** [TODO: set on actual publish date]
**Effective for:** Sarvabhasha (सर्वभाषा), mobile app and associated backend services.

## 1. Who we are

Sarvabhasha is operated by [TODO: legal entity name and registered address — required for both DPDP Act 2023 disclosure and app store submission]. If you have questions about this policy or your data, contact us at [TODO: privacy contact email].

Under India's Digital Personal Data Protection Act 2023 (DPDP Act), we are required to designate a Grievance Officer for data-related complaints. Grievance Officer contact: [TODO — required before publishing; not yet designated].

## 2. What we collect, and why

This section is grounded in what the app's code actually does today, not a generic template.

| Data | When it's collected | Why | Where it lives |
|---|---|---|---|
| Name, email | When you sign in (via our authentication provider, Better Auth) | To identify your account and let you return to your progress | Our database (Convex), mirrored from the auth provider |
| Birth year | The first time you open the AI Tutor tab — not required to use the rest of the app | To determine whether you're an adult or a minor, and gate AI Tutor access accordingly (see §5) | Our database, as a birth year and a computed age category — we do not otherwise collect or infer your exact age |
| UI language, target learning language, lesson progress, streaks | As you use the app | To run the product — remembering what you're learning and how far you've gotten | Our database |
| Text messages you send the AI Tutor, and its replies | When you use the AI Tutor (by typing or by speaking) | To hold a conversation and let you review past turns | Our database — retained indefinitely today; **[TODO: a data-retention/deletion policy for tutor conversation history has not yet been built into the product and needs to be decided before this can be a real commitment, not just a policy statement]** |
| Microphone audio | Only while you are actively recording a voice message to the AI Tutor (push-to-talk — recording starts and stops on your own taps) | To convert your speech to text so the tutor can reply | **Not stored.** Sent to our speech-recognition provider (see §3) for transcription and then discarded — we do not keep a copy of your voice recording on our servers. |
| Nothing about lesson audio playback | — | Lesson audio clips are pre-recorded content, not your data — listening to them doesn't send anything about you anywhere | — |

We do **not** currently collect: precise location, contacts, photos, or any payment/financial information (in-app purchases are not yet available in this version of the app).

## 3. Who we share data with

We use a small number of service providers to make the app work. None of them are permitted to use your data for their own purposes beyond providing the service to us.

| Provider | What they receive | Why |
|---|---|---|
| **Google (Gemini API)** | The text of your AI Tutor conversation (never raw audio) | To generate the tutor's replies |
| **Google Cloud Text-to-Speech** | Text of tutor replies (occasionally, as a fallback) | To convert text to spoken audio |
| **Bhashini** (a Government of India / Digital India speech AI initiative, Ministry of Electronics & IT) | Your voice recording (transcribed and immediately discarded, not retained by us), and lesson-reply text for speech synthesis | Speech-to-text and text-to-speech for Indian languages |
| **Convex** | All app data described in §2 | Our database and backend hosting provider |
| **[Better Auth's underlying sign-in provider(s) — TODO: confirm which social sign-in options are actually enabled, e.g. Google Sign-In]** | Whatever your chosen sign-in method shares (typically name, email) | Account authentication |

We do not sell your data to anyone. We do not use it for advertising.

## 4. Content generation (not your data)

Some of the app's lesson animations and audio are generated using AI tools (including fal.ai) during content authoring, before the app is ever used by learners. This process does not involve or touch any individual user's personal data — it's how we build the lesson library, not something that happens when you use the app.

## 5. Children's privacy and age gating

India's DPDP Act 2023 treats anyone under 18 as a child and requires verifiable parental consent before processing their data for many purposes.

- **All lesson content is free and open to everyone, regardless of age**, and does not require telling us your birth year.
- **The AI Tutor is different**: because it involves an ongoing conversation with a third-party AI model, we ask for your birth year the first time you try to use it. If you tell us you're under 18, the AI Tutor is not available to you yet — **[TODO: a real parental-consent flow for minors does not exist in this version of the app; until it does, under-18 users simply cannot access the AI Tutor, which is the current, deliberately conservative approach to this requirement]**.
- We rely on your own honest answer about your birth year. We do not otherwise verify age.

**[TODO — a real legal question, not an engineering one: does DPDP Act 2023 require a broader age-verification/parental-consent mechanism at ACCOUNT CREATION generally, not just at AI Tutor access, given the app may be used by children for lesson content? This needs a lawyer's read, not an assumption either way.]**

## 6. Your rights

Under the DPDP Act 2023 and applicable law, you generally have the right to access, correct, and request deletion of your personal data.

**[TODO: a self-service or supported account-deletion / data-export flow does not yet exist in the product. Until it does, this section cannot honestly promise a mechanism — either build one before launch, or this section needs to describe how to request this manually (e.g., an email process) rather than imply a button exists.]**

## 7. Data security

**[TODO: describe actual security practices honestly once they're decided/confirmed — e.g., encryption in transit, access controls on the Convex deployment. Do not include generic "bank-level security" language that isn't specifically true.]**

## 8. Changes to this policy

We may update this policy as the app changes. **[TODO: decide and state the actual notification mechanism for material changes — e.g., in-app notice, before this is a real commitment.]**

## 9. Contact

[TODO: support/privacy contact email or form]

---

### Note to whoever reviews this before publishing

Every `[TODO]` above corresponds to something this codebase either doesn't do yet (account deletion, parental consent for minors, retention limits on tutor history) or doesn't yet have a decided answer for (legal entity name, grievance officer, which sign-in providers are actually live). Publishing this policy without resolving them means either the policy overpromises what the product does, or the product needs to catch up to what the policy says — either is a real launch-blocking decision, not a copy-editing pass.
