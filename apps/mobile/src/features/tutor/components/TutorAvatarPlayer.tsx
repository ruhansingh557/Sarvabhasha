import { useCallback, useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Box, Text, useTheme } from '@theme';

/** The four fal.ai-generated persona reaction loops, resolved to signed
 * Convex storage URLs — the exact shape `personaAnimations.getLiveClipsForCharacter`
 * returns. Any entry is `null` until that expression has a `live` clip. */
export interface TutorAvatarClips {
  neutral: string | null;
  happy: string | null;
  encouraging: string | null;
  thinking: string | null;
}

export type AvatarExpression = 'neutral' | 'happy' | 'encouraging' | 'thinking';
type AvatarSizeName = 'compact' | 'hero';

/** The responsive-prop-array shape Restyle expects: a value per breakpoint,
 * `wide` optional (falls back to `tablet`'s value like any Restyle prop). */
interface AvatarDimension {
  phone: number;
  tablet: number;
  wide?: number;
}

interface TutorAvatarPlayerProps {
  /** `undefined` while the query is loading, matching `useQuery`'s own
   * loading sentinel so callers can pass it straight through. */
  clips: TutorAvatarClips | undefined;
  /** One-letter fallback badge (e.g. "D" for Dadi) — used only by the static
   * placeholder circle, never as a substitute for the real reference image. */
  initial: string;
  /** Accessibility label — the persona's display name. */
  personaDisplayName: string;
  /** Which reaction loop to play right now. Defaults to `neutral` — every
   * caller that doesn't have a live signal to drive this (the compact
   * chat-header avatar, a message with no persisted `expression`) gets the
   * same idle loop it always did. Falls back to the `neutral` clip if the
   * requested expression has no `live` clip of its own yet — personas go
   * live one expression at a time (see `personaAnimations.ts`), so a persona
   * with only a `neutral` clip approved still gets SOME motion instead of
   * freezing on the placeholder mid-conversation. */
  expression?: AvatarExpression;
  /** `hero` = the large, centred voice-screen avatar. `compact` (default)
   * matches every pre-existing caller's small chat-header size. */
  size?: AvatarSizeName;
}

const AVATAR_SIZES: Record<AvatarSizeName, AvatarDimension> = {
  compact: { phone: 56, tablet: 72 },
  /**
   * The voice screen's DOMINANT visual element, not one element among
   * several — product-owner feedback on a Simulator screenshot was that the
   * previous sizing (168/224/224) read as "noticeably small" relative to the
   * centred focal area `VoiceTutor` gives it. Roughly double the on-screen
   * area of the old size at every breakpoint (~1.4x the linear dimension).
   *
   * Still deliberately capped absolute sizes, not a fraction of
   * `MAX_CONTENT_WIDTH` or a percentage — that would be wrong on a narrow
   * phone (rule 16). `wide` gets a bit more than `tablet` since a landscape
   * tablet/foldable has the width to spare, but not dramatically more: that
   * breakpoint typically has LESS height to work with than tablet portrait
   * (e.g. a 1024x768 landscape iPad), so it's checked against the same
   * budget below, not scaled up freely.
   *
   * Checked against `VoiceTutor`'s layout budget on the smallest realistic
   * target (iPhone SE-class, ~667pt tall, no home-indicator inset) with its
   * safe-area top inset, the persona/credits header row, and the
   * fixed-size `MIC_BUTTON_SIZE` (88) + its padding all subtracted: the
   * centred flex area has room for this size (plus its ~18% halo from
   * `AvatarStage` below) AND the status caption AND the last-exchange text
   * block beneath it, without either being crowded off-screen. Re-check
   * this budget on-device if the status/last-exchange copy grows longer or
   * `MIC_BUTTON_SIZE` changes.
   */
  hero: { phone: 240, tablet: 320, wide: 340 },
};

/** How much larger the decorative halo behind the hero avatar is than the
 * avatar circle itself — see `AvatarStage`. */
const AVATAR_HALO_SCALE = 1.18;
const AVATAR_HALO_OPACITY = 0.14;

/** Drop-shadow constants for the hero avatar circle. There's no shadow
 * scale in the theme (unlike spacing/radii/typography) — these are a single
 * deliberate, one-off treatment, not a pattern to reuse elsewhere without
 * reconsidering (Refactoring-UI restraint). `shadowColor` itself is NOT
 * here — it comes from `theme.colors.primary` at the call site, never a raw
 * hex, so it's warm and correctly-contrasted in both themes for free. */
const AVATAR_SHADOW_OFFSET = { width: 0, height: 6 };
const AVATAR_SHADOW_OPACITY = 0.32;
const AVATAR_SHADOW_RADIUS = 18;
const AVATAR_ELEVATION = 10;

function scaleDimension(dimension: AvatarDimension, factor: number): AvatarDimension {
  return {
    phone: Math.round(dimension.phone * factor),
    tablet: Math.round(dimension.tablet * factor),
    ...(dimension.wide !== undefined ? { wide: Math.round(dimension.wide * factor) } : {}),
  };
}

/**
 * Wraps the hero avatar's circle with the "eye candy" the product owner
 * asked for after seeing a plain flat circle in the Simulator: a soft warm
 * halo behind it (a low-opacity `primary` disc ~18% larger than the avatar —
 * reads as a glow without a gradient/blur dependency this repo doesn't
 * have), plus a drop shadow ON the circle itself for depth. Both are
 * sourced from the `primary` token only — never a raw hex — so the
 * glow/shadow stays warm and readable in both `lightTheme` and `darkTheme`
 * automatically (rules 1, 2): `primary` flips from saffron500 to the
 * lighter saffron400 in dark mode, so on a near-black `background`/`surface`
 * this renders as a visible warm glow rather than disappearing.
 *
 * The shadow deliberately lives on a plain (non-clipping) Box wrapping the
 * actual content, not on the content itself: `AvatarVideo`'s circle needs
 * `overflow: hidden` to mask the rectangular video into a circle, and a
 * view cannot cast a shadow past its own clipped bounds — so the shadow has
 * to sit one level above any clipping, or it silently disappears.
 *
 * Scoped to the `hero` size only (see the call site in `TutorAvatarPlayer`):
 * the small chat-header badge keeps its existing flat look. This treatment
 * was asked for on the voice screen's large focal avatar specifically, and
 * a halo would visually compete with the tight chat-header row it wasn't
 * designed for.
 */
function AvatarStage({ dimension, children }: { dimension: AvatarDimension; children: ReactNode }) {
  const theme = useTheme();
  const haloDimension = scaleDimension(dimension, AVATAR_HALO_SCALE);

  return (
    <Box width={haloDimension} height={haloDimension} alignItems="center" justifyContent="center">
      <Box
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        right={0}
        borderRadius="round"
        backgroundColor="primary"
        opacity={AVATAR_HALO_OPACITY}
      />
      <Box
        width={dimension}
        height={dimension}
        borderRadius="round"
        style={{
          shadowColor: theme.colors.primary,
          shadowOffset: AVATAR_SHADOW_OFFSET,
          shadowOpacity: AVATAR_SHADOW_OPACITY,
          shadowRadius: AVATAR_SHADOW_RADIUS,
          elevation: AVATAR_ELEVATION,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

/**
 * The tutor's persona avatar — the small chat-header badge AND the large
 * voice-screen hero avatar are the same component at two sizes, not two
 * components, so a future expression/clip fix only has one place to land.
 *
 * Plays the requested expression's looping reaction clip when a `live` one
 * exists (same `expo-video` shape as `PhraseAnimationPlayer` — loop, muted,
 * focus-gated play/pause); falls back to a static initial badge with a
 * subtle breathing pulse (Reanimated) when NO clip is live for this persona
 * yet at all (neither the requested expression nor the `neutral` fallback).
 */
export function TutorAvatarPlayer({
  clips,
  initial,
  personaDisplayName,
  expression = 'neutral',
  size = 'compact',
}: TutorAvatarPlayerProps) {
  const clipUrl = clips?.[expression] ?? clips?.neutral ?? null;
  const dimension = AVATAR_SIZES[size];
  const isHero = size === 'hero';

  // Keyed by URL: switching expression (or the underlying clip changing)
  // mounts a fresh `expo-video` player for the new source rather than
  // relying on the hook reacting to a changed source argument in place —
  // expression changes are infrequent (at most once per assistant reply),
  // so the small re-init cost is not worth the uncertainty of the other
  // approach.
  const content = clipUrl ? (
    <AvatarVideo
      key={clipUrl}
      clipUrl={clipUrl}
      personaDisplayName={personaDisplayName}
      dimension={dimension}
    />
  ) : (
    <AvatarBreathingPlaceholder
      initial={initial}
      personaDisplayName={personaDisplayName}
      dimension={dimension}
    />
  );

  // Halo + shadow apply to both branches identically (via the shared
  // wrapper) so the polish is consistent whether or not a live clip exists
  // for the current expression — see `AvatarStage`.
  return isHero ? <AvatarStage dimension={dimension}>{content}</AvatarStage> : content;
}

function AvatarVideo({
  clipUrl,
  personaDisplayName,
  dimension,
}: {
  clipUrl: string;
  personaDisplayName: string;
  dimension: AvatarDimension;
}) {
  const theme = useTheme();
  const player = useVideoPlayer(clipUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useFocusEffect(
    useCallback(() => {
      player.play();
      return () => {
        try {
          player.pause();
        } catch {
          // Native player already released — same best-effort cleanup as
          // PhraseAnimationPlayer.
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player]),
  );

  return (
    <Box
      width={dimension}
      height={dimension}
      borderRadius="round"
      overflow="hidden"
      backgroundColor="surface"
      accessibilityLabel={personaDisplayName}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {status === 'loading' ? (
        <Box
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          alignItems="center"
          justifyContent="center"
          backgroundColor="surface"
        >
          <ActivityIndicator color={theme.colors.primary} />
        </Box>
      ) : null}
    </Box>
  );
}

function AvatarBreathingPlaceholder({
  initial,
  personaDisplayName,
  dimension,
}: {
  initial: string;
  personaDisplayName: string;
  dimension: AvatarDimension;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // The hero size is several times the compact badge — a "D" rendered at
  // `h2`'s 22px would read as a tiny mark lost in a 240pt+ circle. Uses the
  // theme's single largest variant (`hero`, 40px) rather than `display`
  // (32px): the avatar circle got substantially bigger, so the fallback
  // initial has to scale up with it or it under-fills the same way the old
  // `display` choice was tuned to avoid at the old, smaller circle size
  // (Refactoring-UI: hierarchy has to scale WITH the container).
  const textVariant = dimension.phone > 100 ? 'hero' : 'h2';

  return (
    <Animated.View style={animatedStyle}>
      <Box
        width={dimension}
        height={dimension}
        borderRadius="round"
        backgroundColor="primary"
        alignItems="center"
        justifyContent="center"
        accessibilityLabel={personaDisplayName}
      >
        <Text variant={textVariant} color="textInverse">
          {initial}
        </Text>
      </Box>
    </Animated.View>
  );
}
