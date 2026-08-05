import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Box, Text, type Theme } from '@theme';

/**
 * One-time, in-memory cold-launch flourish: a handful of letters from
 * different Indian scripts fly in from off-screen, converge toward the
 * centre, dissolve, and resolve into the "Sarvabhasha" wordmark — the app's
 * name literally means "all languages", so genuinely different scripts
 * flying together into one word is the theme, not just decoration.
 *
 * Mounted once by `RootNavigator` as a full-bleed overlay drawn ON TOP of
 * the real auth-check / tab-shell flow underneath, never in place of it —
 * see that file for why. `onFinish` fires once, after the sequence (or the
 * reduced-motion static fallback) completes; the caller unmounts this
 * component in response.
 */

type LetterColorToken = keyof Pick<Theme['colors'], 'textPrimary' | 'primary' | 'accent'>;

/**
 * One real glyph per script — the same "a" vowel sound across 9 different
 * Indian scripts, sourced from the first vowel row of each script's real
 * character set in `packages/backend/scripts/phase13/data.ts`
 * (DEVANAGARI_CHARACTERS[0], BENGALI_CHARACTERS[0], TAMIL_CHARACTERS[0],
 * TELUGU_CHARACTERS[0], KANNADA_CHARACTERS[0], GUJARATI_CHARACTERS[0],
 * GURMUKHI_CHARACTERS[0], MALAYALAM_CHARACTERS[0], URDU_CHARACTERS[0]) — not
 * invented. Copied here rather than imported: that module lives under a
 * backend authoring script directory, not a package meant to be bundled into
 * the mobile app, and this UI layer must not reach into it (see CLAUDE.md
 * rule 9 — the UI layer doesn't own data logic, and this isn't lesson
 * content either, just a decorative brand moment).
 */
const SCRIPT_LETTERS: ReadonlyArray<{ glyph: string; colorToken: LetterColorToken }> = [
  { glyph: 'अ', colorToken: 'textPrimary' }, // Devanagari
  { glyph: 'অ', colorToken: 'primary' }, // Bengali
  { glyph: 'அ', colorToken: 'accent' }, // Tamil
  { glyph: 'అ', colorToken: 'textPrimary' }, // Telugu
  { glyph: 'ಅ', colorToken: 'primary' }, // Kannada
  { glyph: 'અ', colorToken: 'accent' }, // Gujarati
  { glyph: 'ਅ', colorToken: 'textPrimary' }, // Gurmukhi
  { glyph: 'അ', colorToken: 'primary' }, // Malayalam
  { glyph: 'ا', colorToken: 'accent' }, // Urdu (alif)
];

// ---- Timeline constants (ms). Every derived value is computed from these,
// never re-hardcoded, so the whole sequence stays internally consistent if
// the letter count or a single duration changes. ----
const STAGGER_MS = 70;
const FLIGHT_DURATION_MS = 550;
const FLIGHT_HOLD_MS = 150;
const LETTERS_FADE_OUT_MS = 350;
const WORDMARK_LEAD_MS = 100;
const WORDMARK_FADE_MS = 400;
const WORDMARK_HOLD_MS = 650;
const REDUCED_WORDMARK_FADE_MS = 350;
const REDUCED_WORDMARK_HOLD_MS = 650;
const FINISH_BUFFER_MS = 100;

const LAST_LETTER_ARRIVAL_MS = (SCRIPT_LETTERS.length - 1) * STAGGER_MS + FLIGHT_DURATION_MS;
const FADE_OUT_START_MS = LAST_LETTER_ARRIVAL_MS + FLIGHT_HOLD_MS;
const WORDMARK_START_MS = FADE_OUT_START_MS - WORDMARK_LEAD_MS;
const TOTAL_DURATION_MS =
  WORDMARK_START_MS + WORDMARK_FADE_MS + WORDMARK_HOLD_MS + FINISH_BUFFER_MS;
const REDUCED_TOTAL_DURATION_MS =
  REDUCED_WORDMARK_FADE_MS + REDUCED_WORDMARK_HOLD_MS + FINISH_BUFFER_MS;

interface FlyingLetterPlan {
  glyph: string;
  colorToken: LetterColorToken;
  delayMs: number;
  startX: number;
  startY: number;
  startRotateDeg: number;
  ringX: number;
  ringY: number;
  settleRotateDeg: number;
}

/** Deterministic per-letter start edge / target ring / rotation, derived
 * from the window size (never `Dimensions.get()` at module scope — this
 * runs inside the component, fed by `useWindowDimensions`) so it adapts to
 * phone, tablet, and rotation. */
function buildLetterPlans(width: number, height: number): FlyingLetterPlan[] {
  const total = SCRIPT_LETTERS.length;
  const ringRadius = Math.min(width, height) * 0.14;
  const edgeMargin = 70;

  return SCRIPT_LETTERS.map((letter, index) => {
    const fraction = total > 1 ? index / (total - 1) : 0.5;
    const edge = index % 4; // 0 top, 1 right, 2 bottom, 3 left
    let startX = 0;
    let startY = 0;
    if (edge === 0) {
      startX = (fraction - 0.5) * width * 0.85;
      startY = -(height / 2 + edgeMargin);
    } else if (edge === 1) {
      startX = width / 2 + edgeMargin;
      startY = (fraction - 0.5) * height * 0.65;
    } else if (edge === 2) {
      startX = (fraction - 0.5) * width * 0.85;
      startY = height / 2 + edgeMargin;
    } else {
      startX = -(width / 2 + edgeMargin);
      startY = (fraction - 0.5) * height * 0.65;
    }

    const angle = (index / total) * Math.PI * 2;
    const sign = index % 2 === 0 ? 1 : -1;

    return {
      glyph: letter.glyph,
      colorToken: letter.colorToken,
      delayMs: index * STAGGER_MS,
      startX,
      startY,
      startRotateDeg: sign * (40 + ((index * 8) % 40)),
      ringX: ringRadius * Math.cos(angle),
      ringY: ringRadius * Math.sin(angle),
      settleRotateDeg: sign * ((index % 3) * 3),
    };
  });
}

export function IntroSequence({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduceMotion(enabled);
      })
      .catch(() => {
        if (!cancelled) setReduceMotion(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    const duration = reduceMotion ? REDUCED_TOTAL_DURATION_MS : TOTAL_DURATION_MS;
    const timer = setTimeout(onFinish, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const letterPlans = useMemo(() => buildLetterPlans(width, height), [width, height]);

  // Nothing rendered until the reduced-motion check resolves, so a user with
  // that setting on never sees even one frame of the flying-letters version.
  if (reduceMotion === null) {
    return <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="background" />;
  }

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="background"
      alignItems="center"
      justifyContent="center"
      style={styles.overlay}
      accessible
      accessibilityLabel={t('Intro.ACCESSIBILITY_LABEL')}
    >
      {reduceMotion ? (
        <Wordmark startDelayMs={0} fadeMs={REDUCED_WORDMARK_FADE_MS} animateScale={false} label={t('Intro.WORDMARK')} />
      ) : (
        <>
          {letterPlans.map((plan, index) => (
            <FlyingLetter key={`${plan.glyph}-${index}`} plan={plan} />
          ))}
          <Wordmark
            startDelayMs={WORDMARK_START_MS}
            fadeMs={WORDMARK_FADE_MS}
            animateScale
            label={t('Intro.WORDMARK')}
          />
        </>
      )}
    </Box>
  );
}

function FlyingLetter({ plan }: { plan: FlyingLetterPlan }) {
  const translateX = useSharedValue(plan.startX);
  const translateY = useSharedValue(plan.startY);
  const rotate = useSharedValue(plan.startRotateDeg);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    const holdRemaining = Math.max(
      FADE_OUT_START_MS - plan.delayMs - FLIGHT_DURATION_MS,
      0,
    );
    const flightEasing = Easing.out(Easing.cubic);

    translateX.value = withDelay(
      plan.delayMs,
      withSequence(
        withTiming(plan.ringX, { duration: FLIGHT_DURATION_MS, easing: flightEasing }),
        withDelay(holdRemaining, withTiming(0, { duration: LETTERS_FADE_OUT_MS, easing: Easing.in(Easing.cubic) })),
      ),
    );
    translateY.value = withDelay(
      plan.delayMs,
      withSequence(
        withTiming(plan.ringY, { duration: FLIGHT_DURATION_MS, easing: flightEasing }),
        withDelay(holdRemaining, withTiming(0, { duration: LETTERS_FADE_OUT_MS, easing: Easing.in(Easing.cubic) })),
      ),
    );
    rotate.value = withDelay(
      plan.delayMs,
      withTiming(plan.settleRotateDeg, { duration: FLIGHT_DURATION_MS, easing: flightEasing }),
    );
    opacity.value = withDelay(
      plan.delayMs,
      withSequence(
        withTiming(1, { duration: Math.min(250, FLIGHT_DURATION_MS) }),
        withDelay(
          Math.max(holdRemaining - Math.min(250, FLIGHT_DURATION_MS), 0),
          withTiming(0, { duration: LETTERS_FADE_OUT_MS }),
        ),
      ),
    );
    scale.value = withDelay(
      plan.delayMs,
      withSequence(
        withTiming(1, { duration: FLIGHT_DURATION_MS, easing: Easing.out(Easing.back(1.4)) }),
        withDelay(holdRemaining, withTiming(0.6, { duration: LETTERS_FADE_OUT_MS })),
      ),
    );
    // Fire-once flight plan per mount — `plan` is a stable object built by
    // `buildLetterPlans` and doesn't need to retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.letterAnchor, animatedStyle]} accessible={false}>
      <Text variant="hero" color={plan.colorToken}>
        {plan.glyph}
      </Text>
    </Animated.View>
  );
}

function Wordmark({
  startDelayMs,
  fadeMs,
  animateScale,
  label,
}: {
  startDelayMs: number;
  fadeMs: number;
  animateScale: boolean;
  label: string;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(animateScale ? 0.9 : 1);

  useEffect(() => {
    opacity.value = withDelay(startDelayMs, withTiming(1, { duration: fadeMs, easing: Easing.out(Easing.cubic) }));
    if (animateScale) {
      scale.value = withDelay(startDelayMs, withTiming(1, { duration: fadeMs, easing: Easing.out(Easing.cubic) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wordmarkAnchor, animatedStyle]} accessible={false}>
      <Text variant="hero" color="primary">
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 10,
    elevation: 10,
  },
  // Every flying letter and the wordmark share this single absolutely
  // positioned anchor point at the centre of the (flex-centred) overlay —
  // their Reanimated transform then offsets each one away from / back to
  // that shared centre, so no manual percentage/margin centring math is
  // needed (see `buildLetterPlans`).
  letterAnchor: {
    position: 'absolute',
  },
  wordmarkAnchor: {
    position: 'absolute',
  },
});
