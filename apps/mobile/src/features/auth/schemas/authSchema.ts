import { z } from 'zod';
import type { TFunction } from 'i18next';

export const authFormSchema = (t: TFunction) =>
  z.object({
    email: z.string().min(1, t('Auth.EMAIL_REQUIRED')).email(t('Auth.EMAIL_INVALID')),
    password: z.string().min(8, t('Auth.PASSWORD_MIN')),
  });

export type AuthFormValues = z.infer<ReturnType<typeof authFormSchema>>;
