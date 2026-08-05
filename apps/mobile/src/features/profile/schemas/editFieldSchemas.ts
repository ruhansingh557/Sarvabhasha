import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Both schemas below resolve to the same `{ value: string }` shape that
 * `EditFieldSheet` is generic over — one text field, validated, then handed
 * back to the caller as a raw string (the caller owns converting to a
 * number for birth year, matching how it owns which Convex mutation runs).
 */

export const nameFieldSchema = (t: TFunction) =>
  z.object({
    value: z.string().trim().min(1, t('Profile.NAME_REQUIRED')).max(100, t('Profile.NAME_TOO_LONG')),
  });

export type NameFieldValues = z.infer<ReturnType<typeof nameFieldSchema>>;

/**
 * Mirrors the range `users.setBirthYear` enforces server-side (1900..current
 * year) — a client-side nicety, not the real gate, same as
 * `features/tutor/schemas/birthYearSchema.ts`. Kept as Profile's own copy
 * rather than importing Tutor's: the two features are deliberately decoupled
 * (CLAUDE.md rule 6), even though the validation shape is identical.
 */
export const birthYearFieldSchema = (t: TFunction) => {
  const currentYear = new Date().getFullYear();
  return z.object({
    value: z
      .string()
      .min(1, t('Profile.BIRTH_YEAR_REQUIRED'))
      .regex(/^\d{4}$/, t('Profile.BIRTH_YEAR_INVALID'))
      .refine(
        (raw) => {
          const year = Number(raw);
          return year >= 1900 && year <= currentYear;
        },
        { message: t('Profile.BIRTH_YEAR_INVALID') },
      ),
  });
};

export type BirthYearFieldValues = z.infer<ReturnType<typeof birthYearFieldSchema>>;
