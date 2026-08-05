import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@theme';
import { BottomSheet } from '@shared/components/organisms/BottomSheet';
import { LanguagePicker, type LanguageOption } from '@shared/components/molecules/LanguagePicker';
import { SettingsRow } from './SettingsRow';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface LanguageRowProps {
  icon: IoniconName;
  label: string;
  valueLabel: string;
  sheetTitle: string;
  languages: LanguageOption[] | undefined;
  onSelect: (code: string) => unknown;
}

/**
 * The condensed replacement for Profile's old per-language "card + label +
 * value + full-width secondary button that reveals an inline list" layout
 * (project-owner feedback: that reads as three stacked elements per
 * language, not one compact line). Now: a single `SettingsRow` (name +
 * chevron), and tapping it opens the SAME `LanguagePicker` molecule inside a
 * `BottomSheet` instead of inline — the picker itself is unchanged and still
 * shared with Home's/Learn's empty states (CLAUDE.md rule 3), only where it
 * renders moved.
 */
export function LanguageRow({ icon, label, valueLabel, sheetTitle, languages, onSelect }: LanguageRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SettingsRow icon={icon} label={label} value={valueLabel} onPress={() => setOpen(true)} />
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={sheetTitle}>
        <Box paddingBottom="s">
          <LanguagePicker languages={languages} onSelect={onSelect} onSelected={() => setOpen(false)} />
        </Box>
      </BottomSheet>
    </>
  );
}
