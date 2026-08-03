import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { LanguagePicker } from '@shared/components/molecules/LanguagePicker';
import { BirthYearGate } from '../components/BirthYearGate';
import { ParentalConsentNotice } from '../components/ParentalConsentNotice';
import { TutorConversation } from '../components/TutorConversation';

/**
 * Tutor tab root. See specs/ai-tutor.md for the full behavior this wires up.
 *
 * Branches on `getCurrentUser().ageBand`, mirroring `tutor.ts`'s own
 * `assertAdult` gate on the client side so the learner sees the right
 * screen up front instead of a rejected `startSession` call:
 *
 *   unknown -> BirthYearGate (self-declare, then re-render reactively)
 *   minor   -> ParentalConsentNotice (hard stop, no workaround)
 *   adult, no targetLanguage yet -> inline LanguagePicker, same empty-state
 *             molecule Home/Learn already use (CLAUDE.md rule 3)
 *   adult, has targetLanguage -> TutorConversation (voice-primary, with a
 *             "Type instead" fallback — see specs/ai-tutor.md)
 */
export function TutorScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const user = useQuery(api.users.getCurrentUser);
  const targetLanguages = useQuery(api.languages.listLiveLanguages);
  const setTargetLanguage = useMutation(api.users.setTargetLanguage);

  if (user === undefined) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  // `null` covers "no session" (shouldn't reach this tab — RootNavigator
  // gates on session before the tab shell mounts) and "row not yet ensured".
  // Treated the same as `ageBand: 'unknown'`: the birth-year form is safe to
  // show either way, since submitting it requires only an authenticated
  // session, which this tab already guarantees.
  if (user === null || user.ageBand === 'unknown') {
    return <BirthYearGate />;
  }

  if (user.ageBand === 'minor') {
    return <ParentalConsentNotice />;
  }

  if (!user.targetLanguage) {
    return (
      <Screen scroll>
        <Box flex={1} justifyContent="center">
          <Text variant="h1" marginBottom="s">
            {t('Tutor.NEEDS_TARGET_LANGUAGE_TITLE')}
          </Text>
          <Text variant="body" color="textSecondary" marginBottom="l">
            {t('Tutor.NEEDS_TARGET_LANGUAGE_BODY')}
          </Text>
          <LanguagePicker
            languages={targetLanguages}
            onSelect={(code) => setTargetLanguage({ languageCode: code })}
          />
        </Box>
      </Screen>
    );
  }

  return <TutorConversation targetLanguage={user.targetLanguage} />;
}
