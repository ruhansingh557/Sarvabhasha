import { useState } from 'react';
import { TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'convex/react';
import { api } from '@backend/_generated/api';
import { Box, Text, useTheme } from '@theme';
import { Screen } from '@shared/components/atoms/Screen';
import { Button } from '@shared/components/atoms/Button';
import { birthYearFormSchema, type BirthYearFormValues } from '../schemas/birthYearSchema';

/**
 * The tutor's minimal age gate — see specs/ai-tutor.md's "Age gating as a
 * hard precondition" section: a full onboarding/consent redesign was pulled
 * back to phase 8; this is a birth-year prompt surfaced the first time the
 * Tutor tab is opened, following phase 3's precedent of a tab-triggered CTA.
 * Same `react-hook-form` + `zod` + inline `TextInput` pattern as
 * `AuthScreen` — no new form primitive invented for a single field.
 *
 * On success, `users.setBirthYear` resolves `ageBand`; the parent
 * `TutorScreen`'s `getCurrentUser` query re-renders reactively into the
 * chat or the parental-consent notice — this component has no "success"
 * state of its own to manage.
 */
export function BirthYearGate() {
  const { t } = useTranslation();
  const theme = useTheme();
  const setBirthYear = useMutation(api.users.setBirthYear);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BirthYearFormValues>({
    resolver: zodResolver(birthYearFormSchema(t)),
    defaultValues: { birthYear: '' },
  });

  const onSubmit = async (values: BirthYearFormValues) => {
    setSubmitError(null);
    try {
      await setBirthYear({ birthYear: Number(values.birthYear) });
    } catch {
      setSubmitError(t('Tutor.BIRTH_YEAR_SUBMIT_ERROR'));
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadii.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    color: theme.colors.textPrimary,
    fontSize: 16,
  };

  return (
    <Screen scroll>
      <Box flex={1} justifyContent="center">
        <Text variant="h1" marginBottom="s">
          {t('Tutor.AGE_GATE_TITLE')}
        </Text>
        <Text variant="body" color="textSecondary" marginBottom="l">
          {t('Tutor.AGE_GATE_BODY')}
        </Text>

        <Text variant="label" marginBottom="xs">
          {t('Tutor.BIRTH_YEAR_LABEL')}
        </Text>
        <Controller
          control={control}
          name="birthYear"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={inputStyle}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              maxLength={4}
              placeholder={t('Tutor.BIRTH_YEAR_PLACEHOLDER')}
              placeholderTextColor={theme.colors.textMuted}
            />
          )}
        />
        {errors.birthYear ? (
          <Text variant="caption" color="error" marginTop="xs">
            {errors.birthYear.message}
          </Text>
        ) : null}

        {submitError ? (
          <Text variant="caption" color="error" marginTop="m">
            {submitError}
          </Text>
        ) : null}

        <Box marginTop="l">
          <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
            {t('Tutor.BIRTH_YEAR_SUBMIT_BUTTON')}
          </Button>
        </Box>
      </Box>
    </Screen>
  );
}
