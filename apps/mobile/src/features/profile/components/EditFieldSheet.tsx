import { useEffect, useState } from 'react';
import { TextInput, type KeyboardTypeOptions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { Box, Text, useTheme } from '@theme';
import { BottomSheet } from '@shared/components/organisms/BottomSheet';
import { Button } from '@shared/components/atoms/Button';

interface EditFieldSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  label: string;
  /** Re-seeds the form whenever the sheet opens — see the effect below. */
  defaultValue: string;
  schema: ZodType<{ value: string }>;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  placeholder?: string;
  saveLabel: string;
  genericErrorMessage: string;
  onSubmit: (value: string) => Promise<void>;
}

/**
 * One reusable "edit a single text field inside a bottom sheet" flow. Name
 * and birth year both need exactly this shape (label + input + validate +
 * save), so it's built once here rather than as two near-identical files
 * (CLAUDE.md rule 3). Same react-hook-form + zod + inline-`TextInput`
 * pattern already established by `AuthScreen` / `BirthYearGate` — no new
 * form primitive invented, just reused inside a sheet instead of a full
 * screen.
 */
export function EditFieldSheet({
  visible,
  onClose,
  title,
  label,
  defaultValue,
  schema,
  keyboardType = 'default',
  maxLength,
  placeholder,
  saveLabel,
  genericErrorMessage,
  onSubmit,
}: EditFieldSheetProps) {
  const theme = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ value: string }>({
    resolver: zodResolver(schema),
    defaultValues: { value: defaultValue },
  });

  // `useForm`'s `defaultValues` only apply once, at mount — this component
  // stays mounted across open/close (the parent just toggles `visible`), so
  // without re-seeding here the field would go stale after the first edit,
  // or on reopen after some other action changed the underlying value.
  useEffect(() => {
    if (visible) {
      reset({ value: defaultValue });
      setSubmitError(null);
    }
  }, [visible, defaultValue, reset]);

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await onSubmit(values.value.trim());
      onClose();
    } catch {
      setSubmitError(genericErrorMessage);
    }
  });

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
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <Text variant="label" marginBottom="xs">
        {label}
      </Text>
      <Controller
        control={control}
        name="value"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={inputStyle}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={keyboardType}
            maxLength={maxLength}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
        )}
      />
      {errors.value ? (
        <Text variant="caption" color="error" marginTop="xs">
          {errors.value.message}
        </Text>
      ) : null}
      {submitError ? (
        <Text variant="caption" color="error" marginTop="m">
          {submitError}
        </Text>
      ) : null}
      <Box marginTop="l">
        <Button onPress={submit} loading={isSubmitting}>
          {saveLabel}
        </Button>
      </Box>
    </BottomSheet>
  );
}
