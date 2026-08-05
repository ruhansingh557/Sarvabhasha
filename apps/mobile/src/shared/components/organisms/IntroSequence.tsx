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
 * different Indian scripts fly in slowly from off-screen and gather briefly
 * near the centre. While they're still visibly mid-flight, the
 * "Sarvabhasha" wordmark starts fading in — a genuine overlap, not a
 * hand-off. The letters then keep moving, diverging outward and exiting off
 * the left/right edges of the screen, leaving the wordmark alone on screen
 * to hold briefly before the sequence ends. The app's name literally means
 * "all languages", so genuinely different scripts flying together — and
 * then apart again — around one word is the theme, not just decoration.
 *
 * Every element rotates in genuine 3D, not a flat 2D spin: a `rotateY`
 * (a real Y-axis, card-flip-style sideways turn) paired with a `perspective`
 * value in the same transform array, so the foreshortening actually reads as
 * depth. The flying letters use it on both entrance and exit, and the
 * wordmark enters the same way — one shared rotate-with-depth motion
 * language across every element, not a flatter effect for the wordmark.
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
const STAGGER_MS = 70; // gap between each letter's flight start
const FLIGHT_DURATION_MS = 1700; // slow, deliberate flight-in (product ask: 1.5-2.5s, not a snap)
const WORDMARK_START_FRACTION = 0.45; // wordmark starts fading in this far into a single letter's flight — with STAGGER_MS this guarantees every letter has started moving, and none has arrived yet, so the overlap is real, not a hand-off
const GATHER_HOLD_MS = 100; // brief hold at the gather point once the last letter arrives, before the synchronized exit begins
const EXIT_DURATION_MS = 500; // continued-motion exit off the left/right edges — replaces the old fade-in-place
const WORDMARK_FADE_MS = 750;
const WORDMARK_HOLD_MS = 550;
const REDUCED_WORDMARK_FADE_MS = 350;
const REDUCED_WORDMARK_HOLD_MS = 650;
const FINISH_BUFFER_MS = 100;

// Shared 3D perspective depth for every rotateY in the sequence — the
// letters (in and out) and the wordmark's own entrance all use this same
// value so the "sideways card-flip" reads as one consistent effect rather
// than several different ones.
const ROTATE_PERSPECTIVE = 800;
// How far from face-on the wordmark starts before rotating in to 0deg —
// the same kind of card-flip entrance the letters use, not a plain fade.
const WORDMARK_ROTATE_Y_START_DEG = 110;

const LAST_LETTER_ARRIVAL_MS = (SCRIPT_LETTERS.length - 1) * STAGGER_MS + FLIGHT_DURATION_MS;
const WORDMARK_START_MS = Math.round(FLIGHT_DURATION_MS * WORDMARK_START_FRACTION);
const EXIT_START_MS = LAST_LETTER_ARRIVAL_MS + GATHER_HOLD_MS;
const EXIT_END_MS = EXIT_START_MS + EXIT_DURATION_MS;
const WORDMARK_FADE_END_MS = WORDMARK_START_MS + WORDMARK_FADE_MS;
const TOTAL_DURATION_MS = Math.max(EXIT_END_MS, WORDMARK_FADE_END_MS) + WORDMARK_HOLD_MS + FINISH_BUFFER_MS;
const REDUCED_TOTAL_DURATION_MS =
  REDUCED_WORDMARK_FADE_MS + REDUCED_WORDMARK_HOLD_MS + FINISH_BUFFER_MS;

interface FlyingLetterPlan {
  glyph: string;
  colorToken: LetterColorToken;
  delayMs: number;
  startX: number;
  startY: number;
  startRotateYDeg: number;
  ringX: number;
  ringY: number;
  settleRotateYDeg: number;
  exitX: number;
  exitRotateYDeg: number;
}

/** Deterministic per-letter start edge / gather point / exit edge, derived
 * from the window size (never `Dimensions.get()` at module scope — this
 * runs inside the component, fed by `useWindowDimensions`) so it adapts to
 * phone, tablet, and rotation. Each letter enters from one of the four
 * screen edges, gathers briefly near the centre, then keeps moving and
 * exits via whichever side (left/right) its gather position already leans
 * toward — a continued-motion divergence, not a fade in place. */
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
    const ringX = ringRadius * Math.cos(angle);
    // Exit side follows the letter's own gather position (whichever side of
    // centre it already leans toward) rather than a fixed alternation, so
    // the divergence reads as outward-continued motion instead of a coin
    // flip. Ties (ringX === 0) fall back to alternating by index.
    const exitSign = ringX !== 0 ? Math.sign(ringX) : sign;

    // rotateY plan: a real card-flip arc, not a subtle tilt — letters spin
    // through a wide sideways angle while flying in, settle to a small resting
    // tilt at the gather point, then keep spinning further in the same
    // direction as they diverge off-screen on exit.
    const settleRotateYDeg = sign * (6 + (index % 3) * 4);

    return {
      glyph: letter.glyph,
      colorToken: letter.colorToken,
      delayMs: index * STAGGER_MS,
      startX,
      startY,
      startRotateYDeg: sign * (100 + ((index * 11) % 40)),
      ringX,
      ringY: ringRadius * Math.sin(angle),
      settleRotateYDeg,
      exitX: exitSign * (width / 2 + edgeMargin * 2),
      exitRotateYDeg: settleRotateYDeg + exitSign * (110 + (index % 2) * 20),
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
            rotateYStartDeg={WORDMARK_ROTATE_Y_START_DEG}
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
  const rotateY = useSharedValue(plan.startRotateYDeg);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    // How long this letter waits at the gather point after its own arrival
    // so that every letter — regardless of stagger — begins its exit at the
    // same shared moment, EXIT_START_MS.
    const holdRemaining = Math.max(EXIT_START_MS - plan.delayMs - FLIGHT_DURATION_MS, 0);
    const flightEasing = Easing.out(Easing.cubic);
    // NOT Easing.in: an ease-in curve is nearly stationary for most of its
    // duration and dumps all the travel into its last sliver, which reads as
    // a pop/vanish rather than a glide. Easing.out front-loads the motion —
    // the letter is visibly moving for the whole EXIT_DURATION_MS window,
    // matching the flight-in's own easing so the exit reads as the same
    // motion continuing outward, not a different animation taking over.
    const exitEasing = Easing.out(Easing.cubic);

    translateX.value = withDelay(
      plan.delayMs,
      withSequence(
        withTiming(plan.ringX, { duration: FLIGHT_DURATION_MS, easing: flightEasing }),
        withDelay(holdRemaining, withTiming(plan.exitX, { duration: EXIT_DURATION_MS, easing: exitEasing })),
      ),
    );
    // Y only animates through the flight-in; the exit is a lateral
    // divergence off the left/right edges, not a further vertical move.
    translateY.value = withDelay(
      plan.delayMs,
      withTiming(plan.ringY, { duration: FLIGHT_DURATION_MS, easing: flightEasing }),
    );
    // A real Y-axis card-flip, not a flat Z-axis spin — combined with
    // `perspective` in the transform below, this reads as genuine 3D
    // sideways rotation while the letter is flying, both in and out.
    rotateY.value = withDelay(
      plan.delayMs,
      withSequence(
        withTiming(plan.settleRotateYDeg, { duration: FLIGHT_DURATION_MS, easing: flightEasing }),
        withDelay(holdRemaining, withTiming(plan.exitRotateYDeg, { duration: EXIT_DURATION_MS, easing: exitEasing })),
      ),
    );
    // Letters fade in on arrival and then stay fully opaque — they leave the
    // scene by moving off-screen during the exit, never by fading in place.
    opacity.value = withDelay(plan.delayMs, withTiming(1, { duration: Math.min(250, FLIGHT_DURATION_MS) }));
    scale.value = withDelay(
      plan.delayMs,
      withTiming(1, { duration: FLIGHT_DURATION_MS, easing: Easing.out(Easing.back(1.4)) }),
    );
    // Fire-once flight plan per mount — `plan` is a stable object built by
    // `buildLetterPlans` and doesn't need to retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    // `perspective` must precede `rotateY` in the transform array — order
    // matters — for the rotation to project as foreshortened depth instead
    // of a flat rotation.
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { perspective: ROTATE_PERSPECTIVE },
      { rotateY: `${rotateY.value}deg` },
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
  rotateYStartDeg,
  label,
}: {
  startDelayMs: number;
  fadeMs: number;
  animateScale: boolean;
  /** When set, the wordmark rotates in from this Y-axis angle to 0deg over
   * `fadeMs` — the same card-flip-with-perspective entrance the flying
   * letters use, instead of a plain fade. Left undefined for the
   * reduced-motion fallback, which must stay an unrotated static fade. */
  rotateYStartDeg?: number;
  label: string;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(animateScale ? 0.9 : 1);
  const rotateY = useSharedValue(rotateYStartDeg ?? 0);

  useEffect(() => {
    opacity.value = withDelay(startDelayMs, withTiming(1, { duration: fadeMs, easing: Easing.out(Easing.cubic) }));
    if (animateScale) {
      scale.value = withDelay(startDelayMs, withTiming(1, { duration: fadeMs, easing: Easing.out(Easing.cubic) }));
    }
    if (rotateYStartDeg !== undefined) {
      rotateY.value = withDelay(startDelayMs, withTiming(0, { duration: fadeMs, easing: Easing.out(Easing.cubic) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    // Same perspective-before-rotateY ordering as the flying letters, so the
    // wordmark's entrance reads as the same 3D motion, not a flatter effect.
    transform: [{ scale: scale.value }, { perspective: ROTATE_PERSPECTIVE }, { rotateY: `${rotateY.value}deg` }],
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
