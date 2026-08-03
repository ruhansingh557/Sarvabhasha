import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Mirrors the range `users.setBirthYear` enforces server-side (1900..current
 * year) — this is a UX nicety catching an obviously-wrong value before the
 * round trip, not the real gate. The server re-validates independently and
 * is the only thing that ever actually resolves `ageBand`.
 */
export const birthYearFormSchema = (t: TFunction) => {
  const currentYear = new Date().getFullYear();
  return z.object({
    birthYear: z
      .string()
      .min(1, t('Tutor.BIRTH_YEAR_REQUIRED'))
      .regex(/^\d{4}$/, t('Tutor.BIRTH_YEAR_INVALID'))
      .refine(
        (value) => {
          const year = Number(value);
          return year >= 1900 && year <= currentYear;
        },
        { message: t('Tutor.BIRTH_YEAR_INVALID') },
      ),
  });
};

export type BirthYearFormValues = z.infer<ReturnType<typeof birthYearFormSchema>>;
