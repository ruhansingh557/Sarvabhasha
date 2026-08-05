import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Box, Text, useTheme, MAX_CONTENT_WIDTH } from '@theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Optional heading rendered above `children`, inside the sheet panel. */
  title?: string;
  children: ReactNode;
}

const ANIMATION_MS = 240;
const ENTER_OFFSET_PX = 320;

/**
 * A themed modal bottom sheet — dimmed backdrop (tap to dismiss) behind a
 * `surface`-colored panel that slides up from the bottom, rounded top
 * corners, a drag-handle affordance, safe-area-aware bottom padding, and
 * centred with a max width on tablet/wide (CLAUDE.md rule 16 — a sheet
 * stretched full-bleed at 1024px reads broken, not like tablet support).
 *
 * This is the compact "tap a row, change/edit something inline" mechanism
 * the Profile redesign needed instead of a permanently-visible CTA button
 * per row (project-owner feedback) — genuinely reusable beyond Profile, so
 * it lives in `shared/organisms` rather than a feature folder (rule 3/6).
 * First consumers: Profile's language pickers and name/birth-year editors.
 *
 * Deliberately does NOT use a third-party bottom-sheet library — this repo
 * already has `react-native-reanimated` as a dependency (used by
 * `IntroSequence`/`TutorAvatarPlayer`) and RN's own `Modal` covers the
 * backdrop + focus-trap + Android back-button behaviour, so a small
 * purpose-built component avoids an extra dependency for what's a fairly
 * standard slide-up-panel effect.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Stays mounted slightly past `visible: false` so the closing animation
  // can finish before the `Modal` (and its children) actually unmount.
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: ANIMATION_MS });
    } else {
      progress.value = withTiming(0, { duration: ANIMATION_MS }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * ENTER_OFFSET_PX }],
  }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }, backdropStyle]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('Common.DISMISS_SHEET')}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoider}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.panelWrapper, panelStyle]}>
          <Box
            backgroundColor="surface"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            paddingHorizontal="l"
            paddingTop="s"
            style={{
              paddingBottom: insets.bottom + theme.spacing.l,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 1,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <Box alignItems="center" marginBottom="m">
              <Box width={36} height={4} borderRadius="round" backgroundColor="border" />
            </Box>
            {title ? (
              <Text variant="h3" marginBottom="m">
                {title}
              </Text>
            ) : null}
            <ScrollView
              style={{ maxHeight: windowHeight * 0.6 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Box>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avoider: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  panelWrapper: { width: '100%', maxWidth: MAX_CONTENT_WIDTH },
});
