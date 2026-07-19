import { useState } from 'react';
import { TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Box, Text, useTheme, MAX_CONTENT_WIDTH } from '@theme';
import { authClient } from '@core/auth/authClient';
import { authFormSchema, type AuthFormValues } from '../schemas/authSchema';

/**
 * Temporary auth test harness — proves the Better Auth + Convex + Expo loop
 * end to end. Replaced once the real onboarding flow and navigation shell
 * (specs/auth.md, specs/navigation-and-routing.md, both ◻) are built.
 */
export function AuthScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema(t)),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setSubmitError(null);
    const result =
      mode === 'signUp'
        ? await authClient.signUp.email({ email: values.email, password: values.password, name: values.email })
        : await authClient.signIn.email({ email: values.email, password: values.password });

    if (result.error) {
      setSubmitError(result.error.message ?? t('Auth.SUBMIT_ERROR'));
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

  if (isPending) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center">
        <ActivityIndicator color={theme.colors.primary} />
      </Box>
    );
  }

  if (session) {
    return (
      <Box flex={1} backgroundColor="background" alignItems="center" justifyContent="center" padding="l">
        <Text variant="h2" marginBottom="s">
          {t('Auth.SIGNED_IN_AS', { email: session.user.email })}
        </Text>
        <Pressable onPress={() => authClient.signOut()}>
          <Box backgroundColor="primary" paddingVertical="s" paddingHorizontal="l" borderRadius="m" marginTop="m">
            <Text variant="button">{t('Auth.SIGN_OUT_BUTTON')}</Text>
          </Box>
        </Pressable>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="background" justifyContent="center">
      <Box
        alignSelf="center"
        width="100%"
        maxWidth={MAX_CONTENT_WIDTH}
        padding={{ phone: 'l', tablet: 'xl' }}
      >
        <Text variant="h1" marginBottom="l">
          {t(mode === 'signUp' ? 'Auth.SIGN_UP_TITLE' : 'Auth.SIGN_IN_TITLE')}
        </Text>

        <Text variant="label" marginBottom="xs">
          {t('Auth.EMAIL_LABEL')}
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={inputStyle}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={theme.colors.textMuted}
            />
          )}
        />
        {errors.email && (
          <Text variant="caption" color="error" marginTop="xs">
            {errors.email.message}
          </Text>
        )}

        <Box marginTop="m">
          <Text variant="label" marginBottom="xs">
            {t('Auth.PASSWORD_LABEL')}
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                placeholderTextColor={theme.colors.textMuted}
              />
            )}
          />
          {errors.password && (
            <Text variant="caption" color="error" marginTop="xs">
              {errors.password.message}
            </Text>
          )}
        </Box>

        {submitError && (
          <Text variant="caption" color="error" marginTop="m">
            {submitError}
          </Text>
        )}

        <Pressable onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          <Box
            backgroundColor="primary"
            paddingVertical="s"
            alignItems="center"
            borderRadius="m"
            marginTop="l"
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Text variant="button">
                {t(mode === 'signUp' ? 'Auth.SIGN_UP_BUTTON' : 'Auth.SIGN_IN_BUTTON')}
              </Text>
            )}
          </Box>
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}>
          <Text variant="link" textAlign="center" marginTop="m">
            {t(mode === 'signUp' ? 'Auth.SWITCH_TO_SIGN_IN' : 'Auth.SWITCH_TO_SIGN_UP')}
          </Text>
        </Pressable>
      </Box>
    </Box>
  );
}
